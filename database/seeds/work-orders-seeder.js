/**
 * Work Orders Seeder Script
 * Script para poblar la base de datos con datos iniciales de órdenes de trabajo
 *
 * Uso:
 * - Para poblar datos iniciales: node database/seeds/work-orders-seeder.js
 * - Para limpiar datos: node database/seeds/work-orders-seeder.js --clean
 */

require("dotenv").config();
const {
  WorkOrderStatus,
  Service,
  ServiceCategory,
  ServiceSubcategory,
} = require("../../features/workshop/work-orders/models");

const seedingData = {
  serviceCategories: [
    {
      nombre: "Mantenimiento del Motor",
      descripcion:
        "Servicios relacionados con el mantenimiento preventivo y correctivo del motor",
      codigo: "MANTENIMIENTO_MOTOR",
      color: "#FF6B6B",
      icono: "engine",
      orden: 1,
    },
    {
      nombre: "Suspensión y Ruedas",
      descripcion: "Servicios de suspensión, dirección, frenos y ruedas",
      codigo: "SUSPENSION_RUEDAS",
      color: "#4ECDC4",
      icono: "car-tire",
      orden: 2,
    },
    {
      nombre: "Sistema Eléctrico",
      descripcion: "Servicios relacionados con el sistema eléctrico y batería",
      codigo: "ELECTRICO_BATERIA",
      color: "#FFD93D",
      icono: "battery",
      orden: 3,
    },
    {
      nombre: "Frenos",
      descripcion:
        "Servicios de mantenimiento y reparación del sistema de frenos",
      codigo: "FRENOS_DISCOS",
      color: "#FF8A65",
      icono: "brake",
      orden: 4,
    },
    {
      nombre: "Diagnóstico General",
      descripcion: "Servicios de diagnóstico y revisión general del vehículo",
      codigo: "DIAGNOSTICO_GENERAL",
      color: "#90CAF9",
      icono: "diagnostic",
      orden: 5,
    },
    {
      nombre: "Reparación de Motor",
      descripcion: "Servicios de reparación mayor del motor",
      codigo: "MOTOR_REPARACION",
      color: "#F48FB1",
      icono: "engine-repair",
      orden: 6,
    },
  ],
  serviceSubcategories: [
    {
      nombre: "Mantenimiento de Motor",
      descripcion: "Mantenimiento preventivo del motor",
      codigo: "MANTENIMIENTO_MOTOR",
      categoria: "MANTENIMIENTO_MOTOR", // Será reemplazado por ObjectId
      orden: 1,
    },
    {
      nombre: "Suspensión y Ruedas",
      descripcion: "Servicios de suspensión y ruedas",
      codigo: "SUSPENSION_RUEDAS",
      categoria: "SUSPENSION_RUEDAS",
      orden: 1,
    },
    {
      nombre: "Sistema Eléctrico y Batería",
      descripcion: "Mantenimiento del sistema eléctrico",
      codigo: "ELECTRICO_BATERIA",
      categoria: "ELECTRICO_BATERIA",
      orden: 1,
    },
    {
      nombre: "Frenos y Discos",
      descripcion: "Mantenimiento de frenos",
      codigo: "FRENOS_DISCOS",
      categoria: "FRENOS_DISCOS",
      orden: 1,
    },
    {
      nombre: "Diagnóstico General",
      descripcion: "Diagnóstico completo del vehículo",
      codigo: "DIAGNOSTICO_GENERAL",
      categoria: "DIAGNOSTICO_GENERAL",
      orden: 1,
    },
    {
      nombre: "Reparación Mayor de Motor",
      descripcion: "Reparaciones complejas del motor",
      codigo: "MOTOR_REPARACION",
      categoria: "MOTOR_REPARACION",
      orden: 1,
    },
  ],
  categories: [
    {
      nombre: "Mantenimiento",
      descripcion: "Servicios de mantenimiento preventivo y correctivo",
      codigo: "MANTENIMIENTO",
      color: "#4CAF50",
      icono: "wrench",
      orden: 1,
    },
    {
      nombre: "Reparación",
      descripcion: "Servicios de reparación de componentes y sistemas",
      codigo: "REPARACION",
      color: "#FF9800",
      icono: "hammer",
      orden: 2,
    },
    {
      nombre: "Diagnóstico",
      descripcion: "Servicios de diagnóstico y evaluación técnica",
      codigo: "DIAGNOSTICO",
      color: "#2196F3",
      icono: "search",
      orden: 3,
    },
    {
      nombre: "Eléctrico",
      descripcion: "Servicios relacionados con sistemas eléctricos",
      codigo: "ELECTRICO",
      color: "#FFC107",
      icono: "zap",
      orden: 4,
    },
    {
      nombre: "Suspensión",
      descripcion: "Servicios de suspensión y dirección",
      codigo: "SUSPENSION",
      color: "#9C27B0",
      icono: "car",
      orden: 5,
    },
    {
      nombre: "Frenos",
      descripcion: "Servicios de sistema de frenos",
      codigo: "FRENOS",
      color: "#F44336",
      icono: "disc",
      orden: 6,
    },
    {
      nombre: "Motor",
      descripcion: "Servicios relacionados con el motor",
      codigo: "MOTOR",
      color: "#795548",
      icono: "cog",
      orden: 7,
    },
  ],

  subcategories: [
    // Mantenimiento
    {
      categoria: "MANTENIMIENTO",
      nombre: "Motor",
      codigo: "MANTENIMIENTO_MOTOR",
    },
    {
      categoria: "MANTENIMIENTO",
      nombre: "Transmisión",
      codigo: "MANTENIMIENTO_TRANSMISION",
    },
    {
      categoria: "MANTENIMIENTO",
      nombre: "General",
      codigo: "MANTENIMIENTO_GENERAL",
    },

    // Reparación
    {
      categoria: "REPARACION",
      nombre: "Carrocería",
      codigo: "REPARACION_CARROCERIA",
    },
    {
      categoria: "REPARACION",
      nombre: "Componentes",
      codigo: "REPARACION_COMPONENTES",
    },
    {
      categoria: "REPARACION",
      nombre: "Sistemas",
      codigo: "REPARACION_SISTEMAS",
    },

    // Diagnóstico
    {
      categoria: "DIAGNOSTICO",
      nombre: "General",
      codigo: "DIAGNOSTICO_GENERAL",
    },
    {
      categoria: "DIAGNOSTICO",
      nombre: "Eléctrico",
      codigo: "DIAGNOSTICO_ELECTRICO",
    },
    { categoria: "DIAGNOSTICO", nombre: "Motor", codigo: "DIAGNOSTICO_MOTOR" },

    // Eléctrico
    { categoria: "ELECTRICO", nombre: "Batería", codigo: "ELECTRICO_BATERIA" },
    {
      categoria: "ELECTRICO",
      nombre: "Alternador",
      codigo: "ELECTRICO_ALTERNADOR",
    },
    {
      categoria: "ELECTRICO",
      nombre: "Sistema Eléctrico",
      codigo: "ELECTRICO_SISTEMA",
    },

    // Suspensión
    { categoria: "SUSPENSION", nombre: "Ruedas", codigo: "SUSPENSION_RUEDAS" },
    {
      categoria: "SUSPENSION",
      nombre: "Dirección",
      codigo: "SUSPENSION_DIRECCION",
    },
    {
      categoria: "SUSPENSION",
      nombre: "Suspensión",
      codigo: "SUSPENSION_SUSPENSION",
    },

    // Frenos
    {
      categoria: "FRENOS",
      nombre: "Discos y Pastillas",
      codigo: "FRENOS_DISCOS",
    },
    { categoria: "FRENOS", nombre: "Tambores", codigo: "FRENOS_TAMBORES" },
    {
      categoria: "FRENOS",
      nombre: "Sistema Hidráulico",
      codigo: "FRENOS_HIDRAULICO",
    },

    // Motor
    {
      categoria: "MOTOR",
      nombre: "Reparación Mayor",
      codigo: "MOTOR_REPARACION",
    },
    { categoria: "MOTOR", nombre: "Afinación", codigo: "MOTOR_AFINACION" },
    { categoria: "MOTOR", nombre: "Lubricación", codigo: "MOTOR_LUBRICACION" },
  ],
  statuses: [
    {
      codigo: "RECIBIDO",
      nombre: "Recibido",
      descripcion: "Vehículo recibido en el taller",
      color: "#FFA500",
      icono: "car",
      orden: 1,
      tipo: "inicial",
      transicionesPermitidas: ["DIAGNOSTICO", "CANCELADA"],
      requiereAprobacion: false,
      requiereDocumentacion: true,
      notificarCliente: true,
      tiempoEstimadoHoras: 1,
    },
    {
      codigo: "DIAGNOSTICO",
      nombre: "Diagnóstico",
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
      nombre: "Cerrada/Facturada",
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
  ],

  services: [
    {
      nombre: "Cambio de Aceite y Filtro",
      descripcion: "Cambio completo de aceite del motor y filtro de aceite",
      codigo: "CAMBIO_ACEITE",
      categoria: "MANTENIMIENTO_MOTOR", // Será reemplazado por ObjectId
      subcategoria: "MANTENIMIENTO_MOTOR", // Será reemplazado por ObjectId
      precioBase: 25.0,
      tiempoEstimadoMinutos: 30,
      unidadTiempo: "minutos",
      costoHoraAdicional: 0,
      requiereEspecialista: false,
      dificultad: "baja",
      herramientasRequeridas: [
        "Llave de filtro",
        "Embudo",
        "Contenedor de aceite",
      ],
      garantiaMeses: 1,
      instrucciones: "Verificar nivel de aceite después de 500km",
    },
    {
      nombre: "Alineación y Balanceo",
      descripcion: "Alineación de ruedas delanteras y balanceo de las 4 ruedas",
      codigo: "ALINEACION_BALANCEO",
      categoria: "SUSPENSION_RUEDAS",
      subcategoria: "SUSPENSION_RUEDAS",
      precioBase: 35.0,
      tiempoEstimadoMinutos: 60,
      unidadTiempo: "minutos",
      costoHoraAdicional: 0,
      requiereEspecialista: true,
      dificultad: "media",
      herramientasRequeridas: ["Máquina de alineación", "Balancadora"],
      garantiaMeses: 3,
      instrucciones:
        "Revisar cada 10,000km o cuando se note desgaste irregular",
    },
    {
      nombre: "Revisión General del Vehículo",
      descripcion: "Inspección completa de todos los sistemas del vehículo",
      codigo: "REVISION_GENERAL",
      categoria: "DIAGNOSTICO_GENERAL",
      subcategoria: "DIAGNOSTICO_GENERAL",
      precioBase: 45.0,
      tiempoEstimadoMinutos: 90,
      unidadTiempo: "minutos",
      costoHoraAdicional: 0,
      requiereEspecialista: true,
      dificultad: "media",
      herramientasRequeridas: [
        "Scanner OBD-II",
        "Multímetro",
        "Herramientas básicas",
      ],
      garantiaMeses: 0,
      instrucciones: "Incluye reporte detallado de hallazgos",
    },
    {
      nombre: "Cambio de Batería",
      descripcion: "Reemplazo de batería del vehículo",
      codigo: "CAMBIO_BATERIA",
      categoria: "ELECTRICO_BATERIA",
      subcategoria: "ELECTRICO_BATERIA",
      precioBase: 40.0,
      tiempoEstimadoMinutos: 20,
      unidadTiempo: "minutos",
      costoHoraAdicional: 0,
      requiereEspecialista: false,
      dificultad: "baja",
      herramientasRequeridas: ["Llaves", "Cargador de batería"],
      garantiaMeses: 12,
      instrucciones: "Batería incluye 1 año de garantía",
    },
    {
      nombre: "Cambio de Frenos Delanteros",
      descripcion: "Reemplazo de pastillas y discos de freno delanteros",
      codigo: "FRENOS_DELANTEROS",
      categoria: "FRENOS_DISCOS",
      subcategoria: "FRENOS_DISCOS",
      precioBase: 80.0,
      tiempoEstimadoMinutos: 120,
      unidadTiempo: "minutos",
      costoHoraAdicional: 0,
      requiereEspecialista: true,
      dificultad: "media",
      herramientasRequeridas: [
        "Gato hidráulico",
        "Llave de impacto",
        "Calibrador de frenos",
      ],
      garantiaMeses: 12,
      instrucciones: "Incluye purga del sistema de frenos",
    },
    {
      nombre: "Reparación de Motor",
      descripcion: "Reparación mayor del motor (válvulas, pistones, etc.)",
      codigo: "REPARACION_MOTOR",
      categoria: "MOTOR_REPARACION",
      subcategoria: "MOTOR_REPARACION",
      precioBase: 200.0,
      tiempoEstimadoMinutos: 480,
      unidadTiempo: "minutos",
      costoHoraAdicional: 50.0,
      requiereEspecialista: true,
      dificultad: "experto",
      herramientasRequeridas: [
        "Herramientas especializadas",
        "Equipo de diagnosis",
      ],
      garantiaMeses: 24,
      instrucciones: "Requiere aprobación previa del cliente",
    },
  ],
};

const seedWorkOrderStatuses = async () => {
  try {
    console.log("🌱 Iniciando seeding de estados de órdenes de trabajo...");

    let statusesCreated = 0;

    for (const statusData of workOrdersSeedData.statuses) {
      let status = await WorkOrderStatus.findOne({ codigo: statusData.codigo });
      let created = false;

      if (!status) {
        status = new WorkOrderStatus(statusData);
        await status.save();
        created = true;
        statusesCreated++;
        console.log(`  ✅ Estado creado: ${status.nombre} (${status.codigo})`);
      } else {
        console.log(
          `  ℹ️  Estado ya existe: ${status.nombre} (${status.codigo})`
        );
      }
    }

    console.log(
      `📊 Estados procesados: ${workOrdersSeedData.statuses.length}, creados: ${statusesCreated}`
    );
  } catch (error) {
    console.error("❌ Error durante el seeding de estados:", error);
    throw error;
  }
};

const seedServices = async () => {
  try {
    console.log("🌱 Iniciando seeding de servicios...");

    let servicesCreated = 0;

    for (const serviceData of workOrdersSeedData.services) {
      let service = await Service.findOne({ codigo: serviceData.codigo });
      let created = false;

      if (!service) {
        service = new Service(serviceData);
        await service.save();
        created = true;
        servicesCreated++;
        console.log(
          `  ✅ Servicio creado: ${service.nombre} (${service.codigo})`
        );
      } else {
        console.log(
          `  ℹ️  Servicio ya existe: ${service.nombre} (${service.codigo})`
        );
      }
    }

    console.log(
      `📊 Servicios procesados: ${workOrdersSeedData.services.length}, creados: ${servicesCreated}`
    );
  } catch (error) {
    console.error("❌ Error durante el seeding de servicios:", error);
    throw error;
  }
};

const cleanWorkOrdersData = async () => {
  try {
    console.log("🧹 Limpiando datos de órdenes de trabajo...");

    const statusesDeleted = await WorkOrderStatus.deleteMany({});
    const servicesDeleted = await Service.deleteMany({});

    console.log("✅ Limpieza completada:");
    console.log(`   - Estados eliminados: ${statusesDeleted.deletedCount}`);
    console.log(`   - Servicios eliminados: ${servicesDeleted.deletedCount}`);
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
    throw error;
  }
};

// Función principal unificada para seeding completo de órdenes de trabajo
const seedWorkOrders = async () => {
  try {
    console.log("🌱 Iniciando seeding completo de Órdenes de Trabajo...");

    // 1. Crear categorías de servicios primero
    console.log("📂 Creando categorías de servicios...");
    const createdCategories = {};
    for (const categoryData of seedingData.serviceCategories) {
      const category = new ServiceCategory(categoryData);
      await category.save();
      createdCategories[categoryData.codigo] = category._id;
      console.log(`✅ Categoría creada: ${category.nombre}`);
    }

    // 2. Crear subcategorías con referencias a categorías
    console.log("📂 Creando subcategorías de servicios...");
    const createdSubcategories = {};
    for (const subcategoryData of seedingData.serviceSubcategories) {
      const subcategory = new ServiceSubcategory({
        ...subcategoryData,
        categoria: createdCategories[subcategoryData.categoria],
      });
      await subcategory.save();
      createdSubcategories[subcategoryData.codigo] = subcategory._id;
      console.log(`✅ Subcategoría creada: ${subcategory.nombre}`);
    }

    // 3. Crear servicios con referencias correctas
    console.log("🔧 Creando servicios...");
    for (const serviceData of seedingData.services) {
      const service = new Service({
        ...serviceData,
        categoria: createdCategories[serviceData.categoria],
        subcategoria: createdSubcategories[serviceData.subcategoria],
      });
      await service.save();
      console.log(`✅ Servicio creado: ${service.nombre}`);
    }

    // 4. Crear estados de órdenes de trabajo
    console.log("📋 Creando estados de órdenes de trabajo...");
    for (const statusData of seedingData.statuses) {
      const status = new WorkOrderStatus(statusData);
      await status.save();
      console.log(`✅ Estado creado: ${status.nombre}`);
    }

    console.log(
      "🎉 Seeding completo de Órdenes de Trabajo finalizado exitosamente!"
    );
    return { success: true, message: "Seeding completado" };
  } catch (error) {
    console.error("❌ Error durante el seeding:", error);
    throw error;
  }
};

// Función principal
const main = async () => {
  try {
    // Conectar a la base de datos
    const { dbConnection } = require("../../database/config");
    await dbConnection();
    console.log("📡 Conectado a la base de datos");

    // Verificar argumentos de línea de comandos
    const args = process.argv.slice(2);

    if (args.includes("--clean")) {
      await cleanWorkOrdersData();
    } else {
      await seedWorkOrders();
    }

    console.log("🏁 Proceso finalizado exitosamente!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en el proceso principal:", error);
    process.exit(1);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = {
  seedWorkOrderStatuses,
  seedServices,
  seedWorkOrders,
  cleanWorkOrdersData,
};
