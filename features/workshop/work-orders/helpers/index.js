/**
 * Index de helpers para el módulo de Órdenes de Trabajo
 * Centraliza todas las exportaciones de validadores
 */

const workOrderValidators = require("./db-validators");

module.exports = {
  ...workOrderValidators,
};
