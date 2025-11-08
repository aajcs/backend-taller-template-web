/**
 * Index de helpers para el módulo de Facturación
 * Centraliza todas las exportaciones de validadores
 */

const billingValidators = require("./db-validators");

module.exports = {
  ...billingValidators,
};
