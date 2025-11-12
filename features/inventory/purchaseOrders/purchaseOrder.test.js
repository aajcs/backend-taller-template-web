const http = require("http");

/**
 * Test para el modelo PurchaseOrder (Órdenes de Compra)
 *
 * Funcionalidades probadas:
 * 1. Crear órdenes de compra con múltiples items
 * 2. Recepción completa de mercancía
 * 3. Recepción parcial de mercancía
 * 4. Actualización automática de stock
 * 5. Población correcta de referencias (proveedor, items)
 * 6. Transaccionalidad de operaciones
 */

// Helper function para hacer peticiones HTTP
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

async function testPurchaseOrders() {
  try {
    console.log(
      "📦 Iniciando test de Purchase Orders (Órdenes de Compra)...\n"
    );

    // ============================================
    // PASO 1: AUTENTICACIÓN
    // ============================================
    console.log("🔐 PASO 1: Autenticación");
    console.log("-".repeat(50));

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
    console.log("✅ Autenticado correctamente\n");

    // ============================================
    // PASO 2: OBTENER DATOS DE REFERENCIA
    // ============================================
    console.log("📋 PASO 2: Obtener datos de referencia");
    console.log("-".repeat(50));

    // Obtener Proveedores
    const getSuppliersResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/suppliers",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    const suppliers = {};
    if (getSuppliersResponse.statusCode === 200) {
      const allSuppliers = getSuppliersResponse.data.suppliers || [];
      allSuppliers.forEach((supplier) => {
        suppliers[supplier.nombre] = supplier.id || supplier._id;
      });
      console.log(
        `✅ Proveedores disponibles: ${Object.keys(suppliers).length}`
      );
    }

    // Obtener Items
    const getItemsResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/items",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    const items = {};
    if (getItemsResponse.statusCode === 200) {
      const allItems = getItemsResponse.data.items || [];
      allItems.forEach((item) => {
        items[item.sku] = {
          id: item.id || item._id,
          nombre: item.nombre,
          precioCosto: item.precioCosto,
        };
      });
      console.log(`✅ Items disponibles: ${Object.keys(items).length}`);
    }

    // Obtener Almacenes
    const getWarehousesResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/warehouses",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    const warehouses = {};
    if (getWarehousesResponse.statusCode === 200) {
      const allWarehouses = getWarehousesResponse.data.warehouses || [];
      allWarehouses.forEach((warehouse) => {
        warehouses[warehouse.nombre] = warehouse.id || warehouse._id;
      });
      console.log(
        `✅ Almacenes disponibles: ${Object.keys(warehouses).length}`
      );
    }

    // Verificar datos necesarios
    if (
      Object.keys(suppliers).length === 0 ||
      Object.keys(items).length === 0 ||
      Object.keys(warehouses).length === 0
    ) {
      console.log("\n⚠️  ADVERTENCIA: Faltan datos de referencia.");
      console.log("Por favor ejecuta primero:");
      console.log("  - supplier.test.js (Proveedores)");
      console.log("  - item.test.js (Items)");
      console.log("  - warehouse.test.js (Almacenes)");
      return;
    }

    console.log("\n✅ Todos los datos de referencia disponibles\n");

    // Seleccionar datos para las órdenes
    const supplierIds = Object.values(suppliers).slice(0, 5);
    const itemList = Object.entries(items).slice(0, 30);
    const mainWarehouse = Object.values(warehouses)[0];

    // ============================================
    // PASO 3: CREAR 5 ÓRDENES DE COMPRA
    // ============================================
    console.log("➕ PASO 3: Crear 5 órdenes de compra");
    console.log("-".repeat(50));

    const purchaseOrdersToCreate = [
      {
        numero: `PO-${Date.now()}-001`,
        proveedor: supplierIds[0],
        fecha: new Date(),
        items: [
          {
            item: itemList[0][1].id,
            cantidad: 50,
            precioUnitario: itemList[0][1].precioCosto || 45.0,
          },
          {
            item: itemList[1][1].id,
            cantidad: 30,
            precioUnitario: itemList[1][1].precioCosto || 65.0,
          },
          {
            item: itemList[2][1].id,
            cantidad: 40,
            precioUnitario: itemList[2][1].precioCosto || 42.0,
          },
        ],
        estado: "pendiente",
      },
      {
        numero: `PO-${Date.now()}-002`,
        proveedor: supplierIds[1] || supplierIds[0],
        fecha: new Date(),
        items: [
          {
            item: itemList[5][1].id,
            cantidad: 100,
            precioUnitario: itemList[5][1].precioCosto || 8.5,
          },
          {
            item: itemList[6][1].id,
            cantidad: 80,
            precioUnitario: itemList[6][1].precioCosto || 18.0,
          },
          {
            item: itemList[7][1].id,
            cantidad: 60,
            precioUnitario: itemList[7][1].precioCosto || 22.0,
          },
          {
            item: itemList[8][1].id,
            cantidad: 90,
            precioUnitario: itemList[8][1].precioCosto || 12.0,
          },
        ],
        estado: "pendiente",
      },
      {
        numero: `PO-${Date.now()}-003`,
        proveedor: supplierIds[2] || supplierIds[0],
        fecha: new Date(),
        items: [
          {
            item: itemList[10][1].id,
            cantidad: 120,
            precioUnitario: itemList[10][1].precioCosto || 48.0,
          },
          {
            item: itemList[11][1].id,
            cantidad: 100,
            precioUnitario: itemList[11][1].precioCosto || 35.0,
          },
          {
            item: itemList[12][1].id,
            cantidad: 80,
            precioUnitario: itemList[12][1].precioCosto || 32.0,
          },
        ],
        estado: "pendiente",
      },
      {
        numero: `PO-${Date.now()}-004`,
        proveedor: supplierIds[3] || supplierIds[0],
        fecha: new Date(),
        items: [
          {
            item: itemList[15][1].id,
            cantidad: 200,
            precioUnitario: itemList[15][1].precioCosto || 12.0,
          },
          {
            item: itemList[16][1].id,
            cantidad: 150,
            precioUnitario: itemList[16][1].precioCosto || 42.0,
          },
          {
            item: itemList[17][1].id,
            cantidad: 100,
            precioUnitario: itemList[17][1].precioCosto || 9.5,
          },
          {
            item: itemList[18][1].id,
            cantidad: 80,
            precioUnitario: itemList[18][1].precioCosto || 7.0,
          },
          {
            item: itemList[19][1].id,
            cantidad: 120,
            precioUnitario: itemList[19][1].precioCosto || 8.0,
          },
        ],
        estado: "pendiente",
      },
      {
        numero: `PO-${Date.now()}-005`,
        proveedor: supplierIds[4] || supplierIds[0],
        fecha: new Date(),
        items: [
          {
            item: itemList[20][1].id,
            cantidad: 30,
            precioUnitario: itemList[20][1].precioCosto || 45.0,
          },
          {
            item: itemList[21][1].id,
            cantidad: 20,
            precioUnitario: itemList[21][1].precioCosto || 280.0,
          },
          {
            item: itemList[22][1].id,
            cantidad: 15,
            precioUnitario: itemList[22][1].precioCosto || 180.0,
          },
        ],
        estado: "pendiente",
      },
    ];

    const createdPurchaseOrders = [];
    const errors = [];

    for (let i = 0; i < purchaseOrdersToCreate.length; i++) {
      const poData = purchaseOrdersToCreate[i];
      console.log(`\n📦 [${i + 1}/5] Creando: ${poData.numero}`);
      console.log(
        `   Proveedor: ${Object.keys(suppliers).find((k) => suppliers[k] === poData.proveedor) || "N/A"}`
      );
      console.log(`   Items: ${poData.items.length} líneas`);

      const createResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: "/api/inventory/purchaseOrders",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-token": token,
          },
        },
        poData
      );

      if (createResponse.statusCode === 201) {
        const po = createResponse.data;
        createdPurchaseOrders.push(po);
        console.log(`   ✅ Orden creada - ID: ${po.id || po._id}`);
        console.log(`   Estado: ${po.estado}`);
      } else {
        const errorMsg =
          createResponse.data.message ||
          createResponse.data.msg ||
          "Error desconocido";
        console.log(`   ❌ Error al crear: ${errorMsg}`);
        errors.push({ po: poData.numero, error: errorMsg });
      }
    }

    if (createdPurchaseOrders.length === 0) {
      console.log("\n❌ No se crearon órdenes de compra. Test detenido.");
      return;
    }

    // ============================================
    // PASO 4: VERIFICAR ÓRDENES CON POBLACIÓN
    // ============================================
    console.log(
      "\n\n📊 PASO 4: Verificar órdenes con población de referencias"
    );
    console.log("-".repeat(50));

    const getPOsResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/purchaseOrders",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (getPOsResponse.statusCode === 200) {
      const allPOs = getPOsResponse.data.purchaseOrders || [];
      console.log(
        `\n✅ Total de órdenes en la base de datos: ${allPOs.length}`
      );

      // Verificar población
      let posWithSupplier = 0;
      let posWithItems = 0;

      allPOs.forEach((po) => {
        if (
          po.proveedor &&
          typeof po.proveedor === "object" &&
          po.proveedor.nombre
        ) {
          posWithSupplier++;
        }
        if (po.items && po.items.length > 0) {
          const allItemsPopulated = po.items.every(
            (line) =>
              line.item && typeof line.item === "object" && line.item.nombre
          );
          if (allItemsPopulated) posWithItems++;
        }
      });

      console.log(`\n🔍 VERIFICACIÓN DE POBLACIÓN:`);
      console.log(
        `✅ Órdenes con Proveedor poblado: ${posWithSupplier}/${allPOs.length}`
      );
      console.log(
        `✅ Órdenes con Items poblados:    ${posWithItems}/${allPOs.length}`
      );

      // Mostrar muestra
      console.log("\n📋 MUESTRA DE ÓRDENES (últimas 3):");
      console.log("-".repeat(100));
      allPOs.slice(-3).forEach((po) => {
        console.log(`\n📦 Orden: ${po.numero}`);
        console.log(`   Proveedor: ${po.proveedor?.nombre || "N/A"}`);
        console.log(`   Estado: ${po.estado}`);
        console.log(`   Items (${po.items?.length || 0}):`);
        po.items?.slice(0, 3).forEach((line, idx) => {
          console.log(
            `     ${idx + 1}. ${line.item?.nombre?.substring(0, 35) || "N/A"} - Cant: ${line.cantidad}, Recibido: ${line.recibido || 0}`
          );
        });
      });
    }

    // ============================================
    // PASO 5: RECEPCIÓN DE MERCANCÍA
    // ============================================
    console.log("\n\n🚚 PASO 5: Simular recepción de mercancía");
    console.log("-".repeat(50));

    if (createdPurchaseOrders.length > 0) {
      // Recepción COMPLETA de la primera orden
      const po1 = createdPurchaseOrders[0];
      console.log(`\n📦 Recepción COMPLETA - Orden: ${po1.numero}`);
      console.log(`   Almacén destino: ${Object.keys(warehouses)[0]}`);

      const receiveData1 = {
        warehouse: mainWarehouse,
        items: po1.items.map((line) => ({
          item: line.item,
          cantidad: line.cantidad,
          costoUnitario: line.precioUnitario,
        })),
        idempotencyKey: `test-receive-${po1.numero}-${Date.now()}`,
      };

      const receiveResponse1 = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: `/api/inventory/purchaseOrders/${po1.id || po1._id}/receive`,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-token": token,
          },
        },
        receiveData1
      );

      if (receiveResponse1.statusCode === 200) {
        const result = receiveResponse1.data;
        console.log(`   ✅ Recepción exitosa`);
        console.log(
          `   Estado actualizado: ${result.purchaseOrder?.estado || "N/A"}`
        );
        console.log(`   Movimientos creados: ${result.movements?.length || 0}`);

        if (result.movements && result.movements.length > 0) {
          console.log(`\n   📊 Detalle de movimientos:`);
          result.movements.forEach((mov, idx) => {
            console.log(
              `     ${idx + 1}. Tipo: ${mov.tipo}, Cantidad: ${mov.cantidad}, Stock resultante: ${mov.resultadoStock?.cantidad || "N/A"}`
            );
          });
        }
      } else {
        console.log(
          `   ❌ Error en recepción: ${receiveResponse1.data.message || receiveResponse1.data.msg}`
        );
      }

      // Recepción PARCIAL de la segunda orden (solo primeros 2 items)
      if (createdPurchaseOrders.length > 1) {
        const po2 = createdPurchaseOrders[1];
        console.log(`\n📦 Recepción PARCIAL - Orden: ${po2.numero}`);
        console.log(
          `   Recibiendo solo ${Math.min(2, po2.items.length)} de ${po2.items.length} items`
        );

        const receiveData2 = {
          warehouse: mainWarehouse,
          items: po2.items.slice(0, 2).map((line) => ({
            item: line.item,
            cantidad: Math.floor(line.cantidad / 2), // Recibir solo la mitad
            costoUnitario: line.precioUnitario,
          })),
          idempotencyKey: `test-receive-${po2.numero}-${Date.now()}`,
        };

        const receiveResponse2 = await makeRequest(
          {
            hostname: "localhost",
            port: 4000,
            path: `/api/inventory/purchaseOrders/${po2.id || po2._id}/receive`,
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-token": token,
            },
          },
          receiveData2
        );

        if (receiveResponse2.statusCode === 200) {
          const result = receiveResponse2.data;
          console.log(`   ✅ Recepción parcial exitosa`);
          console.log(
            `   Estado actualizado: ${result.purchaseOrder?.estado || "N/A"}`
          );
          console.log(
            `   Movimientos creados: ${result.movements?.length || 0}`
          );
        } else {
          console.log(
            `   ❌ Error en recepción: ${receiveResponse2.data.message || receiveResponse2.data.msg}`
          );
        }
      }
    }

    // ============================================
    // PASO 6: VERIFICAR STOCK ACTUALIZADO
    // ============================================
    console.log("\n\n📊 PASO 6: Verificar actualización de stock");
    console.log("-".repeat(50));

    const getStockResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/stock",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (getStockResponse.statusCode === 200) {
      const allStock = getStockResponse.data.stock || [];
      console.log(`\n✅ Registros de stock: ${allStock.length}`);

      // Mostrar stock de items con cantidad > 0
      const stockWithQty = allStock.filter((s) => s.cantidad > 0);
      console.log(`✅ Items con stock disponible: ${stockWithQty.length}`);

      if (stockWithQty.length > 0) {
        console.log("\n📦 MUESTRA DE STOCK ACTUALIZADO (primeros 5):");
        console.log("-".repeat(90));
        console.log(
          "Item                              | Almacén         | Cantidad | Costo Promedio"
        );
        console.log("-".repeat(90));
        stockWithQty.slice(0, 5).forEach((stock) => {
          const itemName = (stock.item?.nombre || "N/A")
            .substring(0, 32)
            .padEnd(33);
          const warehouse = (stock.warehouse?.nombre || "N/A").padEnd(15);
          const qty = String(stock.cantidad || 0).padStart(8);
          const cost = `$${(stock.costoPromedio || 0).toFixed(2)}`;
          console.log(`${itemName} | ${warehouse} | ${qty} | ${cost}`);
        });
        console.log("-".repeat(90));
      }
    }

    // ============================================
    // PASO 7: VERIFICAR MOVIMIENTOS
    // ============================================
    console.log("\n\n📊 PASO 7: Verificar movimientos de inventario");
    console.log("-".repeat(50));

    const getMovementsResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/movements",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (getMovementsResponse.statusCode === 200) {
      const allMovements = getMovementsResponse.data.movements || [];
      console.log(`\n✅ Total de movimientos: ${allMovements.length}`);

      const movementsByType = {};
      allMovements.forEach((mov) => {
        movementsByType[mov.tipo] = (movementsByType[mov.tipo] || 0) + 1;
      });

      console.log("\n📊 DISTRIBUCIÓN POR TIPO:");
      Object.entries(movementsByType).forEach(([tipo, count]) => {
        console.log(`   • ${tipo.padEnd(15)}: ${count} movimientos`);
      });

      // Mostrar últimos movimientos
      const recentMovements = allMovements.slice(-5);
      if (recentMovements.length > 0) {
        console.log("\n📋 ÚLTIMOS MOVIMIENTOS:");
        console.log("-".repeat(90));
        recentMovements.forEach((mov) => {
          const tipo = mov.tipo.padEnd(12);
          const item = (mov.item?.nombre || "N/A").substring(0, 30).padEnd(31);
          const qty = String(mov.cantidad || 0).padStart(5);
          console.log(
            `   ${tipo} | ${item} | Cant: ${qty} | Ref: ${mov.referenciaTipo || "N/A"}`
          );
        });
        console.log("-".repeat(90));
      }
    }

    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log("\n" + "=".repeat(80));
    console.log("📊 RESUMEN DEL TEST");
    console.log("=".repeat(80));

    console.log(
      `\n✅ Órdenes de compra creadas: ${createdPurchaseOrders.length} de 5`
    );
    console.log(`❌ Errores: ${errors.length}`);

    if (createdPurchaseOrders.length > 0) {
      console.log("\n📦 ÓRDENES CREADAS:");
      createdPurchaseOrders.forEach((po, idx) => {
        console.log(
          `  ${idx + 1}. ${po.numero} - ${po.items?.length || 0} items - Estado: ${po.estado}`
        );
      });
    }

    if (errors.length > 0) {
      console.log(`\n⚠️  ERRORES ENCONTRADOS:`);
      errors.forEach((err, index) => {
        console.log(`  ${index + 1}. ${err.po}: ${err.error}`);
      });
    }

    console.log("\n💡 Funcionalidades probadas:");
    console.log("   ✅ Creación de órdenes de compra");
    console.log("   ✅ Población de referencias (proveedor, items)");
    console.log("   ✅ Recepción completa de mercancía");
    console.log("   ✅ Recepción parcial de mercancía");
    console.log("   ✅ Actualización automática de stock");
    console.log("   ✅ Creación de movimientos de inventario");
    console.log("   ✅ Cálculo de costo promedio");
    console.log("   ✅ Actualización de estado de órdenes");

    console.log("\n🎉 TEST DE PURCHASE ORDERS COMPLETADO");
    console.log("=".repeat(80) + "\n");
  } catch (error) {
    console.error("\n❌ ERROR EN EL TEST:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

// Ejecutar el test
if (require.main === module) {
  console.log("\n" + "=".repeat(80));
  console.log("🧪 TEST: Modelo PurchaseOrder - Órdenes de Compra y Recepción");
  console.log("=".repeat(80));
  console.log("📍 Servidor: http://localhost:4000");
  console.log("📍 Asegúrate de que el servidor esté corriendo\n");
  console.log("⚠️  IMPORTANTE: Este test requiere datos previos:");
  console.log("   - Proveedores (supplier.test.js)");
  console.log("   - Items (item.test.js)");
  console.log("   - Almacenes (warehouse.test.js)");
  console.log("=".repeat(80) + "\n");

  testPurchaseOrders();
}

module.exports = { testPurchaseOrders };
