/**
 * Service Bay System Seeder
 * Crea datos de prueba para el sistema de bahías de servicio
 *
 * Uso:
 * node database/seeds/serviceBaySeeder.js
 */

require("dotenv").config();
const bcrypt = require("bcryptjs");

// Importar modelos
const ServiceBay = require("../../features/workshop/service-bay/models/serviceBay.model");
const WorkOrderAssignment = require("../../features/workshop/service-bay/models/workOrderAssignment.model");
const BayOccupancyHistory = require("../../features/workshop/service-bay/models/bayOccupancyHistory.model");
const User = require("../../features/user/user.models");
const WorkOrder = require("../../features/workshop/work-orders/models/workOrder.model");
const WorkOrderStatus = require("../../features/workshop/work-orders/models/workOrderStatus.model");
const Customer = require("../../features/crm/customers/models/customer.model");
const Vehicle = require("../../features/crm/vehicles/models/vehicle.model");

/**
 * Limpiar colecciones relacionadas con bahías
 */
const clearServiceBayData = async () => {
  console.log("🧹 Limpiando datos existentes de bahías...");

  await ServiceBay.deleteMany({});
  await WorkOrderAssignment.deleteMany({});
  await BayOccupancyHistory.deleteMany({});

  console.log("✅ Datos limpiados");
};

/**
 * Crear bahías de servicio
 */
const createServiceBays = async () => {
  console.log("\n🏗️  Creando bahías de servicio...");

  const bays = [
    {
      name: "Bahía Mecánica 1",
      code: "MEC-01",
      area: "mecanica",
      capacity: "multiple",
      equipment: [
        "Elevador 4 columnas",
        "Compresor 150 PSI",
        "Juego de herramientas completo",
        "Scanner automotriz",
      ],
      maxTechnicians: 2,
      isActive: true,
      order: 1,
      notes: "Bahía principal para trabajos mecánicos generales",
    },
    {
      name: "Bahía Mecánica 2",
      code: "MEC-02",
      area: "mecanica",
      capacity: "multiple",
      equipment: ["Elevador 2 columnas", "Compresor", "Herramientas básicas"],
      maxTechnicians: 2,
      isActive: true,
      order: 2,
    },
    {
      name: "Bahía Eléctrica 1",
      code: "ELEC-01",
      area: "electricidad",
      capacity: "multiple",
      equipment: [
        "Multímetro digital",
        "Scanner OBD2",
        "Osciloscopio",
        "Banco de pruebas",
      ],
      maxTechnicians: 1,
      isActive: true,
      order: 3,
      notes: "Especializada en diagnóstico eléctrico y electrónico",
    },
    {
      name: "Bahía Diagnóstico",
      code: "DIAG-01",
      area: "diagnostico",
      capacity: "multiple",
      equipment: [
        "Scanner profesional",
        "Equipo de diagnóstico avanzado",
        "Computadora con software especializado",
      ],
      maxTechnicians: 1,
      isActive: true,
      order: 4,
    },
    {
      name: "Bahía Pintura",
      code: "PINT-01",
      area: "pintura",
      capacity: "multiple",
      equipment: [
        "Cabina de pintura",
        "Compresor industrial",
        "Pistolas de pintura",
        "Mezcladora de color",
      ],
      maxTechnicians: 2,
      isActive: true,
      order: 5,
    },
    {
      name: "Bahía Latonería",
      code: "LAT-01",
      area: "latoneria",
      capacity: "multiple",
      equipment: [
        "Bancada de enderezado",
        "Soldadora MIG",
        "Herramientas de carrocería",
      ],
      maxTechnicians: 2,
      isActive: true,
      order: 6,
    },
    {
      name: "Bahía Express",
      code: "EXP-01",
      area: "multiple",
      capacity: "sedan",
      equipment: ["Elevador rápido", "Herramientas básicas"],
      maxTechnicians: 1,
      isActive: true,
      order: 7,
      notes: "Para trabajos rápidos: cambio de aceite, filtros, etc.",
    },
    {
      name: "Bahía Camiones",
      code: "CAM-01",
      area: "mecanica",
      capacity: "camion",
      equipment: [
        "Elevador heavy duty",
        "Herramientas industriales",
        "Gato hidráulico 20 ton",
      ],
      maxTechnicians: 3,
      isActive: true,
      order: 8,
    },
  ];

  const createdBays = await ServiceBay.insertMany(bays);
  console.log(`✅ ${createdBays.length} bahías creadas`);

  return createdBays;
};

