const mongoose = require("mongoose");
const SalesOrder = require("./salesOrder.model");
const Reservation = require("../reservations/reservation.models");
const { Stock } = require("../models");
const stockService = require("../stock/stock.services");
const buildUpdateWithHistorial = require("../../../helpers/build-update-with-historial");

/**
 * Create a new SalesOrder (draft)
 */
async function create(req, res, next) {
  try {
    const body = req.body;
    // generate a simple numero if not provided
    if (!body.numero) body.numero = `SO-${Date.now()}`;
    const so = new SalesOrder(body);
    await so.save();
    res.status(201).json(so);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const items = await SalesOrder.find({ eliminado: false })
      .populate({
        path: "reservations",
        populate: [
          { path: "item", select: "nombre codigo" },
          { path: "warehouse", select: "nombre codigo" },
        ],
      })
      .lean();
    res.json(items);
  } catch (err) {
    next(err);
  }
}

async function get(req, res, next) {
  try {
    const id = req.params.id;
    const so = await SalesOrder.findById(id)
      .populate({
        path: "reservations",
        populate: [
          { path: "item", select: "nombre codigo" },
          { path: "warehouse", select: "nombre codigo" },
        ],
      })
      .exec();
    if (!so) return res.status(404).end();
    res.json(so);
  } catch (err) {
    next(err);
  }
}

/**
 * Confirm: create reservations for each line and mark order as confirmada
 */
async function confirm(req, res, next) {
  let session = null;
  try {
    // Try to start a session, but handle if replica set is not available
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (sessionError) {
      console.warn(
        "⚠️  MongoDB session/transaction not available:",
        sessionError.message
      );
      console.warn(
        "⚠️  Continuing without transaction (not recommended for production)"
      );
      // Continue without session
    }

    const id = req.params.id;
    const so = session
      ? await SalesOrder.findById(id).session(session)
      : await SalesOrder.findById(id);
    if (!so) throw { status: 404, message: "SalesOrder not found" };

    // Idempotency check
    const idempotencyKey = req.body.idempotencyKey;
    if (idempotencyKey && so.confirmIdempotencyKey) {
      if (so.confirmIdempotencyKey === idempotencyKey) {
        // Already processed with this key, return current state
        if (session) {
          await session.abortTransaction();
          session.endSession();
        }
        const existing = await SalesOrder.findById(id)
          .populate("reservations")
          .exec();
        return res.json(existing);
      } else {
        throw {
          status: 409,
          message: "SalesOrder already confirmed with different idempotencyKey",
        };
      }
    }

    // State transition validation
    const allowedStates = ["borrador", "pendiente"];
    if (!allowedStates.includes(so.estado)) {
      throw {
        status: 400,
        message: `Cannot confirm SalesOrder in estado '${so.estado}'. Allowed: ${allowedStates.join(", ")}`,
      };
    }

    // create reservations per line (simple reservation of cantidad)
    const reservations = [];
    const warehouse = req.body.warehouse; // required: warehouse where to reserve from
    if (!warehouse)
      throw {
        status: 400,
        message: "warehouse is required to create reservations",
      };
    for (const line of so.items) {
      // ensure stock exists and has available quantity
      const stockQuery = Stock.findOne({ item: line.item, warehouse });
      let stock = session
        ? await stockQuery.session(session)
        : await stockQuery;

      if (!stock) {
        // if no stock doc exists, we consider available = 0 -> cannot reserve
        throw { status: 400, message: "No hay stock disponible para reservar" };
      }
      const disponible = (stock.cantidad || 0) - (stock.reservado || 0);
      if (disponible < line.cantidad) {
        throw { status: 400, message: "No hay stock disponible para reservar" };
      }

      // increment reserved on stock
      stock.reservado = (stock.reservado || 0) + line.cantidad;
      if (session) {
        await stock.save({ session });
      } else {
        await stock.save();
      }

      const r = new Reservation({
        item: line.item,
        warehouse,
        cantidad: line.cantidad,
        origenTipo: "SalesOrder",
        origen: so._id,
        // use the canonical enum value for an active reservation
        estado: "activo",
      });
      if (session) {
        await r.save({ session });
      } else {
        await r.save();
      }
      reservations.push(r._id);
    }

    so.reservations = reservations;
    so.estado = "confirmada";
    so.fechaConfirmacion = new Date();
    if (idempotencyKey) so.confirmIdempotencyKey = idempotencyKey;

    if (session) {
      await so.save({ session });
      await session.commitTransaction();
      session.endSession();
    } else {
      await so.save();
    }
    const updated = await SalesOrder.findById(id)
      .populate({
        path: "reservations",
        populate: [
          { path: "item", select: "nombre codigo" },
          { path: "warehouse", select: "nombre codigo" },
        ],
      })
      .exec();
    res.json(updated);
  } catch (err) {
    if (session) {
      try {
        await session.abortTransaction();
        session.endSession();
      } catch (abortError) {
        console.error("Error aborting transaction:", abortError.message);
      }
    }
    next(err);
  }
}

