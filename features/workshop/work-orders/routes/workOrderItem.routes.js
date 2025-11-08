const { Router } = require("express");
const { check } = require("express-validator");

const { validarJWT, validarCampos } = require("../../../../middlewares");

const {
  getWorkOrderItems,
  getWorkOrderItemById,
  addWorkOrderItem,
  updateWorkOrderItem,
  completeWorkOrderItem,
  deleteWorkOrderItem,
} = require("../controllers/workOrderItem.controller");

// Helpers de validación
const {
  existeWorkOrderPorId,
  existeServicePorId,
  existeProductoPorId,
  existeWorkOrderItemPorId,
} = require("../helpers/db-validators");

const router = Router();

/**
 * {{url}}/api/work-order-items
 */

// Obtener items de una orden de trabajo - privado
router.get(
  "/:workOrderId",
  [
    validarJWT,
    check("workOrderId", "No es un ID de Mongo válido").isMongoId(),
    check("workOrderId").custom(existeWorkOrderPorId),
    validarCampos,
  ],
  getWorkOrderItems
);

// Obtener un item específico por ID - privado
router.get(
  "/item/:id",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    check("id").custom(existeWorkOrderItemPorId),
    validarCampos,
  ],
  getWorkOrderItemById
);

// Agregar item a una orden de trabajo - privado
router.post(
  "/",
  [
    validarJWT,
    check("workOrder", "La orden de trabajo es obligatoria").not().isEmpty(),
    check("workOrder", "No es un ID de Mongo válido").isMongoId(),
    check("workOrder").custom(existeWorkOrderPorId),
    check("type", "El tipo es obligatorio").not().isEmpty(),
    check("type", 'El tipo debe ser "service" o "part"').isIn([
      "service",
      "part",
    ]),
    check("quantity", "La cantidad debe ser un número positivo")
      .optional()
      .isFloat({ min: 0.01 }),
    check("unitPrice", "El precio unitario debe ser un número positivo")
      .optional()
      .isFloat({ min: 0 }),
    check("notes", "Las notas deben ser texto").optional().isString(),
    // Validación condicional basada en el tipo
    check("service")
      .if(check("type").equals("service"))
      .notEmpty()
      .withMessage("El servicio es obligatorio"),
    check("service")
      .if(check("type").equals("service"))
      .isMongoId()
      .withMessage("No es un ID de Mongo válido"),
    check("service")
      .if(check("type").equals("service"))
      .custom(existeServicePorId),
    check("part")
      .if(check("type").equals("part"))
      .notEmpty()
      .withMessage("La pieza es obligatoria"),
    check("part")
      .if(check("type").equals("part"))
      .isMongoId()
      .withMessage("No es un ID de Mongo válido"),
    check("part").if(check("type").equals("part")).custom(existeProductoPorId),
    validarCampos,
  ],
  addWorkOrderItem
);

// Actualizar un item de orden de trabajo - privado
router.put(
  "/item/:id",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    check("id").custom(existeWorkOrderItemPorId),
    check("quantity", "La cantidad debe ser un número positivo")
      .optional()
      .isFloat({ min: 0.01 }),
    check("unitPrice", "El precio unitario debe ser un número positivo")
      .optional()
      .isFloat({ min: 0 }),
    check("notes", "Las notas deben ser texto").optional().isString(),
    check("status", "El estado debe ser válido")
      .optional()
      .isIn(["pendiente", "en_progreso", "completado", "cancelado"]),
    validarCampos,
  ],
  updateWorkOrderItem
);

// Marcar item como completado - privado
router.patch(
  "/item/:id/complete",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    check("id").custom(existeWorkOrderItemPorId),
    check("actualTime", "El tiempo actual debe ser un número positivo")
      .optional()
      .isFloat({ min: 0 }),
    check("notes", "Las notas deben ser texto").optional().isString(),
    validarCampos,
  ],
  completeWorkOrderItem
);

// Eliminar un item de orden de trabajo - privado
router.delete(
  "/item/:id",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    check("id").custom(existeWorkOrderItemPorId),
    validarCampos,
  ],
  deleteWorkOrderItem
);

module.exports = router;
