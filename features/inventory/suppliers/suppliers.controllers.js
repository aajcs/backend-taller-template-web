const { response, request } = require("express");
const { Supplier } = require("../models");
const buildUpdateWithHistorial = require("../../../helpers/build-update-with-historial");

const suppliersGet = async (req = request, res = response, next) => {
  try {
    const suppliers = await Supplier.find({ eliminado: false }).sort({
      nombre: 1,
    });
    res.json({ total: suppliers.length, suppliers });
  } catch (err) {
    next(err);
  }
};

const supplierGetById = async (req = request, res = response, next) => {
  try {
    const s = await Supplier.findOne({ _id: req.params.id, eliminado: false });
    if (!s) return res.status(404).json({ msg: "Proveedor no encontrado" });
    res.json(s);
  } catch (err) {
    next(err);
  }
};
const supplierPost = async (req = request, res = response, next) => {
  try {
    const data = req.body;
    const s = new Supplier({ ...data, createdBy: req.usuario?._id });
    await s.save();
    res.status(201).json(s);
  } catch (err) {
    next(err);
  }
};
const supplierPut = async (req = request, res = response, next) => {
  try {
    const { id } = req.params;
    const { _id, eliminado, ...rest } = req.body;
    const update = buildUpdateWithHistorial({
      rest,
      extraSetFields: {},
      historialEntry: { modificadoPor: req.usuario?._id },
    });
    const updated = await Supplier.findOneAndUpdate(
      { _id: id, eliminado: false },
      update,
      { new: true, runValidators: true }
    );
    if (!updated)
      return res.status(404).json({ msg: "Proveedor no encontrado" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};
const supplierDelete = async (req = request, res = response, next) => {
  try {
    const s = await Supplier.findById(req.params.id);
    if (!s) return res.status(404).json({ msg: "Proveedor no encontrado" });
    s.eliminado = true;
    await s.save();
    res.json({ msg: "Proveedor eliminado", supplier: s });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  suppliersGet,
  supplierGetById,
  supplierPost,
  supplierPut,
  supplierDelete,
};
