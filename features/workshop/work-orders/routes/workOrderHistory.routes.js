const { Router } = require("express");
const { check } = require("express-validator");

const { validarJWT, validarCampos } = require("../../../../middlewares");

const {
  getWorkOrderHistory,
  getWorkOrderHistoryById,
  getWorkOrderTimeline,
  getActivityStats,
  createHistoryEntry,
} = require("../controllers/workOrderHistory.controller");

// Helpers de validación
const {
  existeWorkOrderPorId,
  existeUsuarioPorId,
} = require("../helpers/db-validators");

const router = Router();

/**
 * {{url}}/api/work-order-history
 */

// Obtener todo el historial de órdenes de trabajo - privado
router.get("/", [validarJWT, validarCampos], getWorkOrderHistory);

// Obtener historial de una orden específica - privado
router.get(
  "/work-order/:workOrderId",
  [
    validarJWT,
    check("workOrderId", "No es un ID de Mongo válido").isMongoId(),
    check("workOrderId").custom(existeWorkOrderPorId),
    validarCampos,
  ],
  getWorkOrderTimeline
);

// Obtener historial por usuario - privado
router.get(
  "/user/:userId",
  [
    validarJWT,
    check("userId", "No es un ID de Mongo válido").isMongoId(),
    check("userId").custom(existeUsuarioPorId),
    validarCampos,
  ],
  getWorkOrderHistoryById
);

// Obtener estadísticas del historial - privado
router.get(
  "/stats/overview",
  [
    validarJWT,
    check("startDate", "La fecha de inicio debe ser una fecha válida")
      .optional()
      .isISO8601(),
    check("endDate", "La fecha de fin debe ser una fecha válida")
      .optional()
      .isISO8601(),
    validarCampos,
  ],
  getActivityStats
);

// Crear una entrada manual en el historial - privado
router.post(
  "/",
  [
    validarJWT,
    check("workOrder", "La orden de trabajo es obligatoria").not().isEmpty(),
    check(
      "workOrder",
      "La orden de trabajo debe ser un ID de Mongo válido"
    ).isMongoId(),
    check("workOrder").custom(existeWorkOrderPorId),
    check("action", "La acción es obligatoria").not().isEmpty(),
    check("action", "La acción debe tener máximo 100 caracteres").isLength({
      max: 100,
    }),
    check("description", "La descripción debe tener máximo 500 caracteres")
      .optional()
      .isLength({ max: 500 }),
    check("oldValue", "El valor anterior debe ser un objeto")
      .optional()
      .isObject(),
    check("newValue", "El nuevo valor debe ser un objeto")
      .optional()
      .isObject(),
    check("metadata", "Los metadatos deben ser un objeto")
      .optional()
      .isObject(),
    validarCampos,
  ],
  createHistoryEntry
);

module.exports = router;
