/**
 * Vehicle Seeder Script
 * Script para poblar la base de datos con marcas y modelos de vehículos
 *
 * Uso:
 * - Para poblar datos iniciales: node database/seeds/vehicle-seeder.js
 * - Para limpiar datos: node database/seeds/vehicle-seeder.js --clean
 */

require("dotenv").config();
const {
  VehicleBrand,
  VehicleModel,
} = require("../../features/crm/vehicles/models");
const vehicleSeedData = require("./vehicle-seed-data");

const seedVehicles = async () => {
  try {
    console.log("🌱 Iniciando seeding de vehículos...");

    let brandsCreated = 0;
    let modelsCreated = 0;

    // Procesar cada marca
    for (const brandData of vehicleSeedData.brands) {
      console.log(`\n📋 Procesando marca: ${brandData.nombre}`);

      // Buscar marca existente o crear nueva
      let brand = await VehicleBrand.findOne({ nombre: brandData.nombre });
      let brandCreated = false;

      if (!brand) {
        brand = new VehicleBrand({
          nombre: brandData.nombre,
          descripcion: brandData.descripcion,
          paisOrigen: brandData.paisOrigen,
          logo: brandData.logo,
          estado: "activo",
        });
        await brand.save();
        brandCreated = true;
        brandsCreated++;
        console.log(`  ✅ Marca creada: ${brand.nombre}`);
      } else {
        console.log(`  ℹ️  Marca ya existe: ${brand.nombre}`);
      }

      // Procesar modelos de la marca
      for (const modelData of brandData.modelos) {
        let model = await VehicleModel.findOne({
          brand: brand._id,
          nombre: modelData.nombre,
        });
        let modelCreated = false;

        if (!model) {
          model = new VehicleModel({
            brand: brand._id,
            nombre: modelData.nombre,
            descripcion: modelData.descripcion,
            tipo: modelData.tipo,
            motor: modelData.motor,
            yearInicio: modelData.yearInicio,
            yearFin: modelData.yearFin,
            estado: "activo",
          });
          await model.save();
          modelCreated = true;
          modelsCreated++;
          console.log(`    ✅ Modelo creado: ${model.nombre}`);
        } else {
          console.log(`    ℹ️  Modelo ya existe: ${model.nombre}`);
        }
      }
    }

    console.log("\n🎉 Seeding completado exitosamente!");
    console.log(`📊 Resumen:`);
    console.log(`   - Marcas procesadas: ${vehicleSeedData.brands.length}`);
    console.log(`   - Marcas creadas: ${brandsCreated}`);
    console.log(`   - Modelos creados: ${modelsCreated}`);

    const totalModels = vehicleSeedData.brands.reduce(
      (sum, brand) => sum + brand.modelos.length,
      0
    );
    console.log(`   - Total modelos en seed: ${totalModels}`);
  } catch (error) {
    console.error("❌ Error durante el seeding:", error);
    process.exit(1);
  }
};

const cleanVehicles = async () => {
  try {
    console.log("🧹 Limpiando datos de vehículos...");

    const modelsDeleted = await VehicleModel.deleteMany({});
    const brandsDeleted = await VehicleBrand.deleteMany({});

    console.log("✅ Limpieza completada:");
    console.log(`   - Modelos eliminados: ${modelsDeleted.deletedCount}`);
    console.log(`   - Marcas eliminadas: ${brandsDeleted.deletedCount}`);
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
    process.exit(1);
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
      await cleanVehicles();
    } else {
      await seedVehicles();
    }

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
  seedVehicles,
  cleanVehicles,
};
