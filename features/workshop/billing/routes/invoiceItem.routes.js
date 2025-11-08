const { Router } = require("express");
const { check } = require("express-validator");

// Middlewares globales
const { validarJWT, validarCampos } = require("../../../../middlewares");

// Controllers del módulo
const {
  getInvoiceItems,
  getInvoiceItemById,
  addInvoiceItem,
  updateInvoiceItem,
  deleteInvoiceItem,
} = require("../controllers/invoiceItem.controller");

// Validadores del módulo
const { existeInvoicePorId } = require("../helpers");

// Validadores globales
const { existeProductoPorId } = require("../../../../helpers");

const router = Router();

/**
 * {{url}}/api/invoice-items
 */

// Obtener todos los ítems de factura - privado
router.get("/", [validarJWT, validarCampos], getInvoiceItems);

// Obtener ítem de factura específico por ID - privado
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    validarCampos,
  ],
  getInvoiceItemById
);

// Crear ítem de factura - privado
router.post(
  "/",
  [
    validarJWT,
    check("invoice", "La factura es obligatoria").not().isEmpty(),
    check("invoice", "No es un ID de Mongo válido").isMongoId(),
    check("invoice").custom(existeInvoicePorId),
    check("product", "El producto es obligatorio").not().isEmpty(),
    check("product", "No es un ID de Mongo válido").isMongoId(),
    check("product").custom(existeProductoPorId),
    check("quantity", "La cantidad es obligatoria").not().isEmpty(),
    check("quantity", "La cantidad debe ser un número positivo").isFloat({
      min: 0.01,
    }),
    check("unitPrice", "El precio unitario es obligatorio").not().isEmpty(),
    check(
      "unitPrice",
      "El precio unitario debe ser un número positivo"
    ).isFloat({ min: 0 }),
    check("discount", "El descuento debe ser un número")
      .optional()
      .isFloat({ min: 0, max: 100 }),
    check("description", "La descripción debe ser texto").optional().isString(),
    validarCampos,
  ],
  addInvoiceItem
);

// Actualizar ítem de factura - privado
router.put(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    check("quantity", "La cantidad debe ser un número positivo")
      .optional()
      .isFloat({ min: 0.01 }),
    check("unitPrice", "El precio unitario debe ser un número positivo")
      .optional()
      .isFloat({ min: 0 }),
    check("discount", "El descuento debe ser un número")
      .optional()
      .isFloat({ min: 0, max: 100 }),
    check("description", "La descripción debe ser texto").optional().isString(),
    validarCampos,
  ],
  updateInvoiceItem
);

// Eliminar ítem de factura - privado
router.delete(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    validarCampos,
  ],
  deleteInvoiceItem
);

module.exports = router;
