/**
 * Services Seeder
 * Script para poblar la base de datos con servicios de taller automotriz
 */

require("dotenv").config();
const mongoose = require("mongoose");
const ServiceCategory = require("../features/workshop/work-orders/models/serviceCategory.model");
const ServiceSubcategory = require("../features/workshop/work-orders/models/serviceSubcategory.model");
const Service = require("../features/workshop/work-orders/models/service.model");

// Conectar a la base de datos
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_CNN);
    console.log("✅ Conectado a MongoDB");
  } catch (error) {
    console.error("❌ Error conectando a MongoDB:", error);
    process.exit(1);
  }
};

// Categorías de servicios
const categories = [
  {
    nombre: "Mantenimiento Preventivo",
    codigo: "MANT_PREV",
    descripcion: "Servicios de mantenimiento programado y preventivo",
    color: "#4CAF50",
    icono: "wrench",
    orden: 1,
  },
  {
    nombre: "Mecánica General",
    codigo: "MEC_GENERAL",
    descripcion: "Reparaciones mecánicas generales del motor y transmisión",
    color: "#2196F3",
    icono: "engine",
    orden: 2,
  },
  {
    nombre: "Sistema Eléctrico",
    codigo: "ELEC",
    descripcion: "Diagnóstico y reparación del sistema eléctrico",
    color: "#FF9800",
    icono: "bolt",
    orden: 3,
  },
  {
    nombre: "Frenos",
    codigo: "FRENOS",
    descripcion: "Mantenimiento y reparación del sistema de frenos",
    color: "#F44336",
    icono: "brake",
    orden: 4,
  },
  {
    nombre: "Suspensión y Dirección",
    codigo: "SUSP_DIR",
    descripcion: "Reparación de suspensión y dirección",
    color: "#9C27B0",
    icono: "steering",
    orden: 5,
  },
  {
    nombre: "Sistema de Enfriamiento",
    codigo: "ENFRIAMIENTO",
    descripcion: "Mantenimiento del sistema de enfriamiento del motor",
    color: "#00BCD4",
    icono: "cooling",
    orden: 6,
  },
  {
    nombre: "Diagnóstico",
    codigo: "DIAGNOSTICO",
    descripcion: "Diagnóstico computarizado y revisiones técnicas",
    color: "#607D8B",
    icono: "diagnostic",
    orden: 7,
  },
  {
    nombre: "Carrocería y Pintura",
    codigo: "CARROCERIA",
    descripcion: "Trabajos de hojalatería y pintura",
    color: "#795548",
    icono: "paint",
    orden: 8,
  },
];

// Subcategorías por categoría
const subcategories = {
  MANT_PREV: [
    { nombre: "Cambio de Aceite", codigo: "MANT_PREV_ACEITE" },
    { nombre: "Filtros", codigo: "MANT_PREV_FILTROS" },
    { nombre: "Revisión General", codigo: "MANT_PREV_REVISION" },
    { nombre: "Bujías", codigo: "MANT_PREV_BUJIAS" },
  ],
  MEC_GENERAL: [
    { nombre: "Motor", codigo: "MEC_MOTOR" },
    { nombre: "Transmisión", codigo: "MEC_TRANSMISION" },
    { nombre: "Embrague", codigo: "MEC_EMBRAGUE" },
    { nombre: "Escape", codigo: "MEC_ESCAPE" },
  ],
  ELEC: [
    { nombre: "Batería", codigo: "ELEC_BATERIA" },
    { nombre: "Alternador", codigo: "ELEC_ALTERNADOR" },
    { nombre: "Motor de Arranque", codigo: "ELEC_ARRANQUE" },
    { nombre: "Sistema de Luces", codigo: "ELEC_LUCES" },
  ],
  FRENOS: [
    { nombre: "Pastillas", codigo: "FRENOS_PASTILLAS" },
    { nombre: "Discos", codigo: "FRENOS_DISCOS" },
    { nombre: "Líquido de Frenos", codigo: "FRENOS_LIQUIDO" },
    { nombre: "Sistema ABS", codigo: "FRENOS_ABS" },
  ],
  SUSP_DIR: [
    { nombre: "Amortiguadores", codigo: "SUSP_AMORTIGUADORES" },
    { nombre: "Alineación", codigo: "SUSP_ALINEACION" },
    { nombre: "Balanceo", codigo: "SUSP_BALANCEO" },
    { nombre: "Cremallera", codigo: "SUSP_CREMALLERA" },
  ],
  ENFRIAMIENTO: [
    { nombre: "Radiador", codigo: "ENFR_RADIADOR" },
    { nombre: "Termostato", codigo: "ENFR_TERMOSTATO" },
    { nombre: "Bomba de Agua", codigo: "ENFR_BOMBA" },
    { nombre: "Líquido Refrigerante", codigo: "ENFR_LIQUIDO" },
  ],
  DIAGNOSTICO: [
    { nombre: "Escaneo Computarizado", codigo: "DIAG_SCANNER" },
    { nombre: "Revisión Pre-compra", codigo: "DIAG_PRECOMPRA" },
    { nombre: "Análisis de Ruidos", codigo: "DIAG_RUIDOS" },
  ],
  CARROCERIA: [
    { nombre: "Hojalatería", codigo: "CARR_HOJALATERIA" },
    { nombre: "Pintura", codigo: "CARR_PINTURA" },
    { nombre: "Pulido", codigo: "CARR_PULIDO" },
  ],
};

