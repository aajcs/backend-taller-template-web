/**
 * Vehicles Helpers - Validadores específicos para el módulo de vehicles
 */

// Validar que existe una marca de vehículo por ID
const existeVehicleBrandPorId = async (id = "") => {
  const { VehicleBrand } = require("../models");
  const vehicleBrand = await VehicleBrand.findOne({
    _id: id,
    eliminado: false,
  });
  if (!vehicleBrand) {
    throw new Error(`La marca con id ${id} no existe`);
  }
};

// Validar que existe un modelo de vehículo por ID
const existeVehicleModelPorId = async (id = "") => {
  const { VehicleModel } = require("../models");
  const vehicleModel = await VehicleModel.findOne({
    _id: id,
    eliminado: false,
  });
  if (!vehicleModel) {
    throw new Error(`El modelo con id ${id} no existe`);
  }
};

// Validar que existe un vehículo por ID
const existeVehiclePorId = async (id = "") => {
  const { Vehicle } = require("../models");
  const vehicle = await Vehicle.findOne({
    _id: id,
    eliminado: false,
  });
  if (!vehicle) {
    throw new Error(`El vehículo con id ${id} no existe`);
  }
};

// Validar que no existe un vehículo con la misma placa (para creación)
const existeVehiclePorPlaca = async (placa = "") => {
  const { Vehicle } = require("../models");
  const vehicle = await Vehicle.findOne({
    placa: placa.toUpperCase(),
    eliminado: false,
  });
  if (vehicle) {
    throw new Error(`La placa ${placa} ya está registrada`);
  }
};

// Validar que no existe un vehículo con el mismo VIN (para creación y actualización)
const existeVehiclePorVin = async (vin = "", { req } = {}) => {
  // Si no se proporciona VIN, no validar (es opcional)
  if (!vin || vin.trim() === "") {
    return true;
  }

  const { Vehicle } = require("../models");

  // Construir query: buscar por VIN pero excluir el ID actual si es un PUT
  const query = {
    vin: vin.toUpperCase(),
    eliminado: false,
  };

  // Si viene un ID en los params (PUT), excluirlo de la búsqueda
  if (req?.params?.id) {
    query._id = { $ne: req.params.id };
  }

  const vehicle = await Vehicle.findOne(query);
  if (vehicle) {
    throw new Error(`El VIN ${vin} ya está registrado`);
  }
};

module.exports = {
  existeVehicleBrandPorId,
  existeVehicleModelPorId,
  existeVehiclePorId,
  existeVehiclePorPlaca,
  existeVehiclePorVin,
};
