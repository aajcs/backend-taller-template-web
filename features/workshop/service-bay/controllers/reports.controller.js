const { response } = require("express");
const {
  ServiceBay,
  WorkOrderAssignment,
  BayOccupancyHistory,
} = require("../models");

/**
 * GET /api/dashboard/taller-status
 * Obtener estado del taller en tiempo real
 */
const getTallerStatus = async (req, res = response) => {
  try {
    // Resumen de bahías
    const totalBays = await ServiceBay.countDocuments({
      eliminado: false,
    });
    const occupiedBays = await ServiceBay.countDocuments({
      status: "ocupado",
      eliminado: false,
    });
    const availableBays = await ServiceBay.countDocuments({
      status: "disponible",
      eliminado: false,
    });
    const maintenanceBays = await ServiceBay.countDocuments({
      status: "mantenimiento",
      eliminado: false,
    });

    const utilizationRate =
      totalBays > 0 ? ((occupiedBays / totalBays) * 100).toFixed(1) : 0;

    // Bahías ocupadas con detalles
    const activeBays = await ServiceBay.find({
      eliminado: false,
    })
      // .populate({
      //   path: "currentWorkOrder",
      //   select: "numeroOrden motivo vehicle customer",
      //   populate: [
      //     {
      //       path: "vehicle",
      //       select: " modelo placa año",
      //       populate: [
      //         // { path: "marca", select: "nombre" },
      //         { path: "modelo", select: "nombre" },
      //       ],
      //     },
      //     { path: "customer", select: "nombre apellido telefono" },
      //   ],
      // })
      .populate({
        path: "currentWorkOrder",
        select: "numeroOrden motivo vehicle customer estado items",
        populate: [
          {
            path: "vehicle", // 1. Popular el vehículo
            select: "model placa año", // <-- CORREGIDO: Seleccionamos 'model' (no 'marca' ni 'modelo')
            populate: {
              path: "model", // 2. Popular el 'model' DENTRO de 'vehicle'
              select: "nombre brand", // Seleccionamos el nombre (ej: "Corolla") y la ref a 'marca'
              populate: {
                path: "brand", // 3. Popular la 'marca' DENTRO de 'model'
                select: "nombre", // Seleccionamos el nombre (ej: "Toyota")
              },
            },
          },
          { path: "customer", select: "nombre apellido telefono" },
          { path: "estado", select: "nombre" },
        ],
      })
      // .populate({
      //   path: "currentWorkOrder",
      //   select: "numeroOrden motivo vehicle customer",
      //   populate: {
      //     path: "vehicle",
      //     select: "placa año",
      //     populate: [
      //       { path: "marca", select: "nombre" },
      //       { path: "modelo", select: "nombre" },
      //     ],
      //   },
      // })
      .populate("currentTechnicians.technician", "nombre apellido email")
      .sort({ order: 1 });

    // Formatear bahías activas
    const formattedActiveBays = activeBays.map((bay) => {
      const hoursInBay = bay.occupiedSince
        ? ((new Date() - bay.occupiedSince) / (1000 * 60 * 60)).toFixed(1)
        : 0;

      return {
        bay: {
          _id: bay._id,
          name: bay.name,
          code: bay.code,
          area: bay.area,
          maxTechnicians: bay.maxTechnicians,
          equipment: bay.equipment,
          order: bay.order,
        },
        status: bay.status,
        workOrder: bay.currentWorkOrder
          ? {
              _id: bay.currentWorkOrder._id,
              numeroOrden: bay.currentWorkOrder.numeroOrden,
              motivo: bay.currentWorkOrder.motivo,
              vehicle: bay.currentWorkOrder.vehicle
                ? `${bay.currentWorkOrder.vehicle.model.brand.nombre} ${bay.currentWorkOrder.vehicle.model.nombre} - ${bay.currentWorkOrder.vehicle.placa}`
                : "N/A",
              customer: bay.currentWorkOrder.customer
                ? `${bay.currentWorkOrder.customer.nombre}`
                : "N/A",
              estado: bay.currentWorkOrder.estado,
              items: bay.currentWorkOrder.items,
            }
          : null,
        technicians: bay.currentTechnicians.map((ct) => ({
          _id: ct.technician._id,
          name: `${ct.technician.nombre}`,
          role: ct.role,
          entryTime: ct.entryTime,
        })),
        occupiedSince: bay.occupiedSince,
        estimatedCompletion: bay.estimatedEndTime,
        hoursInBay: parseFloat(hoursInBay),
      };
    });

    // Técnicos activos
    const activeTechnicians = await WorkOrderAssignment.countDocuments({
      status: "activo",
      eliminado: false,
    });

    res.json({
      ok: true,
      timestamp: new Date(),
      summary: {
        totalBays,
        occupiedBays,
        availableBays,
        maintenanceBays,
        utilizationRate: parseFloat(utilizationRate),
      },
      activeBays: formattedActiveBays,
      technicians: {
        active: activeTechnicians,
      },
    });
  } catch (error) {
    console.error("Error getting taller status:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener estado del taller",
    });
  }
};

