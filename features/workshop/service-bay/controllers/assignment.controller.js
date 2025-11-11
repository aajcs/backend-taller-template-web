const { response } = require("express");
const {
  WorkOrderAssignment,
  ServiceBay,
  BayOccupancyHistory,
} = require("../models");
const WorkOrder = require("../../work-orders/models/workOrder.model");

/**
 * POST /api/work-orders/:workOrderId/enter-bay
 * Asignar técnico(s) a una bahía y registrar entrada
 */
const enterBay = async (req, res = response) => {
  try {
    const { workOrderId } = req.params;
    const {
      serviceBay: bayId,
      technician,
      technicians,
      role = "principal",
      entryNotes,
      estimatedHours,
    } = req.body;
    const assignedBy = req.usuario._id; // Usuario que hace la asignación

    // Validar que existe la orden de trabajo
    const workOrder = await WorkOrder.findOne({
      _id: workOrderId,
      eliminado: false,
    });
    if (!workOrder) {
      return res.status(404).json({
        ok: false,
        msg: "Orden de trabajo no encontrada",
      });
    }

    // Validar que existe la bahía
    const bay = await ServiceBay.findOne({ _id: bayId, eliminado: false });
    if (!bay) {
      return res.status(404).json({
        ok: false,
        msg: "Bahía de servicio no encontrada",
      });
    }

    // Verificar disponibilidad de la bahía
    if (bay.status === "mantenimiento" || bay.status === "fuera_servicio") {
      return res.status(400).json({
        ok: false,
        msg: `La bahía está en estado: ${bay.status}`,
      });
    }

    // Preparar lista de técnicos (puede ser uno o varios)
    const techList = technicians || [{ technician, role }];

    // Verificar capacidad de técnicos
    const currentTechCount = bay.currentTechnicians.length;
    const newTechCount = techList.length;

    if (currentTechCount + newTechCount > bay.maxTechnicians) {
      return res.status(400).json({
        ok: false,
        msg: `La bahía no puede aceptar más técnicos (máximo: ${bay.maxTechnicians})`,
      });
    }

    const assignments = [];
    const entryTime = new Date();

    // Crear asignaciones para cada técnico
    for (const tech of techList) {
      const assignment = new WorkOrderAssignment({
        workOrder: workOrderId,
        technician: tech.technician,
        serviceBay: bayId,
        role: tech.role || role,
        entryTime,
        entryNotes,
        assignedBy,
        status: "activo",
      });

      await assignment.save();
      assignments.push(assignment);

      // Agregar técnico a la bahía
      bay.currentTechnicians.push({
        technician: tech.technician,
        role: tech.role || role,
        entryTime,
      });
    }

    // Si la bahía no está ocupada, marcarla como ocupada
    if (bay.status !== "ocupado") {
      bay.status = "ocupado";
      bay.currentWorkOrder = workOrderId;
      bay.occupiedSince = entryTime;

      if (estimatedHours) {
        bay.estimatedEndTime = new Date(
          entryTime.getTime() + estimatedHours * 60 * 60 * 1000
        );
      }
    }

    await bay.save();

    // Actualizar la orden de trabajo
    workOrder.serviceBay = bayId;
    workOrder.assignments.push(...assignments.map((a) => a._id));
    await workOrder.save();

    // Poblar datos para la respuesta
    await Promise.all([
      ...assignments.map((a) =>
        a.populate("technician", "nombre apellido email")
      ),
    ]);

    res.status(201).json({
      ok: true,
      message: `${assignments.length} técnico(s) asignado(s) a bahía exitosamente`,
      assignments,
      bay: {
        _id: bay._id,
        name: bay.name,
        code: bay.code,
        status: bay.status,
        occupiedSince: bay.occupiedSince,
        estimatedEndTime: bay.estimatedEndTime,
        currentTechnicianCount: bay.currentTechnicians.length,
      },
    });
  } catch (error) {
    console.error("Error in enterBay:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al asignar técnico a bahía",
      error: error.message,
    });
  }
};

/**
 * POST /api/work-orders/:workOrderId/exit-bay
 * Registrar salida de técnico(s) de la bahía
 */
