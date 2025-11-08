/**
 * Vehicle Data Verifier
 * Script para verificar que los datos de vehículos se insertaron correctamente
 *
 * Uso: node database/seeds/vehicle-verifier.js
 */

require("dotenv").config();
const {
  VehicleBrand,
  VehicleModel,
} = require("../../features/crm/vehicles/models");

const verifyVehicleData = async () => {
  try {
    console.log("🔍 Verificando datos de vehículos en la base de datos...\n");

    // Contar marcas
    const brandCount = await VehicleBrand.countDocuments();
    console.log(`📊 Total de marcas: ${brandCount}`);

    // Contar modelos
    const modelCount = await VehicleModel.countDocuments();
    console.log(`📊 Total de modelos: ${modelCount}`);

    // Mostrar algunas marcas con sus modelos
    console.log("\n🏷️  Muestra de marcas y modelos:");

    const brands = await VehicleBrand.find().limit(5);
    for (const brand of brands) {
      console.log(`\n  🚗 ${brand.nombre} (${brand.paisOrigen})`);

      const models = await VehicleModel.find({ brand: brand._id }).limit(3);
      models.forEach((model) => {
        console.log(
          `    • ${model.nombre} (${model.yearInicio}-${model.yearFin || "Actual"})`
        );
      });

      if (models.length === 3) {
        const totalModels = await VehicleModel.countDocuments({
          brand: brand._id,
        });
        console.log(`    ... y ${totalModels - 3} modelos más`);
      }
    }

    // Verificar integridad de referencias
    console.log("\n🔗 Verificando integridad de referencias...");

    const modelsWithoutBrand = await VehicleModel.countDocuments({
      brand: { $exists: false },
    });
    console.log(`   - Modelos sin marca: ${modelsWithoutBrand}`);

    const orphanModels = await VehicleModel.countDocuments({
      brand: null,
    });
    console.log(`   - Modelos huérfanos: ${orphanModels}`);

    if (modelsWithoutBrand === 0 && orphanModels === 0) {
      console.log("   ✅ Todas las referencias están correctas");
    } else {
      console.log("   ⚠️  Se encontraron problemas de integridad");
    }

    // Estadísticas por tipo de vehículo
    console.log("\n📈 Estadísticas por tipo de vehículo:");
    const types = await VehicleModel.aggregate([
      { $group: { _id: "$tipo", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    types.forEach((type) => {
      console.log(`   - ${type._id}: ${type.count} modelos`);
    });

    console.log("\n✅ Verificación completada exitosamente!");
  } catch (error) {
    console.error("❌ Error durante la verificación:", error);
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

    await verifyVehicleData();

    console.log("🏁 Verificación finalizada");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error en el proceso de verificación:", error);
    process.exit(1);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = {
  verifyVehicleData,
};
