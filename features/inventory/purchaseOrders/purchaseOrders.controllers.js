const mongoose = require("mongoose");
const { response, request } = require("express");
const { PurchaseOrder } = require("../models");
const buildUpdateWithHistorial = require("../../../helpers/build-update-with-historial");
const stockService = require("../stock/stock.services");

const populateOptions = [
  {
    path: "proveedor",
    select: "nombre",
  },
  {
    path: "items",
    populate: { path: "item", select: "nombre" },
  },
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  },
];

const purchaseOrdersGet = async (req = request, res = response, next) => {
  try {
    const rows = await PurchaseOrder.find({ eliminado: false }).populate(
      populateOptions
    );
    res.json({ total: rows.length, purchaseOrders: rows });
  } catch (err) {
    next(err);
  }
};
const purchaseOrderGetById = async (req = request, res = response, next) => {
  try {
    const o = await PurchaseOrder.findOne({
      _id: req.params.id,
      eliminado: false,
    }).populate(populateOptions);
    if (!o) return res.status(404).json({ msg: "Orden no encontrada" });
    res.json(o);
  } catch (err) {
    next(err);
  }
};
const purchaseOrderPost = async (req = request, res = response, next) => {
  try {
    const data = req.body;
    data.creadoPor = req.usuario?._id;
    const po = new PurchaseOrder(data);
    await po.save();
    res.status(201).json(po);
  } catch (err) {
    next(err);
  }
};
const purchaseOrderPut = async (req = request, res = response, next) => {
  try {
    const { id } = req.params;
    const { _id, eliminado, ...rest } = req.body;
    const update = buildUpdateWithHistorial({
      rest,
      extraSetFields: {},
      historialEntry: { modificadoPor: req.usuario?._id },
    });
    const updated = await PurchaseOrder.findOneAndUpdate(
      { _id: id, eliminado: false },
      update,
      { new: true, runValidators: true }
    ).populate(populateOptions);
    if (!updated) return res.status(404).json({ msg: "Orden no encontrada" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};
const purchaseOrderDelete = async (req = request, res = response, next) => {
  try {
    const p = await PurchaseOrder.findById(req.params.id);
    if (!p) return res.status(404).json({ msg: "Orden no encontrada" });
    p.eliminado = true;
    await p.save();
    res.json({ msg: "Orden eliminada", order: p });
  } catch (err) {
    next(err);
  }
};

/**
 * Batch receive endpoint: procesa múltiples líneas de recepción en una sola transacción
 * POST /api/inventory/purchaseOrders/:id/receive
 * Body: {
 *   warehouse: <warehouseId>,  // obligatorio
 *   items: [
 *     { item: <itemId>, cantidad: <number>, costoUnitario: <number> (opcional) },
 *     ...
 *   ]
 * }
 */
const purchaseOrderReceive = async (req = request, res = response, next) => {
  let session = null;
  try {
    const { id } = req.params;
    const { warehouse, items, idempotencyKey } = req.body;

    // Validaciones
    if (!warehouse) {
      throw { status: 400, message: "warehouse es obligatorio" };
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      throw {
        status: 400,
        message: "items debe ser un array con al menos una línea",
      };
    }

    // Check idempotency: si ya existe un movement con esta key, devolver resultado anterior
    if (idempotencyKey) {
      const { Movement } = require("../models");
      const existingMovement = await Movement.findOne({
        idempotencyKey,
        eliminado: false,
      }).populate(["item", "warehouseFrom", "warehouseTo"]);

      if (existingMovement) {
        // Ya procesado — devolver respuesta idempotente
        const po = await PurchaseOrder.findById(id).populate(populateOptions);
        return res.json({
          msg: "Recepción ya procesada (idempotente)",
          purchaseOrder: po,
          movements: [existingMovement], // devolver el movement existente
          idempotent: true,
        });
      }
    }

    session = await mongoose.startSession();
    session.startTransaction();

    // Verificar que PO existe
    const po = await PurchaseOrder.findOne({
      _id: id,
      eliminado: false,
    }).session(session);
    if (!po) throw { status: 404, message: "PurchaseOrder no encontrada" };

    const movements = [];
    const usuarioId = req.usuario?._id;

    // Procesar cada línea
    for (const line of items) {
      if (!line.item || !line.cantidad || line.cantidad <= 0) {
        throw {
          status: 400,
          message: `Línea inválida: item y cantidad son obligatorios (cantidad > 0)`,
        };
      }

      // Buscar línea en PO
      const poLine = po.items.find(
        (l) => l.item && l.item.toString() === line.item.toString()
      );
      if (!poLine) {
        throw {
          status: 400,
          message: `Item ${line.item} no está en esta PurchaseOrder`,
        };
      }

      // Calcular remanente
      const remanente = (poLine.cantidad || 0) - (poLine.recibido || 0);
      if (remanente <= 0) {
        // Línea ya recibida completamente — skip o throw según política
        // Por ahora permitimos continuar (no-op) o podríamos skip silent
        continue;
      }

      // Determinar cantidad a aplicar (no exceder remanente por default; puedes cambiar política)
      const cantidadAplicar = Math.min(line.cantidad, remanente);

      // Construir idempotencyKey único por línea si se proporciona clave base
      let lineIdempotencyKey = null;
      if (idempotencyKey) {
        // Formato: idempotencyKey-base + item + cantidad para unicidad por línea
        lineIdempotencyKey = `${idempotencyKey}-${line.item}-${cantidadAplicar}`;
      }

      // Crear movement via stockService (pasa session)
      const movement = await stockService.createMovement(
        {
          tipo: "entrada",
          item: line.item,
          cantidad: cantidadAplicar,
          warehouseTo: warehouse,
          costoUnitario: line.costoUnitario,
          referenciaTipo: "purchaseOrder",
          referencia: po._id,
          motivo: line.motivo || `Recepción batch PO-${po.numero || id}`,
          metadata: line.metadata,
          idempotencyKey: lineIdempotencyKey,
        },
        usuarioId,
        { session }
      );

      movements.push(movement);
    }

    // Refetch PO para obtener estado actualizado (createMovement ya actualizó PO dentro de session)
    await po.populate(populateOptions);

    await session.commitTransaction();
    session.endSession();

    res.json({
      msg: "Recepción procesada exitosamente",
      purchaseOrder: po,
      movements,
    });
  } catch (err) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    next(err);
  }
};

module.exports = {
  purchaseOrdersGet,
  purchaseOrderGetById,
  purchaseOrderPost,
  purchaseOrderPut,
  purchaseOrderDelete,
  purchaseOrderReceive,
};
