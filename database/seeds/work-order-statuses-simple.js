/**
 * Simple WorkOrderStatus Seeder
 * Script para crear solo los estados de órdenes de trabajo
 */

require("dotenv").config();

const statuses = [
  {
    codigo: "RECIBIDO",
    nombre: "Recibido",
    descripcion: "Vehículo recibido en el taller",
    color: "#FFA500",
    icono: "car",
    orden: 1,
    tipo: "inicial",
    transicionesPermitidas: ["EN_DIAGNOSTICO", "CANCELADA"],
    requiereAprobacion: false,
    requiereDocumentacion: true,
    notificarCliente: true,
    tiempoEstimadoHoras: 1,
  },
  {
    codigo: "EN_DIAGNOSTICO",
    nombre: "En Diagnóstico",
    descripcion: "En proceso de diagnóstico del problema",
    color: "#4169E1",
    icono: "search",
    orden: 2,
    tipo: "intermedio",
    transicionesPermitidas: [
      "ESPERANDO_APROBACION",
      "EN_REPARACION",
      "ESPERANDO_REPUESTOS",
      "CANCELADA",
    ],
    requiereAprobacion: false,
    requiereDocumentacion: false,
    notificarCliente: false,
    tiempoEstimadoHoras: 4,
  },
  {
    codigo: "ESPERANDO_APROBACION",
    nombre: "Esperando Aprobación",
    descripcion: "Esperando aprobación del cliente para proceder",
    color: "#FFD700",
    icono: "clock",
    orden: 3,
    tipo: "intermedio",
    transicionesPermitidas: [
      "EN_REPARACION",
      "ESPERANDO_REPUESTOS",
      "CANCELADA",
    ],
    requiereAprobacion: true,
    requiereDocumentacion: false,
    notificarCliente: true,
    tiempoEstimadoHoras: 24,
  },
  {
    codigo: "ESPERANDO_REPUESTOS",
    nombre: "Esperando Repuestos",
    descripcion: "Esperando llegada de repuestos necesarios",
    color: "#FF6347",
    icono: "package",
    orden: 4,
    tipo: "intermedio",
    transicionesPermitidas: ["EN_REPARACION", "CANCELADA"],
    requiereAprobacion: false,
    requiereDocumentacion: false,
    notificarCliente: true,
    tiempoEstimadoHoras: 48,
  },
  {
    codigo: "EN_REPARACION",
    nombre: "En Reparación",
    descripcion: "Trabajo de reparación en proceso",
    color: "#32CD32",
    icono: "wrench",
    orden: 5,
    tipo: "intermedio",
    transicionesPermitidas: [
      "CONTROL_CALIDAD",
      "ESPERANDO_REPUESTOS",
      "CANCELADA",
    ],
    requiereAprobacion: false,
    requiereDocumentacion: false,
    notificarCliente: false,
    tiempoEstimadoHoras: 8,
  },
  {
    codigo: "CONTROL_CALIDAD",
    nombre: "Control de Calidad",
    descripcion: "Verificación final de la reparación",
    color: "#8A2BE2",
    icono: "check-circle",
    orden: 6,
    tipo: "intermedio",
    transicionesPermitidas: ["LISTO_ENTREGA", "EN_REPARACION", "CANCELADA"],
    requiereAprobacion: false,
    requiereDocumentacion: true,
    notificarCliente: false,
    tiempoEstimadoHoras: 2,
  },
  {
    codigo: "LISTO_ENTREGA",
    nombre: "Listo para Entrega",
    descripcion: "Reparación completada, listo para entrega",
    color: "#00CED1",
    icono: "check-square",
    orden: 7,
    tipo: "intermedio",
    transicionesPermitidas: ["CERRADA_FACTURADA", "CANCELADA"],
    requiereAprobacion: false,
    requiereDocumentacion: true,
    notificarCliente: true,
    tiempoEstimadoHoras: 1,
  },
  {
    codigo: "CERRADA_FACTURADA",
    nombre: "Cerrada y Facturada",
    descripcion: "Orden completada y facturada",
    color: "#228B22",
    icono: "file-check",
    orden: 8,
    tipo: "final",
    transicionesPermitidas: [],
    requiereAprobacion: false,
    requiereDocumentacion: true,
    notificarCliente: true,
    tiempoEstimadoHoras: 0,
  },
  {
    codigo: "CANCELADA",
    nombre: "Cancelada",
    descripcion: "Orden cancelada",
    color: "#DC143C",
    icono: "x-circle",
    orden: 9,
    tipo: "final",
    transicionesPermitidas: [],
    requiereAprobacion: false,
    requiereDocumentacion: false,
    notificarCliente: true,
    tiempoEstimadoHoras: 0,
  },
];

const main = async () => {
  try {
    // Conectar a la base de datos
    const { dbConnection } = require("../config");
    await dbConnection();
    console.log("📡 Conectado a la base de datos");

    const {
      WorkOrderStatus,
    } = require("../../features/workshop/work-orders/models");

    console.log("🌱 Creando estados de órdenes de trabajo...\n");

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const statusData of statuses) {
      const existing = await WorkOrderStatus.findOne({
        codigo: statusData.codigo,
      });

      if (existing) {
        console.log(
          `  ℹ️  Ya existe: ${statusData.nombre} (${statusData.codigo})`
        );
        skipped++;
      } else {
        const status = new WorkOrderStatus(statusData);
        await status.save();
        console.log(`  ✅ Creado: ${statusData.nombre} (${statusData.codigo})`);
        created++;
      }
    }

    console.log("\n📊 Resumen:");
    console.log(`   - Creados: ${created}`);
    console.log(`   - Ya existían: ${skipped}`);
    console.log(`   - Total procesados: ${statuses.length}`);

    console.log("\n🏁 Proceso finalizado exitosamente!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

// Ejecutar
if (require.main === module) {
  main();
}

module.exports = { statuses };
