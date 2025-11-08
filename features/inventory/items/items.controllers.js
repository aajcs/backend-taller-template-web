const { response, request } = require("express");
const { Item } = require("../models");
const buildUpdateWithHistorial = require("../../../helpers/build-update-with-historial");

const populateOptions = [
  {
    path: "unidad",
    select: "nombre",
  },
  {
    path: "marca",
    select: "nombre",
  },
  {
    path: "modelo",
    select: "nombre",
  },
  {
    path: "categoria",
    select: "nombre",
  },
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  },
];
const itemsGet = async (req = request, res = response, next) => {
  try {
    const query = { eliminado: false };
    if (req.taller?.id) query["idRefineria"] = req.taller.id; // optional filter if items are per autoSys

    const [total, items] = await Promise.all([
      Item.countDocuments(query),
      Item.find(query).sort({ nombre: 1 }).populate(populateOptions),
    ]);

    res.json({ total, items });
  } catch (err) {
    next(err);
  }
};

const itemGetById = async (req = request, res = response, next) => {
  try {
    const { id } = req.params;
    const item = await Item.findOne({ _id: id, eliminado: false }).populate(
      "marca modelo categoria"
    );
    if (!item) return res.status(404).json({ msg: "Item no encontrado" });
    res.json(item);
  } catch (err) {
    next(err);
  }
};

const itemPost = async (req = request, res = response, next) => {
  try {
    const data = req.body;
    const item = new Item({ ...data, createdBy: req.usuario?._id });
    await item.save();
    // populate catalog relations before returning
    await item.populate(populateOptions);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};

const itemPut = async (req = request, res = response, next) => {
  try {
    const { id } = req.params;
    const { _id, eliminado, ...rest } = req.body;
    const update = buildUpdateWithHistorial({
      rest,
      extraSetFields: {},
      historialEntry: { modificadoPor: req.usuario?._id },
    });
    const updated = await Item.findOneAndUpdate(
      { _id: id, eliminado: false },
      update,
      { new: true, runValidators: true }
    ).populate(populateOptions);
    if (!updated) return res.status(404).json({ msg: "Item no encontrado" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
};

const itemDelete = async (req = request, res = response, next) => {
  try {
    const { id } = req.params;
    const before = await Item.findById(id);
    if (!before) return res.status(404).json({ msg: "Item no encontrado" });
    if (before.eliminado)
      return res.status(400).json({ msg: "Item ya eliminado" });

    before.eliminado = true;
    await before.save();
    res.json({ msg: "Item eliminado", item: before });
  } catch (err) {
    next(err);
  }
};

module.exports = { itemsGet, itemGetById, itemPost, itemPut, itemDelete };
