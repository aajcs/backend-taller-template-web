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
    check("name", "El nombre es obligatorio").not().isEmpty(),
    check("name", "El nombre debe tener máximo 50 caracteres").isLength({
      max: 50,
    }),
    check("name").custom(existeWorkOrderStatusPorNombre),
    check("description", "La descripción debe tener máximo 200 caracteres")
      .optional()
      .isLength({ max: 200 }),
    check("color", "El color debe ser un código hexadecimal válido")
      .optional()
      .matches(/^#[0-9A-F]{6}$/i),
    check("isActive", "El estado activo debe ser un booleano")
      .optional()
      .isBoolean(),
    check("isInitial", "El estado inicial debe ser un booleano")
      .optional()
      .isBoolean(),
    check("isFinal", "El estado final debe ser un booleano")
      .optional()
      .isBoolean(),
    check("order", "El orden debe ser un número entero positivo")
      .optional()
      .isInt({ min: 1 }),
    check(
      "allowedTransitions",
      "Las transiciones permitidas deben ser un array de IDs válidos"
    )
      .optional()
      .isArray(),
    check(
      "allowedTransitions.*",
      "Cada transición debe ser un ID de Mongo válido"
    )
      .optional()
      .isMongoId(),
    check("allowedTransitions.*").optional().custom(existeWorkOrderStatusPorId),
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
    check("name", "El nombre debe tener máximo 50 caracteres")
      .optional()
      .isLength({ max: 50 }),
    check("name").optional().custom(existeWorkOrderStatusPorNombre),
    check("description", "La descripción debe tener máximo 200 caracteres")
      .optional()
      .isLength({ max: 200 }),
    check("color", "El color debe ser un código hexadecimal válido")
      .optional()
      .matches(/^#[0-9A-F]{6}$/i),
    check("isActive", "El estado activo debe ser un booleano")
      .optional()
      .isBoolean(),
    check("isInitial", "El estado inicial debe ser un booleano")
      .optional()
      .isBoolean(),
    check("isFinal", "El estado final debe ser un booleano")
      .optional()
      .isBoolean(),
    check("order", "El orden debe ser un número entero positivo")
      .optional()
      .isInt({ min: 1 }),
    check(
      "allowedTransitions",
      "Las transiciones permitidas deben ser un array de IDs válidos"
    )
      .optional()
      .isArray(),
    check(
      "allowedTransitions.*",
      "Cada transición debe ser un ID de Mongo válido"
    )
      .optional()
      .isMongoId(),
    check("allowedTransitions.*").optional().custom(existeWorkOrderStatusPorId),
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
