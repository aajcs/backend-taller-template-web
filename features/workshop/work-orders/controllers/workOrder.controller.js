const { response, request } = require("express");
const {
  WorkOrder,
  WorkOrderItem,
  WorkOrderHistory,
  WorkOrderStatus,
} = require("../models");
const { validationResult } = require("express-validator");

console.log("🔄 Cargando workOrder.controller.js");

// Obtener todas las órdenes de trabajo con filtros y paginación
const getWorkOrders = async (req = request, res = response) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      customer,
      vehicle,
      priority,
      sortBy = "createdAt",
      sortOrder = "desc",
      includeItems = true, // Nuevo parámetro opcional
    } = req.query;

    // Construir filtros
    const filters = { eliminado: false };

    if (status) filters.estado = status;
    if (customer) filters.customer = customer;
    if (vehicle) filters.vehicle = vehicle;
    if (priority) filters.prioridad = priority;

    // Configurar ordenamiento
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Configurar populate base
    const populateOptions = [
      { path: "customer", select: "nombre apellido correo telefono" },
      { path: "vehicle", select: "marca modelo placa anio" },
      { path: "tecnicoAsignado", select: "nombre apellido" },
      { path: "estado", select: "codigo nombre color icono" },
      { path: "assignments" },
    ];

    // Agregar populate de items si se solicita
    if (includeItems === "true" || includeItems === true) {
      populateOptions.push({
        path: "items",
        populate: [
          {
            path: "servicio",
            select: "nombre descripcion precioBase tiempoEstimadoMinutos",
          },
          {
            path: "repuesto",
            select: "nombre codigo precio stock",
          },
        ],
      });
    }

    // Ejecutar consulta con paginación
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sortOptions,
      populate: populateOptions,
    };

    const workOrders = await WorkOrder.paginate(filters, options);

    res.json({
      success: true,
      data: workOrders.docs,
      pagination: {
        total: workOrders.totalDocs,
        page: workOrders.page,
        pages: workOrders.totalPages,
        limit: workOrders.limit,
        hasNext: workOrders.hasNextPage,
        hasPrev: workOrders.hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error al obtener órdenes de trabajo:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Obtener una orden de trabajo por ID
const getWorkOrderById = async (req = request, res = response) => {
  try {
    const { id } = req.params;

    const workOrder = await WorkOrder.findById(id)
      .populate("customer", "nombre apellido correo telefono")
      .populate("vehicle", "marca modelo placa anio color kilometraje")
      .populate("tecnicoAsignado", "nombre apellido especialidad")
      .populate("estado", "codigo nombre descripcion color icono tipo orden")
      .populate({
        path: "items",
        populate: [
          {
            path: "servicio",
            select: "nombre descripcion precioBase tiempoEstimadoMinutos",
          },
          {
            path: "repuesto",
            select: "nombre codigo precio stock",
          },
        ],
      });

    if (!workOrder || workOrder.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Orden de trabajo no encontrada",
      });
    }

    res.json({
      success: true,
      data: workOrder,
    });
  } catch (error) {
    console.error("Error al obtener orden de trabajo:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Crear una nueva orden de trabajo
const createWorkOrder = async (req = request, res = response) => {
  try {
    // Validar errores de express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Datos de entrada inválidos",
        errors: errors.array(),
      });
    }

    const {
      customer,
      vehicle,
      motivo,
      kilometraje,
      tecnicoAsignado,
      prioridad = "normal",
      descripcionProblema,
      diagnostico,
      observaciones,
      fechaEstimadaEntrega,
      descuento = 0, // Nuevo: descuento
      impuesto = 0, // Nuevo: impuesto
      items = [], // Array de items (repuestos y servicios)
    } = req.body;

    // Generar número de orden único
    const numeroOrden = await generateWorkOrderNumber();

    // Buscar el estado inicial "RECIBIDO"
    const estadoInicial = await WorkOrderStatus.findOne({ codigo: "RECIBIDO" });
    if (!estadoInicial) {
      return res.status(500).json({
        success: false,
        message:
          "No se encontró el estado inicial. Por favor ejecute el seeder de estados.",
      });
    }

    // Crear la orden de trabajo
    const workOrder = new WorkOrder({
      numeroOrden,
      customer,
      vehicle,
      motivo,
      kilometraje,
      tecnicoAsignado,
      prioridad,
      descripcionProblema,
      diagnostico,
      observaciones,
      fechaEstimadaEntrega,
      descuento, // Nuevo: descuento
      impuesto, // Nuevo: impuesto
      estado: estadoInicial._id,
      createdBy: req.usuario._id, // Usuario que crea la orden
      updatedBy: req.usuario._id, // Usuario que crea la orden
    });

    // Guardar la orden de trabajo
    await workOrder.save();

    // Crear los items de la orden de trabajo si se proporcionaron
    let createdItems = [];
    if (items && items.length > 0) {
      const workOrderItems = items.map((item) => ({
        workOrder: workOrder._id,
        tipo: item.tipo,
        [item.tipo === "repuesto" ? "repuesto" : "servicio"]:
          item.tipo === "repuesto" ? item.repuesto : item.servicio,
        nombre: item.nombre,
        descripcion: item.descripcion,
        cantidad: item.cantidad || 1,
        precioUnitario:
          item.precioUnitario || item.precioFinal / (item.cantidad || 1),
        precioTotal: item.precioTotal || item.precioFinal,
        descuento: item.descuento || 0,
        precioFinal: item.precioFinal,
        numeroParte: item.numeroParte,
        ubicacion: item.ubicacion,
      }));

      createdItems = await WorkOrderItem.insertMany(workOrderItems);

      // Calcular costos desde los items creados
      await workOrder.calcularCostosDesdeItems();

      // Guardar la WorkOrder con los costos actualizados
      await workOrder.save();
    }

    // Poblar datos para respuesta
    await workOrder.populate([
      { path: "customer", select: "nombre correo telefono" },
      {
        path: "vehicle",
        select: "placa year color",
        populate: {
          path: "model",
          select: "name",
          populate: { path: "brand", select: "name" },
        },
      },
      { path: "tecnicoAsignado", select: "nombre correo" },
      { path: "estado", select: "codigo nombre color icono tipo" },
      {
        path: "items",
        populate: [
          { path: "servicio", select: "nombre descripcion precioBase" },
          { path: "repuesto", select: "nombre codigo precio" },
        ],
      },
    ]);

    res.status(201).json({
      ok: true,
      msg: "Orden de trabajo creada exitosamente",
      workOrder,
      itemsCreated: createdItems.length,
    });
  } catch (error) {
    console.error("Error al crear orden de trabajo:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Actualizar una orden de trabajo
const updateWorkOrder = async (req = request, res = response) => {
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

    const workOrder = await WorkOrder.findById(id);
    if (!workOrder || workOrder.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Orden de trabajo no encontrada",
      });
    }

    // Actualizar campos permitidos
    const allowedFields = [
      "description",
      "priority",
      "estimatedCompletionDate",
      "notes",
      "assignedTechnician",
      "actualCompletionDate",
    ];

    // Rastrear cambios significativos para historial
    let cambiosSignificativos = [];
    let tipoHistorial = null;

    allowedFields.forEach((field) => {
      if (
        updateData[field] !== undefined &&
        workOrder[field] !== updateData[field]
      ) {
        // Detectar tipo de cambio significativo
        if (field === "assignedTechnician") {
          tipoHistorial = "asignacion_tecnico";
          cambiosSignificativos.push("Técnico asignado");
        } else if (field === "priority") {
          cambiosSignificativos.push(
            `Prioridad cambiada a ${updateData[field]}`
          );
        } else if (
          field === "estimatedCompletionDate" ||
          field === "actualCompletionDate"
        ) {
          cambiosSignificativos.push(`Fecha actualizada`);
        }
        workOrder[field] = updateData[field];
      }
    });

    // Recalcular costos si se actualizaron items
    if (updateData.items !== undefined) {
      // Manejar actualización de items de la orden de trabajo
      const itemsToUpdate = updateData.items || [];

      // Obtener items existentes
      const existingItems = await WorkOrderItem.find({
        workOrder: workOrder._id,
        eliminado: false,
      });

      // Crear mapas para comparación
      const existingItemsMap = new Map();
      existingItems.forEach((item) => {
        existingItemsMap.set(item._id.toString(), item);
      });

      // Identificar items a mantener, actualizar, crear y eliminar
      const itemsToKeep = new Set();
      const itemsToCreate = [];
      const itemsToUpdateList = [];

      // Procesar items enviados
      for (const itemData of itemsToUpdate) {
        if (itemData._id) {
          // Item existente - actualizar
          const existingItem = existingItemsMap.get(itemData._id.toString());
          if (existingItem) {
            itemsToKeep.add(itemData._id.toString());
            itemsToUpdateList.push({
              _id: itemData._id,
              updates: {
                tipo: itemData.tipo,
                [itemData.tipo === "repuesto" ? "repuesto" : "servicio"]:
                  itemData.tipo === "repuesto"
                    ? itemData.repuesto
                    : itemData.servicio,
                nombre: itemData.nombre,
                descripcion: itemData.descripcion,
                cantidad: itemData.cantidad || 1,
                precioUnitario:
                  itemData.precioUnitario ||
                  itemData.precioFinal / (itemData.cantidad || 1),
                precioTotal: itemData.precioTotal || itemData.precioFinal,
                descuento: itemData.descuento || 0,
                precioFinal: itemData.precioFinal,
                numeroParte: itemData.numeroParte,
                ubicacion: itemData.ubicacion,
              },
            });
          }
        } else {
          // Item nuevo - crear
          itemsToCreate.push({
            workOrder: workOrder._id,
            tipo: itemData.tipo,
            [itemData.tipo === "repuesto" ? "repuesto" : "servicio"]:
              itemData.tipo === "repuesto"
                ? itemData.repuesto
                : itemData.servicio,
            nombre: itemData.nombre,
            descripcion: itemData.descripcion,
            cantidad: itemData.cantidad || 1,
            precioUnitario:
              itemData.precioUnitario ||
              itemData.precioFinal / (itemData.cantidad || 1),
            precioTotal: itemData.precioTotal || itemData.precioFinal,
            descuento: itemData.descuento || 0,
            precioFinal: itemData.precioFinal,
            numeroParte: itemData.numeroParte,
            ubicacion: itemData.ubicacion,
          });
        }
      }

      // Marcar como eliminados los items que ya no están
      const itemsToDelete = existingItems.filter(
        (item) => !itemsToKeep.has(item._id.toString())
      );

      // Ejecutar operaciones en la base de datos
      const operations = [];

      // Crear nuevos items
      if (itemsToCreate.length > 0) {
        operations.push(WorkOrderItem.insertMany(itemsToCreate));
      }

      // Actualizar items existentes
      for (const updateOp of itemsToUpdateList) {
        operations.push(
          WorkOrderItem.findByIdAndUpdate(updateOp._id, updateOp.updates)
        );
      }

      // Marcar como eliminados los items removidos
      if (itemsToDelete.length > 0) {
        operations.push(
          WorkOrderItem.updateMany(
            { _id: { $in: itemsToDelete.map((item) => item._id) } },
            {
              eliminado: true,
              eliminadoAt: new Date(),
              eliminadoBy: req.usuario._id,
            }
          )
        );
      }

      // Ejecutar todas las operaciones
      if (operations.length > 0) {
        await Promise.all(operations);
        cambiosSignificativos.push(
          `Items actualizados: +${itemsToCreate.length} creados, ${itemsToUpdateList.length} modificados, ${itemsToDelete.length} eliminados`
        );
        tipoHistorial = "modificado_item";

        // Calcular costos desde los items actualizados
        await workOrder.calcularCostosDesdeItems();
      }

      // Actualizar el array de items en la WorkOrder (virtual field se encargará del populate)
      // No necesitamos hacer workOrder.items = ... porque el virtual field lo maneja
    }

    workOrder.updatedBy = req.usuario._id;
    workOrder.updatedAt = new Date();

    await workOrder.save();

    // Registrar cambio en historial SOLO si hubo cambios significativos
    if (cambiosSignificativos.length > 0 && tipoHistorial) {
      await WorkOrderHistory.create({
        workOrder: workOrder._id,
        tipo: tipoHistorial,
        descripcion: `${cambiosSignificativos.join(", ")} por ${req.usuario.nombre}`,
        usuario: req.usuario._id,
        detalles: {
          cambios: cambiosSignificativos,
          timestamp: new Date(),
        },
      });
    }

    await workOrder.populate([
      { path: "customer", select: "nombre apellido" },
      { path: "vehicle", select: "marca modelo placa" },
      { path: "estado", select: "nombre codigo" },
      { path: "tecnicoAsignado", select: "nombre apellido" },
      {
        path: "items",
        populate: [
          { path: "servicio", select: "nombre descripcion precioBase" },
          { path: "repuesto", select: "nombre codigo precio" },
        ],
      },
    ]);

    res.json({
      success: true,
      message: "Orden de trabajo actualizada exitosamente",
      data: workOrder,
    });
  } catch (error) {
    console.error("Error al actualizar orden de trabajo:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Cambiar estado de una orden de trabajo
const changeWorkOrderStatus = async (req = request, res = response) => {
  console.log(
    `🔄 API changeWorkOrderStatus llamada: ${req.params.id} -> ${req.body.newStatus}`
  );
  try {
    const { id } = req.params;
    const { newStatus, notes } = req.body;

    console.log(`🔍 Buscando workOrder con ID: ${id}`);
    const workOrder = await WorkOrder.findById(id).populate("estado");
    if (!workOrder || workOrder.eliminado) {
      console.log(`❌ WorkOrder no encontrada: ${id}`);
      return res.status(404).json({
        success: false,
        message: "Orden de trabajo no encontrada",
      });
    }

    console.log(
      `✅ WorkOrder encontrada: ${workOrder.numeroOrden}, llamando cambiarEstado...`
    );
    // Intentar cambiar el estado
    const result = await workOrder.cambiarEstado(
      newStatus,
      req.usuario._id,
      notes
    );

    if (!result.success) {
      console.log(`❌ cambiarEstado falló: ${result.message}`);
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    console.log(`✅ cambiarEstado exitoso, populando datos...`);
    // Poblar datos actualizados
    await workOrder.populate([
      { path: "estado", select: "nombre codigo color icono tipo" },
      { path: "customer", select: "nombre apellido" },
      { path: "vehicle", select: "marca modelo" },
    ]);

    console.log(`📤 Enviando respuesta exitosa`);
    res.json({
      success: true,
      message: "Estado de la orden actualizado exitosamente",
      data: workOrder,
      estadoAnterior: result.estadoAnterior,
      estadoNuevo: result.estadoNuevo,
    });
  } catch (error) {
    console.error("❌ Error en changeWorkOrderStatus:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Eliminar (soft delete) una orden de trabajo
const deleteWorkOrder = async (req = request, res = response) => {
  try {
    const { id } = req.params;

    const workOrder = await WorkOrder.findById(id);
    if (!workOrder || workOrder.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Orden de trabajo no encontrada",
      });
    }

    // Verificar si se puede eliminar (solo estados iniciales)
    const currentStatus = await WorkOrderStatus.findById(workOrder.status);
    if (currentStatus && currentStatus.tipo !== "inicial") {
      return res.status(400).json({
        success: false,
        message: "No se puede eliminar una orden que ya está en proceso",
      });
    }

    workOrder.eliminado = true;
    workOrder.eliminadoBy = req.usuario._id;
    workOrder.eliminadoAt = new Date();

    await workOrder.save();

    // Registrar en historial
    await WorkOrderHistory.create({
      workOrder: workOrder._id,
      tipo: "eliminacion",
      actividad: "Orden eliminada",
      descripcion: `Orden eliminada por ${req.usuario.nombre}`,
      createdBy: req.usuario._id,
    });

    res.json({
      success: true,
      message: "Orden de trabajo eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar orden de trabajo:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Función auxiliar para generar número de orden único
const generateWorkOrderNumber = async () => {
  const currentYear = new Date().getFullYear();
  const prefix = `OT-${currentYear}-`;

  // Buscar el último número de orden del año actual
  const lastWorkOrder = await WorkOrder.findOne({
    numeroOrden: new RegExp(`^${prefix}`),
  }).sort({ numeroOrden: -1 });

  let nextNumber = 1;
  if (lastWorkOrder) {
    const lastNumber = parseInt(lastWorkOrder.numeroOrden.split("-")[2]);
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
};

module.exports = {
  getWorkOrders,
  getWorkOrderById,
  createWorkOrder,
  updateWorkOrder,
  changeWorkOrderStatus,
  deleteWorkOrder,
  generateWorkOrderNumber,
};
