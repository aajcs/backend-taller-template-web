const { Router } = require("express");
const { check } = require("express-validator");

// Middlewares globales
const { validarJWT, validarCampos } = require("../../../../middlewares");

// Controllers del módulo
const {
  getWorkOrders,
  getWorkOrderById,
  createWorkOrder,
  updateWorkOrder,
  changeWorkOrderStatus,
  deleteWorkOrder,
} = require("../controllers/workOrder.controller");

const {
  getWorkOrderHistory,
} = require("../controllers/workOrderHistory.controller");

// Validadores del módulo
const {
  existeWorkOrderPorId,
  existeWorkOrderStatusPorId,
  existeUsuarioPorId,
} = require("../helpers");

// Validadores de CRM
const {
  existeCustomerPorId,
} = require("../../../crm/customers/helpers/customer-validators");
const {
  existeVehiclePorId,
} = require("../../../crm/vehicles/helpers/vehicle-validators");

const router = Router();

/**
 * {{url}}/api/work-orders
 */

// Obtener todas las órdenes de trabajo - privado
router.get("/", [validarJWT], getWorkOrders);

// Obtener historial de una orden de trabajo - privado
router.get(
  "/:workOrderId/history",
  [
    validarJWT,
    check("workOrderId", "No es un ID de Mongo válido").isMongoId(),
    check("workOrderId").custom(existeWorkOrderPorId),
    validarCampos,
  ],
  getWorkOrderHistory
);

// Obtener una orden de trabajo por ID - privado
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    check("id").custom(existeWorkOrderPorId),
    validarCampos,
  ],
  getWorkOrderById
);

// Crear una nueva orden de trabajo - privado
router.post(
  "/",
  [
    validarJWT,
    check("customer", "El cliente es obligatorio").not().isEmpty(),
    check("customer", "No es un ID de Mongo válido").isMongoId(),
    check("customer").custom(existeCustomerPorId),
    check("vehicle", "El vehículo es obligatorio").not().isEmpty(),
    check("vehicle", "No es un ID de Mongo válido").isMongoId(),
    check("vehicle").custom(existeVehiclePorId),
    check("motivo", "El motivo es obligatorio").not().isEmpty(),
    check("motivo", "El motivo debe tener al menos 10 caracteres").isLength({
      min: 10,
    }),
    check("kilometraje", "El kilometraje es obligatorio").not().isEmpty(),
    check("kilometraje", "El kilometraje debe ser un número").isNumeric(),
    check("tecnicoAsignado", "El técnico asignado es obligatorio")
      .not()
      .isEmpty(),
    check("tecnicoAsignado", "No es un ID de Mongo válido").isMongoId(),
    check("tecnicoAsignado").custom(existeUsuarioPorId),
    check("prioridad", "La prioridad debe ser baja, normal, alta o urgente")
      .optional()
      .isIn(["baja", "normal", "alta", "urgente"]),
    check("fechaEstimadaEntrega", "La fecha estimada debe ser válida")
      .optional()
      .isISO8601(),
    validarCampos,
  ],
  createWorkOrder
);

// Actualizar una orden de trabajo - privado
router.put(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    check("id").custom(existeWorkOrderPorId),
    check("description", "La descripción debe tener al menos 10 caracteres")
      .optional()
      .isLength({ min: 10 }),
    check("priority", "La prioridad debe ser baja, media o alta")
      .optional()
      .isIn(["baja", "media", "alta"]),
    check("estimatedCompletionDate", "La fecha estimada debe ser válida")
      .optional()
      .isISO8601(),
    check("assignedTechnician", "No es un ID de Mongo válido")
      .optional()
      .isMongoId(),
    check("assignedTechnician").custom(existeUsuarioPorId).optional(),
    validarCampos,
  ],
  updateWorkOrder
);

// Cambiar estado de una orden de trabajo - privado
router.post(
  "/:id/change-status",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    check("id").custom(existeWorkOrderPorId),
    check("newStatus", "El nuevo estado es obligatorio").not().isEmpty(),
    check("notes", "Las notas deben ser texto").optional().isString(),
    validarCampos,
  ],
  changeWorkOrderStatus
);

// Alias con PATCH (alternativa)
router.patch(
  "/:id/status",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    check("id").custom(existeWorkOrderPorId),
    check("newStatus", "El nuevo estado es obligatorio").not().isEmpty(),
    check("notes", "Las notas deben ser texto").optional().isString(),
    validarCampos,
  ],
  changeWorkOrderStatus
);

// Eliminar una orden de trabajo - privado
router.delete(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    check("id").custom(existeWorkOrderPorId),
    validarCampos,
  ],
  deleteWorkOrder
);

module.exports = router;
