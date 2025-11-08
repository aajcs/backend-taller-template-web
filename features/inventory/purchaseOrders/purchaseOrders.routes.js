const { Router } = require("express");
const { check } = require("express-validator");
const {
  validarCampos,
  validarJWT,
  tieneRole,
} = require("../../../middlewares");
const {
  purchaseOrdersGet,
  purchaseOrderGetById,
  purchaseOrderPost,
  purchaseOrderPut,
  purchaseOrderDelete,
  purchaseOrderReceive,
} = require("./purchaseOrders.controllers");

const router = Router();
router.use(validarJWT);
router.get("/", purchaseOrdersGet);
router.get(
  "/:id",
  [check("id", "No es un id de Mongo válido").isMongoId(), validarCampos],
  purchaseOrderGetById
);
router.post(
  "/",
  [
    check("proveedor", "Proveedor es obligatorio").not().isEmpty(),
    validarCampos,
  ],
  purchaseOrderPost
);
router.put(
  "/:id",
  [check("id", "No es un id de Mongo válido").isMongoId(), validarCampos],
  purchaseOrderPut
);
router.delete(
  "/:id",
  [
    tieneRole("superAdmin", "admin"),
    check("id", "No es un id de Mongo válido").isMongoId(),
    validarCampos,
  ],
  purchaseOrderDelete
);

// Batch receive endpoint
router.post(
  "/:id/receive",
  [
    check("id", "No es un id de Mongo válido").isMongoId(),
    check("warehouse", "Warehouse es obligatorio").not().isEmpty(),
    check("items", "items debe ser un array").isArray(),
    validarCampos,
  ],
  purchaseOrderReceive
);

module.exports = router;
