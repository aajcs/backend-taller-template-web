const { Router } = require("express");
const { check } = require("express-validator");

// Middlewares globales
const { validarJWT, validarCampos } = require("../../../../middlewares");

// Controllers del módulo
const {
  getInvoices,
  getInvoiceById,
  createInvoiceFromWorkOrder,
  updateInvoice,
  applyIVA,
  emitInvoice,
  deleteInvoice,
  getInvoiceReports,
} = require("../controllers/invoice.controller");

// Validadores de otros módulos
const { existeWorkOrderPorId } = require("../../work-orders/helpers");

const router = Router();

/**
 * {{url}}/api/invoices
 */

// Obtener todas las facturas - privado
router.get("/", [validarJWT, validarCampos], getInvoices);

// Obtener reportes de facturas - privado
router.get(
  "/reports",
  [
    validarJWT,
    check("startDate", "La fecha de inicio debe ser una fecha válida")
      .optional()
      .isISO8601(),
    check("endDate", "La fecha de fin debe ser una fecha válida")
      .optional()
      .isISO8601(),
    check("type", "El tipo debe ser válido")
      .optional()
      .isIn(["invoices_issued", "accounts_receivable"]),
    check("customer", "El cliente debe ser un ID válido")
      .optional()
      .isMongoId(),
    validarCampos,
  ],
  getInvoiceReports
);

// Obtener factura específica por ID - privado
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    validarCampos,
  ],
  getInvoiceById
);

// Crear factura desde orden de trabajo - privado
router.post(
  "/from-work-order/:workOrderId",
  [
    validarJWT,
    check("workOrderId", "No es un ID de Mongo válido").isMongoId(),
    check("workOrderId").custom(existeWorkOrderPorId),
    check("dueDate", "La fecha de vencimiento es obligatoria").not().isEmpty(),
    check(
      "dueDate",
      "La fecha de vencimiento debe ser una fecha válida"
    ).isISO8601(),
    check("dueDate").custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error("La fecha de vencimiento debe ser futura");
      }
      return true;
    }),
    check("notes", "Las notas deben ser texto").optional().isString(),
    check("paymentTerms", "Los términos de pago deben ser texto")
      .optional()
      .isString(),
    validarCampos,
  ],
  createInvoiceFromWorkOrder
);

// Actualizar factura - privado
router.put(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    check("dueDate", "La fecha de vencimiento debe ser una fecha válida")
      .optional()
      .isISO8601(),
    check("dueDate")
      .optional()
      .custom((value) => {
        if (new Date(value) <= new Date()) {
          throw new Error("La fecha de vencimiento debe ser futura");
        }
        return true;
      }),
    check("notes", "Las notas deben ser texto").optional().isString(),
    check("paymentTerms", "Los términos de pago deben ser texto")
      .optional()
      .isString(),
    check("status", "El estado debe ser válido")
      .optional()
      .isIn(["borrador", "emitida"]),
    validarCampos,
  ],
  updateInvoice
);

// Aplicar IVA a factura - privado
router.patch(
  "/:id/apply-iva",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    check("ivaRate", "La tasa de IVA debe ser un número positivo")
      .optional()
      .isFloat({ min: 0, max: 100 }),
    validarCampos,
  ],
  applyIVA
);

// Emitir factura - privado
router.patch(
  "/:id/emit",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    validarCampos,
  ],
  emitInvoice
);

// Eliminar factura - privado
router.delete(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    validarCampos,
  ],
  deleteInvoice
);

module.exports = router;
