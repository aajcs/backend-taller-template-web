/**
 * Complete System Seeder
 * Crea datos completos para probar todo el sistema de taller
 * Incluye: Customers, Vehicles, Services, WorkOrders con items, y flujo completo
 */

require("dotenv").config();
const { dbConnection } = require("../database/config");

// Modelos requeridos
const Customer = require("../features/crm/customers/models/customer.model");
const VehicleBrand = require("../features/crm/vehicles/models/vehicleBrand.model");
const VehicleModel = require("../features/crm/vehicles/models/vehicleModel.model");
const Vehicle = require("../features/crm/vehicles/models/vehicle.model");
const WorkOrderStatus = require("../features/workshop/work-orders/models/workOrderStatus.model");
const ServiceCategory = require("../features/workshop/work-orders/models/serviceCategory.model");
const ServiceSubcategory = require("../features/workshop/work-orders/models/serviceSubcategory.model");
const Service = require("../features/workshop/work-orders/models/service.model");
const WorkOrder = require("../features/workshop/work-orders/models/workOrder.model");
const WorkOrderItem = require("../features/workshop/work-orders/models/workOrderItem.model");
const User = require("../features/user/user.models");

const seedCompleteSystem = async () => {
  try {
    await dbConnection();
    console.log("✅ Conectado a MongoDB");

    // 1. Limpiar datos existentes (opcional - descomentar si quieres limpiar)
    // console.log("🗑️  Limpiando datos existentes...");
    // await Promise.all([
    //   WorkOrderItem.deleteMany({}),
    //   WorkOrder.deleteMany({}),
    //   Service.deleteMany({}),
    //   ServiceCategory.deleteMany({}),
    //   Vehicle.deleteMany({}),
    //   VehicleModel.deleteMany({}),
    //   Customer.deleteMany({}),
    // ]);

    // 2. Crear usuarios de prueba (verificar si ya existen)
    console.log("👥 Verificando/creando usuarios...");
    const testUsers = [
      {
        nombre: "Juan Pérez",
        correo: "juan.perez@taller.com",
        password:
          "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // "password123"
        rol: "operador",
        departamento: ["taller"],
        acceso: "completo",
        estado: true,
      },
      {
        nombre: "María González",
        correo: "maria.gonzalez@taller.com",
        password:
          "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
        rol: "admin",
        departamento: ["administracion", "taller"],
        acceso: "completo",
        estado: true,
      },
    ];

    const createdUsers = [];
    for (const userData of testUsers) {
      const existingUser = await User.findOne({ correo: userData.correo });
      if (!existingUser) {
        const user = new User(userData);
        await user.save();
        createdUsers.push(user);
      } else {
        createdUsers.push(existingUser);
      }
    }
    console.log(`✅ ${createdUsers.length} usuarios verificados/creados`);

    // 3. Crear clientes de prueba (verificar si ya existen)
    console.log("👨‍👩‍👧‍👦 Verificando/creando clientes...");
    const testCustomers = [
      {
        nombre: "Carlos Rodríguez",
        tipo: "persona",
        telefono: "+584121234567",
        correo: "carlos.rodriguez@email.com",
        direccion: "Av. Principal, Centro, Caracas",
        estado: "activo",
      },
      {
        nombre: "Empresa ABC",
        tipo: "empresa",
        telefono: "+582127654321",
        correo: "contacto@empresaabc.com",
        rif: "J-87654321-0",
        razonSocial: "Empresa ABC C.A.",
        direccion: "Zona Industrial, Valencia",
        estado: "activo",
      },
      {
        nombre: "Ana López",
        tipo: "persona",
        telefono: "+584149876543",
        correo: "ana.lopez@email.com",
        direccion: "Urb. El Bosque, Maracaibo",
        estado: "activo",
      },
    ];

    const createdCustomers = [];
    for (const customerData of testCustomers) {
      const existingCustomer = await Customer.findOne({
        correo: customerData.correo,
      });
      if (!existingCustomer) {
        const customer = new Customer(customerData);
        await customer.save();
        createdCustomers.push(customer);
      } else {
        createdCustomers.push(existingCustomer);
      }
    }
    console.log(`✅ ${createdCustomers.length} clientes verificados/creados`);

    // 4. Crear marcas de vehículos (verificar si ya existen)
    console.log("🏷️ Verificando/creando marcas de vehículos...");
    const vehicleBrands = [
      {
        nombre: "TOYOTA",
        descripcion: "Marca japonesa líder en calidad y confiabilidad",
        paisOrigen: "Japón",
        estado: "activo",
      },
      {
        nombre: "CHEVROLET",
        descripcion: "Marca estadounidense con amplia gama de vehículos",
        paisOrigen: "Estados Unidos",
        estado: "activo",
      },
      {
        nombre: "FORD",
        descripcion: "Marca estadounidense conocida por su robustez",
        paisOrigen: "Estados Unidos",
        estado: "activo",
      },
      {
        nombre: "NISSAN",
        descripcion: "Marca japonesa con tecnología innovadora",
        paisOrigen: "Japón",
        estado: "activo",
      },
    ];

    const createdVehicleBrands = [];
    for (const brandData of vehicleBrands) {
      const existingBrand = await VehicleBrand.findOne({
        nombre: brandData.nombre,
      });
      if (!existingBrand) {
        const brand = new VehicleBrand(brandData);
        await brand.save();
        createdVehicleBrands.push(brand);
      } else {
        createdVehicleBrands.push(existingBrand);
      }
    }
    console.log(
      `✅ ${createdVehicleBrands.length} marcas de vehículos verificadas/creadas`
    );

    // 5. Crear modelos de vehículos (verificar si ya existen)
    console.log("🚗 Verificando/creando modelos de vehículos...");
    const vehicleModels = [
      {
        brand: createdVehicleBrands[0]._id, // Toyota
        nombre: "Corolla",
        descripcion: "Sedán confiable y económico",
        tipo: "sedan",
        motor: "gasolina",
        yearInicio: 2015,
        yearFin: 2023,
        estado: "activo",
      },
      {
        brand: createdVehicleBrands[1]._id, // Chevrolet
        nombre: "Spark",
        descripcion: "Compacto ideal para ciudad",
        tipo: "hatchback",
        motor: "gasolina",
        yearInicio: 2016,
        yearFin: 2022,
        estado: "activo",
      },
      {
        brand: createdVehicleBrands[2]._id, // Ford
        nombre: "Ranger",
        descripcion: "Camioneta robusta para trabajo",
        tipo: "pickup",
        motor: "diesel",
        yearInicio: 2019,
        yearFin: 2024,
        estado: "activo",
      },
      {
        brand: createdVehicleBrands[3]._id, // Nissan
        nombre: "Sentra",
        descripcion: "Sedán cómodo y espacioso",
        tipo: "sedan",
        motor: "gasolina",
        yearInicio: 2018,
        yearFin: 2023,
        estado: "activo",
      },
    ];

    const createdVehicleModels = [];
    for (const modelData of vehicleModels) {
      const existingModel = await VehicleModel.findOne({
        brand: modelData.brand,
        nombre: modelData.nombre,
      });
      if (!existingModel) {
        const model = new VehicleModel(modelData);
        await model.save();
        createdVehicleModels.push(model);
      } else {
        createdVehicleModels.push(existingModel);
      }
    }
    console.log(
      `✅ ${createdVehicleModels.length} modelos de vehículos verificados/creados`
    );

    // 6. Crear vehículos (verificar si ya existen)
    console.log("� Verificando/creando vehículos...");
    const vehicles = [
      {
        customer: createdCustomers[0]._id,
        model: createdVehicleModels[0]._id,
        year: 2020,
        placa: "ABC-123",
        vin: "1HGCM82633A123456",
        color: "Blanco",
        kilometraje: 45000,
        estado: "activo",
        descripcion: "Vehículo en buen estado",
      },
      {
        customer: createdCustomers[1]._id,
        model: createdVehicleModels[1]._id,
        year: 2019,
        placa: "DEF-456",
        vin: "2HGCM82633A654321",
        color: "Rojo",
        kilometraje: 32000,
        estado: "activo",
        descripcion: "Vehículo compacto",
      },
      {
        customer: createdCustomers[2]._id,
        model: createdVehicleModels[2]._id,
        year: 2021,
        placa: "GHI-789",
        vin: "3HGCM82633A789012",
        color: "Azul",
        kilometraje: 28000,
        estado: "activo",
        descripcion: "Camioneta de trabajo",
      },
      {
        customer: createdCustomers[0]._id,
        model: createdVehicleModels[3]._id,
        year: 2018,
        placa: "JKL-012",
        vin: "4HGCM82633A345678",
        color: "Negro",
        kilometraje: 55000,
        estado: "activo",
        descripcion: "Sedán familiar",
      },
    ];

    const createdVehicles = [];
    for (const vehicleData of vehicles) {
      const existingVehicle = await Vehicle.findOne({
        $or: [{ placa: vehicleData.placa }, { vin: vehicleData.vin }],
      });
      if (!existingVehicle) {
        const vehicle = new Vehicle(vehicleData);
        await vehicle.save();
        createdVehicles.push(vehicle);
      } else {
        createdVehicles.push(existingVehicle);
      }
    }
    console.log(`✅ ${createdVehicles.length} vehículos verificados/creados`);

    // 6. Verificar/crear estados de órdenes de trabajo
    console.log("📋 Verificando estados de órdenes de trabajo...");
    let statusCount = await WorkOrderStatus.countDocuments();
    if (statusCount === 0) {
      console.log("⚠️  No hay estados de OT. Ejecutando seeder de estados...");
      // Aquí podrías llamar al seeder existente o crear los estados básicos
      const basicStatuses = [
        {
          codigo: "RECIBIDO",
          nombre: "Recibido",
          descripcion: "La orden ha sido recibida y registrada",
          color: "#3B82F6",
          icono: "inbox",
          orden: 1,
          tipo: "inicial",
          transicionesPermitidas: ["DIAGNOSTICO"],
          activo: true,
        },
        {
          codigo: "LISTO_ENTREGA",
          nombre: "Listo para Entrega",
          descripcion: "El vehículo está listo para ser entregado",
          color: "#10B981",
          icono: "check",
          orden: 7,
          tipo: "intermedio",
          transicionesPermitidas: ["CERRADA_FACTURADA"],
          activo: true,
        },
        {
          codigo: "CERRADA_FACTURADA",
          nombre: "Cerrada y Facturada",
          descripcion: "La orden ha sido completada y facturada",
          color: "#059669",
          icono: "file-text",
          orden: 8,
          tipo: "final",
          transicionesPermitidas: [],
          activo: true,
        },
      ];
      await WorkOrderStatus.insertMany(basicStatuses);
      console.log(`✅ ${basicStatuses.length} estados básicos creados`);
    } else {
      console.log(`✅ Ya existen ${statusCount} estados de OT`);
    }

    // 7. Crear categorías de servicios (verificar si ya existen)
    console.log("📂 Verificando/creando categorías de servicios...");
    const serviceCategories = [
      {
        nombre: "Mantenimiento Preventivo",
        descripcion: "Servicios de mantenimiento rutinario",
        codigo: "MANTENIMIENTO",
        activo: true,
      },
      {
        nombre: "Reparaciones Mecánicas",
        descripcion: "Reparaciones del motor y sistemas mecánicos",
        codigo: "MECANICA",
        activo: true,
      },
      {
        nombre: "Reparaciones Eléctricas",
        descripcion: "Reparaciones del sistema eléctrico y electrónico",
        codigo: "ELECTRICA",
        activo: true,
      },
      {
        nombre: "Carrocería y Pintura",
        descripcion: "Reparaciones de carrocería y trabajos de pintura",
        codigo: "CARROCERIA",
        activo: true,
      },
    ];

    const createdServiceCategories = [];
    for (const categoryData of serviceCategories) {
      const existingCategory = await ServiceCategory.findOne({
        nombre: categoryData.nombre,
      });
      if (!existingCategory) {
        const category = new ServiceCategory(categoryData);
        await category.save();
        createdServiceCategories.push(category);
      } else {
        createdServiceCategories.push(existingCategory);
      }
    }
    console.log(
      `✅ ${createdServiceCategories.length} categorías de servicios verificadas/creadas`
    );

    // 8. Crear subcategorías de servicios (verificar si ya existen)
    console.log("📂 Verificando/creando subcategorías de servicios...");
    const serviceSubcategories = [
      {
        categoria: createdServiceCategories[0]._id, // Mantenimiento Preventivo
        nombre: "Cambio de Aceite",
        descripcion: "Servicios de cambio de aceite y filtros",
        codigo: "ACEITE",
        activo: true,
      },
      {
        categoria: createdServiceCategories[0]._id, // Mantenimiento Preventivo
        nombre: "Alineación y Balanceo",
        descripcion: "Servicios de alineación de ruedas y balanceo",
        codigo: "ALINEACION",
        activo: true,
      },
      {
        categoria: createdServiceCategories[1]._id, // Reparaciones Mecánicas
        nombre: "Motor",
        descripcion: "Reparaciones del sistema de motor",
        codigo: "MOTOR",
        activo: true,
      },
      {
        categoria: createdServiceCategories[2]._id, // Reparaciones Eléctricas
        nombre: "Batería y Sistema Eléctrico",
        descripcion: "Reparaciones del sistema eléctrico y batería",
        codigo: "BATERIA",
        activo: true,
      },
      {
        categoria: createdServiceCategories[3]._id, // Carrocería y Pintura
        nombre: "Reparación de Parabrisas",
        descripcion: "Reparación y reemplazo de parabrisas",
        codigo: "PARABRISAS",
        activo: true,
      },
    ];

    const createdServiceSubcategories = [];
    for (const subcategoryData of serviceSubcategories) {
      const existingSubcategory = await ServiceSubcategory.findOne({
        categoria: subcategoryData.categoria,
        nombre: subcategoryData.nombre,
      });
      if (!existingSubcategory) {
        const subcategory = new ServiceSubcategory(subcategoryData);
        await subcategory.save();
        createdServiceSubcategories.push(subcategory);
      } else {
        createdServiceSubcategories.push(existingSubcategory);
      }
    }
    console.log(
      `✅ ${createdServiceSubcategories.length} subcategorías de servicios verificadas/creadas`
    );

    // 9. Crear servicios (verificar si ya existen)
    console.log("🔧 Verificando/creando servicios...");
    const services = [
      {
        nombre: "Cambio de Aceite y Filtros",
        descripcion:
          "Cambio completo de aceite, filtro de aceite y filtro de aire",
        codigo: "MANT-001",
        categoria: createdServiceCategories[0]._id,
        subcategoria: createdServiceSubcategories[0]._id, // Cambio de Aceite
        precioBase: 150000,
        tiempoEstimadoMinutos: 45,
        activo: true,
      },
      {
        nombre: "Alineación y Balanceo",
        descripcion:
          "Alineación de ruedas delanteras y balanceo de las 4 ruedas",
        codigo: "MANT-002",
        categoria: createdServiceCategories[0]._id,
        subcategoria: createdServiceSubcategories[1]._id, // Alineación y Balanceo
        precioBase: 200000,
        tiempoEstimadoMinutos: 60,
        activo: true,
      },
      {
        nombre: "Reparación de Motor",
        descripcion: "Diagnóstico y reparación de problemas del motor",
        codigo: "MECH-001",
        categoria: createdServiceCategories[1]._id,
        subcategoria: createdServiceSubcategories[2]._id, // Motor
        precioBase: 500000,
        tiempoEstimadoMinutos: 240,
        activo: true,
      },
      {
        nombre: "Cambio de Batería",
        descripcion: "Reemplazo de batería descargada o defectuosa",
        codigo: "ELEC-001",
        categoria: createdServiceCategories[2]._id,
        subcategoria: createdServiceSubcategories[3]._id, // Batería y Sistema Eléctrico
        precioBase: 180000,
        tiempoEstimadoMinutos: 30,
        activo: true,
      },
      {
        nombre: "Reparación de Parabrisas",
        descripcion: "Reparación o reemplazo de parabrisas dañado",
        codigo: "CARR-001",
        categoria: createdServiceCategories[3]._id,
        subcategoria: createdServiceSubcategories[4]._id, // Reparación de Parabrisas
        precioBase: 350000,
        tiempoEstimadoMinutos: 90,
        activo: true,
      },
    ];

    const createdServices = [];
    for (const serviceData of services) {
      const existingService = await Service.findOne({
        codigo: serviceData.codigo,
      });
      if (!existingService) {
        const service = new Service(serviceData);
        await service.save();
        createdServices.push(service);
      } else {
        createdServices.push(existingService);
      }
    }
    console.log(`✅ ${createdServices.length} servicios verificados/creados`);

    // 10. Crear órdenes de trabajo de prueba (verificar si ya existen)
    console.log("📋 Verificando/creando órdenes de trabajo de prueba...");

    // Obtener estado "LISTO_ENTREGA"
    const listoEntregaStatus = await WorkOrderStatus.findOne({
      codigo: "LISTO_ENTREGA",
    });

    const workOrders = [
      {
        numeroOrden: "OT-DEMO-001",
        customer: createdCustomers[0]._id, // Carlos Rodríguez
        vehicle: createdVehicles[0]._id, // Toyota Corolla
        estado: listoEntregaStatus._id,
        prioridad: "normal",
        motivo: "Mantenimiento preventivo programado",
        kilometraje: 45000,
        tecnicoAsignado: createdUsers[0]._id, // Juan Pérez
        descripcionProblema:
          "El cliente solicita mantenimiento preventivo completo",
        sintomas: ["Indicador de mantenimiento encendido", "Ruido en el motor"],
      },
      {
        numeroOrden: "OT-DEMO-002",
        customer: createdCustomers[2]._id, // Ana López
        vehicle: createdVehicles[2]._id, // Nissan Sentra
        estado: listoEntregaStatus._id,
        prioridad: "alta",
        motivo: "Reparación de batería y parabrisas",
        kilometraje: 65000,
        tecnicoAsignado: createdUsers[0]._id,
        descripcionProblema: "Batería descargada y parabrisas agrietado",
        sintomas: ["No enciende", "Grieta en parabrisas"],
      },
    ];

    const createdWorkOrders = [];
    for (const workOrderData of workOrders) {
      const existingWorkOrder = await WorkOrder.findOne({
        numeroOrden: workOrderData.numeroOrden,
      });
      if (!existingWorkOrder) {
        const workOrder = new WorkOrder(workOrderData);
        await workOrder.save();
        createdWorkOrders.push(workOrder);
      } else {
        createdWorkOrders.push(existingWorkOrder);
      }
    }
    console.log(
      `✅ ${createdWorkOrders.length} órdenes de trabajo verificadas/creadas`
    );

    // 11. Crear items para las órdenes de trabajo (verificar si ya existen)
    console.log("📦 Verificando/creando items de órdenes de trabajo...");

    const workOrderItems = [
      // Items para OT-DEMO-001
      {
        workOrder: createdWorkOrders[0]._id,
        tipo: "servicio",
        servicio: createdServices[0]._id, // Cambio de Aceite
        nombre: "Cambio de Aceite y Filtros",
        descripcion: "Cambio completo de aceite y filtros",
        cantidad: 1,
        precioUnitario: 150000,
        precioTotal: 150000,
        estado: "completado",
        tiempoEstimado: 45,
        tiempoReal: 40,
        notas: "Aceite sintético 5W30, filtros originales",
      },
      {
        workOrder: createdWorkOrders[0]._id,
        tipo: "servicio",
        servicio: createdServices[1]._id, // Alineación y Balanceo
        nombre: "Alineación y Balanceo",
        descripcion: "Alineación delantera y balanceo de 4 ruedas",
        cantidad: 1,
        precioUnitario: 200000,
        precioTotal: 200000,
        estado: "completado",
        tiempoEstimado: 60,
        tiempoReal: 55,
        notas: "Alineación perfecta, balanceo con pesos nuevos",
      },
      // Items para OT-DEMO-002
      {
        workOrder: createdWorkOrders[1]._id,
        tipo: "servicio",
        servicio: createdServices[3]._id, // Cambio de Batería
        nombre: "Cambio de Batería",
        descripcion: "Reemplazo de batería defectuosa",
        cantidad: 1,
        precioUnitario: 180000,
        precioTotal: 180000,
        estado: "completado",
        tiempoEstimado: 30,
        tiempoReal: 25,
        notas: "Batería nueva Varta 12V 100Ah",
      },
      {
        workOrder: createdWorkOrders[1]._id,
        tipo: "servicio",
        servicio: createdServices[4]._id, // Reparación de Parabrisas
        nombre: "Reparación de Parabrisas",
        descripcion: "Reparación de grieta en parabrisas",
        cantidad: 1,
        precioUnitario: 350000,
        precioTotal: 350000,
        estado: "completado",
        tiempoEstimado: 90,
        tiempoReal: 85,
        notas: "Reparación exitosa, parabrisas como nuevo",
      },
    ];

    const createdWorkOrderItems = [];
    for (const itemData of workOrderItems) {
      // Verificar si ya existe un item con la misma workOrder y servicio
      const existingItem = await WorkOrderItem.findOne({
        workOrder: itemData.workOrder,
        servicio: itemData.servicio,
      });
      if (!existingItem) {
        const item = new WorkOrderItem(itemData);
        await item.save();
        createdWorkOrderItems.push(item);
      } else {
        createdWorkOrderItems.push(existingItem);
      }
    }
    console.log(
      `✅ ${createdWorkOrderItems.length} items de órdenes de trabajo verificados/creados`
    );

    // 12. Probar facturación automática
    console.log("💰 Probando facturación automática...");

    for (const workOrder of createdWorkOrders) {
      console.log(`\n📄 Procesando orden: ${workOrder.numeroOrden}`);

      // Cambiar estado a CERRADA_FACTURADA para generar factura
      const result = await workOrder.cambiarEstado(
        "CERRADA_FACTURADA",
        createdUsers[1]._id,
        "Factura generada automáticamente por seeder"
      );

      if (result.success) {
        console.log(`✅ Estado cambiado exitosamente`);
        console.log(`📊 Factura generada para orden ${workOrder.numeroOrden}`);
      } else {
        console.log(`❌ Error cambiando estado: ${result.message}`);
      }
    }

    // 12. Resumen final
    console.log("\n" + "=".repeat(60));
    console.log("🎉 SEED COMPLETADO EXITOSAMENTE");
    console.log("=".repeat(60));

    console.log("\n📊 RESUMEN DE DATOS CREADOS:");
    console.log(`👥 Usuarios: ${createdUsers.length}`);
    console.log(`👨‍👩‍👧‍👦 Clientes: ${createdCustomers.length}`);
    console.log(`🚗 Modelos de vehículos: ${createdVehicleModels.length}`);
    console.log(`🚙 Vehículos: ${createdVehicles.length}`);
    console.log(
      `📂 Categorías de servicios: ${createdServiceCategories.length}`
    );
    console.log(`🔧 Servicios: ${createdServices.length}`);
    console.log(`📋 Órdenes de trabajo: ${createdWorkOrders.length}`);
    console.log(`📦 Items de órdenes: ${createdWorkOrderItems.length}`);

    console.log("\n🚀 PRUEBAS DISPONIBLES:");
    console.log("1. GET /api/work-orders - Listar órdenes");
    console.log("2. GET /api/work-orders/:id - Ver orden específica");
    console.log(
      "3. PUT /api/work-orders/:id/status - Cambiar estado (genera facturas)"
    );
    console.log("4. GET /api/invoices - Ver facturas generadas");
    console.log("5. GET /api/customers - Ver clientes");
    console.log("6. GET /api/vehicles - Ver vehículos");

    console.log("\n💡 ÓRDENES PARA PROBAR FACTURACIÓN:");
    createdWorkOrders.forEach((wo, index) => {
      console.log(
        `${index + 1}. ${wo.numeroOrden} - Ya facturada automáticamente`
      );
    });

    console.log("\n✨ ¡Sistema listo para pruebas!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en seed:", error);
    process.exit(1);
  }
};

seedCompleteSystem();