const exitBay = async (req, res = response) => {
  try {
    const { workOrderId } = req.params;
    const {
      technician,
      technicians,
      exitNotes,
      exitReason = "completado",
    } = req.body;

    // Validar que existe la orden de trabajo
    const workOrder = await WorkOrder.findOne({
      _id: workOrderId,
      eliminado: false,
    })
      .populate("serviceBay")
      .populate("assignments");

    if (!workOrder) {
      return res.status(404).json({
        ok: false,
        msg: "Orden de trabajo no encontrada",
      });
    }

    if (!workOrder.serviceBay) {
      return res.status(400).json({
        ok: false,
        msg: "La orden de trabajo no tiene una bahía asignada",
      });
    }

    // Preparar lista de técnicos
    const techList = technicians || [technician];

    const exitedAssignments = [];
    const exitTime = new Date();

    // Obtener bahía fresca desde la DB (no usar la poblada)
    const bayId = workOrder.serviceBay._id || workOrder.serviceBay;
    const bay = await ServiceBay.findById(bayId);

    if (!bay) {
      return res.status(404).json({
        ok: false,
        msg: "Bahía no encontrada",
      });
    }

    // Procesar salida de cada técnico
    for (const techId of techList) {
      // Buscar asignación activa
      const assignment = await WorkOrderAssignment.findOne({
        workOrder: workOrderId,
        technician: techId,
        status: "activo",
        eliminado: false,
      });

      if (!assignment) {
        console.warn(`No se encontró asignación activa para técnico ${techId}`);
        continue;
      }

      // Registrar salida
      assignment.exitTime = exitTime;
      assignment.exitNotes = exitNotes;
      assignment.status = "completado";
      assignment.calculateHoursWorked();
      await assignment.save();

      exitedAssignments.push(assignment);

      // Actualizar horas trabajadas en la orden
      workOrder.totalHoursWorked += assignment.hoursWorked;

      // Remover técnico de la bahía
      bay.currentTechnicians = bay.currentTechnicians.filter(
        (ct) => ct.technician.toString() !== techId.toString()
      );
    }

    // Después del loop, verificar si quedan técnicos y liberar si es necesario
    if (bay.currentTechnicians.length === 0) {
      // Crear historial de ocupación
      const history = new BayOccupancyHistory({
        serviceBay: bay._id,
        workOrder: workOrderId,
        vehicle: workOrder.vehicle,
        customer: workOrder.customer,
        entryTime: bay.occupiedSince,
        exitTime,
        exitReason,
        notes: exitNotes,
      });

      history.calculateDuration();

      // Agregar información de técnicos
      const allAssignments = await WorkOrderAssignment.find({
        workOrder: workOrderId,
        serviceBay: bay._id,
        status: "completado",
      }).populate("technician", "nombre apellido");

      history.technicians = allAssignments.map((a) => ({
        technician: a.technician._id,
        role: a.role,
        hoursWorked: a.hoursWorked,
      }));

      history.calculateTotalTechnicianHours();
      await history.save();

      // Liberar la bahía
      await bay.release();

      // Si se completó, actualizar estado de la orden
      if (exitReason === "completado") {
        // Aquí podrías cambiar el estado de la orden a "control_calidad" o similar
        // workOrder.estado = await WorkOrderStatus.findOne({ codigo: "control_calidad" });
      }
    } else {
      // Si aún quedan técnicos, solo guardar los cambios en currentTechnicians
      await bay.save();
    }

    await workOrder.save();

    // Poblar datos para respuesta
    await Promise.all(
      exitedAssignments.map((a) =>
        a.populate("technician", "nombre apellido email")
      )
    );

    res.json({
      ok: true,
      message: `Salida de ${exitedAssignments.length} técnico(s) registrada exitosamente`,
      assignments: exitedAssignments.map((a) => ({
        _id: a._id,
        technician: a.technician,
        role: a.role,
        entryTime: a.entryTime,
        exitTime: a.exitTime,
        hoursWorked: a.hoursWorked,
        duration: a.duration,
      })),
      workOrder: {
        _id: workOrder._id,
        numeroOrden: workOrder.numeroOrden,
        totalHoursWorked: workOrder.totalHoursWorked,
        serviceBay: bay.currentTechnicians.length === 0 ? null : bay._id,
      },
      bay: {
        status: bay.status,
        currentTechnicianCount: bay.currentTechnicians.length,
        currentTechnicians: bay.currentTechnicians,
        currentWorkOrder: bay.currentWorkOrder,
      },
      bayReleased: bay.currentTechnicians.length === 0,
    });
  } catch (error) {
    console.error("Error in exitBay:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al registrar salida de bahía",
      error: error.message,
    });
  }
};

