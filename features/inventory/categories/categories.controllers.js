const { response, request } = require("express");
const { Category } = require("../models");
const buildUpdateWithHistorial = require("../../../helpers/build-update-with-historial");

const categoriesGet = async (req = request, res = response, next) => {
  try {
    const query = { eliminado: false };
    const [total, categories] = await Promise.all([
      Category.countDocuments(query),
      Category.find(query).sort({ nombre: 1 }),
    ]);
    res.json({ total, categories });
  } catch (err) {
    next(err);
  }
};

const categoryGetById = async (req = request, res = response, next) => {
  try {
    const { id } = req.params;
    const category = await Category.findOne({ _id: id, eliminado: false });
    if (!category)
      return res.status(404).json({ msg: "Categoria no encontrada" });
    res.json(category);
  } catch (err) {
    next(err);
  }
};

const categoryPost = async (req = request, res = response, next) => {
  try {
    const data = req.body;
    const category = new Category({ ...data, createdBy: req.usuario?._id });
    await category.save();
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
};

const categoryPut = async (req = request, res = response, next) => {
  try {
    const { id } = req.params;
    const { _id, eliminado, ...rest } = req.body;
    const updated = await Category.findOneAndUpdate(
      { _id: id, eliminado: false },
      buildUpdateWithHistorial({
        rest,
        extraSetFields: {},
        historialEntry: { modificadoPor: req.usuario?._id },
      }),
      { new: true, runValidators: true }
    );
    if (!updated)
      return res.status(404).json({ msg: "Categoria no encontrada" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

const categoryDelete = async (req = request, res = response, next) => {
  try {
    const { id } = req.params;
    const before = await Category.findById(id);
    if (!before)
      return res.status(404).json({ msg: "Categoria no encontrada" });
    if (before.eliminado)
      return res.status(400).json({ msg: "Categoria ya eliminada" });
    before.eliminado = true;
    await before.save();
    res.json({ msg: "Categoria eliminada", category: before });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  categoriesGet,
  categoryGetById,
  categoryPost,
  categoryPut,
  categoryDelete,
};