/**
 * GET /api/reports/technician-hours
 * Reporte de horas trabajadas por técnico
 */
const getTechnicianHoursReport = async (req, res = response) => {
  try {
    const { technician, startDate, endDate } = req.query;

    const filters = {
      status: "completado",
      eliminado: false,
    };

    if (technician) filters.technician = technician;

    if (startDate || endDate) {
      filters.entryTime = {};
      if (startDate) filters.entryTime.$gte = new Date(startDate);
      if (endDate) filters.entryTime.$lte = new Date(endDate);
    }

    const assignments = await WorkOrderAssignment.find(filters)
      .populate("technician", "nombre apellido email")
      .populate("workOrder", "numeroOrden")
      .populate("serviceBay", "name code")
      .sort({ entryTime: -1 });

    // Agrupar por técnico si no se especificó uno
    if (!technician) {
      const technicianMap = new Map();

      assignments.forEach((assignment) => {
        const techId = assignment.technician._id.toString();
        if (!technicianMap.has(techId)) {
          technicianMap.set(techId, {
            technician: assignment.technician,
            totalAssignments: 0,
            totalHoursWorked: 0,
            assignments: [],
          });
        }

        const techData = technicianMap.get(techId);
        techData.totalAssignments++;
        techData.totalHoursWorked += assignment.hoursWorked || 0;
        techData.assignments.push({
          workOrder: assignment.workOrder.numeroOrden,
          bay: assignment.serviceBay.name,
          entryTime: assignment.entryTime,
          exitTime: assignment.exitTime,
          hoursWorked: assignment.hoursWorked,
        });
      });

      const report = Array.from(technicianMap.values()).map((data) => ({
        technician: {
          _id: data.technician._id,
          nombre: data.technician.nombre,
          apellido: data.technician.apellido,
          email: data.technician.email,
        },
        summary: {
          totalAssignments: data.totalAssignments,
          totalHoursWorked: Math.round(data.totalHoursWorked * 100) / 100,
          averageHoursPerAssignment:
            Math.round((data.totalHoursWorked / data.totalAssignments) * 100) /
            100,
        },
        recentAssignments: data.assignments.slice(0, 10), // Últimas 10
      }));

      return res.json({
        ok: true,
        period: { startDate, endDate },
        report,
        totalTechnicians: report.length,
      });
    }

    // Reporte de un técnico específico
    const totalHours = assignments.reduce(
      (sum, a) => sum + (a.hoursWorked || 0),
      0
    );
    const avgHours =
      assignments.length > 0 ? totalHours / assignments.length : 0;

    res.json({
      ok: true,
      technician: assignments[0]?.technician || null,
      period: { startDate, endDate },
      summary: {
        totalAssignments: assignments.length,
        totalHoursWorked: Math.round(totalHours * 100) / 100,
        averageHoursPerAssignment: Math.round(avgHours * 100) / 100,
      },
      assignments: assignments.map((a) => ({
        _id: a._id,
        workOrder: a.workOrder.numeroOrden,
        bay: `${a.serviceBay.name} (${a.serviceBay.code})`,
        role: a.role,
        entryTime: a.entryTime,
        exitTime: a.exitTime,
        hoursWorked: a.hoursWorked,
        duration: a.duration,
      })),
    });
  } catch (error) {
    console.error("Error getting technician hours report:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al generar reporte de horas",
    });
  }
};

