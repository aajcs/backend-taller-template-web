const { response, request } = require("express");
const { WorkOrderStatus } = require("../models");
const { validationResult } = require("express-validator");

// Obtener todos los estados de órdenes de trabajo
const getWorkOrderStatuses = async (req = request, res = response) => {
  try {
    const { tipo, activo = true } = req.query;

    const filters = {};
    if (tipo) filters.tipo = tipo;
    if (activo !== undefined) filters.activo = activo;
    filters.eliminado = false;

    const statuses = await WorkOrderStatus.find(filters).sort({
      orden: 1,
      createdAt: 1,
    });

    res.json({
      success: true,
      data: statuses,
    });
  } catch (error) {
    console.error("Error al obtener estados:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Obtener un estado por ID
const getWorkOrderStatusById = async (req = request, res = response) => {
  try {
    const { id } = req.params;

    const status = await WorkOrderStatus.findById(id);

    if (!status || status.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Estado no encontrado",
      });
    }

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error("Error al obtener estado:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Obtener estados iniciales disponibles
const getInitialStatuses = async (req = request, res = response) => {
  try {
    const statuses = await WorkOrderStatus.find({
      tipo: "inicial",
      activo: true,
      eliminado: false,
    }).sort({ orden: 1 });

    res.json({
      success: true,
      data: statuses,
    });
  } catch (error) {
    console.error("Error al obtener estados iniciales:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Obtener transiciones permitidas desde un estado
const getAllowedTransitions = async (req = request, res = response) => {
  try {
    const { id } = req.params;

    const status = await WorkOrderStatus.findById(id);
    if (!status || status.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Estado no encontrado",
      });
    }

    const allowedStatuses = await WorkOrderStatus.find({
      _id: { $in: status.transicionesPermitidas },
      activo: true,
      deleted: false,
    }).sort({ orden: 1 });

    res.json({
      success: true,
      data: allowedStatuses,
    });
  } catch (error) {
    console.error("Error al obtener transiciones permitidas:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Crear un nuevo estado
const createWorkOrderStatus = async (req = request, res = response) => {
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
      codigo,
      nombre,
      descripcion,
      color,
      icono,
      orden,
      tipo,
      transicionesPermitidas,
      requiereAprobacion,
      requiereDocumentacion,
      notificarCliente,
      tiempoEstimadoHoras,
    } = req.body;

    // Verificar que el código no exista
    const existingStatus = await WorkOrderStatus.findOne({
      codigo: codigo.toUpperCase(),
      deleted: false,
    });

    if (existingStatus) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un estado con ese código",
      });
    }

    // Validar configuración de estados
    const validation = await WorkOrderStatus.validarConfiguracionEstados({
      tipo,
      transicionesPermitidas,
    });

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.message,
      });
    }

    const status = new WorkOrderStatus({
      codigo: codigo.toUpperCase(),
      nombre,
      descripcion,
      color,
      icono,
      orden,
      tipo,
      transicionesPermitidas,
      requiereAprobacion,
      requiereDocumentacion,
      notificarCliente,
      tiempoEstimadoHoras,
      createdBy: req.usuario._id,
    });

    await status.save();

    res.status(201).json({
      success: true,
      message: "Estado creado exitosamente",
      data: status,
    });
  } catch (error) {
    console.error("Error al crear estado:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Actualizar un estado
const updateWorkOrderStatus = async (req = request, res = response) => {
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

    const status = await WorkOrderStatus.findById(id);
    if (!status || status.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Estado no encontrado",
      });
    }

    // Verificar código único si se está cambiando
    if (
      updateData.codigo &&
      updateData.codigo.toUpperCase() !== status.codigo
    ) {
      const existingStatus = await WorkOrderStatus.findOne({
        codigo: updateData.codigo.toUpperCase(),
        deleted: false,
        _id: { $ne: id },
      });

      if (existingStatus) {
        return res.status(400).json({
          success: false,
          message: "Ya existe un estado con ese código",
        });
      }
    }

    // Validar configuración si se actualizan campos críticos
    if (updateData.tipo || updateData.transicionesPermitidas) {
      const validation = await WorkOrderStatus.validarConfiguracionEstados({
        tipo: updateData.tipo || status.tipo,
        transicionesPermitidas:
          updateData.transicionesPermitidas || status.transicionesPermitidas,
      });

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          message: validation.message,
        });
      }
    }

    // Actualizar campos permitidos
    const allowedFields = [
      "codigo",
      "nombre",
      "descripcion",
      "color",
      "icono",
      "orden",
      "tipo",
      "transicionesPermitidas",
      "requiereAprobacion",
      "requiereDocumentacion",
      "notificarCliente",
      "tiempoEstimadoHoras",
      "activo",
    ];

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        if (field === "codigo") {
          status[field] = updateData[field].toUpperCase();
        } else {
          status[field] = updateData[field];
        }
      }
    });

    status.updatedBy = req.usuario._id;
    status.updatedAt = new Date();

    await status.save();

    res.json({
      success: true,
      message: "Estado actualizado exitosamente",
      data: status,
    });
  } catch (error) {
    console.error("Error al actualizar estado:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Activar/desactivar un estado
const toggleWorkOrderStatus = async (req = request, res = response) => {
  try {
    const { id } = req.params;

    const status = await WorkOrderStatus.findById(id);
    if (!status || status.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Estado no encontrado",
      });
    }

    status.activo = !status.activo;
    status.updatedBy = req.usuario._id;
    status.updatedAt = new Date();

    await status.save();

    res.json({
      success: true,
      message: `Estado ${status.activo ? "activado" : "desactivado"} exitosamente`,
      data: status,
    });
  } catch (error) {
    console.error("Error al cambiar estado de activación:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Eliminar un estado (soft delete)
const deleteWorkOrderStatus = async (req = request, res = response) => {
  try {
    const { id } = req.params;

    const status = await WorkOrderStatus.findById(id);
    if (!status || status.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Estado no encontrado",
      });
    }

    // Verificar si hay órdenes usando este estado
    const workOrdersCount = await require("../models").WorkOrder.countDocuments(
      {
        status: id,
        deleted: false,
      }
    );

    if (workOrdersCount > 0) {
      return res.status(400).json({
        success: false,
        message:
          "No se puede eliminar un estado que está siendo usado por órdenes de trabajo",
      });
    }

    status.eliminado = true;
    status.eliminadoBy = req.usuario._id;
    status.eliminadoAt = new Date();

    await status.save();

    res.json({
      success: true,
      message: "Estado eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar estado:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getWorkOrderStatuses,
  getWorkOrderStatusById,
  getInitialStatuses,
  getAllowedTransitions,
  createWorkOrderStatus,
  updateWorkOrderStatus,
  toggleWorkOrderStatus,
  deleteWorkOrderStatus,
};
