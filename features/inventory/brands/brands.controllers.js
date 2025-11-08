const { response, request } = require("express");
const { Brand } = require("../models");
const buildUpdateWithHistorial = require("../../../helpers/build-update-with-historial");

const brandsGet = async (req = request, res = response, next) => {
  try {
    const query = { eliminado: false };
    const [total, brands] = await Promise.all([
      Brand.countDocuments(query),
      Brand.find(query).sort({ nombre: 1 }),
    ]);
    res.json({ total, brands });
  } catch (err) {
    next(err);
  }
};

const brandGetById = async (req = request, res = response, next) => {
  try {
    const { id } = req.params;
    const brand = await Brand.findOne({ _id: id, eliminado: false });
    if (!brand) return res.status(404).json({ msg: "Marca no encontrada" });
    res.json(brand);
  } catch (err) {
    next(err);
  }
};

const brandPost = async (req = request, res = response, next) => {
  try {
    const data = req.body;
    const brand = new Brand({ ...data, createdBy: req.usuario?._id });
    await brand.save();
    res.status(201).json(brand);
  } catch (err) {
    next(err);
  }
};

const brandPut = async (req = request, res = response, next) => {
  try {
    const { id } = req.params;
    const { _id, eliminado, ...rest } = req.body;
    const update = buildUpdateWithHistorial({
      rest,
      extraSetFields: {},
      historialEntry: { modificadoPor: req.usuario?._id },
    });
    const updated = await Brand.findOneAndUpdate(
      { _id: id, eliminado: false },
      update,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ msg: "Marca no encontrada" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

const brandDelete = async (req = request, res = response, next) => {
  try {
    const { id } = req.params;
    const before = await Brand.findById(id);
    if (!before) return res.status(404).json({ msg: "Marca no encontrada" });
    if (before.eliminado)
      return res.status(400).json({ msg: "Marca ya eliminada" });
    before.eliminado = true;
    await before.save();
    res.json({ msg: "Marca eliminada", brand: before });
  } catch (err) {
    next(err);
  }
};

module.exports = { brandsGet, brandGetById, brandPost, brandPut, brandDelete };
