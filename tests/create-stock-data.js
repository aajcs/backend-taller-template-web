const http = require("http");

// Helper function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        try {
          const response = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: response });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function createStockData() {
  try {
    console.log("🔐 Iniciando sesión...");

    // Login to get token
    const loginResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/auth/login",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      },
      {
        correo: "castilloitsystems@gmail.com",
        password: "1234abcd",
      }
    );

    if (loginResponse.statusCode !== 200) {
      console.error("❌ Error en login:", loginResponse.data);
      return;
    }

    const token = loginResponse.data.token;
    console.log("✅ Login exitoso\n");

    // Get or create warehouse
    console.log("📦 Verificando almacenes...");
    const warehousesResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/warehouses",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    let warehouseId = null;

    if (warehousesResponse.statusCode === 200) {
      const warehouses = warehousesResponse.data.warehouses;
      console.log(`📦 Almacenes encontrados: ${warehouses.length}`);

      if (warehouses.length > 0) {
        warehouseId = warehouses[0]._id || warehouses[0].id;
        console.log(
          `✅ Usando almacén existente: ${warehouses[0].nombre} (${warehouseId})\n`
        );
      } else {
        console.log("⚠️  No hay almacenes. Creando almacén principal...");
        const createWarehouseResponse = await makeRequest(
          {
            hostname: "localhost",
            port: 4000,
            path: "/api/inventory/warehouses",
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-token": token,
            },
          },
          {
            nombre: "Almacén Principal",
            codigo: "ALM-MAIN",
            tipo: "almacen",
            ubicacion: "Calle Principal 123, Ciudad, Estado",
            capacidad: 1000,
            estado: "activo",
          }
        );

        if (createWarehouseResponse.statusCode === 201) {
          warehouseId = createWarehouseResponse.data.warehouse._id;
          console.log(
            `✅ Almacén creado: ${createWarehouseResponse.data.warehouse.nombre} (${warehouseId})\n`
          );
        } else {
          console.error(
            "❌ Error creando almacén:",
            JSON.stringify(createWarehouseResponse.data, null, 2)
          );
          console.error("Status code:", createWarehouseResponse.statusCode);
          return;
        }
      }
    }

    // Get inventory items
    console.log("🔍 Obteniendo items de inventario...");
    const itemsResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/items",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (itemsResponse.statusCode !== 200) {
      console.error("❌ Error obteniendo items:", itemsResponse.data);
      return;
    }

    const items = itemsResponse.data.items;
    console.log(`✅ Items encontrados: ${items.length}\n`);

    if (items.length === 0) {
      console.log(
        "⚠️  No hay items de inventario. Por favor crea items primero."
      );
      return;
    }

    // Get existing stock
    console.log("📊 Verificando stock existente...");
    const stockResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/stock",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    const existingStock = stockResponse.data?.stocks || [];
    console.log(`📊 Registros de stock existentes: ${existingStock.length}\n`);

    // Create stock map
    const stockMap = new Map();
    existingStock.forEach((stock) => {
      const key = `${stock.item}-${stock.warehouse}`;
      stockMap.set(key, stock);
    });

    // Add stock for items that don't have it
    console.log("➕ Agregando stock a items...\n");
    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of items) {
      const key = `${item._id}-${warehouseId}`;
      const existingStockForItem = stockMap.get(key);

      if (existingStockForItem) {
        // Check if stock is low
        if (existingStockForItem.cantidad < 5) {
          console.log(
            `🔄 Actualizando stock para: ${item.nombre} (actual: ${existingStockForItem.cantidad})`
          );

          const updateResponse = await makeRequest(
            {
              hostname: "localhost",
              port: 4000,
              path: `/api/inventory/stock/${existingStockForItem._id}`,
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                "x-token": token,
              },
            },
            {
              cantidad: 50,
              reservado: existingStockForItem.reservado || 0,
            }
          );

          if (updateResponse.statusCode === 200) {
            console.log(`  ✅ Stock actualizado a 50 unidades\n`);
            updated++;
          } else {
            console.log(
              `  ❌ Error actualizando: ${updateResponse.data?.msg || "Error desconocido"}\n`
            );
          }
        } else {
          console.log(
            `⏭️  ${item.nombre} - Ya tiene stock suficiente (${existingStockForItem.cantidad})`
          );
          skipped++;
        }
      } else {
        // Create new stock
        console.log(`➕ Creando stock para: ${item.nombre}`);

        const createResponse = await makeRequest(
          {
            hostname: "localhost",
            port: 4000,
            path: "/api/inventory/stock",
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-token": token,
            },
          },
          {
            item: item._id,
            warehouse: warehouseId,
            cantidad: 50,
            reservado: 0,
          }
        );

        if (createResponse.statusCode === 201) {
          console.log(`  ✅ Stock creado: 50 unidades\n`);
          created++;
        } else {
          console.log(
            `  ❌ Error creando: ${createResponse.data?.msg || "Error desconocido"}\n`
          );
        }
      }
    }

    console.log("\n📊 RESUMEN:");
    console.log(`  ➕ Creados: ${created}`);
    console.log(`  🔄 Actualizados: ${updated}`);
    console.log(`  ⏭️  Omitidos: ${skipped}`);
    console.log(`  📦 Total procesados: ${items.length}`);

    // Verify final stock
    console.log("\n🔍 Verificando stock final...");
    const finalStockResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/stock",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (finalStockResponse.statusCode === 200) {
      const finalStocks = finalStockResponse.data.stocks;
      console.log(`\n✅ Stock disponible: ${finalStocks.length} items`);

      const itemsWithStock = finalStocks.filter((s) => s.cantidad > 0);
      console.log(
        `✅ Items con stock disponible: ${itemsWithStock.length} items`
      );

      if (itemsWithStock.length > 0) {
        console.log("\n📦 Primeros 5 items con stock:");
        itemsWithStock.slice(0, 5).forEach((stock, index) => {
          console.log(
            `  ${index + 1}. ${stock.item?.nombre || "N/A"} - Disponible: ${stock.cantidad}, Reservado: ${stock.reservado}`
          );
        });
      }
    }

    console.log("\n✅ Proceso completado exitosamente!");
  } catch (error) {
    console.error("❌ Error en el script:", error.message);
    console.error(error);
  }
}

createStockData();