/**
 * Crear técnicos de prueba
 */
const createTechnicians = async () => {
  console.log("\n👷 Creando técnicos...");

  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync("Tecnico123!", salt);

  const technicians = [
    {
      nombre: "Carlos",
      apellido: "Rodríguez",
      correo: "carlos.rodriguez@taller.com",
      password: hashedPassword,
      rol: "operador",
      estado: true,
      img: "default.jpg",
    },
    {
      nombre: "María",
      apellido: "González",
      correo: "maria.gonzalez@taller.com",
      password: hashedPassword,
      rol: "operador",
      estado: true,
      img: "default.jpg",
    },
    {
      nombre: "José",
      apellido: "Martínez",
      correo: "jose.martinez@taller.com",
      password: hashedPassword,
      rol: "operador",
      estado: true,
      img: "default.jpg",
    },
    {
      nombre: "Ana",
      apellido: "López",
      correo: "ana.lopez@taller.com",
      password: hashedPassword,
      rol: "operador",
      estado: true,
      img: "default.jpg",
    },
    {
      nombre: "Pedro",
      apellido: "Sánchez",
      correo: "pedro.sanchez@taller.com",
      password: hashedPassword,
      rol: "operador",
      estado: true,
      img: "default.jpg",
    },
  ];

  // Verificar si ya existen, si no, crearlos
  const createdTechnicians = [];
  for (const tech of technicians) {
    let technician = await User.findOne({ correo: tech.correo });
    if (!technician) {
      technician = await User.create(tech);
      console.log(`   ✅ Técnico creado: ${tech.nombre} ${tech.apellido}`);
    } else {
      console.log(`   ℹ️  Técnico existente: ${tech.nombre} ${tech.apellido}`);
    }
    createdTechnicians.push(technician);
  }

  console.log(`✅ ${createdTechnicians.length} técnicos disponibles`);
  return createdTechnicians;
};

/**
 * Crear órdenes de trabajo de prueba
 */
const createWorkOrders = async (customers, vehicles, technicians) => {
  console.log("\n📋 Creando órdenes de trabajo...");

  if (!customers || customers.length === 0) {
    console.log("⚠️  No hay clientes disponibles. Saltando creación de OT.");
    return [];
  }

  if (!vehicles || vehicles.length === 0) {
    console.log("⚠️  No hay vehículos disponibles. Saltando creación de OT.");
    return [];
  }

  // Obtener estado inicial (buscar RECIBIDO, EN_DIAGNOSTICO o EN_REPARACION)
  const estadoPendiente = await WorkOrderStatus.findOne({
    codigo: { $in: ["RECIBIDO", "EN_DIAGNOSTICO", "EN_REPARACION"] },
  });
  if (!estadoPendiente) {
    console.log(
      "⚠️  Estado de OT no encontrado (RECIBIDO/EN_DIAGNOSTICO/EN_REPARACION). Saltando creación de OT."
    );
    return [];
  }
  console.log(`   ℹ️  Usando estado: ${estadoPendiente.codigo}`);

  const workOrders = [];
  const numOrders = Math.min(5, customers.length, vehicles.length);

  for (let i = 0; i < numOrders; i++) {
    const customer = customers[i % customers.length];
    const vehicle = vehicles[i % vehicles.length];
    const technician = technicians[i % technicians.length];

    const workOrder = await WorkOrder.create({
      customer: customer._id,
      vehicle: vehicle._id,
      tecnicoAsignado: technician._id,
      estado: estadoPendiente._id,
      motivo: `Mantenimiento ${i % 2 === 0 ? "preventivo" : "correctivo"} - Seed ${i + 1}`,
      descripcionProblema: `Descripción del problema ${i + 1} para pruebas`,
      kilometraje: 25000 + i * 5000,
      prioridad: ["baja", "normal", "alta"][i % 3],
      fechaEstimadaEntrega: new Date(
        Date.now() + (i + 1) * 24 * 60 * 60 * 1000
      ),
    });

    workOrders.push(workOrder);
  }

  console.log(`✅ ${workOrders.length} órdenes de trabajo creadas`);
  return workOrders;
};

