/**
 * Customers Routes Index
 * Exporta todas las rutas relacionadas con clientes
 */

const { Router } = require("express");
const customerRoutes = require("./customer.routes");

const router = Router();

// Rutas de clientes (montadas en /api/customers desde server.js)
router.use("/", customerRoutes);

module.exports = router;
