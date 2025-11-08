const mongoose = require("mongoose");
const { Stock, Movement, PurchaseOrder, Reservation } = require("../models");

/**
 * Stock service: transactional movement application and helpers
 */
module.exports = {
  async getStockByItem(itemId) {
    return Stock.find({ item: itemId, eliminado: false }).populate("warehouse");
  },

  /**
   * Create a movement and update stock atomically.
   * payload: { tipo, item, cantidad, warehouseFrom, warehouseTo, costoUnitario, referencia, referenciaTipo, reserva, motivo, metadata }
   */
  async createMovement(payload, usuarioId, opts = {}) {
    const externalSession = opts.session;
    const session = externalSession || (await mongoose.startSession());
    const ownSession = !externalSession;
    if (ownSession) session.startTransaction();
    try {
      const {
        tipo,
        item,
        cantidad,
        warehouseFrom,
        warehouseTo,
        costoUnitario,
        referencia,
        referenciaTipo,
        reserva,
        motivo,
        metadata,
      } = payload;

      if (!item) throw new Error("item es obligatorio");
      if (!cantidad || cantidad <= 0)
        throw new Error("cantidad debe ser mayor que 0");

      // Helper to get or create stock doc
      const getOrCreateStock = async (itemId, warehouseId) => {
        let stock = await Stock.findOne({
          item: itemId,
          warehouse: warehouseId,
        }).session(session);
        if (!stock) {
          stock = new Stock({
            item: itemId,
            warehouse: warehouseId,
            cantidad: 0,
            costoPromedio: costoUnitario || 0,
          });
          await stock.save({ session });
        }
        return stock;
      };

      let resultadoStock = null;

      // Handle types
      if (["entrada", "compra"].includes(tipo)) {
        // increase destination stock
        if (!warehouseTo)
          throw new Error("warehouseTo es obligatorio para entradas");
        const stockTo = await getOrCreateStock(item, warehouseTo);
        stockTo.cantidad = (stockTo.cantidad || 0) + cantidad;
        // simple costo promedio update (weighted)
        if (costoUnitario && stockTo.costoPromedio) {
          const totalPrev =
            (stockTo.cantidad - cantidad) * stockTo.costoPromedio;
          const totalNew = cantidad * costoUnitario;
          stockTo.costoPromedio =
            (totalPrev + totalNew) / (stockTo.cantidad || 1);
        } else if (costoUnitario) stockTo.costoPromedio = costoUnitario;
        await stockTo.save({ session });
        resultadoStock = {
          cantidad: stockTo.cantidad,
          reservado: stockTo.reservado,
        };
        // If this entrada references a PurchaseOrder, update recibido
        if (referenciaTipo === "purchaseOrder" && referencia) {
          const po = await PurchaseOrder.findOne({ _id: referencia }).session(
            session
          );
          if (po) {
            // find the matching line
            const line = po.items.find(
              (l) => l.item && l.item.toString() === item.toString()
            );
            if (line) {
              line.recibido = (line.recibido || 0) + cantidad;
              // clamp to ordered cantidad
              if (line.recibido > line.cantidad) line.recibido = line.cantidad;
            }
            // recalc estado
            const allReceived = po.items.every(
              (l) => (l.recibido || 0) >= (l.cantidad || 0)
            );
            const someReceived = po.items.some((l) => (l.recibido || 0) > 0);
            po.estado = allReceived
              ? "recibido"
              : someReceived
                ? "parcial"
                : "pendiente";
            await po.save({ session });
          }
        }
      } else if (["salida", "venta", "consumo"].includes(tipo)) {
        // decrease source stock
        if (!warehouseFrom)
          throw new Error("warehouseFrom es obligatorio para salidas");
        const stockFrom = await Stock.findOne({
          item,
          warehouse: warehouseFrom,
        }).session(session);
        if (!stockFrom) throw new Error("No hay stock en el warehouse origen");
        const disponibles =
          (stockFrom.cantidad || 0) - (stockFrom.reservado || 0);
        if (disponibles < cantidad) throw new Error("No hay stock disponible");
        stockFrom.cantidad = stockFrom.cantidad - cantidad;
        // if consuming a reserva, decrement reservado as well and update Reservation
        if (reserva) {
          // decrement reserved count on stock
          stockFrom.reservado = Math.max(
            0,
            (stockFrom.reservado || 0) - cantidad
          );
          // mark reservation as consumido
          const r = await Reservation.findOne({ _id: reserva }).session(
            session
          );
          if (r && r.estado === "activo") {
            r.estado = "consumido";
            await r.save({ session });
          }
        }
        await stockFrom.save({ session });
        resultadoStock = {
          cantidad: stockFrom.cantidad,
          reservado: stockFrom.reservado,
        };
      } else if (tipo === "transferencia") {
        if (!warehouseFrom || !warehouseTo)
          throw new Error(
            "warehouseFrom y warehouseTo son obligatorios para transferencia"
          );
        const stockFrom = await Stock.findOne({
          item,
          warehouse: warehouseFrom,
        }).session(session);
        if (!stockFrom) throw new Error("No hay stock en el warehouse origen");
        const disponibles =
          (stockFrom.cantidad || 0) - (stockFrom.reservado || 0);
        if (disponibles < cantidad)
          throw new Error("No hay stock disponible para transferencia");
        stockFrom.cantidad = stockFrom.cantidad - cantidad;
        // if transfer consumes a reservation on the origin, decrement reservado and update reservation
        if (reserva) {
          stockFrom.reservado = Math.max(
            0,
            (stockFrom.reservado || 0) - cantidad
          );
          const r = await Reservation.findOne({ _id: reserva }).session(
            session
          );
          if (r && r.estado === "activo") {
            r.estado = "consumido";
            await r.save({ session });
          }
        }
        await stockFrom.save({ session });
        const stockTo = await getOrCreateStock(item, warehouseTo);
        stockTo.cantidad = (stockTo.cantidad || 0) + cantidad;
        await stockTo.save({ session });
        resultadoStock = {
          cantidad: stockTo.cantidad,
          reservado: stockTo.reservado,
        };
      } else if (tipo === "ajuste") {
        // ajuste puede venir con warehouseFrom o warehouseTo
        if (warehouseTo) {
          const stockTo = await getOrCreateStock(item, warehouseTo);
          stockTo.cantidad = (stockTo.cantidad || 0) + cantidad;
          await stockTo.save({ session });
          resultadoStock = {
            cantidad: stockTo.cantidad,
            reservado: stockTo.reservado,
          };
        } else if (warehouseFrom) {
          const stockFrom = await getOrCreateStock(item, warehouseFrom);
          stockFrom.cantidad = Math.max(
            0,
            (stockFrom.cantidad || 0) - cantidad
          );
          await stockFrom.save({ session });
          resultadoStock = {
            cantidad: stockFrom.cantidad,
            reservado: stockFrom.reservado,
          };
        }
      } else {
        // fallback: just create movement without stock change
      }

      const movement = new Movement({
        tipo,
        referencia,
        referenciaTipo,
        item,
        cantidad,
        costoUnitario,
        warehouseFrom,
        warehouseTo,
        reserva,
        motivo,
        metadata,
        idempotencyKey: payload.idempotencyKey, // pasar desde payload si existe
        fecha: new Date(),
        usuario: usuarioId,
        resultadoStock,
      });

      await movement.save({ session });

      // push historial in stocks/items could be implemented here (plugin may handle some)

      if (ownSession) {
        await session.commitTransaction();
        session.endSession();
      }

      // populate movement for response
      await movement.populate([
        "item",
        "warehouseFrom",
        "warehouseTo",
        "reserva",
        "usuario",
      ]);
      return movement;
    } catch (err) {
      if (ownSession) {
        await session.abortTransaction();
        session.endSession();
      }
      throw err;
    }
  },

  /**
   * Query movements with filters and pagination
   */
  async queryMovements({
    item,
    tipo,
    warehouse,
    from,
    to,
    page = 1,
    limit = 25,
  }) {
    const query = { eliminado: false };
    if (item) query.item = item;
    if (tipo) query.tipo = tipo;
    if (warehouse)
      query.$or = [{ warehouseFrom: warehouse }, { warehouseTo: warehouse }];
    if (from || to) query.fecha = {};
    if (from) query.fecha.$gte = new Date(from);
    if (to) query.fecha.$lte = new Date(to);

    const skip = (page - 1) * limit;
    const [total, rows] = await Promise.all([
      Movement.countDocuments(query),
      Movement.find(query)
        .sort({ fecha: -1 })
        .skip(skip)
        .limit(limit)
        .populate(["item", "warehouseFrom", "warehouseTo", "usuario"]),
    ]);
    return { total, movements: rows };
  },

  /**
   * Time series aggregation per day for an item
   */
  async timeSeries({ item, from, to, interval = "day" }) {
    const match = {
      item: require("mongoose").Types.ObjectId(item),
      eliminado: false,
    };
    if (from)
      match.fecha = Object.assign(match.fecha || {}, { $gte: new Date(from) });
    if (to)
      match.fecha = Object.assign(match.fecha || {}, { $lte: new Date(to) });

    const dateFormat = interval === "month" ? "%Y-%m" : "%Y-%m-%d";
    const pipeline = [
      { $match: match },
      {
        $project: {
          fechaStr: { $dateToString: { format: dateFormat, date: "$fecha" } },
          tipo: 1,
          cantidad: 1,
        },
      },
      {
        $group: {
          _id: "$fechaStr",
          entradas: {
            $sum: {
              $cond: [
                { $in: ["$tipo", ["entrada", "compra", "recepcion"]] },
                "$cantidad",
                0,
              ],
            },
          },
          salidas: {
            $sum: {
              $cond: [
                { $in: ["$tipo", ["salida", "venta", "consumo"]] },
                "$cantidad",
                0,
              ],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const res = await Movement.aggregate(pipeline);
    return res.map((r) => ({
      date: r._id,
      entradas: r.entradas || 0,
      salidas: r.salidas || 0,
      neto: (r.entradas || 0) - (r.salidas || 0),
    }));
  },

  /**
   * Get current stock snapshot for item (optionally warehouse)
   */
  async getStockSnapshot({ item, warehouse }) {
    if (warehouse) {
      const s = await Stock.findOne({
        item,
        warehouse,
        eliminado: false,
      }).populate("warehouse");
      if (!s)
        return { item, warehouse, cantidad: 0, reservado: 0, disponible: 0 };
      return {
        item,
        warehouse: s.warehouse,
        cantidad: s.cantidad || 0,
        reservado: s.reservado || 0,
        disponible: (s.cantidad || 0) - (s.reservado || 0),
      };
    }
    // aggregate across warehouses
    const rows = await Stock.find({ item, eliminado: false }).populate(
      "warehouse"
    );
    const total = rows.reduce(
      (acc, r) => {
        acc.cantidad += r.cantidad || 0;
        acc.reservado += r.reservado || 0;
        return acc;
      },
      { cantidad: 0, reservado: 0 }
    );
    return {
      item,
      cantidad: total.cantidad,
      reservado: total.reservado,
      disponible: total.cantidad - total.reservado,
    };
  },
};
