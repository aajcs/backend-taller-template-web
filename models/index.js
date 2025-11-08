/**
 * Central export de modelos (limpio).
 * Solo incluye modelos que existen en la carpeta models/
 */

const Historial = require("./historial");
const Notification = require("./notification");
const Server = require("./server");
const Sockets = require("./sockets");
const Counter = require("./counter");
const AutoSys = require("./autoSys");

module.exports = {
  Historial,
  Notification,
  Server,
  Sockets,
  Counter,
  AutoSys,
};
