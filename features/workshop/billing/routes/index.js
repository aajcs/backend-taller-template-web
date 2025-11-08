/**
 * Billing Routes Index
 * Exporta todas las rutas relacionadas con facturación
 */

const { Router } = require("express");

const router = Router();

// Rutas principales
router.use("/invoices", require("./invoice.routes"));
router.use("/invoice-items", require("./invoiceItem.routes"));
router.use("/payments", require("./payment.routes"));

module.exports = router;
