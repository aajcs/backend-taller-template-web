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
  vehicleBrandsGet,
  vehicleBrandGetById,
  vehicleBrandPost,
  vehicleBrandPut,
  vehicleBrandDelete,
} = require("../controllers");

const router = Router();

// Obtener todas las marcas de vehículos
router.get("/", [validarJWT], vehicleBrandsGet);

// Obtener una marca por ID
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeVehicleBrandPorId),
    validarCampos,
  ],
  vehicleBrandGetById
);

// Crear una nueva marca
router.post(
  "/",
  [
    validarJWT,
    esSuperAdminRole,
    check("nombre", "El nombre es obligatorio").not().isEmpty(),
    check("nombre", "El nombre debe tener al menos 2 caracteres").isLength({
      min: 2,
    }),
    validarCampos,
  ],
  vehicleBrandPost
);

// Actualizar una marca
router.put(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeVehicleBrandPorId),
    check("nombre", "El nombre debe tener al menos 2 caracteres")
      .optional()
      .isLength({ min: 2 }),
    validarCampos,
  ],
  vehicleBrandPut
);

// Eliminar una marca
router.delete(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeVehicleBrandPorId),
    validarCampos,
  ],
  vehicleBrandDelete
);

module.exports = router;