/**
 * Ship: consume reservations, create movements and decrement stock.reservado
 */
async function ship(req, res, next) {
  let session = null;
  try {
    // Try to start a session, but handle if replica set is not available
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (sessionError) {
      console.warn(
        "⚠️  MongoDB session/transaction not available:",
        sessionError.message
      );
      console.warn(
        "⚠️  Continuing without transaction (not recommended for production)"
      );
    }

    const id = req.params.id;
    const soQuery = SalesOrder.findById(id).populate("reservations");
    const so = session ? await soQuery.session(session) : await soQuery;
    if (!so) throw { status: 404, message: "SalesOrder not found" };

    // Idempotency check
    const idempotencyKey = req.body.idempotencyKey;
    if (idempotencyKey && so.shipIdempotencyKey) {
      if (so.shipIdempotencyKey === idempotencyKey) {
        // Already processed with this key, return current state
        await session.abortTransaction();
        session.endSession();
        const existing = await SalesOrder.findById(id)
          .populate("reservations")
          .exec();
        return res.json(existing);
      } else {
        throw {
          status: 409,
          message: "SalesOrder already shipped with different idempotencyKey",
        };
      }
    }

    // State transition validation
    const allowedStates = ["confirmada", "parcial"];
    if (!allowedStates.includes(so.estado)) {
      throw {
        status: 400,
        message: `Cannot ship SalesOrder in estado '${so.estado}'. Allowed: ${allowedStates.join(", ")}`,
      };
    }

    // Partial shipping support: req.body.items = [{ item: ObjectId, cantidad: Number }]
    const itemsToShip = req.body.items || [];
    const isPartialShip = itemsToShip.length > 0;

    if (isPartialShip) {
      // Process only specified items with specified quantities
      for (const shipItem of itemsToShip) {
        // Find matching line in SO
        const line = so.items.find(
          (l) => l.item.toString() === shipItem.item.toString()
        );
        if (!line) {
          throw {
            status: 400,
            message: `Item ${shipItem.item} not found in SalesOrder`,
          };
        }

        const cantidadPendiente = line.cantidad - (line.entregado || 0);
        const cantidadAEntregar = Math.min(
          shipItem.cantidad,
          cantidadPendiente
        );

        if (cantidadAEntregar <= 0) {
          throw {
            status: 400,
            message: `Item ${shipItem.item} ya está completamente entregado`,
          };
        }

        // Find active reservation for this item
        const r = await Reservation.findOne({
          _id: { $in: so.reservations },
          item: line.item,
          estado: "activo",
        }).session(session);

        if (!r) {
          throw {
            status: 400,
            message: `No active reservation found for item ${shipItem.item}`,
          };
        }

        // Create movement for the quantity being shipped
        await stockService.createMovement(
          {
            referenciaTipo: "SalesOrder",
            referencia: so._id,
            tipo: "salida",
            item: r.item,
            cantidad: cantidadAEntregar,
            warehouseFrom: r.warehouse,
            reserva: r._id,
          },
          req.usuario?._id,
          { session }
        );

        // Update line.entregado
        line.entregado = (line.entregado || 0) + cantidadAEntregar;

        // If this line is fully delivered, mark reservation consumed
        if (line.entregado >= line.cantidad) {
          r.estado = "consumido";
          await r.save({ session });
        }
      }

      // Calculate if order is fully shipped or partial
      const allDelivered = so.items.every((l) => l.entregado >= l.cantidad);
      so.estado = allDelivered ? "despachada" : "parcial";
      if (allDelivered && !so.fechaDespacho) {
        so.fechaDespacho = new Date();
      }
    } else {
      // Full shipping: process all active reservations
      for (const rId of so.reservations) {
        const r = await Reservation.findById(rId).session(session);
        if (!r || r.estado !== "activo") continue;

        // call createMovement to decrement stock
        await stockService.createMovement(
          {
            referenciaTipo: "SalesOrder",
            referencia: so._id,
            tipo: "salida",
            item: r.item,
            cantidad: r.cantidad,
            warehouseFrom: r.warehouse,
            reserva: r._id,
          },
          req.usuario?._id,
          { session }
        );

        r.estado = "consumido";
        await r.save({ session });

        // Update line.entregado
        const line = so.items.find(
          (l) => l.item.toString() === r.item.toString()
        );
        if (line) {
          line.entregado = line.cantidad;
        }
      }

      so.estado = "despachada";
      so.fechaDespacho = new Date();
    }

    if (idempotencyKey) so.shipIdempotencyKey = idempotencyKey;
    await so.save({ session });

    await session.commitTransaction();
    session.endSession();
    const updated = await SalesOrder.findById(id)
      .populate({
        path: "reservations",
        populate: [
          { path: "item", select: "nombre codigo" },
          { path: "warehouse", select: "nombre codigo" },
        ],
      })
      .exec();
    res.json(updated);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
}

async function cancel(req, res, next) {
  let session = null;
  try {
    // Try to start a session, but handle if replica set is not available
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (sessionError) {
      console.warn(
        "⚠️  MongoDB session/transaction not available:",
        sessionError.message
      );
      console.warn(
        "⚠️  Continuing without transaction (not recommended for production)"
      );
    }

    const id = req.params.id;
    const soQuery = SalesOrder.findById(id).populate("reservations");
    const so = session ? await soQuery.session(session) : await soQuery;
    if (!so) throw { status: 404, message: "SalesOrder not found" };

    // Idempotency check
    const idempotencyKey = req.body.idempotencyKey;
    if (idempotencyKey && so.cancelIdempotencyKey) {
      if (so.cancelIdempotencyKey === idempotencyKey) {
        // Already processed with this key, return current state
        await session.abortTransaction();
        session.endSession();
        const existing = await SalesOrder.findById(id)
          .populate("reservations")
          .exec();
        return res.json(existing);
      } else {
        throw {
          status: 409,
          message: "SalesOrder already canceled with different idempotencyKey",
        };
      }
    }

    // State transition validation
    const allowedStates = ["borrador", "pendiente", "confirmada", "parcial"];
    if (!allowedStates.includes(so.estado)) {
      throw {
        status: 400,
        message: `Cannot cancel SalesOrder in estado '${so.estado}'. Allowed: ${allowedStates.join(", ")}`,
      };
    }

    // release reservations AND decrement stock.reservado (FIX)
    for (const rId of so.reservations) {
      const r = await Reservation.findById(rId).session(session);
      if (!r) continue;

      // Find the stock document and decrement reservado
      const stock = await Stock.findOne({
        item: r.item,
        warehouse: r.warehouse,
      }).session(session);
      if (stock) {
        stock.reservado = Math.max(0, (stock.reservado || 0) - r.cantidad);
        await stock.save({ session });
      }

      r.estado = "liberado";
      await r.save({ session });
    }

    so.estado = "cancelada";
    so.fechaCancelacion = new Date();
    if (idempotencyKey) so.cancelIdempotencyKey = idempotencyKey;
    await so.save({ session });

    await session.commitTransaction();
    session.endSession();
    const updated = await SalesOrder.findById(id)
      .populate({
        path: "reservations",
        populate: [
          { path: "item", select: "nombre codigo" },
          { path: "warehouse", select: "nombre codigo" },
        ],
      })
      .exec();
    res.json(updated);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const id = req.params.id;
    const body = req.body;
    const update = buildUpdateWithHistorial(body);
    const updated = await SalesOrder.findByIdAndUpdate(id, update, {
      new: true,
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, get, confirm, ship, cancel, update };
