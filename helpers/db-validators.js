const { Historial, Notification, Counter, AutoSys } = require("../models");

const existeHistorialPorId = async (id) => {
  const existeHistorial = await Historial.findById(id);
  if (!existeHistorial) {
    throw new Error(`El chequeo no existe ${id}`);
  }
};

const existeNotificationPorId = async (id) => {
  const existeNotification = await Notification.findById(id);
  if (!existeNotification) {
    throw new Error(`La notificación no existe ${id}`);
  }
};

const existeCounterPorId = async (id) => {
  const existeCounter = await Counter.findById(id);
  if (!existeCounter) {
    throw new Error(`El contador no existe ${id}`);
  }
};

const existeAutoSysPorId = async (id) => {
  const existeAutoSys = await AutoSys.findById(id);
  if (!existeAutoSys) {
    throw new Error(`El sistema automático no existe ${id}`);
  }
};

const coleccionesPermitidas = (coleccion = "", colecciones = []) => {
  const incluida = colecciones.includes(coleccion);
  if (!incluida) {
    throw new Error(
      `La colección ${coleccion} no es permitida, ${colecciones}`
    );
  }
  return true;
};

module.exports = {
  existeHistorialPorId,
  existeNotificationPorId,
  existeCounterPorId,
  existeAutoSysPorId,
  coleccionesPermitidas,
};
