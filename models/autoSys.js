/**
 * AutoSys Model Wrapper
 * Re-exporta el modelo AutoSys desde features/autoSys para compatibilidad
 * con código existente que importa desde models/autoSys
 */

const AutoSys = require("../features/autoSys/autoSys.models");

module.exports = AutoSys;
