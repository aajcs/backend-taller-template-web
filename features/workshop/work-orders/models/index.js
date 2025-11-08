/**
 * Work Orders Models Index
 * Exporta todos los modelos relacionados con Órdenes de Trabajo
 */

const WorkOrder = require("./workOrder.model");
const WorkOrderItem = require("./workOrderItem.model");
const WorkOrderStatus = require("./workOrderStatus.model");
const Service = require("./service.model");
const ServiceCategory = require("./serviceCategory.model");
const ServiceSubcategory = require("./serviceSubcategory.model");
const WorkOrderHistory = require("./workOrderHistory.model");

module.exports = {
  WorkOrder,
  WorkOrderItem,
  WorkOrderStatus,
  Service,
  ServiceCategory,
  ServiceSubcategory,
  WorkOrderHistory,
};
