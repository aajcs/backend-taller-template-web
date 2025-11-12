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

    // Validar que el cliente existe y está activo
    const Customer = require("../../crm/customers/models/customer.model");
    const cliente = await Customer.findById(body.cliente);

    if (!cliente || cliente.eliminado) {
      return res.status(400).json({
        ok: false,
        msg: "Cliente no encontrado o eliminado",
      });
    }

    if (cliente.estado !== "activo") {
      return res.status(400).json({
        ok: false,
        msg: "El cliente debe estar en estado activo para crear órdenes",
      });
    }

    // generate a simple numero if not provided
    if (!body.numero) body.numero = `SO-${Date.now()}`;
    const so = new SalesOrder(body);
    await so.save();

    // Popular cliente antes de responder
    await so.populate("cliente", "nombre correo telefono tipo rif razonSocial");

    res.status(201).json(so);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const items = await SalesOrder.find({ eliminado: false })
      .populate("cliente", "nombre correo telefono tipo rif razonSocial")
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
      .populate(
        "cliente",
        "nombre correo telefono tipo rif razonSocial direccion"
      )
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
    } else {
      await so.save();
    }

    // Close session after successful commit
    if (session) {
      session.endSession();
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
    if (session && session.inTransaction()) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error("Error aborting transaction:", abortError.message);
      }
    }
    if (session) {
      session.endSession();
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

    // Idempotency check (only for non-partial orders to allow multiple shipments)
    const idempotencyKey = req.body.idempotencyKey;
    if (idempotencyKey && so.shipIdempotencyKey && so.estado !== "parcial") {
      if (so.shipIdempotencyKey === idempotencyKey) {
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
        const rQuery = Reservation.findOne({
          _id: { $in: so.reservations },
          item: line.item,
          estado: "activo",
        });
        const r = session ? await rQuery.session(session) : await rQuery;

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
          if (session) {
            await r.save({ session });
          } else {
            await r.save();
          }
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
        const rQuery = Reservation.findById(rId);
        const r = session ? await rQuery.session(session) : await rQuery;
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
        if (session) {
          await r.save({ session });
        } else {
          await r.save();
        }

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

    if (session) {
      await so.save({ session });
      await session.commitTransaction();
    } else {
      await so.save();
    }

    // Close session after successful commit
    if (session) {
      session.endSession();
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

    res.json({
      ok: true,
      salesOrder: updated,
      movements: updated.reservations.filter((r) => r.estado === "consumido")
        .length,
    });
  } catch (err) {
    if (session && session.inTransaction()) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error("Error aborting transaction:", abortError.message);
      }
    }
    if (session) {
      session.endSession();
    }
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
      const rQuery = Reservation.findById(rId);
      const r = session ? await rQuery.session(session) : await rQuery;
      if (!r) continue;

      // Find the stock document and decrement reservado
      const stockQuery = Stock.findOne({
        item: r.item,
        warehouse: r.warehouse,
      });
      const stock = session
        ? await stockQuery.session(session)
        : await stockQuery;
      if (stock) {
        stock.reservado = Math.max(0, (stock.reservado || 0) - r.cantidad);
        if (session) {
          await stock.save({ session });
        } else {
          await stock.save();
        }
      }

      r.estado = "liberado";
      if (session) {
        await r.save({ session });
      } else {
        await r.save();
      }
    }

    so.estado = "cancelada";
    so.fechaCancelacion = new Date();
    if (idempotencyKey) so.cancelIdempotencyKey = idempotencyKey;

    if (session) {
      await so.save({ session });
      await session.commitTransaction();
    } else {
      await so.save();
    }

    // Close session after successful commit (outside of critical path)
    if (session) {
      session.endSession();
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

    res.json({
      ok: true,
      salesOrder: updated,
      liberatedReservations: so.reservations.length,
    });
  } catch (err) {
    console.error("❌ Error en cancel():", err);
    if (session && session.inTransaction()) {
      try {
        await session.abortTransaction();
      } catch (abortError) {
        console.error("Error aborting transaction:", abortError.message);
      }
    }
    if (session) {
      session.endSession();
    }
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
