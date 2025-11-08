const { response, request } = require("express");
const {
  WorkOrder,
  WorkOrderItem,
  WorkOrderHistory,
  WorkOrderStatus,
} = require("../models");
const { validationResult } = require("express-validator");

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

    // Ejecutar consulta con paginación
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sortOptions,
      populate: [
        { path: "customer", select: "nombre apellido correo telefono" },
        { path: "vehicle", select: "marca modelo placa anio" },
        { path: "tecnicoAsignado", select: "nombre apellido" },
        { path: "estado", select: "codigo nombre color icono" },
      ],
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
      estado: estadoInicial._id,
    });

    // Guardar la orden de trabajo
    await workOrder.save();

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
    ]);

    res.status(201).json({
      ok: true,
      msg: "Orden de trabajo creada exitosamente",
      workOrder,
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
    if (updateData.items) {
      workOrder.items = updateData.items;
      await workOrder.calcularCostoTotal();
      tipoHistorial = "actualizacion_costos";
      cambiosSignificativos.push("Costos actualizados");
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
  try {
    const { id } = req.params;
    const { newStatus, notes } = req.body;

    const workOrder = await WorkOrder.findById(id).populate("estado");
    if (!workOrder || workOrder.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Orden de trabajo no encontrada",
      });
    }

    // Intentar cambiar el estado
    const result = await workOrder.cambiarEstado(
      newStatus,
      req.usuario._id,
      notes
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message,
      });
    }

    // Poblar datos actualizados
    await workOrder.populate([
      { path: "estado", select: "nombre codigo color icono tipo" },
      { path: "customer", select: "nombre apellido" },
      { path: "vehicle", select: "marca modelo" },
    ]);

    res.json({
      success: true,
      message: "Estado de la orden actualizado exitosamente",
      data: workOrder,
      estadoAnterior: result.estadoAnterior,
      estadoNuevo: result.estadoNuevo,
    });
  } catch (error) {
    console.error("Error al cambiar estado de orden:", error);
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
