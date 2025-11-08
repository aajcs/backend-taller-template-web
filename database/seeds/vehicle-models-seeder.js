/**
 * Seeder de Modelos de Vehículos
 * Crea marcas y modelos de vehículos para el sistema
 */

require("dotenv").config();
const { dbConnection } = require("../config");
const VehicleModel = require("../../features/crm/vehicles/models/vehicleModel.model");
const VehicleBrand = require("../../features/crm/vehicles/models/vehicleBrand.model");

const seedVehicleModels = async () => {
  try {
    await dbConnection();
    console.log("🔗 Conectado a MongoDB\n");

    console.log("=".repeat(60));
    console.log("🌱 SEEDER: MARCAS Y MODELOS DE VEHÍCULOS");
    console.log("=".repeat(60));

    // ============================================
    // 1. CREAR MARCAS DE VEHÍCULOS
    // ============================================
    console.log("\n🏷️  PASO 1: Crear Marcas de Vehículos");
    console.log("-".repeat(60));

    const marcasData = [
      { nombre: "Toyota", pais: "Japón" },
      { nombre: "Chevrolet", pais: "Estados Unidos" },
      { nombre: "Ford", pais: "Estados Unidos" },
      { nombre: "Hyundai", pais: "Corea del Sur" },
      { nombre: "Nissan", pais: "Japón" },
      { nombre: "Volkswagen", pais: "Alemania" },
      { nombre: "Renault", pais: "Francia" },
      { nombre: "Kia", pais: "Corea del Sur" },
      { nombre: "Honda", pais: "Japón" },
      { nombre: "Mazda", pais: "Japón" },
    ];

    const marcasCreadas = [];
    for (const marcaData of marcasData) {
      let marca = await VehicleBrand.findOne({ nombre: marcaData.nombre });

      if (!marca) {
        marca = await VehicleBrand.create(marcaData);
        console.log(`✅ ${marca.nombre} (${marca.pais})`);
      } else {
        console.log(`ℹ️  ${marcaData.nombre} ya existe`);
      }
      marcasCreadas.push(marca);
    }

    // ============================================
    // 2. CREAR MODELOS DE VEHÍCULOS
    // ============================================
    console.log("\n🚗 PASO 2: Crear Modelos de Vehículos");
    console.log("-".repeat(60));

    const modelosData = [
      // Toyota
      {
        nombre: "Corolla",
        brand: marcasCreadas[0]._id,
        tipo: "sedan",
        motor: "gasolina",
      },
      {
        nombre: "Yaris",
        brand: marcasCreadas[0]._id,
        tipo: "sedan",
        motor: "gasolina",
      },
      {
        nombre: "Hilux",
        brand: marcasCreadas[0]._id,
        tipo: "pickup",
        motor: "diesel",
      },
      {
        nombre: "RAV4",
        brand: marcasCreadas[0]._id,
        tipo: "suv",
        motor: "gasolina",
      },

      // Chevrolet
      {
        nombre: "Spark GT",
        brand: marcasCreadas[1]._id,
        tipo: "hatchback",
        motor: "gasolina",
      },
      {
        nombre: "Aveo",
        brand: marcasCreadas[1]._id,
        tipo: "sedan",
        motor: "gasolina",
      },
      {
        nombre: "Cruze",
        brand: marcasCreadas[1]._id,
        tipo: "sedan",
        motor: "gasolina",
      },
      {
        nombre: "Silverado",
        brand: marcasCreadas[1]._id,
        tipo: "pickup",
        motor: "diesel",
      },

      // Ford
      {
        nombre: "Fiesta",
        brand: marcasCreadas[2]._id,
        tipo: "hatchback",
        motor: "gasolina",
      },
      {
        nombre: "Focus",
        brand: marcasCreadas[2]._id,
        tipo: "sedan",
        motor: "gasolina",
      },
      {
        nombre: "Explorer",
        brand: marcasCreadas[2]._id,
        tipo: "suv",
        motor: "gasolina",
      },
      {
        nombre: "F-150",
        brand: marcasCreadas[2]._id,
        tipo: "pickup",
        motor: "gasolina",
      },

      // Hyundai
      {
        nombre: "Accent",
        brand: marcasCreadas[3]._id,
        tipo: "sedan",
        motor: "gasolina",
      },
      {
        nombre: "Elantra",
        brand: marcasCreadas[3]._id,
        tipo: "sedan",
        motor: "gasolina",
      },
      {
        nombre: "Tucson",
        brand: marcasCreadas[3]._id,
        tipo: "suv",
        motor: "gasolina",
      },

      // Nissan
      {
        nombre: "Versa",
        brand: marcasCreadas[4]._id,
        tipo: "sedan",
        motor: "gasolina",
      },
      {
        nombre: "Sentra",
        brand: marcasCreadas[4]._id,
        tipo: "sedan",
        motor: "gasolina",
      },
      {
        nombre: "X-Trail",
        brand: marcasCreadas[4]._id,
        tipo: "suv",
        motor: "gasolina",
      },

      // Volkswagen
      {
        nombre: "Gol",
        brand: marcasCreadas[5]._id,
        tipo: "hatchback",
        motor: "gasolina",
      },
      {
        nombre: "Polo",
        brand: marcasCreadas[5]._id,
        tipo: "hatchback",
        motor: "gasolina",
      },
      {
        nombre: "Jetta",
        brand: marcasCreadas[5]._id,
        tipo: "sedan",
        motor: "gasolina",
      },

      // Renault
      {
        nombre: "Logan",
        brand: marcasCreadas[6]._id,
        tipo: "sedan",
        motor: "gasolina",
      },
      {
        nombre: "Sandero",
        brand: marcasCreadas[6]._id,
        tipo: "hatchback",
        motor: "gasolina",
      },
      {
        nombre: "Duster",
        brand: marcasCreadas[6]._id,
        tipo: "suv",
        motor: "gasolina",
      },

      // Kia
      {
        nombre: "Rio",
        brand: marcasCreadas[7]._id,
        tipo: "sedan",
        motor: "gasolina",
      },
      {
        nombre: "Sportage",
        brand: marcasCreadas[7]._id,
        tipo: "suv",
        motor: "gasolina",
      },

      // Honda
      {
        nombre: "Civic",
        brand: marcasCreadas[8]._id,
        tipo: "sedan",
        motor: "gasolina",
      },
      {
        nombre: "CR-V",
        brand: marcasCreadas[8]._id,
        tipo: "suv",
        motor: "gasolina",
      },

      // Mazda
      {
        nombre: "Mazda3",
        brand: marcasCreadas[9]._id,
        tipo: "sedan",
        motor: "gasolina",
      },
      {
        nombre: "CX-5",
        brand: marcasCreadas[9]._id,
        tipo: "suv",
        motor: "gasolina",
      },
    ];

    const modelosCreados = [];
    for (const modeloData of modelosData) {
      let modelo = await VehicleModel.findOne({
        nombre: modeloData.nombre,
        brand: modeloData.brand,
      });

      if (!modelo) {
        modelo = await VehicleModel.create(modeloData);
        const marca = marcasCreadas.find(
          (m) => m._id.toString() === modeloData.brand.toString()
        );
        console.log(`✅ ${marca.nombre} ${modelo.nombre} (${modelo.tipo})`);
      } else {
        console.log(`ℹ️  ${modeloData.nombre} ya existe`);
      }
      modelosCreados.push(modelo);
    }

    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMEN DEL SEEDER");
    console.log("=".repeat(60));

    const totalMarcas = await VehicleBrand.countDocuments();
    const totalModelos = await VehicleModel.countDocuments();

    console.log(`
    ✅ Marcas de Vehículos: ${totalMarcas}
    ✅ Modelos de Vehículos: ${totalModelos}
    `);

    console.log("=".repeat(60));
    console.log("🎉 SEEDER COMPLETADO EXITOSAMENTE");
    console.log("=".repeat(60));

    return { marcas: marcasCreadas, modelos: modelosCreados };
  } catch (error) {
    console.error("\n❌ Error en el seeder:", error);
    throw error;
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  seedVehicleModels()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = seedVehicleModels;
