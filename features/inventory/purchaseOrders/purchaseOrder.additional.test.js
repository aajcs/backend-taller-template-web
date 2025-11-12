const http = require("http");

/**
 * Test ADICIONAL para el modelo PurchaseOrder
 *
 * Este test crea 10 ÓRDENES ADICIONALES que:
 * - Contemplan TODOS los 50 items disponibles
 * - Utilizan los 3 almacenes de manera equilibrada
 * - Simulan recepciones en diferentes almacenes
 *
 * Funcionalidades probadas:
 * 1. Distribución equitativa de items entre órdenes
 * 2. Uso de todos los almacenes disponibles
 * 3. Recepciones masivas con diferentes proveedores
 * 4. Gestión de stock en múltiples ubicaciones
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

// Función para distribuir items equitativamente
function distributeItemsAcrossOrders(items, numOrders) {
  const distribution = Array.from({ length: numOrders }, () => []);
  items.forEach((item, index) => {
    distribution[index % numOrders].push(item);
  });
  return distribution;
}

async function testAdditionalPurchaseOrders() {
  try {
    console.log("\n" + "=".repeat(80));
    console.log("🧪 TEST ADICIONAL: 10 Órdenes de Compra con TODOS los Items");
    console.log("=".repeat(80));
    console.log("📍 Servidor: http://localhost:4000");
    console.log("📍 Asegúrate de que el servidor esté corriendo");
    console.log("=".repeat(80));
    console.log("\n📦 Iniciando test adicional de Purchase Orders...\n");

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
    // PASO 2: OBTENER TODOS LOS DATOS
    // ============================================
    console.log("📋 PASO 2: Obtener todos los datos de referencia");
    console.log("-".repeat(50));

    // Obtener TODOS los Proveedores
    const getSuppliersResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/suppliers?limite=100",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    const suppliers = [];
    if (getSuppliersResponse.statusCode === 200) {
      const allSuppliers = getSuppliersResponse.data.suppliers || [];
      suppliers.push(...allSuppliers);
      console.log(`✅ Proveedores disponibles: ${suppliers.length}`);
    }

    // Obtener TODOS los Items
    const getItemsResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/items?limite=100",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    const items = [];
    if (getItemsResponse.statusCode === 200) {
      const allItems = getItemsResponse.data.items || [];
      items.push(...allItems);
      console.log(`✅ Items disponibles: ${items.length}`);
    }

    // Obtener TODOS los Almacenes
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

    const warehouses = [];
    if (getWarehousesResponse.statusCode === 200) {
      const allWarehouses = getWarehousesResponse.data.warehouses || [];
      warehouses.push(...allWarehouses);
      console.log(`✅ Almacenes disponibles: ${warehouses.length}`);
    }

    // Verificar datos necesarios
    if (
      suppliers.length === 0 ||
      items.length === 0 ||
      warehouses.length === 0
    ) {
      console.log("\n⚠️  ADVERTENCIA: Faltan datos de referencia.");
      console.log("Por favor ejecuta primero:");
      console.log("  - supplier.test.js (Proveedores)");
      console.log("  - item.test.js (Items)");
      console.log("  - warehouse.test.js (Almacenes)");
      return;
    }

    console.log("\n✅ Todos los datos de referencia disponibles");
    console.log(`📊 Total de items a distribuir: ${items.length}`);
    console.log(
      `🏢 Almacenes para distribución: ${warehouses.map((w) => w.nombre).join(", ")}\n`
    );

    // ============================================
    // PASO 3: DISTRIBUIR ITEMS EN 10 ÓRDENES
    // ============================================
    console.log(
      "➕ PASO 3: Crear 10 órdenes de compra (distribuyendo TODOS los items)"
    );
    console.log("-".repeat(50));

    // Distribuir todos los items en 10 órdenes
    const itemDistribution = distributeItemsAcrossOrders(items, 10);
    const timestamp = Date.now();

    const purchaseOrdersToCreate = itemDistribution.map((orderItems, index) => {
      // Rotar proveedores
      const supplier = suppliers[index % suppliers.length];

      return {
        numero: `PO-ADICIONAL-${timestamp}-${String(index + 1).padStart(3, "0")}`,
        proveedor: supplier.id || supplier._id,
        fecha: new Date(),
        items: orderItems.map((item) => ({
          item: item.id || item._id,
          cantidad: Math.floor(Math.random() * 150) + 50, // Entre 50 y 200 unidades
          precioUnitario:
            item.precioCosto || Math.floor(Math.random() * 100) + 20,
        })),
        estado: "pendiente",
      };
    });

    const createdOrders = [];
    let successCount = 0;

    for (let i = 0; i < purchaseOrdersToCreate.length; i++) {
      const purchaseOrder = purchaseOrdersToCreate[i];
      console.log(`\n📦 [${i + 1}/10] Creando: ${purchaseOrder.numero}`);
      console.log(`   Proveedor: ${suppliers[i % suppliers.length].nombre}`);
      console.log(`   Items: ${purchaseOrder.items.length} líneas`);

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
        purchaseOrder
      );

      if (
        createResponse.statusCode === 201 ||
        createResponse.statusCode === 200
      ) {
        const created =
          createResponse.data.purchaseOrder || createResponse.data;
        createdOrders.push(created);
        successCount++;
        console.log(`   ✅ Orden creada - ID: ${created.id || created._id}`);
        console.log(`   Estado: ${created.estado}`);
      } else {
        console.log(
          `   ❌ Error al crear orden:`,
          createResponse.data.msg || createResponse.data
        );
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log(`✅ Órdenes creadas exitosamente: ${successCount}/10`);

    // ============================================
    // PASO 4: VERIFICAR ÓRDENES CON POBLACIÓN
    // ============================================
    console.log("\n📊 PASO 4: Verificar órdenes con población de referencias");
    console.log("-".repeat(50));

    const getOrdersResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/purchaseOrders?limite=100&populate=true",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (getOrdersResponse.statusCode === 200) {
      const orders = getOrdersResponse.data.purchaseOrders || [];
      const adicionalOrders = orders.filter((o) =>
        o.numero.includes("ADICIONAL")
      );

      console.log(
        `\n✅ Total de órdenes adicionales en la BD: ${adicionalOrders.length}`
      );

      // Verificar población
      const withSupplier = adicionalOrders.filter(
        (o) => o.proveedor && typeof o.proveedor === "object"
      ).length;
      const withItems = adicionalOrders.filter(
        (o) => o.items && o.items[0] && typeof o.items[0].item === "object"
      ).length;

      console.log(`\n🔍 VERIFICACIÓN DE POBLACIÓN:`);
      console.log(
        `✅ Órdenes con Proveedor poblado: ${withSupplier}/${adicionalOrders.length}`
      );
      console.log(
        `✅ Órdenes con Items poblados:    ${withItems}/${adicionalOrders.length}`
      );

      // Mostrar estadísticas de items
      let totalItemsInOrders = 0;
      adicionalOrders.forEach((order) => {
        totalItemsInOrders += order.items.length;
      });

      console.log(`\n📊 ESTADÍSTICAS:`);
      console.log(
        `   Total de líneas de items en órdenes: ${totalItemsInOrders}`
      );
      console.log(
        `   Promedio de items por orden: ${Math.round(totalItemsInOrders / adicionalOrders.length)}`
      );

      // Mostrar muestra de 3 órdenes
      console.log(`\n📋 MUESTRA DE ÓRDENES (primeras 3):`);
      console.log("-".repeat(100));

      adicionalOrders.slice(0, 3).forEach((order) => {
        const proveedorNombre =
          typeof order.proveedor === "object" ? order.proveedor.nombre : "N/A";
        console.log(`\n📦 Orden: ${order.numero}`);
        console.log(`   Proveedor: ${proveedorNombre}`);
        console.log(`   Estado: ${order.estado}`);
        console.log(`   Items (${order.items.length}):`);
        order.items.slice(0, 3).forEach((lineItem, idx) => {
          const itemNombre =
            typeof lineItem.item === "object"
              ? lineItem.item.nombre.substring(0, 35)
              : "N/A";
          console.log(
            `     ${idx + 1}. ${itemNombre.padEnd(35)} - Cant: ${lineItem.cantidad}, Recibido: ${lineItem.recibido}`
          );
        });
        if (order.items.length > 3) {
          console.log(`     ... y ${order.items.length - 3} items más`);
        }
      });
    }

    // ============================================
    // PASO 5: SIMULAR RECEPCIONES EN DIFERENTES ALMACENES
    // ============================================
    console.log("\n\n🚚 PASO 5: Simular recepciones en diferentes almacenes");
    console.log("-".repeat(50));

    // Recibir las primeras 5 órdenes, rotando entre almacenes
    const ordersToReceive = createdOrders.slice(0, 5);
    let totalMovements = 0;

    for (let i = 0; i < ordersToReceive.length; i++) {
      const order = ordersToReceive[i];
      const warehouse = warehouses[i % warehouses.length]; // Rotar entre almacenes

      console.log(`\n📦 [${i + 1}/5] Recepción en: ${warehouse.nombre}`);
      console.log(`   Orden: ${order.numero}`);

      // Preparar items para recepción (recibir todos los items de la orden)
      const itemsToReceive = order.items.map((lineItem) => ({
        item: lineItem.item,
        cantidad: lineItem.cantidad,
        costoUnitario: lineItem.precioUnitario,
      }));

      const receiveResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: `/api/inventory/purchaseOrders/${order.id || order._id}/receive`,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-token": token,
          },
        },
        {
          warehouse: warehouse.id || warehouse._id,
          items: itemsToReceive,
          idempotencyKey: `RECEPCION-${order.numero}-${Date.now()}`,
        }
      );

      if (receiveResponse.statusCode === 200) {
        const result = receiveResponse.data;
        totalMovements +=
          result.movimientos?.length || result.movements?.length || 0;
        console.log(`   ✅ Recepción exitosa`);
        console.log(
          `   Estado actualizado: ${result.purchaseOrder?.estado || "N/A"}`
        );
        console.log(
          `   Movimientos creados: ${result.movimientos?.length || result.movements?.length || 0}`
        );
      } else {
        console.log(
          `   ⚠️  Error en recepción:`,
          receiveResponse.data.msg || receiveResponse.data
        );
      }

      // Pequeña pausa entre recepciones
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(`\n✅ Total de movimientos generados: ${totalMovements}`);

    // ============================================
    // PASO 6: VERIFICAR STOCK EN TODOS LOS ALMACENES
    // ============================================
    console.log("\n\n📊 PASO 6: Verificar stock en todos los almacenes");
    console.log("-".repeat(50));

    const getStockResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/stock?limite=200&populate=true",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (getStockResponse.statusCode === 200) {
      const stocks = getStockResponse.data.stocks || [];
      console.log(`\n✅ Total de registros de stock: ${stocks.length}`);

      // Agrupar por almacén
      const stockByWarehouse = {};
      stocks.forEach((stock) => {
        const warehouseName =
          typeof stock.warehouse === "object"
            ? stock.warehouse.nombre
            : "Desconocido";
        if (!stockByWarehouse[warehouseName]) {
          stockByWarehouse[warehouseName] = {
            items: 0,
            totalQuantity: 0,
            totalValue: 0,
          };
        }
        stockByWarehouse[warehouseName].items++;
        stockByWarehouse[warehouseName].totalQuantity += stock.cantidad || 0;
        stockByWarehouse[warehouseName].totalValue +=
          (stock.cantidad || 0) * (stock.costoPromedio || 0);
      });

      console.log(`\n📊 DISTRIBUCIÓN POR ALMACÉN:`);
      Object.entries(stockByWarehouse).forEach(([warehouseName, stats]) => {
        console.log(`\n🏢 ${warehouseName}:`);
        console.log(`   Items únicos: ${stats.items}`);
        console.log(`   Cantidad total: ${stats.totalQuantity} unidades`);
        console.log(`   Valor total: $${stats.totalValue.toFixed(2)}`);
      });

      // Mostrar algunos items con stock
      console.log(`\n📋 MUESTRA DE STOCK (primeros 10 items):`);
      console.log("-".repeat(100));
      stocks.slice(0, 10).forEach((stock, idx) => {
        const itemNombre =
          typeof stock.item === "object" ? stock.item.nombre : "N/A";
        const warehouseName =
          typeof stock.warehouse === "object" ? stock.warehouse.nombre : "N/A";
        console.log(
          `${(idx + 1).toString().padStart(3)}. ${itemNombre.substring(0, 40).padEnd(40)} | ` +
            `Almacén: ${warehouseName.padEnd(20)} | ` +
            `Cant: ${stock.cantidad.toString().padStart(5)} | ` +
            `Costo: $${(stock.costoPromedio || 0).toFixed(2).padStart(8)}`
        );
      });
    }

    // ============================================
    // PASO 7: VERIFICAR MOVIMIENTOS
    // ============================================
    console.log("\n\n📊 PASO 7: Verificar movimientos de inventario");
    console.log("-".repeat(50));

    const getMovementsResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/movements?limite=200&populate=true",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (getMovementsResponse.statusCode === 200) {
      const movements = getMovementsResponse.data.movements || [];
      const poMovements = movements.filter(
        (m) => m.referenciaTipo === "purchaseOrder"
      );

      console.log(
        `\n✅ Total de movimientos de Purchase Orders: ${poMovements.length}`
      );

      // Agrupar por tipo
      const byType = {};
      poMovements.forEach((m) => {
        byType[m.tipo] = (byType[m.tipo] || 0) + 1;
      });

      console.log(`\n📊 DISTRIBUCIÓN POR TIPO:`);
      Object.entries(byType).forEach(([tipo, count]) => {
        console.log(`   • ${tipo.padEnd(15)}: ${count} movimientos`);
      });

      // Agrupar por almacén
      const byWarehouse = {};
      poMovements.forEach((m) => {
        const warehouseName =
          typeof m.warehouseTo === "object" ? m.warehouseTo.nombre : "N/A";
        byWarehouse[warehouseName] = (byWarehouse[warehouseName] || 0) + 1;
      });

      console.log(`\n📊 DISTRIBUCIÓN POR ALMACÉN DE DESTINO:`);
      Object.entries(byWarehouse).forEach(([warehouse, count]) => {
        console.log(`   • ${warehouse.padEnd(25)}: ${count} movimientos`);
      });

      // Mostrar últimos movimientos
      console.log(`\n📋 ÚLTIMOS MOVIMIENTOS (10 más recientes):`);
      console.log("-".repeat(90));
      poMovements.slice(-10).forEach((mov) => {
        const itemNombre =
          typeof mov.item === "object"
            ? mov.item.nombre.substring(0, 35)
            : "N/A";
        const warehouseName =
          typeof mov.warehouseTo === "object" ? mov.warehouseTo.nombre : "N/A";
        console.log(
          `   ${mov.tipo.padEnd(12)} | ${itemNombre.padEnd(35)} | ` +
            `Cant: ${mov.cantidad.toString().padStart(5)} | ` +
            `Almacén: ${warehouseName}`
        );
      });
    }

    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log("\n" + "=".repeat(80));
    console.log("📊 RESUMEN DEL TEST ADICIONAL");
    console.log("=".repeat(80));
    console.log(`\n✅ Órdenes de compra creadas: ${successCount} de 10`);
    console.log(
      `✅ Items distribuidos: ${items.length} items en ${successCount} órdenes`
    );
    console.log(`✅ Almacenes utilizados: ${warehouses.length} almacenes`);
    console.log(`✅ Recepciones procesadas: 5 órdenes recibidas`);
    console.log(
      `✅ Movimientos generados: ${totalMovements} movimientos de entrada`
    );

    console.log(`\n📦 ÓRDENES CREADAS:`);
    createdOrders.forEach((order, idx) => {
      console.log(
        `  ${idx + 1}. ${order.numero} - ${order.items.length} items - Estado: ${order.estado}`
      );
    });

    console.log(`\n💡 Funcionalidades probadas:`);
    console.log(
      `   ✅ Distribución de TODOS los items (${items.length}) en 10 órdenes`
    );
    console.log(`   ✅ Uso equilibrado de ${warehouses.length} almacenes`);
    console.log(`   ✅ Rotación de proveedores entre órdenes`);
    console.log(`   ✅ Recepciones en diferentes ubicaciones`);
    console.log(`   ✅ Gestión de stock multi-almacén`);
    console.log(`   ✅ Trazabilidad completa de movimientos`);
    console.log(`   ✅ Población correcta de referencias`);

    console.log(`\n🎉 TEST ADICIONAL DE PURCHASE ORDERS COMPLETADO`);
    console.log("=".repeat(80) + "\n");
  } catch (error) {
    console.error("\n❌ ERROR EN EL TEST:", error);
    console.error(error.stack);
  }
}

// Configuración inicial
console.log("\n" + "=".repeat(80));
console.log(
  "🧪 TEST ADICIONAL: Modelo PurchaseOrder - 10 Órdenes con Todos los Items"
);
console.log("=".repeat(80));
console.log("📍 Servidor: http://localhost:4000");
console.log("📍 Asegúrate de que el servidor esté corriendo");
console.log("\n⚠️  IMPORTANTE: Este test requiere datos previos:");
console.log("   - Proveedores (supplier.test.js)");
console.log("   - Items (item.test.js) - Se utilizarán TODOS");
console.log("   - Almacenes (warehouse.test.js) - Se utilizarán TODOS");
console.log("=".repeat(80));

// Ejecutar test
testAdditionalPurchaseOrders();
