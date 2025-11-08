const { response, request } = require("express");
const { WorkOrderHistory, WorkOrder } = require("../models");

// Obtener historial de una orden de trabajo
const getWorkOrderHistory = async (req = request, res = response) => {
  try {
    const { workOrderId } = req.params;
    const {
      page = 1,
      limit = 20,
      tipo,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Verificar que la orden existe
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder || workOrder.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Orden de trabajo no encontrada",
      });
    }

    // Construir filtros
    const filters = { workOrder: workOrderId };
    if (tipo) filters.tipo = tipo;

    // Configurar ordenamiento
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Configurar paginación
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sortOptions,
      populate: [
        { path: "usuario", select: "nombre apellido email" },
        { path: "workOrder", select: "numeroOrden" },
        { path: "estadoAnterior", select: "codigo nombre color icono" },
        { path: "estadoNuevo", select: "codigo nombre color icono" },
        { path: "tecnicoAnterior", select: "nombre apellido" },
        { path: "tecnicoNuevo", select: "nombre apellido" },
        { path: "itemAfectado", select: "tipo cantidad" },
      ],
    };

    const history = await WorkOrderHistory.paginate(filters, options);

    res.json({
      success: true,
      data: history.docs,
      pagination: {
        total: history.totalDocs,
        page: history.page,
        pages: history.totalPages,
        limit: history.limit,
        hasNext: history.hasNextPage,
        hasPrev: history.hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error al obtener historial:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Obtener un registro de historial por ID
const getWorkOrderHistoryById = async (req = request, res = response) => {
  try {
    const { id } = req.params;

    const historyEntry = await WorkOrderHistory.findById(id)
      .populate("workOrder", "numeroOrden status")
      .populate("createdBy", "nombre apellido email");

    if (!historyEntry) {
      return res.status(404).json({
        success: false,
        message: "Registro de historial no encontrado",
      });
    }

    res.json({
      success: true,
      data: historyEntry,
    });
  } catch (error) {
    console.error("Error al obtener registro de historial:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Obtener estadísticas de actividad por tipo
const getActivityStats = async (req = request, res = response) => {
  try {
    const { workOrderId } = req.params;
    const { startDate, endDate } = req.query;

    // Verificar que la orden existe
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder || workOrder.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Orden de trabajo no encontrada",
      });
    }

    // Construir filtros de fecha
    const dateFilters = { workOrder: workOrderId };
    if (startDate || endDate) {
      dateFilters.createdAt = {};
      if (startDate) dateFilters.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilters.createdAt.$lte = new Date(endDate);
    }

    // Obtener estadísticas por tipo de actividad
    const stats = await WorkOrderHistory.aggregate([
      { $match: dateFilters },
      {
        $group: {
          _id: "$tipo",
          count: { $sum: 1 },
          lastActivity: { $max: "$createdAt" },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Obtener usuarios más activos
    const userStats = await WorkOrderHistory.aggregate([
      { $match: dateFilters },
      {
        $group: {
          _id: "$createdBy",
          count: { $sum: 1 },
          lastActivity: { $max: "$createdAt" },
        },
      },
      {
        $lookup: {
          from: "usuarios",
          localField: "_id",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          nombre: "$user.nombre",
          apellido: "$user.apellido",
          count: 1,
          lastActivity: 1,
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    res.json({
      success: true,
      data: {
        activityStats: stats,
        userStats: userStats,
      },
    });
  } catch (error) {
    console.error("Error al obtener estadísticas de actividad:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Obtener timeline completo de una orden
const getWorkOrderTimeline = async (req = request, res = response) => {
  try {
    const { workOrderId } = req.params;

    // Verificar que la orden existe
    const workOrder = await WorkOrder.findById(workOrderId)
      .populate("createdBy", "nombre apellido")
      .populate("customer", "nombre apellido")
      .populate("vehicle", "marca modelo placa");

    if (!workOrder || workOrder.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Orden de trabajo no encontrada",
      });
    }

    // Obtener todos los eventos del historial
    const historyEvents = await WorkOrderHistory.find({
      workOrder: workOrderId,
    })
      .populate("createdBy", "nombre apellido")
      .sort({ createdAt: 1 });

    // Crear timeline con eventos clave
    const timeline = [
      {
        type: "creation",
        title: "Orden Creada",
        description: `Orden ${workOrder.numeroOrden} creada`,
        date: workOrder.createdAt,
        user: workOrder.createdBy,
        icon: "plus-circle",
        color: "#4CAF50",
      },
    ];

    // Agregar eventos del historial
    historyEvents.forEach((event) => {
      let icon = "circle";
      let color = "#2196F3";

      switch (event.tipo) {
        case "creacion":
          icon = "plus-circle";
          color = "#4CAF50";
          break;
        case "actualizacion":
          icon = "edit";
          color = "#FF9800";
          break;
        case "cambio_estado":
          icon = "arrow-right-circle";
          color = "#9C27B0";
          break;
        case "completado":
          icon = "check-circle";
          color = "#4CAF50";
          break;
        case "cancelacion":
          icon = "x-circle";
          color = "#F44336";
          break;
        case "eliminacion":
          icon = "trash";
          color = "#F44336";
          break;
      }

      timeline.push({
        type: event.tipo,
        title: event.actividad,
        description: event.descripcion,
        date: event.createdAt,
        user: event.createdBy,
        icon,
        color,
        details: event,
      });
    });

    // Agregar evento de finalización si existe
    if (workOrder.actualCompletionDate) {
      timeline.push({
        type: "completion",
        title: "Orden Completada",
        description: `Orden finalizada el ${workOrder.actualCompletionDate.toLocaleDateString()}`,
        date: workOrder.actualCompletionDate,
        user: workOrder.updatedBy,
        icon: "check-circle",
        color: "#4CAF50",
      });
    }

    // Ordenar por fecha
    timeline.sort((a, b) => new Date(a.date) - new Date(b.date));

    res.json({
      success: true,
      data: {
        workOrder: {
          numeroOrden: workOrder.numeroOrden,
          status: workOrder.status,
          customer: workOrder.customer,
          vehicle: workOrder.vehicle,
        },
        timeline,
      },
    });
  } catch (error) {
    console.error("Error al obtener timeline:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Buscar en el historial
const searchHistory = async (req = request, res = response) => {
  try {
    const {
      workOrderId,
      searchTerm,
      tipo,
      userId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    // Verificar que la orden existe
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder || workOrder.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Orden de trabajo no encontrada",
      });
    }

    // Construir filtros
    const filters = { workOrder: workOrderId };

    if (tipo) filters.tipo = tipo;
    if (userId) filters.createdBy = userId;

    // Filtros de fecha
    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }

    // Búsqueda por texto
    if (searchTerm) {
      filters.$or = [
        { actividad: new RegExp(searchTerm, "i") },
        { descripcion: new RegExp(searchTerm, "i") },
      ];
    }

    // Configurar paginación
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 },
      populate: [
        { path: "createdBy", select: "nombre apellido email" },
        { path: "workOrder", select: "numeroOrden" },
      ],
    };

    const history = await WorkOrderHistory.paginate(filters, options);

    res.json({
      success: true,
      data: history.docs,
      pagination: {
        total: history.totalDocs,
        page: history.page,
        pages: history.totalPages,
        limit: history.limit,
        hasNext: history.hasNextPage,
        hasPrev: history.hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error al buscar en historial:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Crear entrada manual en el historial (para notas o comentarios)
const createHistoryEntry = async (req = request, res = response) => {
  try {
    const { workOrderId } = req.params;
    const { tipo, actividad, descripcion } = req.body;

    // Verificar que la orden existe
    const workOrder = await WorkOrder.findById(workOrderId);
    if (!workOrder || workOrder.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Orden de trabajo no encontrada",
      });
    }

    const historyEntry = new WorkOrderHistory({
      workOrder: workOrderId,
      tipo: tipo || "nota",
      actividad: actividad || "Nota agregada",
      descripcion,
      createdBy: req.usuario._id,
    });

    await historyEntry.save();

    // Poblar datos para respuesta
    await historyEntry.populate("createdBy", "nombre apellido");

    res.status(201).json({
      success: true,
      message: "Entrada de historial creada exitosamente",
      data: historyEntry,
    });
  } catch (error) {
    console.error("Error al crear entrada de historial:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getWorkOrderHistory,
  getWorkOrderHistoryById,
  getActivityStats,
  getWorkOrderTimeline,
  searchHistory,
  createHistoryEntry,
};
