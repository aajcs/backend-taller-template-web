// Índice de modelos canónicos para features/inventory
// Re-exporta los modelos desde sus subcarpetas para imports más limpios.
module.exports = {
  Item: require("../items/item.models"),
  Stock: require("../stock/stock.models"),
  Movement: require("../movements/movement.models"),
  PurchaseOrder: require("../purchaseOrders/purchaseOrder.models"),
  Supplier: require("../suppliers/supplier.models"),
  Warehouse: require("../warehouses/warehouse.models"),
  Reservation: require("../reservations/reservation.models"),
  Brand: require("../brands/brand.models"),
  // backward-compatible: both ItemModel and Model point to the same implementation
  ItemModel: require("../models/model.models"),
  Model: require("../models/model.models"),
  Category: require("../categories/category.models"),
  Unit: require("../units/unit.models"),
  StockAlert: require("../notifications/stockAlert.models"),
};