/**
 * Crear asignaciones y historial de ejemplo
 */
const createSampleAssignments = async (
  bays,
  technicians,
  workOrders,
  admin
) => {
  console.log("\n📊 Creando asignaciones de ejemplo...");

  if (workOrders.length === 0) {
    console.log("⚠️  No hay órdenes de trabajo. Saltando asignaciones.");
    return;
  }

  const assignments = [];
  const histories = [];

  // Crear algunas asignaciones completadas (historial)
  for (
    let i = 0;
    i < Math.min(3, bays.length, technicians.length, workOrders.length);
    i++
  ) {
    const bay = bays[i];
    const technician = technicians[i % technicians.length];
    const workOrder = workOrders[i];

    // Fecha de entrada hace 2-5 días
    const daysAgo = 2 + i;
    const entryDate = new Date();
    entryDate.setDate(entryDate.getDate() - daysAgo);
    entryDate.setHours(8, 0, 0, 0);

    // Fecha de salida: 2-6 horas después
    const exitDate = new Date(entryDate);
    exitDate.setHours(entryDate.getHours() + (2 + i));

    const hoursWorked = (exitDate - entryDate) / (1000 * 60 * 60);

    // Crear asignación completada
    const assignment = await WorkOrderAssignment.create({
      workOrder: workOrder._id,
      technician: technician._id,
      serviceBay: bay._id,
      role: i === 0 ? "principal" : "asistente",
      entryTime: entryDate,
      exitTime: exitDate,
      hoursWorked: Math.round(hoursWorked * 100) / 100,
      status: "completado",
      entryNotes: `Inicio de trabajo - ${bay.name}`,
      exitNotes: `Trabajo completado en ${Math.round(hoursWorked * 100) / 100} horas`,
      assignedBy: admin._id,
    });

    assignments.push(assignment);

    // Crear historial de ocupación
    const history = await BayOccupancyHistory.create({
      serviceBay: bay._id,
      workOrder: workOrder._id,
      vehicle: workOrder.vehicle,
      customer: workOrder.customer,
      entryTime: entryDate,
      exitTime: exitDate,
      duration: Math.round(hoursWorked * 100) / 100,
      technicians: [
        {
          technician: technician._id,
          role: assignment.role,
          hoursWorked: assignment.hoursWorked,
        },
      ],
      totalTechnicianHours: assignment.hoursWorked,
      exitReason: "completado",
      notes: `Trabajo completado satisfactoriamente`,
    });

    histories.push(history);

    console.log(
      `   ✅ Asignación histórica ${i + 1}: ${technician.nombre} en ${bay.name} (${Math.round(hoursWorked * 100) / 100}h)`
    );
  }

  // Crear una asignación activa
  if (bays.length > 3 && technicians.length > 3 && workOrders.length > 3) {
    const activeBay = bays[3];
    const activeTechnician = technicians[3 % technicians.length];
    const activeWorkOrder = workOrders[3];

    // Entrada hace 1 hora
    const activeEntryTime = new Date();
    activeEntryTime.setHours(activeEntryTime.getHours() - 1);

    const activeAssignment = await WorkOrderAssignment.create({
      workOrder: activeWorkOrder._id,
      technician: activeTechnician._id,
      serviceBay: activeBay._id,
      role: "principal",
      entryTime: activeEntryTime,
      status: "activo",
      entryNotes: "Trabajo en progreso",
      assignedBy: admin._id,
    });

    // Actualizar bahía
    activeBay.status = "ocupado";
    activeBay.currentWorkOrder = activeWorkOrder._id;
    activeBay.currentTechnicians = [
      {
        technician: activeTechnician._id,
        role: "principal",
        entryTime: activeEntryTime,
      },
    ];
    activeBay.occupiedSince = activeEntryTime;
    await activeBay.save();

    // Actualizar orden de trabajo
    activeWorkOrder.serviceBay = activeBay._id;
    activeWorkOrder.assignments = [activeAssignment._id];
    await activeWorkOrder.save();

    assignments.push(activeAssignment);
    console.log(
      `   ✅ Asignación activa: ${activeTechnician.nombre} en ${activeBay.name}`
    );
  }

  console.log(
    `✅ Total: ${assignments.length} asignaciones creadas (${histories.length} históricas, ${assignments.length - histories.length} activas)`
  );
};

