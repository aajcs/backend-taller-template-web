/**
 * Vehicles Controllers Index
 * Exporta todos los controladores relacionados con vehículos
 */

const vehicleBrandController = require("./vehicleBrand.controller");
const vehicleModelController = require("./vehicleModel.controller");
const vehicleController = require("./vehicle.controller");

module.exports = {
  ...vehicleBrandController,
  ...vehicleModelController,
  ...vehicleController,
};
