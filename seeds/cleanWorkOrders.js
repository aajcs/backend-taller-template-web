/**
 * Script para limpiar WorkOrders y WorkOrderItems
 * Útil para resetear y empezar de nuevo
 */

require("dotenv").config();
const { dbConnection } = require("../database/config");
const WorkOrder = require("../features/workshop/work-orders/models/workOrder.model");
const WorkOrderItem = require("../features/workshop/work-orders/models/workOrderItem.model");
const WorkOrderHistory = require("../features/workshop/work-orders/models/workOrderHistory.model");

const cleanWorkOrders = async () => {
  try {
    await dbConnection();
    console.log("✅ Conectado a MongoDB");

    // Limpiar WorkOrderItems
    const itemsDeleted = await WorkOrderItem.deleteMany({});
    console.log(`🗑️  ${itemsDeleted.deletedCount} items de órdenes eliminados`);

    // Limpiar WorkOrderHistory
    const historyDeleted = await WorkOrderHistory.deleteMany({});
    console.log(
      `🗑️  ${historyDeleted.deletedCount} registros de historial eliminados`
    );

    // Limpiar WorkOrders
    const ordersDeleted = await WorkOrder.deleteMany({});
    console.log(
      `🗑️  ${ordersDeleted.deletedCount} órdenes de trabajo eliminadas`
    );

    console.log("\n✨ Limpieza completada exitosamente!");
    console.log(
      "👉 Ahora puedes crear nuevas órdenes con el sistema actualizado"
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error en limpieza:", error);
    process.exit(1);
  }
};

cleanWorkOrders();
