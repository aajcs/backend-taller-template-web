const { response } = require("express");
const { ServiceBay } = require("../models");

/**
 * Helper function para obtener populate options estándar
 */
const populateOptions = [
  {
    path: "currentWorkOrder",
    select: "numeroOrden motivo ",
  },
  {
    path: "currentTechnicians.technician",
    select: "nombre apellido",
  },
];

/**
 * GET /api/service-bays
 * Obtener todas las bahías de servicio
 */
const getServiceBays = async (req, res = response) => {
  try {
    const { status, area, sortBy = "order", sortOrder = "asc" } = req.query;

    // Construir filtros
    const filters = { eliminado: false };

    if (status) filters.status = status;
    if (area) filters.area = area;

    // Ordenamiento
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    const bays = await ServiceBay.find(filters)
      .populate(populateOptions)
      .sort(sort);

    res.json({
      ok: true,
      bays,
      total: bays.length,
    });
  } catch (error) {
    console.error("Error getting service bays:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener las bahías de servicio",
    });
  }
};

/**
 * GET /api/service-bays/available
 * Obtener bahías disponibles
 */
const getAvailableBays = async (req, res = response) => {
  try {
    const { area, capacity } = req.query;

    const filters = {
      status: "disponible",
      eliminado: false,
    };

    if (area) filters.area = area;
    if (capacity) filters.capacity = capacity;

    const bays = await ServiceBay.find(filters).sort({ order: 1 });

    res.json({
      ok: true,
      bays,
      total: bays.length,
    });
  } catch (error) {
    console.error("Error getting available bays:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener bahías disponibles",
    });
  }
};

/**
 * GET /api/service-bays/:id
 * Obtener una bahía por ID
 */
const getServiceBayById = async (req, res = response) => {
  try {
    const { id } = req.params;

    const bay = await ServiceBay.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions);

    if (!bay) {
      return res.status(404).json({
        ok: false,
        msg: "Bahía de servicio no encontrada",
      });
    }

    res.json({
      ok: true,
      bay,
    });
  } catch (error) {
    console.error("Error getting service bay:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener la bahía de servicio",
    });
  }
};

/**
 * POST /api/service-bays
 * Crear una nueva bahía
 */
const createServiceBay = async (req, res = response) => {
  try {
    const bayData = req.body;

    // Verificar si el código ya existe
    const existingBay = await ServiceBay.findOne({
      code: bayData.code.toUpperCase(),
      eliminado: false,
    });

    if (existingBay) {
      return res.status(400).json({
        ok: false,
        msg: `Ya existe una bahía con el código ${bayData.code}`,
      });
    }

    const bay = new ServiceBay(bayData);
    await bay.save();
    await bay.populate(populateOptions);

    res.status(201).json({
      ok: true,
      bay,
      msg: "Bahía de servicio creada exitosamente",
    });
  } catch (error) {
    console.error("Error creating service bay:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al crear la bahía de servicio",
    });
  }
};

/**
 * PUT /api/service-bays/:id
 * Actualizar una bahía
 */
const updateServiceBay = async (req, res = response) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // No permitir actualizar estos campos directamente
    delete updateData.currentWorkOrder;
    delete updateData.currentTechnicians;
    delete updateData.occupiedSince;
    delete updateData.eliminado;

    const bay = await ServiceBay.findOneAndUpdate(
      { _id: id, eliminado: false },
      updateData,
      { new: true, runValidators: true }
    ).populate(populateOptions);

    if (!bay) {
      return res.status(404).json({
        ok: false,
        msg: "Bahía de servicio no encontrada",
      });
    }

    res.json({
      ok: true,
      bay,
      msg: "Bahía de servicio actualizada exitosamente",
    });
  } catch (error) {
    console.error("Error updating service bay:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al actualizar la bahía de servicio",
    });
  }
};

/**
 * DELETE /api/service-bays/:id
 * Eliminar (lógicamente) una bahía
 */
const deleteServiceBay = async (req, res = response) => {
  try {
    const { id } = req.params;

    const bay = await ServiceBay.findById(id);

    if (!bay || bay.eliminado) {
      return res.status(404).json({
        ok: false,
        msg: "Bahía de servicio no encontrada",
      });
    }

    // No permitir eliminar si está ocupada
    if (bay.status === "ocupado") {
      return res.status(400).json({
        ok: false,
        msg: "No se puede eliminar una bahía que está ocupada",
      });
    }

    bay.eliminado = true;
    await bay.save();

    res.json({
      ok: true,
      msg: "Bahía de servicio eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error deleting service bay:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al eliminar la bahía de servicio",
    });
  }
};

/**
 * PATCH /api/service-bays/:id/status
 * Cambiar estado de una bahía manualmente
 */
// const updateBayStatus = async (req, res = response) => {
//   try {
//     const { id } = req.params;
//     const { status, notes } = req.body;

//     const validStatuses = [
//       "disponible",
//       "ocupado",
//       "mantenimiento",
//       "fuera_servicio",
//     ];
//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({
//         ok: false,
//         msg: "Estado no válido",
//       });
//     }

//     const bay = await ServiceBay.findOne({ _id: id, eliminado: false });

//     if (!bay) {
//       return res.status(404).json({
//         ok: false,
//         msg: "Bahía de servicio no encontrada",
//       });
//     }

//     // Si se cambia a disponible, limpiar ocupación
//     if (status === "disponible") {
//       bay.currentWorkOrder = null;
//       bay.currentTechnicians = [];
//       bay.occupiedSince = null;
//       bay.estimatedEndTime = null;
//     }

//     bay.status = status;
//     if (notes) bay.notes = notes;
//     await bay.save();

//     res.json({
//       ok: true,
//       bay,
//       msg: "Estado de bahía actualizado exitosamente",
//     });
//   } catch (error) {
//     console.error("Error updating bay status:", error);
//     res.status(500).json({
//       ok: false,
//       msg: "Error al actualizar el estado de la bahía",
//     });
//   }
// };

module.exports = {
  getServiceBays,
  getAvailableBays,
  getServiceBayById,
  createServiceBay,
  updateServiceBay,
  deleteServiceBay,
  // updateBayStatus,
};
