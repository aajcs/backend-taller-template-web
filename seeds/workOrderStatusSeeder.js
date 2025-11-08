/**
 * Seeder para WorkOrderStatus
 * Crea los estados base del sistema de órdenes de trabajo
 */

require("dotenv").config();
const { dbConnection } = require("../database/config");
const WorkOrderStatus = require("../features/workshop/work-orders/models/workOrderStatus.model");

const workOrderStatuses = [
  {
    codigo: "RECIBIDO",
    nombre: "Recibido",
    descripcion: "La orden ha sido recibida y registrada en el sistema",
    color: "#3B82F6", // blue
    icono: "inbox",
    orden: 1,
    tipo: "inicial",
    transicionesPermitidas: ["DIAGNOSTICO", "CANCELADA"],
    requiereAprobacion: false,
    requiereDocumentacion: false,
    notificarCliente: true,
    notificarTecnico: true,
    activo: true,
  },
  {
    codigo: "DIAGNOSTICO",
    nombre: "En Diagnóstico",
    descripcion: "El técnico está realizando el diagnóstico del vehículo",
    color: "#F59E0B", // amber
    icono: "search",
    orden: 2,
    tipo: "intermedio",
    transicionesPermitidas: [
      "ESPERANDO_APROBACION",
      "EN_REPARACION",
      "CANCELADA",
    ],
    requiereAprobacion: false,
    requiereDocumentacion: true,
    notificarCliente: false,
    notificarTecnico: true,
    activo: true,
  },
  {
    codigo: "ESPERANDO_APROBACION",
    nombre: "Esperando Aprobación",
    descripcion:
      "Esperando aprobación del cliente para proceder con la reparación",
    color: "#8B5CF6", // violet
    icono: "clock",
    orden: 3,
    tipo: "intermedio",
    transicionesPermitidas: [
      "ESPERANDO_REPUESTOS",
      "EN_REPARACION",
      "CANCELADA",
    ],
    requiereAprobacion: true,
    requiereDocumentacion: true,
    notificarCliente: true,
    notificarTecnico: false,
    activo: true,
  },
  {
    codigo: "ESPERANDO_REPUESTOS",
    nombre: "Esperando Repuestos",
    descripcion: "Esperando llegada de repuestos para continuar",
    color: "#EF4444", // red
    icono: "package",
    orden: 4,
    tipo: "intermedio",
    transicionesPermitidas: ["EN_REPARACION", "CANCELADA"],
    requiereAprobacion: false,
    requiereDocumentacion: false,
    notificarCliente: true,
    notificarTecnico: true,
    activo: true,
  },
  {
    codigo: "EN_REPARACION",
    nombre: "En Reparación",
    descripcion: "El vehículo está siendo reparado",
    color: "#F97316", // orange
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
    notificarTecnico: true,
    activo: true,
  },
  {
    codigo: "CONTROL_CALIDAD",
    nombre: "Control de Calidad",
    descripcion: "El trabajo está siendo revisado antes de la entrega",
    color: "#06B6D4", // cyan
    icono: "check-circle",
    orden: 6,
    tipo: "intermedio",
    transicionesPermitidas: ["LISTO_ENTREGA", "EN_REPARACION"],
    requiereAprobacion: false,
    requiereDocumentacion: true,
    notificarCliente: false,
    notificarTecnico: true,
    activo: true,
  },
  {
    codigo: "LISTO_ENTREGA",
    nombre: "Listo para Entrega",
    descripcion: "El vehículo está listo para ser entregado al cliente",
    color: "#10B981", // green
    icono: "check",
    orden: 7,
    tipo: "intermedio",
    transicionesPermitidas: ["CERRADA_FACTURADA"],
    requiereAprobacion: false,
    requiereDocumentacion: true,
    notificarCliente: true,
    notificarTecnico: false,
    activo: true,
  },
  {
    codigo: "CERRADA_FACTURADA",
    nombre: "Cerrada y Facturada",
    descripcion: "La orden ha sido completada y facturada",
    color: "#059669", // emerald dark
    icono: "file-text",
    orden: 8,
    tipo: "final",
    transicionesPermitidas: [],
    requiereAprobacion: false,
    requiereDocumentacion: true,
    notificarCliente: true,
    notificarTecnico: false,
    activo: true,
  },
  {
    codigo: "CANCELADA",
    nombre: "Cancelada",
    descripcion: "La orden ha sido cancelada",
    color: "#DC2626", // red dark
    icono: "x-circle",
    orden: 9,
    tipo: "final",
    transicionesPermitidas: [],
    requiereAprobacion: true,
    requiereDocumentacion: true,
    notificarCliente: true,
    notificarTecnico: true,
    activo: true,
  },
];

const seedWorkOrderStatuses = async () => {
  try {
    await dbConnection();
    console.log("✅ Conectado a MongoDB");

    // Limpiar colección existente
    await WorkOrderStatus.deleteMany({});
    console.log("🗑️  Colección WorkOrderStatus limpiada");

    // Insertar estados
    const inserted = await WorkOrderStatus.insertMany(workOrderStatuses);
    console.log(`✅ ${inserted.length} estados insertados`);

    // Mostrar los estados creados con sus IDs
    console.log("\n📋 Estados creados:");
    inserted.forEach((status) => {
      console.log(`  - ${status.codigo}: ${status.nombre} (${status._id})`);
    });

    console.log("\n✨ Seed completado exitosamente!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en seed:", error);
    process.exit(1);
  }
};

seedWorkOrderStatuses();
