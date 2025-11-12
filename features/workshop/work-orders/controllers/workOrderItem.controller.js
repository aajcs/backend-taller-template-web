const { response, request } = require("express");
const {
  WorkOrderItem,
  WorkOrder,
  WorkOrderStatus,
  Service,
} = require("../models");
const Item = require("../../../inventory/items/item.model");
const Reservation = require("../../../inventory/reservations/reservation.models");
const Stock = require("../../../inventory/stock/stock.model");
const { validationResult } = require("express-validator");

// Obtener items de una orden de trabajo específica
const getWorkOrderItems = async (req = request, res = response) => {
  try {
    console.log("🔍 DEBUG - req.params:", req.params);
    console.log("🔍 DEBUG - req.url:", req.url);
    console.log("🔍 DEBUG - req.baseUrl:", req.baseUrl);
    console.log("🔍 DEBUG - req.originalUrl:", req.originalUrl);
    const { workOrderId } = req.params;
    const { page = 1, limit = 50, status } = req.query;

    // Verificar que la orden existe
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder || workOrder.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Orden de trabajo no encontrada",
      });
    }

    // Construir filtros
    const filters = { workOrder: workOrderId, eliminado: false };
    if (status) filters.estado = status;

    // Configurar paginación
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: 1 },
      populate: [
        {
          path: "servicio",
          select:
            "nombre descripcion precioBase tiempoEstimadoMinutos unidadTiempo categoria subcategoria",
        },
        {
          path: "repuesto",
          select: "nombre codigo precio costo stockMinimo stockActual",
        },
      ],
    };

    const items = await WorkOrderItem.paginate(filters, options);

    res.json({
      success: true,
      data: items.docs,
      pagination: {
        total: items.totalDocs,
        page: items.page,
        pages: items.totalPages,
        limit: items.limit,
      },
    });
  } catch (error) {
    console.error("Error al obtener items de orden:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Obtener un item específico por ID
const getWorkOrderItemById = async (req = request, res = response) => {
  try {
    const { id } = req.params;

    const item = await WorkOrderItem.findById(id)
      .populate("workOrder", "numeroOrden status")
      .populate(
        "servicio",
        "nombre descripcion precioBase tiempoEstimadoMinutos"
      )
      .populate("repuesto", "nombre codigo precio costo stockActual");

    if (!item || item.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Item no encontrado",
      });
    }

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("Error al obtener item:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Agregar un item a una orden de trabajo
const addWorkOrderItem = async (req = request, res = response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Datos de entrada inválidos",
        errors: errors.array(),
      });
    }

    const {
      workOrder: workOrderId,
      type, // 'service' o 'part'
      service,
      part,
      quantity = 1,
      unitPrice,
      notes,
    } = req.body;

    // Verificar que la orden existe y no está completada
    const workOrder = await WorkOrder.findById(workOrderId).populate("estado");
    if (!workOrder || workOrder.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Orden de trabajo no encontrada",
      });
    }

    // Verificar que el estado no sea final
    if (workOrder.estado.tipo === "final") {
      return res.status(400).json({
        success: false,
        message: `No se pueden agregar items a una orden en estado ${workOrder.estado.nombre}`,
      });
    }

    // Validar que se proporcione service o part según el tipo
    if (type === "service" && !service) {
      return res.status(400).json({
        success: false,
        message: "Debe especificar un servicio",
      });
    }

    if (type === "part" && !part) {
      return res.status(400).json({
        success: false,
        message: "Debe especificar una pieza",
      });
    }

    // Verificar existencia del servicio o pieza
    let itemData = {
      workOrder: workOrderId,
      tipo: type === "service" ? "servicio" : "repuesto",
      cantidad: quantity,
      notas: notes,
      createdBy: req.usuario._id, // Usuario que crea el item
      updatedBy: req.usuario._id, // Usuario que crea el item
    };

    if (type === "service") {
      const serviceDoc = await Service.findById(service);
      if (!serviceDoc) {
        return res.status(404).json({
          success: false,
          message: "Servicio no encontrado",
        });
      }
      itemData.servicio = service;
      itemData.nombre = serviceDoc.nombre;
      itemData.descripcion = serviceDoc.descripcion;
      itemData.precioUnitario = unitPrice || serviceDoc.precioBase;
      itemData.tiempoEstimado = serviceDoc.tiempoEstimadoMinutos;
    } else if (type === "part") {
      const partDoc = await Item.findById(part);
      if (!partDoc) {
        return res.status(404).json({
          success: false,
          message: "Pieza no encontrada",
        });
      }
      itemData.repuesto = part;
      itemData.nombre = partDoc.nombre;
      itemData.descripcion = partDoc.descripcion;
      itemData.precioUnitario = unitPrice || partDoc.precio;
      itemData.numeroParte = partDoc.codigo;

      // Verificar stock disponible antes de crear la reserva
      const availableStock = await Stock.findOne({
        item: part,
        cantidad: { $gte: quantity },
      }).populate("warehouse");

      if (!availableStock) {
        return res.status(400).json({
          success: false,
          message: `No hay suficiente stock disponible para ${partDoc.nombre}. Stock requerido: ${quantity}`,
        });
      }

      // Guardar el almacén disponible para crear la reserva después
      itemData.availableWarehouse = availableStock.warehouse._id;
    }

    // Crear el item
    const item = new WorkOrderItem(itemData);

    await item.save();

    // Crear reserva si es un repuesto (solo reserva, NO consume aún)
    if (type === "part") {
      try {
        const reservation = new Reservation({
          item: part,
          warehouse: itemData.availableWarehouse,
          cantidad: quantity,
          reservadoPor: req.usuario?._id,
          ordenTrabajo: workOrderId,
          motivo: `Reserva para orden de trabajo ${workOrder.numeroOrden}`,
          estado: "activo", // Solo reservado, NO consumido aún
        });
        await reservation.save();

        // Actualizar el item con la referencia a la reserva
        item.reserva = reservation._id;
        await item.save();

        console.log(
          `✅ Reserva creada para ${partDoc.nombre} - Estado: activo`
        );
      } catch (reservationError) {
        console.error("Error al crear reserva:", reservationError);
        // No fallar la creación del item por error en reserva
      }
    }

    // Recalcular costos de la orden
    await workOrder.calcularCostoTotal();
    await workOrder.save();

    // Poblar datos para respuesta
    await item.populate([
      { path: "servicio", select: "nombre precioBase" },
      { path: "repuesto", select: "nombre precio" },
    ]);

    res.status(201).json({
      success: true,
      message: "Item agregado exitosamente",
      data: item,
    });
  } catch (error) {
    console.error("Error al agregar item:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Actualizar un item de orden de trabajo
const updateWorkOrderItem = async (req = request, res = response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Datos de entrada inválidos",
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    const item = await WorkOrderItem.findById(id).populate({
      path: "workOrder",
      populate: { path: "estado" },
    });
    if (!item || item.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Item no encontrado",
      });
    }

    // Verificar que la orden no esté en estado final
    if (item.workOrder.estado.tipo === "final") {
      return res.status(400).json({
        success: false,
        message: `No se pueden modificar items de una orden en estado ${item.workOrder.estado.nombre}`,
      });
    }

    // Actualizar campos permitidos
    const allowedFields = ["quantity", "unitPrice", "notes", "status"];
    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        item[field] = updateData[field];
      }
    });

    item.updatedBy = req.usuario._id;
    item.updatedAt = new Date();

    await item.save();

    // Recalcular costos de la orden
    await item.workOrder.calcularCostoTotal();
    await item.workOrder.save();

    // Poblar datos actualizados
    await item.populate([
      { path: "servicio", select: "nombre precioBase" },
      { path: "repuesto", select: "nombre precio" },
    ]);

    res.json({
      success: true,
      message: "Item actualizado exitosamente",
      data: item,
    });
  } catch (error) {
    console.error("Error al actualizar item:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Marcar item como completado
const completeWorkOrderItem = async (req = request, res = response) => {
  try {
    const { id } = req.params;
    const { actualTime, notes } = req.body;

    const item = await WorkOrderItem.findById(id).populate("workOrder");
    if (!item || item.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Item no encontrado",
      });
    }

    // Marcar como completado
    const result = await item.marcarCompletado(
      actualTime,
      req.usuario._id,
      notes
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // Poblar datos para respuesta
    await item.populate([
      { path: "servicio", select: "nombre" },
      { path: "repuesto", select: "nombre" },
    ]);

    res.json({
      success: true,
      message: "Item marcado como completado",
      data: item,
    });
  } catch (error) {
    console.error("Error al completar item:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Eliminar un item de orden de trabajo
const deleteWorkOrderItem = async (req = request, res = response) => {
  try {
    const { id } = req.params;

    const item = await WorkOrderItem.findById(id).populate({
      path: "workOrder",
      populate: { path: "estado" },
    });
    if (!item || item.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Item no encontrado",
      });
    }

    // Verificar que la orden no esté en estado final
    if (item.workOrder.estado.tipo === "final") {
      return res.status(400).json({
        success: false,
        message: `No se pueden eliminar items de una orden en estado ${item.workOrder.estado.nombre}`,
      });
    }

    item.eliminado = true;

    await item.save();

    // Recalcular costos de la orden
    await item.workOrder.calcularCostoTotal();
    await item.workOrder.save();

    res.json({
      success: true,
      message: "Item eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar item:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Cambiar estado de un item
const changeItemStatus = async (req = request, res = response) => {
  try {
    const { id } = req.params;
    const { newStatus, notes } = req.body;
    const userId = req.usuario._id;

    // Buscar item con workOrder poblado
    const item = await WorkOrderItem.findById(id)
      .populate("workOrder", "numeroOrden estado eliminado")
      .populate("repuesto", "nombre codigo")
      .populate("servicio", "nombre");

    if (!item || item.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Item no encontrado",
      });
    }

    // Verificar que la orden no esté cerrada o cancelada
    const estadoOrden = await WorkOrderStatus.findById(item.workOrder.estado);
    if (estadoOrden && estadoOrden.tipo === "final") {
      return res.status(400).json({
        success: false,
        message: `No se puede cambiar el estado de items en una orden ${estadoOrden.nombre}`,
      });
    }

    // Usar el método del modelo para cambiar estado (incluye registro automático en historial)
    const result = await item.cambiarEstado(newStatus, userId, notes);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // Si se completa un item con repuesto, procesar almacén
    if (
      newStatus === "completado" &&
      item.tipo === "repuesto" &&
      item.reserva
    ) {
      try {
        const reservation = await Reservation.findById(item.reserva);
        if (reservation && reservation.estado === "activo") {
          // Aprobar la reserva (esto consume el stock)
          reservation.estado = "consumido";
          reservation.fechaConsumo = new Date();
          await reservation.save();

          // Crear Movement (nota de salida)
          const Movement = require("../../../inventory/movements/movement.models");
          const movement = new Movement({
            item: item.repuesto,
            warehouse: reservation.warehouse,
            type: "salida",
            cantidad: item.cantidad,
            motivo: `Consumo para orden ${item.workOrder.numeroOrden}`,
            ordenTrabajo: item.workOrder._id,
            reserva: reservation._id,
            usuario: userId,
          });
          await movement.save();

          console.log(
            `✅ Reserva consumida y movimiento creado para ${item.nombre}`
          );
        }
      } catch (almacenError) {
        console.error("Error procesando almacén:", almacenError);
        // No fallar el cambio de estado por error en almacén
        // pero registrar el error
      }
    }

    // Si se cancela un item con reserva, liberar la reserva
    if (newStatus === "cancelado" && item.reserva) {
      try {
        const reservation = await Reservation.findById(item.reserva);
        if (reservation && reservation.estado === "activo") {
          reservation.estado = "cancelado";
          reservation.fechaCancelacion = new Date();
          await reservation.save();

          console.log(`✅ Reserva cancelada para ${item.nombre}`);
        }
      } catch (almacenError) {
        console.error("Error cancelando reserva:", almacenError);
      }
    }

    // Poblar datos actualizados para respuesta
    await item.populate([
      { path: "servicio", select: "nombre" },
      { path: "repuesto", select: "nombre" },
    ]);

    res.json({
      success: true,
      message: "Estado del item actualizado exitosamente",
      data: item,
    });
  } catch (error) {
    console.error("Error al cambiar estado de item:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getWorkOrderItems,
  getWorkOrderItemById,
  addWorkOrderItem,
  updateWorkOrderItem,
  completeWorkOrderItem,
  deleteWorkOrderItem,
  changeItemStatus,
};
