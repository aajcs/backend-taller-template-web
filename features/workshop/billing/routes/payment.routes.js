const { Router } = require("express");
const { check } = require("express-validator");

// Middlewares globales
const { validarJWT, validarCampos } = require("../../../../middlewares");

// Controllers del módulo
const {
  getAllPayments,
  getInvoicePayments,
  getPaymentById,
  createPayment,
  updatePayment,
  confirmPayment,
  rejectPayment,
  deletePayment,
} = require("../controllers/payment.controller");

// Validadores del módulo
const { existeInvoicePorId } = require("../helpers");

const router = Router();

/**
 * {{url}}/api/payments
 */

// Obtener todos los pagos - privado
router.get(
  "/",
  [
    validarJWT,
    validarCampos,
  ],
  getAllPayments
);

// Obtener pagos por factura - privado
router.get(
  "/invoice/:invoiceId",
  [
    validarJWT,
    check("invoiceId", "No es un ID de Mongo válido").isMongoId(),
    check("invoiceId").custom(existeInvoicePorId),
    validarCampos,
  ],
  getInvoicePayments
);

// Obtener pago específico por ID - privado
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    validarCampos,
  ],
  getPaymentById
);

// Crear pago - privado
router.post(
  "/",
  [
    validarJWT,
    check("invoice", "La factura es obligatoria").not().isEmpty(),
    check("invoice", "No es un ID de Mongo válido").isMongoId(),
    check("invoice").custom(existeInvoicePorId),
    check("amount", "El monto es obligatorio").not().isEmpty(),
    check("amount", "El monto debe ser un número positivo").isFloat({
      min: 0.01,
    }),
    check("paymentMethod", "El método de pago es obligatorio").not().isEmpty(),
    check("paymentMethod", "El método de pago debe ser válido").isIn([
      "efectivo",
      "transferencia",
      "cheque",
      "tarjeta_credito",
      "tarjeta_debito",
    ]),
    check("paymentDate", "La fecha de pago es obligatoria").not().isEmpty(),
    check(
      "paymentDate",
      "La fecha de pago debe ser una fecha válida"
    ).isISO8601(),
    check("reference", "La referencia debe ser texto").optional().isString(),
    check("notes", "Las notas deben ser texto").optional().isString(),
    validarCampos,
  ],
  createPayment
);

// Actualizar pago - privado
router.put(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    check("amount", "El monto debe ser un número positivo")
      .optional()
      .isFloat({ min: 0.01 }),
    check("paymentMethod", "El método de pago debe ser válido")
      .optional()
      .isIn([
        "efectivo",
        "transferencia",
        "cheque",
        "tarjeta_credito",
        "tarjeta_debito",
      ]),
    check("paymentDate", "La fecha de pago debe ser una fecha válida")
      .optional()
      .isISO8601(),
    check("reference", "La referencia debe ser texto").optional().isString(),
    check("notes", "Las notas deben ser texto").optional().isString(),
    validarCampos,
  ],
  updatePayment
);

// Confirmar pago - privado
router.patch(
  "/:id/confirm",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    validarCampos,
  ],
  confirmPayment
);

// Cancelar pago - privado
router.patch(
  "/:id/cancel",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    validarCampos,
  ],
  rejectPayment
);

// Eliminar pago - privado
router.delete(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    validarCampos,
  ],
  deletePayment
);

module.exports = router;
