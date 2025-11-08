const { Router } = require("express");

const router = Router();

/**
 * Work Orders Routes Index
 * Exporta todas las rutas relacionadas con órdenes de trabajo
 */

// Rutas principales de work orders (incluye sus items anidados)
router.use("/work-orders", require("./workOrder.routes"));

// Rutas alternativas de items (mantener por compatibilidad)
router.use("/work-order-items", require("./workOrderItem.routes"));
router.use("/work-order-statuses", require("./workOrderStatus.routes"));
router.use("/services", require("./service.routes"));
router.use("/service-categories", require("./serviceCategory.routes"));
router.use("/service-subcategories", require("./serviceSubcategory.routes"));
router.use("/work-order-history", require("./workOrderHistory.routes"));

// Rutas de facturación
router.use("/invoices", require("../../billing/routes/invoice.routes"));

module.exports = router;