/**
 * Función principal del seeder
 */
const seedServiceBaySystem = async () => {
  try {
    console.log("\n╔════════════════════════════════════════════════════╗");
    console.log("║     SEEDER: SISTEMA DE BAHÍAS DE SERVICIO        ║");
    console.log("╚════════════════════════════════════════════════════╝\n");

    // 1. Limpiar datos existentes
    await clearServiceBayData();

    // 2. Crear bahías
    const bays = await createServiceBays();

    // 3. Crear técnicos
    const technicians = await createTechnicians();

    // 4. Buscar o crear superAdmin
    let admin = await User.findOne({ rol: "superAdmin" });
    if (!admin) {
      console.log("   ℹ️  Creando Super Admin para el sistema...");
      const hashedPassword = bcryptjs.hashSync("SuperAdmin123!", 10);
      admin = await User.create({
        nombre: "Sistema",
        apellido: "Admin",
        correo: "superadmin@taller.com",
        password: hashedPassword,
        rol: "superAdmin",
        estado: true,
        img: "default.jpg",
      });
      console.log("   ✅ Super Admin creado");
    }

    // 5. Obtener clientes y vehículos existentes
    const customers = await Customer.find({ eliminado: false }).limit(10);
    const vehicles = await Vehicle.find({ eliminado: false }).limit(10);

    if (customers.length === 0 || vehicles.length === 0) {
      console.log(
        "\n⚠️  ADVERTENCIA: No hay clientes o vehículos en el sistema."
      );
      console.log("   Las órdenes de trabajo y asignaciones no se crearán.");
      console.log(
        "   Por favor, ejecuta los seeders de clientes y vehículos primero.\n"
      );
    }

    // 6. Crear órdenes de trabajo
    const workOrders = await createWorkOrders(customers, vehicles, technicians);

    // 7. Crear asignaciones de ejemplo
    if (admin && workOrders.length > 0) {
      await createSampleAssignments(bays, technicians, workOrders, admin);
    }

    // Resumen
    console.log("\n╔════════════════════════════════════════════════════╗");
    console.log("║                  RESUMEN DEL SEED                  ║");
    console.log("╚════════════════════════════════════════════════════╝");
    console.log(`
    ✅ Bahías de servicio: ${bays.length}
    ✅ Técnicos: ${technicians.length}
    ✅ Órdenes de trabajo: ${workOrders.length}
    ✅ Asignaciones históricas: ${workOrders.length > 0 ? Math.min(3, workOrders.length) : 0}
    ✅ Asignaciones activas: ${workOrders.length > 3 ? 1 : 0}
    
    📋 Credenciales de técnicos:
       Email: [nombre].[apellido]@taller.com
       Password: Tecnico123!
       
    💡 Uso:
       node database/seeds/serviceBaySeeder.js
    `);

    console.log("✅ Seed completado exitosamente\n");
  } catch (error) {
    console.error("\n❌ Error en el seed:", error);
    console.error(error.stack);
    throw error;
  }
};

/**
 * Función principal
 */
const main = async () => {
  try {
    // Conectar a la base de datos
    const { dbConnection } = require("../config");
    await dbConnection();
    console.log("� Conectado a la base de datos");

    // Ejecutar seed
    await seedServiceBaySystem();

    console.log("🏁 Proceso finalizado");
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
  seedServiceBaySystem,
  clearServiceBayData,
  createServiceBays,
  createTechnicians,
};
