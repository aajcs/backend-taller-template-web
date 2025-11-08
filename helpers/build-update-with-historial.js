/**
 * Construye un objeto de update seguro para Mongo/Mongoose que
 * separa campos a setear ($set) y agrega una entrada de historial ($push).
 * Evita mezclar operadores con campos directos (causa de conflicto en Mongo).
 *
 * Uso:
 * const update = buildUpdateWithHistorial({ rest, extraSetFields, historialEntry });
 */
function buildUpdateWithHistorial({
  rest = {},
  extraSetFields = {},
  historialEntry = {},
} = {}) {
  // copiar y filtrar cualquier campo 'historial' que venga en el body
  const setFields = { ...rest, ...extraSetFields };
  if (Object.prototype.hasOwnProperty.call(setFields, "historial")) {
    delete setFields.historial;
  }

  const update = {};
  if (Object.keys(setFields).length) update.$set = setFields;

  // siempre añadimos el push al historial
  update.$push = { historial: historialEntry };

  return update;
}

module.exports = buildUpdateWithHistorial;