/**
 * GET /api/reports/bay-utilization
 * Reporte de utilización de bahías
 */
const getBayUtilizationReport = async (req, res = response) => {
  try {
    const { startDate, endDate, serviceBay } = req.query;

    const filters = { eliminado: false };

    if (serviceBay) filters.serviceBay = serviceBay;

    if (startDate || endDate) {
      filters.entryTime = {};
      if (startDate) filters.entryTime.$gte = new Date(startDate);
      if (endDate) filters.entryTime.$lte = new Date(endDate);
    }

    const history = await BayOccupancyHistory.find(filters)
      .populate("serviceBay", "name code area")
      .populate("workOrder", "numeroOrden")
      .sort({ entryTime: -1 });

    // Agrupar por bahía
    const bayMap = new Map();

    history.forEach((record) => {
      const bayId = record.serviceBay._id.toString();
      if (!bayMap.has(bayId)) {
        bayMap.set(bayId, {
          bay: record.serviceBay,
          totalOrders: 0,
          occupiedHours: 0,
          totalTechnicianHours: 0,
          records: [],
        });
      }

      const bayData = bayMap.get(bayId);
      bayData.totalOrders++;
      bayData.occupiedHours += record.duration || 0;
      bayData.totalTechnicianHours += record.totalTechnicianHours || 0;
      bayData.records.push(record);
    });

    const report = Array.from(bayMap.values()).map((data) => {
      const avgOrderDuration =
        data.totalOrders > 0 ? data.occupiedHours / data.totalOrders : 0;

      return {
        bay: {
          _id: data.bay._id,
          name: data.bay.name,
          code: data.bay.code,
          area: data.bay.area,
        },
        metrics: {
          totalOrders: data.totalOrders,
          occupiedHours: Math.round(data.occupiedHours * 100) / 100,
          totalTechnicianHours:
            Math.round(data.totalTechnicianHours * 100) / 100,
          averageOrderDuration: Math.round(avgOrderDuration * 100) / 100,
        },
        recentOrders: data.records.slice(0, 10).map((r) => ({
          workOrder: r.workOrder.numeroOrden,
          entryTime: r.entryTime,
          exitTime: r.exitTime,
          duration: r.duration,
          technicianCount: r.technicians.length,
        })),
      };
    });

    res.json({
      ok: true,
      period: { startDate, endDate },
      report,
      totalBays: report.length,
    });
  } catch (error) {
    console.error("Error getting bay utilization report:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al generar reporte de utilización",
    });
  }
};

/**
 * GET /api/service-bays/:id/history
 * Historial de ocupación de una bahía
 */
const getBayHistory = async (req, res = response) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, limit = 50 } = req.query;

    const filters = {
      serviceBay: id,
      eliminado: false,
    };

    if (startDate || endDate) {
      filters.entryTime = {};
      if (startDate) filters.entryTime.$gte = new Date(startDate);
      if (endDate) filters.entryTime.$lte = new Date(endDate);
    }

    const history = await BayOccupancyHistory.find(filters)
      .populate("workOrder", "numeroOrden motivo")
      .populate({
        path: "vehicle",
        select: "placa year",
        populate: {
          path: "model",
          select: "nombre",
          populate: {
            path: "brand",
            select: "nombre",
          },
        },
      })
      .populate("customer", "nombre apellido")
      .populate("technicians.technician", "nombre apellido")
      .sort({ entryTime: -1 })
      .limit(parseInt(limit));

    const totalOrders = await BayOccupancyHistory.countDocuments(filters);
    const totalHours = history.reduce((sum, h) => sum + (h.duration || 0), 0);

    res.json({
      ok: true,
      history,
      summary: {
        totalOrders,
        totalHours: Math.round(totalHours * 100) / 100,
        averageDuration:
          history.length > 0
            ? Math.round((totalHours / history.length) * 100) / 100
            : 0,
      },
    });
  } catch (error) {
    console.error("Error getting bay history:", error);
    res.status(500).json({
      ok: false,
      msg: "Error al obtener historial de bahía",
    });
  }
};

module.exports = {
  getTallerStatus,
  getTechnicianHoursReport,
  getBayUtilizationReport,
  getBayHistory,
};
