/**
 * Controlador para acciones de reservas: generación de orden de salida y entrega
 */

const { response, request } = require("express");
const { Reservation } = require("../models");
const stockService = require("../stock/stock.services");

/**
 * Generar orden de salida para una reserva
 * Cambia el estado de "activo" a "pendiente_retiro"
 */
const generarOrdenSalida = async (req = request, res = response) => {
  try {
    const { reservaId } = req.params;

    const reserva = await Reservation.findById(reservaId)
      .populate("item", "nombre codigo")
      .populate("warehouse", "nombre")
      .populate("ordenTrabajo", "numeroOrden");

    if (!reserva || reserva.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Reserva no encontrada",
      });
    }

    if (reserva.estado !== "activo") {
      return res.status(400).json({
        success: false,
        message: `No se puede generar orden de salida. Estado actual: ${reserva.estado}`,
      });
    }

    // Cambiar estado a pendiente_retiro
    reserva.estado = "pendiente_retiro";
    await reserva.save();

    res.json({
      success: true,
      message: "Orden de salida generada correctamente",
      data: {
        reserva,
        ordenSalida: {
          numero: `SAL-${reserva._id.toString().slice(-8).toUpperCase()}`,
          fecha: new Date(),
          almacen: reserva.warehouse.nombre,
          repuesto: reserva.item.nombre,
          cantidad: reserva.cantidad,
          ordenTrabajo: reserva.ordenTrabajo?.numeroOrden || "N/A",
          estado: "Pendiente de retiro",
        },
      },
    });
  } catch (error) {
    console.error("Error al generar orden de salida:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Entregar repuesto (consumir reserva)
 * Cambia el estado a "entregado" y crea el movimiento de salida de inventario
 */
const entregarRepuesto = async (req = request, res = response) => {
  try {
    const { reservaId } = req.params;
    const { recibidoPor, notas } = req.body;

    const reserva = await Reservation.findById(reservaId)
      .populate("item", "nombre codigo")
      .populate("warehouse", "nombre")
      .populate("ordenTrabajo", "numeroOrden");

    if (!reserva || reserva.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Reserva no encontrada",
      });
    }

    if (reserva.estado !== "pendiente_retiro") {
      return res.status(400).json({
        success: false,
        message: `No se puede entregar. Estado actual: ${reserva.estado}. Debe estar en "pendiente_retiro"`,
      });
    }

    // Crear movimiento de salida de inventario
    const movimiento = await stockService.createMovement(
      {
        tipo: "salida",
        referencia: reserva.ordenTrabajo
          ? `OT-${reserva.ordenTrabajo.numeroOrden}`
          : `SAL-${reserva._id.toString().slice(-8).toUpperCase()}`,
        referenciaTipo: "workOrder",
        item: reserva.item._id,
        cantidad: reserva.cantidad,
        warehouseFrom: reserva.warehouse._id,
        reserva: reserva._id,
        motivo:
          notas ||
          `Entrega para orden de trabajo ${reserva.ordenTrabajo?.numeroOrden}`,
        metadata: {
          ordenTrabajo: reserva.ordenTrabajo?._id,
          recibidoPor,
        },
      },
      req.usuario?._id
    );

    // Actualizar reserva a estado "entregado" (o "consumido" según tu preferencia)
    reserva.estado = "consumido"; // El repuesto ya salió del almacén
    reserva.fechaEntrega = new Date();
    reserva.entregadoPor = req.usuario?._id;
    reserva.recibidoPor = recibidoPor;
    await reserva.save();

    res.json({
      success: true,
      message: "Repuesto entregado correctamente. Stock actualizado.",
      data: {
        reserva,
        movimiento,
        stockActualizado: movimiento.resultadoStock,
      },
    });
  } catch (error) {
    console.error("Error al entregar repuesto:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Obtener reservas pendientes de retiro
 */
const getReservasPendientes = async (req = request, res = response) => {
  try {
    const reservas = await Reservation.find({
      estado: "pendiente_retiro",
      eliminado: false,
    })
      .populate("item", "nombre codigo")
      .populate("warehouse", "nombre")
      .populate("ordenTrabajo", "numeroOrden")
      .populate("reservadoPor", "nombre")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      total: reservas.length,
      data: reservas,
    });
  } catch (error) {
    console.error("Error al obtener reservas pendientes:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

/**
 * Obtener reservas activas (sin orden de salida aún)
 */
const getReservasActivas = async (req = request, res = response) => {
  try {
    const reservas = await Reservation.find({
      estado: "activo",
      eliminado: false,
    })
      .populate("item", "nombre codigo")
      .populate("warehouse", "nombre")
      .populate("ordenTrabajo", "numeroOrden")
      .populate("reservadoPor", "nombre")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      total: reservas.length,
      data: reservas,
    });
  } catch (error) {
    console.error("Error al obtener reservas activas:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  generarOrdenSalida,
  entregarRepuesto,
  getReservasPendientes,
  getReservasActivas,
};
