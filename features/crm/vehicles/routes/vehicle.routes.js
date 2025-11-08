const { Router } = require("express");
const { check } = require("express-validator");

const {
  validarCampos,
  validarJWT,
  esSuperAdminRole,
  tieneRole,
} = require("../../../../middlewares");

const {
  existeVehicleBrandPorId,
  existeVehicleModelPorId,
  existeVehiclePorId,
  existeVehiclePorPlaca,
  existeVehiclePorVin,
} = require("../helpers/vehicle-validators");

const {
  vehiclesGet,
  vehicleGetById,
  vehicleGetByPlaca,
  vehicleGetByVin,
  vehiclePost,
  vehiclePut,
  vehicleDelete,
} = require("../controllers");

const router = Router();

// Obtener todos los vehículos
router.get("/", [validarJWT], vehiclesGet);

// Buscar vehículo por placa (RF-8)
router.get(
  "/placa/:placa",
  [
    validarJWT,
    check("placa", "La placa es obligatoria").not().isEmpty(),
    validarCampos,
  ],
  vehicleGetByPlaca
);

// Buscar vehículo por VIN (RF-8)
router.get(
  "/vin/:vin",
  [
    validarJWT,
    check("vin", "El VIN es obligatorio").not().isEmpty(),
    check("vin", "El VIN debe tener 17 caracteres").isLength({
      min: 17,
      max: 17,
    }),
    validarCampos,
  ],
  vehicleGetByVin
);

// Obtener un vehículo por ID
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeVehiclePorId),
    validarCampos,
  ],
  vehicleGetById
);

// Crear un nuevo vehículo
router.post(
  "/",
  [
    validarJWT,
    esSuperAdminRole,
    check("customer", "El cliente es obligatorio").not().isEmpty(),
    check("customer", "No es un ID válido").isMongoId(),
    check("model", "El modelo es obligatorio").not().isEmpty(),
    check("model", "No es un ID válido").isMongoId(),
    check("model").custom(existeVehicleModelPorId),
    check("year", "El año es obligatorio").isInt({ min: 1900 }),
    check("placa", "La placa es obligatoria").not().isEmpty(),
    check("placa", "La placa debe tener entre 3 y 10 caracteres").isLength({
      min: 3,
      max: 10,
    }),
    check("vin", "El VIN es obligatorio").not().isEmpty(),
    check("vin", "El VIN debe tener 17 caracteres").isLength({
      min: 17,
      max: 17,
    }),
    check("kilometraje", "El kilometraje debe ser un número positivo")
      .optional()
      .isInt({ min: 0 }),
    validarCampos,
  ],
  vehiclePost
);

// Actualizar un vehículo
router.put(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeVehiclePorId),
    check("customer", "No es un ID válido").optional().isMongoId(),
    check("model", "No es un ID válido").optional().isMongoId(),
    check("model").custom(existeVehicleModelPorId).optional(),
    check("year", "El año debe ser válido").optional().isInt({ min: 1900 }),
    check("placa", "La placa debe tener entre 3 y 10 caracteres")
      .optional()
      .isLength({ min: 3, max: 10 }),
    check("vin", "El VIN debe tener 17 caracteres")
      .optional()
      .isLength({ min: 17, max: 17 }),
    check("kilometraje", "El kilometraje debe ser un número positivo")
      .optional()
      .isInt({ min: 0 }),
    validarCampos,
  ],
  vehiclePut
);

// Eliminar un vehículo
router.delete(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeVehiclePorId),
    validarCampos,
  ],
  vehicleDelete
);

module.exports = router;
