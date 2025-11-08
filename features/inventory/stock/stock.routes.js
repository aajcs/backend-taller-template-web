const { Router } = require("express");
const { check } = require("express-validator");
const {
  validarCampos,
  validarJWT,
  tieneRole,
} = require("../../../middlewares");
const {
  stockGetAll,
  stockGetById,
  stockPost,
  stockPut,
  stockDelete,
} = require("./stock.controllers");
const {
  getItemsBelowMinimum,
  checkItemAlert,
  generateStockReport,
  getSuggestedPurchaseOrders,
} = require("./stockAlerts.controllers");
const router = Router();

router.use(validarJWT);

// Rutas de alertas de stock mínimo
router.get("/alerts/below-minimum", getItemsBelowMinimum);
router.get(
  "/alerts/item/:itemId",
  [check("itemId", "No es un id de Mongo válido").isMongoId(), validarCampos],
  checkItemAlert
);
router.get("/alerts/report", generateStockReport);
router.get("/alerts/purchase-suggestions", getSuggestedPurchaseOrders);

// Rutas CRUD de stock
router.get("/", stockGetAll);
router.get(
  "/:id",
  [check("id", "No es un id de Mongo válido").isMongoId(), validarCampos],
  stockGetById
);
router.post(
  "/",
  [
    check("item", "Item es obligatorio").not().isEmpty(),
    check("warehouse", "Warehouse es obligatorio").not().isEmpty(),
    validarCampos,
  ],
  stockPost
);
router.put(
  "/:id",
  [check("id", "No es un id de Mongo válido").isMongoId(), validarCampos],
  stockPut
);
router.delete(
  "/:id",
  [
    tieneRole("superAdmin", "admin"),
    check("id", "No es un id de Mongo válido").isMongoId(),
    validarCampos,
  ],
  stockDelete
);

module.exports = router;