// Servicios detallados
const services = [
  // MANTENIMIENTO PREVENTIVO
  {
    categoria: "MANT_PREV",
    subcategoria: "MANT_PREV_ACEITE",
    nombre: "Cambio de Aceite Sintético",
    codigo: "SRV_ACEITE_SINT",
    descripcion: "Cambio de aceite sintético 5W-30 o 5W-40 con filtro",
    precioBase: 45.0,
    tiempoEstimadoMinutos: 30,
    dificultad: "baja",
    requiereEspecialista: false,
  },
  {
    categoria: "MANT_PREV",
    subcategoria: "MANT_PREV_ACEITE",
    nombre: "Cambio de Aceite Semi-sintético",
    codigo: "SRV_ACEITE_SEMI",
    descripcion: "Cambio de aceite semi-sintético con filtro",
    precioBase: 35.0,
    tiempoEstimadoMinutos: 30,
    dificultad: "baja",
    requiereEspecialista: false,
  },
  {
    categoria: "MANT_PREV",
    subcategoria: "MANT_PREV_FILTROS",
    nombre: "Cambio de Filtro de Aire",
    codigo: "SRV_FILTRO_AIRE",
    descripcion: "Reemplazo del filtro de aire del motor",
    precioBase: 15.0,
    tiempoEstimadoMinutos: 15,
    dificultad: "baja",
    requiereEspecialista: false,
  },
  {
    categoria: "MANT_PREV",
    subcategoria: "MANT_PREV_FILTROS",
    nombre: "Cambio de Filtro de Combustible",
    codigo: "SRV_FILTRO_COMB",
    descripcion: "Reemplazo del filtro de combustible",
    precioBase: 25.0,
    tiempoEstimadoMinutos: 45,
    dificultad: "media",
    requiereEspecialista: false,
  },
  {
    categoria: "MANT_PREV",
    subcategoria: "MANT_PREV_BUJIAS",
    nombre: "Cambio de Bujías (4 cilindros)",
    codigo: "SRV_BUJIAS_4CIL",
    descripcion: "Reemplazo de bujías para motor de 4 cilindros",
    precioBase: 40.0,
    tiempoEstimadoMinutos: 60,
    dificultad: "media",
    requiereEspecialista: false,
  },
  {
    categoria: "MANT_PREV",
    subcategoria: "MANT_PREV_REVISION",
    nombre: "Revisión de 15,000 km",
    codigo: "SRV_REV_15K",
    descripcion:
      "Revisión general programada a los 15,000 km (aceite, filtros, niveles)",
    precioBase: 80.0,
    tiempoEstimadoMinutos: 90,
    dificultad: "baja",
    requiereEspecialista: false,
  },

  // FRENOS
  {
    categoria: "FRENOS",
    subcategoria: "FRENOS_PASTILLAS",
    nombre: "Cambio de Pastillas Delanteras",
    codigo: "SRV_PAST_DEL",
    descripcion: "Reemplazo de pastillas de freno delanteras",
    precioBase: 60.0,
    tiempoEstimadoMinutos: 60,
    dificultad: "media",
    requiereEspecialista: false,
  },
  {
    categoria: "FRENOS",
    subcategoria: "FRENOS_PASTILLAS",
    nombre: "Cambio de Pastillas Traseras",
    codigo: "SRV_PAST_TRAS",
    descripcion: "Reemplazo de pastillas de freno traseras",
    precioBase: 55.0,
    tiempoEstimadoMinutos: 60,
    dificultad: "media",
    requiereEspecialista: false,
  },
  {
    categoria: "FRENOS",
    subcategoria: "FRENOS_DISCOS",
    nombre: "Rectificado de Discos Delanteros",
    codigo: "SRV_RECT_DISC_DEL",
    descripcion: "Rectificado de discos de freno delanteros",
    precioBase: 40.0,
    tiempoEstimadoMinutos: 90,
    dificultad: "media",
    requiereEspecialista: true,
  },
  {
    categoria: "FRENOS",
    subcategoria: "FRENOS_LIQUIDO",
    nombre: "Cambio de Líquido de Frenos",
    codigo: "SRV_LIQ_FRENOS",
    descripcion: "Reemplazo completo del líquido de frenos DOT 3/4",
    precioBase: 35.0,
    tiempoEstimadoMinutos: 45,
    dificultad: "media",
    requiereEspecialista: false,
  },

  // SUSPENSIÓN Y DIRECCIÓN
  {
    categoria: "SUSP_DIR",
    subcategoria: "SUSP_AMORTIGUADORES",
    nombre: "Cambio de Amortiguadores Delanteros",
    codigo: "SRV_AMORT_DEL",
    descripcion: "Reemplazo de amortiguadores delanteros (par)",
    precioBase: 100.0,
    tiempoEstimadoMinutos: 120,
    dificultad: "alta",
    requiereEspecialista: true,
  },
  {
    categoria: "SUSP_DIR",
    subcategoria: "SUSP_ALINEACION",
    nombre: "Alineación Computarizada",
    codigo: "SRV_ALINEACION",
    descripcion: "Alineación computarizada de las 4 ruedas",
    precioBase: 30.0,
    tiempoEstimadoMinutos: 45,
    dificultad: "media",
    requiereEspecialista: true,
  },
  {
    categoria: "SUSP_DIR",
    subcategoria: "SUSP_BALANCEO",
    nombre: "Balanceo de 4 Ruedas",
    codigo: "SRV_BALANCEO",
    descripcion: "Balanceo computarizado de las 4 ruedas",
    precioBase: 20.0,
    tiempoEstimadoMinutos: 30,
    dificultad: "baja",
    requiereEspecialista: false,
  },

  // SISTEMA ELÉCTRICO
  {
    categoria: "ELEC",
    subcategoria: "ELEC_BATERIA",
    nombre: "Diagnóstico de Batería",
    codigo: "SRV_DIAG_BAT",
    descripcion: "Prueba de carga y estado de la batería",
    precioBase: 10.0,
    tiempoEstimadoMinutos: 15,
    dificultad: "baja",
    requiereEspecialista: false,
  },
  {
    categoria: "ELEC",
    subcategoria: "ELEC_BATERIA",
    nombre: "Cambio de Batería",
    codigo: "SRV_CAMBIO_BAT",
    descripcion: "Instalación de batería nueva (batería no incluida)",
    precioBase: 15.0,
    tiempoEstimadoMinutos: 20,
    dificultad: "baja",
    requiereEspecialista: false,
  },
  {
    categoria: "ELEC",
    subcategoria: "ELEC_ALTERNADOR",
    nombre: "Reparación de Alternador",
    codigo: "SRV_REP_ALT",
    descripcion: "Reparación y prueba del alternador",
    precioBase: 80.0,
    tiempoEstimadoMinutos: 180,
    dificultad: "alta",
    requiereEspecialista: true,
  },

  // MECÁNICA GENERAL
  {
    categoria: "MEC_GENERAL",
    subcategoria: "MEC_MOTOR",
    nombre: "Cambio de Correa de Distribución",
    codigo: "SRV_CORREA_DIST",
    descripcion: "Reemplazo de correa/cadena de distribución",
    precioBase: 250.0,
    tiempoEstimadoMinutos: 300,
    dificultad: "experto",
    requiereEspecialista: true,
  },
  {
    categoria: "MEC_GENERAL",
    subcategoria: "MEC_TRANSMISION",
    nombre: "Cambio de Aceite de Transmisión",
    codigo: "SRV_ACEITE_TRANS",
    descripcion: "Cambio de aceite de transmisión automática",
    precioBase: 70.0,
    tiempoEstimadoMinutos: 60,
    dificultad: "media",
    requiereEspecialista: false,
  },

  // DIAGNÓSTICO
  {
    categoria: "DIAGNOSTICO",
    subcategoria: "DIAG_SCANNER",
    nombre: "Escaneo Computarizado Completo",
    codigo: "SRV_SCAN_COMP",
    descripcion: "Escaneo completo de todos los sistemas del vehículo",
    precioBase: 40.0,
    tiempoEstimadoMinutos: 30,
    dificultad: "media",
    requiereEspecialista: true,
  },
  {
    categoria: "DIAGNOSTICO",
    subcategoria: "DIAG_PRECOMPRA",
    nombre: "Inspección Pre-compra",
    codigo: "SRV_INSP_PRECOM",
    descripcion:
      "Inspección técnica completa para vehículos usados (más de 100 puntos)",
    precioBase: 100.0,
    tiempoEstimadoMinutos: 120,
    dificultad: "media",
    requiereEspecialista: true,
  },

  // SISTEMA DE ENFRIAMIENTO
  {
    categoria: "ENFRIAMIENTO",
    subcategoria: "ENFR_LIQUIDO",
    nombre: "Cambio de Líquido Refrigerante",
    codigo: "SRV_REFRIG",
    descripcion: "Cambio completo del líquido refrigerante/anticongelante",
    precioBase: 40.0,
    tiempoEstimadoMinutos: 45,
    dificultad: "media",
    requiereEspecialista: false,
  },
  {
    categoria: "ENFRIAMIENTO",
    subcategoria: "ENFR_TERMOSTATO",
    nombre: "Cambio de Termostato",
    codigo: "SRV_TERMOSTATO",
    descripcion: "Reemplazo del termostato del motor",
    precioBase: 50.0,
    tiempoEstimadoMinutos: 90,
    dificultad: "media",
    requiereEspecialista: false,
  },
];

