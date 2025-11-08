// Controllers para el módulo de Órdenes de Trabajo
const workOrderController = require("./workOrder.controller");
const workOrderItemController = require("./workOrderItem.controller");
const workOrderStatusController = require("./workOrderStatus.controller");
const serviceController = require("./service.controller");
const serviceCategoryController = require("./serviceCategory.controller");
const serviceSubcategoryController = require("./serviceSubcategory.controller");
const workOrderHistoryController = require("./workOrderHistory.controller");

module.exports = {
  // Controladores principales
  workOrderController,
  workOrderItemController,
  workOrderStatusController,
  serviceController,
  serviceCategoryController,
  serviceSubcategoryController,
  workOrderHistoryController,

  // Exportaciones individuales para facilitar el acceso
  WorkOrderController: workOrderController,
  WorkOrderItemController: workOrderItemController,
  WorkOrderStatusController: workOrderStatusController,
  ServiceController: serviceController,
  ServiceCategoryController: serviceCategoryController,
  ServiceSubcategoryController: serviceSubcategoryController,
  WorkOrderHistoryController: workOrderHistoryController,
};
