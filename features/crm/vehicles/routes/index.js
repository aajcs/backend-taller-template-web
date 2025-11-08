/**
 * Vehicles Routes Index
 * Exporta todas las rutas relacionadas con vehículos
 */

const { Router } = require("express");
const vehicleBrandRoutes = require("./vehicleBrand.routes");
const vehicleModelRoutes = require("./vehicleModel.routes");
const vehicleRoutes = require("./vehicle.routes");

const router = Router();

// Rutas para marcas de vehículos
router.use("/brands", vehicleBrandRoutes);

// Rutas para modelos de vehículos
router.use("/models", vehicleModelRoutes);

// Rutas para vehículos
router.use("/", vehicleRoutes);

module.exports = router;
