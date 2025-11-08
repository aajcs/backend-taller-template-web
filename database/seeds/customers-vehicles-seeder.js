/**
 * Seeder de Clientes y Vehículos
 * Crea clientes y vehículos de prueba para tests
 */

require("dotenv").config();
const { dbConnection } = require("../config");
const Customer = require("../../features/crm/customers/models/customer.model");
const Vehicle = require("../../features/crm/vehicles/models/vehicle.model");
const VehicleModel = require("../../features/crm/vehicles/models/vehicleModel.model");
const seedVehicleModels = require("./vehicle-models-seeder");

const seedCustomersVehicles = async () => {
  try {
    await dbConnection();
    console.log("🔗 Conectado a MongoDB\n");

    console.log("=".repeat(60));
    console.log("🌱 SEEDER: CLIENTES Y VEHÍCULOS");
    console.log("=".repeat(60));

    // ============================================
    // 0. CREAR MARCAS Y MODELOS PRIMERO
    // ============================================
    console.log("\n🚗 PASO 0: Verificar Marcas y Modelos de Vehículos");
    console.log("-".repeat(60));

    let modelos = await VehicleModel.find().limit(5);
    if (modelos.length === 0) {
      console.log("⚠️  No hay modelos de vehículos. Ejecutando seeder...");
      const { modelos: modelosCreados } = await seedVehicleModels();
      modelos = modelosCreados;
    } else {
      console.log(`✅ ${modelos.length} modelos disponibles`);
    }

    // ============================================
    // 1. CREAR CLIENTES
    // ============================================
    console.log("\n👤 PASO 1: Crear Clientes");
    console.log("-".repeat(60));

    const clientesData = [
      {
        nombre: "Juan Pérez García",
        tipo: "persona",
        telefono: "+584141234567",
        correo: "juan.perez@email.com",
        direccion: "Av. Principal, Caracas",
        cedula: "V-12345678",
      },
      {
        nombre: "María González López",
        tipo: "persona",
        telefono: "+584242345678",
        correo: "maria.gonzalez@email.com",
        direccion: "Calle 5, Valencia",
        cedula: "V-23456789",
      },
      {
        nombre: "Carlos Rodríguez",
        tipo: "persona",
        telefono: "+584143456789",
        correo: "carlos.rodriguez@email.com",
        direccion: "Urbanización Los Mangos, Maracay",
        cedula: "V-34567890",
      },
      {
        nombre: "Ana Martínez",
        tipo: "persona",
        telefono: "+584244567890",
        correo: "ana.martinez@email.com",
        direccion: "Sector Centro, Barquisimeto",
        cedula: "V-45678901",
      },
      {
        nombre: "Taller Express C.A.",
        tipo: "empresa",
        telefono: "+584145678901",
        correo: "ventas@tallerexpress.com",
        direccion: "Zona Industrial, Maracaibo",
        rif: "J-30123456-7",
        razonSocial: "Taller Express Compañía Anónima",
      },
    ];

    const clientesCreados = [];
    for (const clienteData of clientesData) {
      let cliente = await Customer.findOne({
        correo: clienteData.correo,
      });

      if (!cliente) {
        cliente = await Customer.create(clienteData);
        console.log(`✅ ${cliente.nombre}`);
      } else {
        console.log(`ℹ️  ${clienteData.nombre} ya existe`);
      }
      clientesCreados.push(cliente);
    }

    // ============================================
    // 2. CREAR VEHÍCULOS
    // ============================================
    console.log("\n🚗 PASO 2: Crear Vehículos");
    console.log("-".repeat(60));

    // Buscar modelos de vehículos para asignar
    const allModelos = await VehicleModel.find().populate("brand");
    const toyotaCorolla = allModelos.find((m) => m.nombre === "Corolla");
    const chevySpark = allModelos.find((m) => m.nombre === "Spark GT");
    const fordFiesta = allModelos.find((m) => m.nombre === "Fiesta");
    const hyundaiAccent = allModelos.find((m) => m.nombre === "Accent");
    const nissanVersa = allModelos.find((m) => m.nombre === "Versa");
    const vwGol = allModelos.find((m) => m.nombre === "Gol");
    const renaultLogan = allModelos.find((m) => m.nombre === "Logan");
    const kiaRio = allModelos.find((m) => m.nombre === "Rio");

    const vehiculosData = [
      {
        placa: "ABC123",
        vin: "1HGBH41JXMN109186",
        model: toyotaCorolla._id,
        year: 2020,
        color: "Blanco",
        customer: clientesCreados[0]._id,
        kilometraje: 45000,
      },
      {
        placa: "DEF456",
        vin: "2HGBH41JXMN109187",
        model: chevySpark._id,
        year: 2019,
        color: "Rojo",
        customer: clientesCreados[1]._id,
        kilometraje: 62000,
      },
      {
        placa: "GHI789",
        vin: "3HGBH41JXMN109188",
        model: fordFiesta._id,
        year: 2021,
        color: "Azul",
        customer: clientesCreados[2]._id,
        kilometraje: 28000,
      },
      {
        placa: "JKL012",
        vin: "4HGBH41JXMN109189",
        model: hyundaiAccent._id,
        year: 2018,
        color: "Negro",
        customer: clientesCreados[3]._id,
        kilometraje: 85000,
      },
      {
        placa: "MNO345",
        vin: "5HGBH41JXMN109190",
        model: nissanVersa._id,
        year: 2022,
        color: "Gris",
        customer: clientesCreados[0]._id,
        kilometraje: 15000,
      },
      {
        placa: "PQR678",
        vin: "6HGBH41JXMN109191",
        model: vwGol._id,
        year: 2020,
        color: "Plateado",
        customer: clientesCreados[1]._id,
        kilometraje: 52000,
      },
      {
        placa: "STU901",
        vin: "7HGBH41JXMN109192",
        model: renaultLogan._id,
        year: 2019,
        color: "Blanco",
        customer: clientesCreados[2]._id,
        kilometraje: 71000,
      },
      {
        placa: "VWX234",
        vin: "8HGBH41JXMN109193",
        model: kiaRio._id,
        year: 2021,
        color: "Rojo",
        customer: clientesCreados[3]._id,
        kilometraje: 33000,
      },
    ];

    const vehiculosCreados = [];
    for (const vehiculoData of vehiculosData) {
      let vehiculo = await Vehicle.findOne({ placa: vehiculoData.placa });

      if (!vehiculo) {
        vehiculo = await Vehicle.create(vehiculoData);
        const modelo = await VehicleModel.findById(vehiculoData.model).populate(
          "brand"
        );
        console.log(
          `✅ ${modelo.brand.nombre} ${modelo.nombre} (${vehiculo.placa})`
        );
      } else {
        console.log(`ℹ️  ${vehiculoData.placa} ya existe`);
      }
      vehiculosCreados.push(vehiculo);
    }

    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMEN DEL SEEDER");
    console.log("=".repeat(60));

    const totalClientes = await Customer.countDocuments();
    const totalVehiculos = await Vehicle.countDocuments();

    console.log(`
    ✅ Clientes: ${totalClientes}
    ✅ Vehículos: ${totalVehiculos}
    `);

    console.log("=".repeat(60));
    console.log("🎉 SEEDER COMPLETADO EXITOSAMENTE");
    console.log("=".repeat(60));

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error en el seeder:", error);
    process.exit(1);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  seedCustomersVehicles();
}

module.exports = seedCustomersVehicles;
