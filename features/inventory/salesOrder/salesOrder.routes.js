const { Router } = require("express");
const { check } = require("express-validator");
const ctrl = require("./salesOrder.controllers");
const { validarCampos, validarJWT } = require("../../../middlewares");

const router = Router();

// Apply JWT validation to all routes
router.use(validarJWT);

router.post(
  "/",
  [
    check("items", "items must be an array").isArray(),
    check("items", "items cannot be empty").not().isEmpty(),
    validarCampos,
  ],
  ctrl.create
);

router.get("/", ctrl.list);

router.get(
  "/:id",
  [check("id", "Invalid ID").isMongoId(), validarCampos],
  ctrl.get
);

router.put(
  "/:id",
  [check("id", "Invalid ID").isMongoId(), validarCampos],
  ctrl.update
);

router.post(
  "/:id/confirm",
  [
    check("id", "Invalid ID").isMongoId(),
    check("warehouse", "warehouse is required").not().isEmpty(),
    validarCampos,
  ],
  ctrl.confirm
);

router.post(
  "/:id/ship",
  [check("id", "Invalid ID").isMongoId(), validarCampos],
  ctrl.ship
);

router.post(
  "/:id/cancel",
  [check("id", "Invalid ID").isMongoId(), validarCampos],
  ctrl.cancel
);

module.exports = router;
