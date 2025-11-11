const { Router } = require("express");
const { check } = require("express-validator");

const { validarJWT, validarCampos } = require("../../../../middlewares");

const {
  getWorkOrderStatuses,
  getWorkOrderStatusById,
  createWorkOrderStatus,
  updateWorkOrderStatus,
  deleteWorkOrderStatus,
  getAllowedTransitions,
} = require("../controllers/workOrderStatus.controller");

// Helpers de validación
const {
  existeWorkOrderStatusPorId,
  existeWorkOrderStatusPorNombre,
} = require("../helpers/db-validators");

const router = Router();

/**
 * {{url}}/api/work-order-statuses
 */

// Obtener todos los estados de orden de trabajo - privado
router.get("/", [validarJWT, validarCampos], getWorkOrderStatuses);

// Obtener un estado específico por ID - privado
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    check("id").custom(existeWorkOrderStatusPorId),
    validarCampos,
  ],
  getWorkOrderStatusById
);

// Obtener transiciones posibles desde un estado - privado
router.get(
  "/:id/transitions",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    check("id").custom(existeWorkOrderStatusPorId),
    validarCampos,
  ],
  getAllowedTransitions
);

// Crear un nuevo estado de orden de trabajo - privado
router.post(
  "/",
  [
    validarJWT,
    check("codigo", "El código es obligatorio").not().isEmpty(),
    check("codigo", "El código debe tener máximo 20 caracteres").isLength({
      max: 20,
    }),
    check(
      "codigo",
      "El código solo puede contener letras mayúsculas y guiones bajos"
    ).matches(/^[A-Z_]+$/),
    check("nombre", "El nombre es obligatorio").not().isEmpty(),
    check("nombre", "El nombre debe tener máximo 50 caracteres").isLength({
      max: 50,
    }),
    check("descripcion", "La descripción debe tener máximo 200 caracteres")
      .optional()
      .isLength({ max: 200 }),
    check("color", "El color debe ser un código hexadecimal válido")
      .optional()
      .matches(/^#[0-9A-F]{6}$/i),
    check("activo", "El estado activo debe ser un booleano")
      .optional()
      .isBoolean(),
    check("tipo", "El tipo debe ser válido")
      .optional()
      .isIn(["inicial", "intermedio", "final"]),
    check("orden", "El orden debe ser un número entero positivo")
      .optional()
      .isInt({ min: 0 }),
    check(
      "transicionesPermitidas",
      "Las transiciones permitidas deben ser un array de códigos válidos"
    )
      .optional()
      .isArray(),
    check("collapsed", "El estado collapsed debe ser un booleano")
      .optional()
      .isBoolean(),
    validarCampos,
  ],
  createWorkOrderStatus
);

// Actualizar un estado de orden de trabajo - privado
router.put(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    check("id").custom(existeWorkOrderStatusPorId),
    check("codigo", "El código debe tener máximo 20 caracteres")
      .optional()
      .isLength({ max: 20 }),
    check(
      "codigo",
      "El código solo puede contener letras mayúsculas y guiones bajos"
    )
      .optional()
      .matches(/^[A-Z_]+$/),
    check("nombre", "El nombre debe tener máximo 50 caracteres")
      .optional()
      .isLength({ max: 50 }),
    check("descripcion", "La descripción debe tener máximo 200 caracteres")
      .optional()
      .isLength({ max: 200 }),
    check("color", "El color debe ser un código hexadecimal válido")
      .optional()
      .matches(/^#[0-9A-F]{6}$/i),
    check("activo", "El estado activo debe ser un booleano")
      .optional()
      .isBoolean(),
    check("tipo", "El tipo debe ser válido")
      .optional()
      .isIn(["inicial", "intermedio", "final"]),
    check("orden", "El orden debe ser un número entero positivo")
      .optional()
      .isInt({ min: 0 }),
    check(
      "transicionesPermitidas",
      "Las transiciones permitidas deben ser un array de códigos válidos"
    )
      .optional()
      .isArray(),
    check("collapsed", "El estado collapsed debe ser un booleano")
      .optional()
      .isBoolean(),
    validarCampos,
  ],
  updateWorkOrderStatus
);

// Eliminar un estado de orden de trabajo - privado
router.delete(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    check("id").custom(existeWorkOrderStatusPorId),
    validarCampos,
  ],
  deleteWorkOrderStatus
);

module.exports = router;
