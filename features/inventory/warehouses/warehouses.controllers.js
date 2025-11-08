const { response, request } = require("express");
const { Warehouse } = require("../models");
const buildUpdateWithHistorial = require("../../../helpers/build-update-with-historial");

const warehousesGet = async (req = request, res = response, next) => {
  try {
    const ws = await Warehouse.find({ eliminado: false }).sort({ nombre: 1 });
    res.json({ total: ws.length, warehouses: ws });
  } catch (err) {
    next(err);
  }
};
const warehouseGetById = async (req = request, res = response, next) => {
  try {
    const w = await Warehouse.findOne({ _id: req.params.id, eliminado: false });
    if (!w) return res.status(404).json({ msg: "Warehouse no encontrado" });
    res.json(w);
  } catch (err) {
    next(err);
  }
};
const warehousePost = async (req = request, res = response, next) => {
  try {
    const data = req.body;
    const w = new Warehouse({ ...data, createdBy: req.usuario?._id });
    await w.save();
    res.status(201).json(w);
  } catch (err) {
    next(err);
  }
};
const warehousePut = async (req = request, res = response, next) => {
  try {
    const { id } = req.params;
    const { _id, eliminado, ...rest } = req.body;
    const update = buildUpdateWithHistorial({
      rest,
      extraSetFields: {},
      historialEntry: { modificadoPor: req.usuario?._id },
    });
    const updated = await Warehouse.findOneAndUpdate(
      { _id: id, eliminado: false },
      update,
      { new: true, runValidators: true }
    );
    if (!updated)
      return res.status(404).json({ msg: "Warehouse no encontrado" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};
const warehouseDelete = async (req = request, res = response, next) => {
  try {
    const w = await Warehouse.findById(req.params.id);
    if (!w) return res.status(404).json({ msg: "Warehouse no encontrado" });
    w.eliminado = true;
    await w.save();
    res.json({ msg: "Warehouse eliminado", warehouse: w });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  warehousesGet,
  warehouseGetById,
  warehousePost,
  warehousePut,
  warehouseDelete,
};