// Función principal para ejecutar el seed
const seedServices = async () => {
  try {
    console.log("\n🌱 Iniciando seed de servicios...\n");

    // Limpiar colecciones existentes
    console.log("🗑️  Limpiando datos existentes...");
    await Service.deleteMany({});
    await ServiceSubcategory.deleteMany({});
    await ServiceCategory.deleteMany({});
    console.log("✅ Datos existentes eliminados\n");

    // Insertar categorías
    console.log("📁 Insertando categorías...");
    const insertedCategories = await ServiceCategory.insertMany(categories);
    console.log(`✅ ${insertedCategories.length} categorías insertadas\n`);

    // Crear mapa de categorías por código
    const categoryMap = {};
    insertedCategories.forEach((cat) => {
      categoryMap[cat.codigo] = cat._id;
    });

    // Insertar subcategorías
    console.log("📂 Insertando subcategorías...");
    const allSubcategories = [];
    for (const [catCode, subs] of Object.entries(subcategories)) {
      for (const sub of subs) {
        allSubcategories.push({
          ...sub,
          categoria: categoryMap[catCode],
        });
      }
    }
    const insertedSubcategories =
      await ServiceSubcategory.insertMany(allSubcategories);
    console.log(
      `✅ ${insertedSubcategories.length} subcategorías insertadas\n`
    );

    // Crear mapa de subcategorías por código
    const subcategoryMap = {};
    insertedSubcategories.forEach((sub) => {
      subcategoryMap[sub.codigo] = sub._id;
    });

    // Insertar servicios
    console.log("🔧 Insertando servicios...");
    const servicesWithIds = services.map((service) => ({
      ...service,
      categoria: categoryMap[service.categoria],
      subcategoria: subcategoryMap[service.subcategoria],
    }));
    const insertedServices = await Service.insertMany(servicesWithIds);
    console.log(`✅ ${insertedServices.length} servicios insertados\n`);

    // Resumen
    console.log("📊 RESUMEN:");
    console.log(`   Categorías: ${insertedCategories.length}`);
    console.log(`   Subcategorías: ${insertedSubcategories.length}`);
    console.log(`   Servicios: ${insertedServices.length}`);
    console.log("\n✨ Seed completado exitosamente!\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error ejecutando seed:", error);
    process.exit(1);
  }
};

// Ejecutar el seed
connectDB().then(() => seedServices());
