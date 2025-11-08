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
  vehicleModelsGet,
  vehicleModelGetById,
  vehicleModelPost,
  vehicleModelPut,
  vehicleModelDelete,
} = require("../controllers");

const router = Router();

// Obtener todos los modelos de vehículos
router.get("/", [validarJWT], vehicleModelsGet);

// Obtener un modelo por ID
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeVehicleModelPorId),
    validarCampos,
  ],
  vehicleModelGetById
);

// Crear un nuevo modelo
router.post(
  "/",
  [
    validarJWT,
    esSuperAdminRole,
    check("brand", "La marca es obligatoria").not().isEmpty(),
    check("brand", "No es un ID válido").isMongoId(),
    check("brand").custom(existeVehicleBrandPorId),
    check("nombre", "El nombre es obligatorio").not().isEmpty(),
    check("nombre", "El nombre debe tener al menos 2 caracteres").isLength({
      min: 2,
    }),
    check("yearInicio", "El año de inicio debe ser válido")
      .optional()
      .isInt({ min: 1900 }),
    check("yearFin", "El año de fin debe ser válido")
      .optional()
      .isInt({ min: 1900 }),
    validarCampos,
  ],
  vehicleModelPost
);

// Actualizar un modelo
router.put(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeVehicleModelPorId),
    check("brand", "No es un ID válido").optional().isMongoId(),
    check("brand").custom(existeVehicleBrandPorId).optional(),
    check("nombre", "El nombre debe tener al menos 2 caracteres")
      .optional()
      .isLength({ min: 2 }),
    check("yearInicio", "El año de inicio debe ser válido")
      .optional()
      .isInt({ min: 1900 }),
    check("yearFin", "El año de fin debe ser válido")
      .optional()
      .isInt({ min: 1900 }),
    validarCampos,
  ],
  vehicleModelPut
);

// Eliminar un modelo
router.delete(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeVehicleModelPorId),
    validarCampos,
  ],
  vehicleModelDelete
);

module.exports = router;
