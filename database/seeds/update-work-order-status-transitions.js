/**
 * Script para actualizar las transiciones permitidas de los estados de órdenes de trabajo
 * Ejecutar: node database/seeds/update-work-order-status-transitions.js
 */

require("dotenv").config();
const { dbConnection } = require("../../database/config");
const WorkOrderStatus = require("../../features/workshop/work-orders/models/workOrderStatus.model");

const statusTransitions = {
  RECIBIDO: ["EN_DIAGNOSTICO", "CANCELADA"],
  DIAGNOSTICO: [
    "ESPERANDO_APROBACION",
    "EN_REPARACION",
    "ESPERANDO_REPUESTOS",
    "CANCELADA",
  ],
  EN_DIAGNOSTICO: [
    "ESPERANDO_APROBACION",
    "EN_REPARACION",
    "ESPERANDO_REPUESTOS",
    "CANCELADA",
  ],
  ESPERANDO_APROBACION: ["EN_REPARACION", "ESPERANDO_REPUESTOS", "CANCELADA"],
  ESPERANDO_REPUESTOS: ["EN_REPARACION", "CANCELADA"],
  EN_REPARACION: ["CONTROL_CALIDAD", "ESPERANDO_REPUESTOS", "CANCELADA"],
  CONTROL_CALIDAD: ["LISTO_ENTREGA", "EN_REPARACION", "CANCELADA"],
  LISTO_ENTREGA: ["CERRADA_FACTURADA", "CANCELADA"],
  CERRADA_FACTURADA: [],
  CANCELADA: [],
};

async function updateTransitions() {
  try {
    // Conectar a la base de datos
    await dbConnection();

    console.log("🔄 Actualizando transiciones permitidas de estados...\n");

    let updated = 0;
    let notFound = 0;

    for (const [codigo, transiciones] of Object.entries(statusTransitions)) {
      const status = await WorkOrderStatus.findOne({
        codigo,
        eliminado: false,
      });

      if (!status) {
        console.log(`   ⚠️  Estado no encontrado: ${codigo}`);
        notFound++;
        continue;
      }

      // Verificar si necesita actualización
      const currentTransitions = status.transicionesPermitidas.sort().join(",");
      const newTransitions = transiciones.sort().join(",");

      if (currentTransitions !== newTransitions) {
        status.transicionesPermitidas = transiciones;
        await status.save();
        console.log(`   ✅ ${codigo} actualizado`);
        console.log(`      Antes: [${currentTransitions || "vacío"}]`);
        console.log(`      Ahora: [${newTransitions}]\n`);
        updated++;
      } else {
        console.log(`   ⏭️  ${codigo} ya tiene las transiciones correctas\n`);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log(`📊 RESUMEN:`);
    console.log(`   Estados actualizados: ${updated}`);
    console.log(
      `   Estados sin cambios: ${Object.keys(statusTransitions).length - updated - notFound}`
    );
    console.log(`   Estados no encontrados: ${notFound}`);
    console.log("=".repeat(60) + "\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error actualizando transiciones:", error);
    process.exit(1);
  }
}

updateTransitions();
