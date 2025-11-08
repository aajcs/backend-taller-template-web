const { Router } = require("express");
const { check } = require("express-validator");
const {
  validarCampos,
  validarJWT,
  tieneRole,
} = require("../../../middlewares");
const {
  movementsGet,
  movementPost,
  movementGetById,
} = require("./movements.controllers");

const router = Router();
router.use(validarJWT);
router.get("/", movementsGet);
// timeseries
router.get(
  "/timeseries",
  [check("item", "Item id required").not().isEmpty(), validarCampos],
  async (req, res, next) => {
    try {
      const { item, from, to, interval } = req.query;
      const data = await require("./movements.controllers").timeSeriesHandler(
        item,
        from,
        to,
        interval
      );
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

// stock snapshot
router.get("/stock-snapshot", async (req, res, next) => {
  try {
    const { item, warehouse } = req.query;
    const data = await require("./movements.controllers").stockSnapshotHandler(
      req.query
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
});
router.get(
  "/:id",
  [check("id", "No es un id de Mongo válido").isMongoId(), validarCampos],
  movementGetById
);
router.post(
  "/",
  [
    check("tipo", "Tipo es obligatorio").not().isEmpty(),
    check("item", "Item es obligatorio").not().isEmpty(),
    validarCampos,
  ],
  movementPost
);

module.exports = router;
