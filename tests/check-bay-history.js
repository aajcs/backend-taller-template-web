const mongoose = require("mongoose");
const { dbConnection } = require("../database/config");

async function checkBay() {
  try {
    await dbConnection();

    const ServiceBay = require("../features/workshop/service-bay/models/serviceBay.model");
    const BayOccupancyHistory = require("../models/historial");

    const bayId = "691019bf1f6e353e604f8122";

    console.log("\n=== Verificando Bahía ===");
    const bay = await ServiceBay.findById(bayId);
    if (!bay) {
      console.log("❌ Bahía NO encontrada");
    } else {
      console.log("✅ Bahía encontrada:", bay.nombre);
      console.log("   Status:", bay.status);
      console.log("   Eliminado:", bay.eliminado);
    }

    console.log("\n=== Buscando Historial ===");
    const history = await BayOccupancyHistory.find({ bay: bayId })
      .select("entryTime exitTime workOrder vehicle")
      .sort({ entryTime: -1 })
      .limit(5);

    console.log("Registros encontrados:", history.length);

    if (history.length > 0) {
      console.log("\nÚltimos registros:");
      history.forEach((h, i) => {
        console.log(`${i + 1}. Entry: ${h.entryTime}, Exit: ${h.exitTime}`);
      });
    } else {
      console.log("❌ No hay historial para esta bahía");
    }

    console.log("\n=== Total de registros en historial ===");
    const total = await BayOccupancyHistory.countDocuments();
    console.log("Total registros en BD:", total);

    const allBays = await BayOccupancyHistory.distinct("bay");
    console.log("Bahías con historial:", allBays.length);
    console.log(
      "IDs:",
      allBays.map((id) => id.toString())
    );

    process.exit(0);
  } catch (error) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

checkBay();
