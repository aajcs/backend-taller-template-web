const { response, request } = require("express");

const buildUpdateWithHistorial = require("../../../helpers/build-update-with-historial");
const { Unit } = require("../models");

const unitsGet = async (req = request, res = response, next) => {
  try {
    const query = { eliminado: false };
    const [total, units] = await Promise.all([
      Unit.countDocuments(query),
      Unit.find(query).sort({ nombre: 1 }),
    ]);
    res.json({ total, units });
  } catch (err) {
    next(err);
  }
};

const unitGetById = async (req = request, res = response, next) => {
  try {
    const { id } = req.params;
    const unit = await Unit.findOne({ _id: id, eliminado: false });
    if (!unit) return res.status(404).json({ msg: "Unidad no encontrada" });
    res.json(unit);
  } catch (err) {
    next(err);
  }
};

const unitPost = async (req = request, res = response, next) => {
  try {
    const data = req.body;
    const unit = new Unit({ ...data, createdBy: req.usuario?._id });
    await unit.save();
    res.status(201).json(unit);
  } catch (err) {
    next(err);
  }
};

const unitPut = async (req = request, res = response, next) => {
  try {
    const { id } = req.params;
    const { _id, eliminado, ...rest } = req.body;
    const updated = await Unit.findOneAndUpdate(
      { _id: id, eliminado: false },
      buildUpdateWithHistorial({
        rest,
        extraSetFields: {},
        historialEntry: { modificadoPor: req.usuario?._id },
      }),
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ msg: "Unidad no encontrada" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

const unitDelete = async (req = request, res = response, next) => {
  try {
    const { id } = req.params;
    const before = await Unit.findById(id);
    if (!before) return res.status(404).json({ msg: "Unidad no encontrada" });
    if (before.eliminado)
      return res.status(400).json({ msg: "Unidad ya eliminada" });
    before.eliminado = true;
    await before.save();
    res.json({ msg: "Unidad eliminada", unit: before });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  unitsGet,
  unitGetById,
  unitPost,
  unitPut,
  unitDelete,
};
