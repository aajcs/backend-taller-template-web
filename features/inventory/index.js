const { Router } = require("express");

const router = Router();

// Mount sub-routers (using folder index exports)
router.use("/items", require("./items"));
router.use("/stock", require("./stock"));
router.use("/suppliers", require("./suppliers"));
router.use("/warehouses", require("./warehouses"));
router.use("/movements", require("./movements"));
router.use("/purchaseOrders", require("./purchaseOrders"));
router.use("/reservations", require("./reservations"));

// Catalogs
router.use("/brands", require("./brands"));
router.use("/categories", require("./categories"));
// models subfeature (moved from itemModels)
// mount the models router explicitly (the models index is a canonical models export)
router.use("/models", require("./models/models.routes"));
router.use("/units", require("./units"));
router.use("/salesOrder", require("./salesOrder"));

module.exports = router;
