require("dotenv").config();
const { dbConnection } = require("../config");
const { Stock, Item } = require("../../features/inventory/models");

(async () => {
  try {
    await dbConnection();
    console.log("🔗 Conectado a MongoDB\n");

    const bateria = await Item.findOne({ nombre: /batería.*100/i });

    if (!bateria) {
      console.log("❌ No se encontró la batería 12V 100Ah");
      process.exit(0);
    }

    console.log(`✅ Batería encontrada: ${bateria.nombre}`);

    const stock = await Stock.findOne({ item: bateria._id });

    if (!stock) {
      console.log("❌ No hay stock registrado");
      process.exit(0);
    }

    const stockAnterior = stock.cantidad;
    stock.cantidad = 15;
    stock.reservado = 0;
    await stock.save();

    console.log(
      `✅ Stock actualizado: ${stockAnterior} → ${stock.cantidad} unidades`
    );
    console.log(`✅ Reservado: 0 unidades`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
})();
