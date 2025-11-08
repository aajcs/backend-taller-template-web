const { response, request } = require("express");
const { Model } = require("../models");

const modelsGet = async (req = request, res = response, next) => {
  try {
    const query = { eliminado: false };
    const [total, rows] = await Promise.all([
      Model.countDocuments(query),
      Model.find(query).sort({ nombre: 1 }).populate("marca"),
    ]);
    res.json({ total, models: rows });
  } catch (err) {
    next(err);
  }
};

const modelGetById = async (req = request, res = response, next) => {
  try {
    const { id } = req.params;
    const m = await Model.findOne({ _id: id, eliminado: false }).populate(
      "marca"
    );
    if (!m) return res.status(404).json({ msg: "Modelo no encontrado" });
    res.json(m);
  } catch (err) {
    next(err);
  }
};

const modelPost = async (req = request, res = response, next) => {
  try {
    const data = req.body;
    const m = new Model({ ...data, createdBy: req.usuario?._id });
    await m.save();
    res.status(201).json(m);
  } catch (err) {
    next(err);
  }
};

const modelPut = async (req = request, res = response, next) => {
  try {
    const { id } = req.params;
    const { _id, eliminado, ...rest } = req.body;
    const updated = await Model.findOneAndUpdate(
      { _id: id, eliminado: false },
      buildUpdateWithHistorial({
        rest,
        extraSetFields: {},
        historialEntry: { modificadoPor: req.usuario?._id },
      }),
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ msg: "Modelo no encontrado" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

const modelDelete = async (req = request, res = response, next) => {
  try {
    const { id } = req.params;
    const before = await Model.findById(id);
    if (!before) return res.status(404).json({ msg: "Modelo no encontrado" });
    if (before.eliminado)
      return res.status(400).json({ msg: "Modelo ya eliminado" });
    before.eliminado = true;
    await before.save();
    res.json({ msg: "Modelo eliminado", model: before });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  modelsGet,
  modelGetById,
  modelPost,
  modelPut,
  modelDelete,
};
