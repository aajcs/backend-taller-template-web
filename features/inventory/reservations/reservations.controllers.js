const { response, request } = require("express");
const { Reservation } = require("../models");
const buildUpdateWithHistorial = require("../../../helpers/build-update-with-historial");

const populateOptions = [
  {
    path: "item",
    select: "nombre",
  },
  {
    path: "warehouse",
    select: "nombre",
  },
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  },
];

const reservationsGet = async (req = request, res = response, next) => {
  try {
    const rows = await Reservation.find({ eliminado: false }).populate(
      populateOptions
    );
    res.json({ total: rows.length, reservations: rows });
  } catch (err) {
    next(err);
  }
};
const reservationGetById = async (req = request, res = response, next) => {
  try {
    const r = await Reservation.findOne({
      _id: req.params.id,
      eliminado: false,
    }).populate(populateOptions);
    if (!r) return res.status(404).json({ msg: "Reserva no encontrada" });
    res.json(r);
  } catch (err) {
    next(err);
  }
};
const reservationPost = async (req = request, res = response, next) => {
  try {
    const data = req.body;
    data.reservadoPor = req.usuario?._id;
    const r = new Reservation(data);
    await r.save();
    const populatedReservation = await Reservation.findById(r._id).populate(
      populateOptions
    );
    res.status(201).json(populatedReservation);
  } catch (err) {
    next(err);
  }
};
const reservationPut = async (req = request, res = response, next) => {
  try {
    const { id } = req.params;
    const { _id, eliminado, ...rest } = req.body;
    const update = buildUpdateWithHistorial({
      rest,
      extraSetFields: {},
      historialEntry: { modificadoPor: req.usuario?._id },
    });
    const updated = await Reservation.findOneAndUpdate(
      { _id: id, eliminado: false },
      update,
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ msg: "Reserva no encontrada" });

    const populatedReservation = await Reservation.findById(
      updated._id
    ).populate(populateOptions);
    res.json(populatedReservation);
  } catch (err) {
    next(err);
  }
};
const reservationDelete = async (req = request, res = response, next) => {
  try {
    const r = await Reservation.findById(req.params.id);
    if (!r) return res.status(404).json({ msg: "Reserva no encontrada" });
    r.eliminado = true;
    await r.save();
    res.json({ msg: "Reserva eliminada", reservation: r });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  reservationsGet,
  reservationGetById,
  reservationPost,
  reservationPut,
  reservationDelete,
};
