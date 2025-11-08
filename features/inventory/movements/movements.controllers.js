const { response, request } = require("express");
const { Movement } = require("../models");
const stockService = require("../stock/stock.services");

const populateOptions = [
  {
    path: "item",
    select: "nombre",
  },
  {
    path: "warehouseFrom",
    select: "nombre",
  },
  {
    path: "warehouseTo",
    select: "nombre",
  },
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  },
];
const movementsGet = async (req = request, res = response, next) => {
  try {
    const { item, tipo, warehouse, from, to, page = 1, limit = 25 } = req.query;
    const result = await stockService.queryMovements({
      item,
      tipo,
      warehouse,
      from,
      to,
      page: Number(page),
      limit: Number(limit),
      populate: populateOptions,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const movementPost = async (req = request, res = response, next) => {
  try {
    const data = req.body; // tipo,item,cantidad,warehouseFrom,warehouseTo,costoUnitario,...
    const usuarioId = req.usuario?._id;
    const m = await stockService.createMovement(data, usuarioId);

    // Populate the created movement before returning
    const populatedMovement = await Movement.findById(m._id).populate(
      populateOptions
    );

    res.status(201).json(populatedMovement);
  } catch (err) {
    next(err);
  }
};

const movementGetById = async (req = request, res = response, next) => {
  try {
    const m = await Movement.findOne({
      _id: req.params.id,
      eliminado: false,
    }).populate(populateOptions);
    if (!m) return res.status(404).json({ msg: "Movimiento no encontrado" });
    res.json(m);
  } catch (err) {
    next(err);
  }
};

module.exports = { movementsGet, movementPost, movementGetById };

// timeSeries and snapshot handlers used by routes (kept here to reuse stockService)
module.exports.timeSeriesHandler = async (item, from, to, interval) => {
  if (!item) throw new Error("item is required");
  return stockService.timeSeries({ item, from, to, interval });
};

module.exports.stockSnapshotHandler = async ({ item, warehouse }) => {
  if (!item) throw new Error("item is required");
  return stockService.getStockSnapshot({ item, warehouse });
};
