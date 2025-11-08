/**
 * Seeder Maestro - Ejecuta todos los seeders en orden
 * Orden: Usuarios → Inventario → Vehículos (si existe)
 */

require("dotenv").config();
const { dbConnection } = require("../config");

// Importar seeders
const seedUsers = require("./users-seeder");
const seedInventory = require("./inventory-seeder");

const runAllSeeders = async () => {
  try {
    await dbConnection();
    console.log("\n🔗 Conectado a MongoDB\n");

    console.log("╔" + "═".repeat(58) + "╗");
    console.log(
      "║" + " ".repeat(15) + "🌱 SEEDER MAESTRO" + " ".repeat(26) + "║"
    );
    console.log("╚" + "═".repeat(58) + "╝");

    console.log("\nEjecutando seeders en orden...\n");

    // ============================================
    // 1. USUARIOS (primero para referencias)
    // ============================================
    console.log("📍 [1/2] Ejecutando seeder de USUARIOS...");
    await seedUsers();

    // ============================================
    // 2. INVENTARIO
    // ============================================
    console.log("\n📍 [2/2] Ejecutando seeder de INVENTARIO...");
    await seedInventory();

    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log("\n╔" + "═".repeat(58) + "╗");
    console.log(
      "║" +
        " ".repeat(10) +
        "✅ TODOS LOS SEEDERS COMPLETADOS" +
        " ".repeat(16) +
        "║"
    );
    console.log("╚" + "═".repeat(58) + "╝");

    console.log("\n📊 Base de datos lista para ejecutar tests\n");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error ejecutando seeders:", error);
    process.exit(1);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  runAllSeeders();
}

module.exports = runAllSeeders;