/**
 * GET /api/work-orders/:workOrderId/assignments
 * Obtener todas las asignaciones de una orden de trabajo
 */
const getWorkOrderAssignments = async (req, res = response) => {
  try {
    const { workOrderId } = req.params;
    const { status } = req.query;

    const filters = {
      workOrder: workOrderId,
      eliminado: false,
    };

    if (status) filters.status = status;

    const assignments = await WorkOrderAssignment.find(filters)
      .populate("technician", "nombre apellido email")
      .populate("serviceBay", "name code area")
      .populate("assignedBy", "nombre apellido")
      .sort({ entryTime: -1 });

    res.json({
      ok: true,
      assignments,
      total: assignments.length,
    });
  } catch (error) {
    console.error("Error getting assignments:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener asignaciones",
    });
  }
};

/**
 * GET /api/technicians/:technicianId/current-assignment
 * Obtener la asignación actual de un técnico
 */
const getTechnicianCurrentAssignment = async (req, res = response) => {
  try {
    const { technicianId } = req.params;

    const assignment = await WorkOrderAssignment.findOne({
      technician: technicianId,
      status: "activo",
      eliminado: false,
    })
      .populate("workOrder", "numeroOrden motivo vehicle customer")
      .populate({
        path: "workOrder",
        populate: [
          { path: "vehicle", select: "marca modelo placa" },
          { path: "customer", select: "nombre apellido telefono" },
        ],
      })
      .populate("serviceBay", "name code area");

    if (!assignment) {
      return res.json({
        ok: true,
        assignment: null,
        message: "El técnico no tiene asignaciones activas",
      });
    }

    // Calcular horas trabajadas hasta ahora
    const hoursWorked = (new Date() - assignment.entryTime) / (1000 * 60 * 60);

    res.json({
      ok: true,
      assignment,
      currentHoursWorked: Math.round(hoursWorked * 100) / 100,
    });
  } catch (error) {
    console.error("Error getting current assignment:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener asignación actual",
    });
  }
};

/**
 * GET /api/technicians/:technicianId/assignments
 * Obtener historial de asignaciones de un técnico
 */
const getTechnicianAssignments = async (req, res = response) => {
  try {
    const { technicianId } = req.params;
    const { startDate, endDate, status } = req.query;

    const filters = {
      technician: technicianId,
      eliminado: false,
    };

    if (status) filters.status = status;

    if (startDate || endDate) {
      filters.entryTime = {};
      if (startDate) filters.entryTime.$gte = new Date(startDate);
      if (endDate) filters.entryTime.$lte = new Date(endDate);
    }

    const assignments = await WorkOrderAssignment.find(filters)
      .populate({
        path: "workOrder",
        select: "numeroOrden motivo vehicle customer",
        match: { eliminado: false },
      })
      .populate({
        path: "serviceBay",
        select: "name code",
        match: { eliminado: false },
      })
      .populate("technician", "nombre apellido email")
      .sort({ entryTime: -1 })
      .lean();

    // Filtrar asignaciones donde workOrder o serviceBay fueron eliminados
    const validAssignments = assignments.filter(
      (a) => a.workOrder && a.serviceBay
    );

    const totalHours = validAssignments.reduce(
      (sum, a) => sum + (a.hoursWorked || 0),
      0
    );

    res.json({
      ok: true,
      assignments: validAssignments,
      total: validAssignments.length,
      totalHoursWorked: Math.round(totalHours * 100) / 100,
    });
  } catch (error) {
    console.error("Error getting technician assignments:", error);
    console.error("Error details:", error.stack);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener asignaciones del técnico",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  enterBay,
  exitBay,
  getWorkOrderAssignments,
  getTechnicianCurrentAssignment,
  getTechnicianAssignments,
};
