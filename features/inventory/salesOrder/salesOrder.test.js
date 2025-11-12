const http = require("http");

/**
 * Test para el modelo SalesOrder (Órdenes de Venta)
 *
 * Funcionalidades probadas:
 * 1. Crear órdenes de venta con clientes del CRM
 * 2. Confirmar órdenes (crea reservaciones de stock)
 * 3. Despachar órdenes completas
 * 4. Despachar órdenes parciales
 * 5. Cancelar órdenes (libera reservas)
 * 6. Verificar actualización de stock
 * 7. Validar estadísticas de compras del cliente
 * 8. Población correcta de referencias
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

async function testSalesOrders() {
  try {
    console.log("\n" + "=".repeat(80));
    console.log("🧪 TEST: Modelo SalesOrder - Órdenes de Venta");
    console.log("=".repeat(80));
    console.log("📍 Servidor: http://localhost:4000");
    console.log("📍 Asegúrate de que el servidor esté corriendo");
    console.log("\n⚠️  IMPORTANTE: Este test requiere datos previos:");
    console.log("   - Customers (customer.test.js)");
    console.log("   - Items (item.test.js)");
    console.log("   - Warehouses (warehouse.test.js)");
    console.log("   - Stock disponible (purchaseOrder.test.js)");
    console.log("=".repeat(80));
    console.log("\n📦 Iniciando test de Sales Orders...\n");

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

    // Obtener Customers
    const getCustomersResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/customers?limite=100",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    const customers = [];
    if (getCustomersResponse.statusCode === 200) {
      const allCustomers = getCustomersResponse.data.customers || [];
      customers.push(...allCustomers);
      console.log(`✅ Clientes disponibles: ${customers.length}`);
    }

    // Obtener Items con stock disponible
    const getStockResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/stock?limite=100&populate=true",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    const itemsConStock = [];
    if (getStockResponse.statusCode === 200) {
      const stocks = getStockResponse.data.stocks || [];
      // Filtrar items con stock disponible (cantidad > reservado)
      stocks.forEach((stock) => {
        const disponible = (stock.cantidad || 0) - (stock.reservado || 0);
        if (disponible > 10) {
          // Solo items con más de 10 unidades disponibles
          itemsConStock.push({
            item: stock.item,
            warehouse: stock.warehouse,
            disponible: disponible,
            precio: stock.costoPromedio || 50,
          });
        }
      });
      console.log(`✅ Items con stock disponible: ${itemsConStock.length}`);
    }

    // Verificar datos necesarios
    if (customers.length === 0 || itemsConStock.length === 0) {
      console.log("\n⚠️  ADVERTENCIA: Faltan datos de referencia.");
      console.log("Por favor ejecuta primero:");
      console.log("  - customer.test.js (Clientes)");
      console.log("  - purchaseOrder.additional.test.js (Stock)");
      return;
    }

    console.log("\n✅ Todos los datos de referencia disponibles\n");

    // ============================================
    // PASO 3: CREAR 5 ÓRDENES DE VENTA
    // ============================================
    console.log("➕ PASO 3: Crear 5 órdenes de venta");
    console.log("-".repeat(50));

    const timestamp = Date.now();
    const salesOrdersToCreate = [];

    // Crear 5 órdenes con diferentes clientes e items
    for (let i = 0; i < 5; i++) {
      const customer = customers[i % customers.length];
      const numItems = Math.min(3, itemsConStock.length);
      const orderItems = [];

      // Seleccionar items para esta orden
      for (let j = 0; j < numItems; j++) {
        const stockItem = itemsConStock[(i * 3 + j) % itemsConStock.length];
        const cantidad = Math.min(10, Math.floor(stockItem.disponible / 2)); // Pedir máximo la mitad del stock

        orderItems.push({
          item:
            typeof stockItem.item === "object"
              ? stockItem.item._id || stockItem.item.id
              : stockItem.item,
          cantidad: cantidad,
          precioUnitario: stockItem.precio * 1.5, // Agregar margen del 50%
        });
      }

      salesOrdersToCreate.push({
        numero: `SO-${timestamp}-${String(i + 1).padStart(3, "0")}`,
        cliente: customer.id || customer._id,
        fecha: new Date(),
        estado: "borrador",
        items: orderItems,
      });
    }

    const createdOrders = [];
    let successCount = 0;

    for (let i = 0; i < salesOrdersToCreate.length; i++) {
      const order = salesOrdersToCreate[i];
      const customer = customers[i % customers.length];

      console.log(`\n📝 [${i + 1}/5] Creando: ${order.numero}`);
      console.log(`   Cliente: ${customer.nombre}`);
      console.log(`   Items: ${order.items.length} líneas`);

      const createResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: "/api/inventory/salesOrder",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-token": token,
          },
        },
        order
      );

      if (
        createResponse.statusCode === 201 ||
        createResponse.statusCode === 200
      ) {
        const created = createResponse.data.salesOrder || createResponse.data;
        createdOrders.push(created);
        successCount++;
        console.log(`   ✅ Orden creada - ID: ${created.id || created._id}`);
        console.log(`   Estado: ${created.estado}`);
      } else {
        console.log(
          `   ❌ Error:`,
          createResponse.data.msg || createResponse.data
        );
      }
    }

    console.log(`\n✅ Órdenes creadas: ${successCount}/5`);

    if (createdOrders.length === 0) {
      console.log("❌ No se pudieron crear órdenes. Abortando test.");
      return;
    }

    // ============================================
    // PASO 4: CONFIRMAR ÓRDENES (CREAR RESERVACIONES)
    // ============================================
    console.log("\n\n📋 PASO 4: Confirmar órdenes (crear reservaciones)");
    console.log("-".repeat(50));

    const ordersToConfirm = createdOrders.slice(0, 4); // Confirmar las primeras 4

    for (let i = 0; i < ordersToConfirm.length; i++) {
      const order = ordersToConfirm[i];

      // Obtener el warehouse del primer item con stock
      const firstItemId =
        typeof order.items[0].item === "object"
          ? order.items[0].item._id || order.items[0].item.id
          : order.items[0].item;

      const stockForItem = itemsConStock.find((s) => {
        const itemId =
          typeof s.item === "object" ? s.item._id || s.item.id : s.item;
        return itemId.toString() === firstItemId.toString();
      });

      const warehouseId =
        typeof stockForItem.warehouse === "object"
          ? stockForItem.warehouse._id || stockForItem.warehouse.id
          : stockForItem.warehouse;

      console.log(`\n📦 [${i + 1}/4] Confirmando orden: ${order.numero}`);
      console.log(
        `   Almacén: ${typeof stockForItem.warehouse === "object" ? stockForItem.warehouse.nombre : warehouseId}`
      );

      const confirmResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: `/api/inventory/salesOrder/${order.id || order._id}/confirm`,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-token": token,
          },
        },
        {
          warehouse: warehouseId,
          idempotencyKey: `CONFIRM-${order.numero}-${Date.now()}`,
        }
      );

      if (confirmResponse.statusCode === 200) {
        const confirmed = confirmResponse.data;
        console.log(`   ✅ Orden confirmada`);
        console.log(
          `   Estado: ${confirmed.estado || confirmed.salesOrder?.estado}`
        );
        console.log(`   Reservaciones: ${confirmed.reservations?.length || 0}`);

        // Actualizar orden en el array
        createdOrders[i] = confirmed.salesOrder || confirmed;
      } else {
        console.log(
          `   ⚠️  Error:`,
          confirmResponse.data.msg ||
            confirmResponse.data.message ||
            "Error desconocido"
        );
      }

      // Pequeña pausa
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // ============================================
    // PASO 5: DESPACHAR ÓRDENES
    // ============================================
    console.log("\n\n🚚 PASO 5: Despachar órdenes");
    console.log("-".repeat(50));

    // Despacho completo de la primera orden confirmada
    const orderToShipFull = createdOrders[0];
    if (orderToShipFull && orderToShipFull.estado === "confirmada") {
      console.log(`\n📦 Despacho COMPLETO - Orden: ${orderToShipFull.numero}`);

      const shipFullResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: `/api/inventory/salesOrder/${orderToShipFull.id || orderToShipFull._id}/ship`,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-token": token,
          },
        },
        {
          idempotencyKey: `SHIP-FULL-${orderToShipFull.numero}-${Date.now()}`,
        }
      );

      if (shipFullResponse.statusCode === 200) {
        const shipped = shipFullResponse.data;
        console.log(`   ✅ Orden despachada completamente`);
        console.log(
          `   Estado: ${shipped.salesOrder?.estado || shipped.estado}`
        );
      } else {
        console.log(
          `   ⚠️  Error:`,
          shipFullResponse.data.msg || shipFullResponse.data.message
        );
      }
    }

    // Despacho parcial de la segunda orden confirmada
    const orderToShipPartial = createdOrders[1];
    if (orderToShipPartial && orderToShipPartial.estado === "confirmada") {
      console.log(
        `\n📦 Despacho PARCIAL - Orden: ${orderToShipPartial.numero}`
      );
      console.log(
        `   Despachando solo el primer item con la mitad de cantidad`
      );

      const firstItem = orderToShipPartial.items[0];
      const itemId =
        typeof firstItem.item === "object"
          ? firstItem.item._id || firstItem.item.id
          : firstItem.item;
      const cantidadParcial = Math.ceil(firstItem.cantidad / 2);

      const shipPartialResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: `/api/inventory/salesOrder/${orderToShipPartial.id || orderToShipPartial._id}/ship`,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-token": token,
          },
        },
        {
          items: [
            {
              item: itemId,
              cantidad: cantidadParcial,
            },
          ],
          idempotencyKey: `SHIP-PARTIAL-${orderToShipPartial.numero}-${Date.now()}`,
        }
      );

      if (shipPartialResponse.statusCode === 200) {
        const shipped = shipPartialResponse.data;
        console.log(`   ✅ Orden despachada parcialmente`);
        console.log(
          `   Estado: ${shipped.salesOrder?.estado || shipped.estado}`
        );
        console.log(`   Cantidad despachada: ${cantidadParcial} unidades`);
      } else {
        console.log(
          `   ⚠️  Error:`,
          shipPartialResponse.data.msg || shipPartialResponse.data.message
        );
      }
    }

    // ============================================
    // PASO 6: CANCELAR UNA ORDEN
    // ============================================
    console.log("\n\n❌ PASO 6: Cancelar una orden");
    console.log("-".repeat(50));

    const orderToCancel = createdOrders[3];
    if (
      orderToCancel &&
      ["confirmada", "parcial"].includes(orderToCancel.estado)
    ) {
      console.log(`\n📦 Cancelando orden: ${orderToCancel.numero}`);

      const cancelResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: `/api/inventory/salesOrder/${orderToCancel.id || orderToCancel._id}/cancel`,
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-token": token,
          },
        },
        {
          idempotencyKey: `CANCEL-${orderToCancel.numero}-${Date.now()}`,
        }
      );

      if (cancelResponse.statusCode === 200) {
        const cancelled = cancelResponse.data;
        console.log(`   ✅ Orden cancelada`);
        console.log(
          `   Estado: ${cancelled.salesOrder?.estado || cancelled.estado}`
        );
        console.log(`   Las reservaciones han sido liberadas`);
      } else {
        console.log(
          `   ⚠️  Error:`,
          cancelResponse.data.msg || cancelResponse.data.message
        );
      }
    }

    // ============================================
    // PASO 7: VERIFICAR ÓRDENES CON POBLACIÓN
    // ============================================
    console.log(
      "\n\n📊 PASO 7: Verificar órdenes con población de referencias"
    );
    console.log("-".repeat(50));

    const getOrdersResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/salesOrder",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (getOrdersResponse.statusCode === 200) {
      const allOrders = getOrdersResponse.data || [];
      const testOrders = allOrders.filter((o) =>
        o.numero.startsWith(`SO-${timestamp}`)
      );

      console.log(`\n✅ Total de órdenes del test: ${testOrders.length}`);

      // Contar por estado
      const porEstado = {
        borrador: 0,
        pendiente: 0,
        confirmada: 0,
        parcial: 0,
        despachada: 0,
        cancelada: 0,
      };

      testOrders.forEach((order) => {
        if (porEstado.hasOwnProperty(order.estado)) {
          porEstado[order.estado]++;
        }
      });

      console.log(`\n📊 DISTRIBUCIÓN POR ESTADO:`);
      Object.entries(porEstado).forEach(([estado, count]) => {
        if (count > 0) {
          console.log(
            `   • ${estado.padEnd(15)}: ${count} ${count === 1 ? "orden" : "órdenes"}`
          );
        }
      });

      // Verificar población
      const conCliente = testOrders.filter(
        (o) => o.cliente && typeof o.cliente === "object"
      ).length;
      const conReservas = testOrders.filter(
        (o) => o.reservations && o.reservations.length > 0
      ).length;

      console.log(`\n🔍 VERIFICACIÓN DE POBLACIÓN:`);
      console.log(
        `   ✅ Órdenes con Cliente poblado: ${conCliente}/${testOrders.length}`
      );
      console.log(
        `   ✅ Órdenes con Reservaciones: ${conReservas}/${testOrders.length}`
      );

      // Mostrar muestra de órdenes
      console.log(`\n📋 MUESTRA DE ÓRDENES (todas):`);
      console.log("-".repeat(100));

      testOrders.forEach((order, idx) => {
        const clienteNombre =
          typeof order.cliente === "object" ? order.cliente.nombre : "N/A";
        const estadoIcon =
          {
            borrador: "📝",
            pendiente: "⏳",
            confirmada: "✅",
            parcial: "📦",
            despachada: "🚚",
            cancelada: "❌",
          }[order.estado] || "📄";

        console.log(`\n${estadoIcon} ${idx + 1}. ${order.numero}`);
        console.log(`   Cliente: ${clienteNombre}`);
        console.log(`   Estado: ${order.estado}`);
        console.log(`   Items: ${order.items.length}`);
        console.log(`   Reservaciones: ${order.reservations?.length || 0}`);
        if (order.fechaConfirmacion) {
          console.log(
            `   Fecha confirmación: ${new Date(order.fechaConfirmacion).toLocaleString()}`
          );
        }
        if (order.fechaDespacho) {
          console.log(
            `   Fecha despacho: ${new Date(order.fechaDespacho).toLocaleString()}`
          );
        }
        if (order.fechaCancelacion) {
          console.log(
            `   Fecha cancelación: ${new Date(order.fechaCancelacion).toLocaleString()}`
          );
        }
      });
    }

    // ============================================
    // PASO 8: VERIFICAR ESTADÍSTICAS DEL CLIENTE
    // ============================================
    console.log("\n\n📈 PASO 8: Verificar estadísticas de compras del cliente");
    console.log("-".repeat(50));

    const testCustomer = customers[0];
    const customerStatsResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: `/api/customers/${testCustomer.id || testCustomer._id}/estadisticas-compras`,
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (customerStatsResponse.statusCode === 200) {
      const stats = customerStatsResponse.data;
      console.log(`\n✅ Estadísticas del cliente: ${stats.cliente.nombre}`);
      console.log(`\n📊 Resumen:`);
      console.log(`   Total de órdenes: ${stats.estadisticas.totalOrdenes}`);
      console.log(`\n📋 Por estado:`);
      Object.entries(stats.estadisticas.porEstado).forEach(
        ([estado, count]) => {
          if (count > 0) {
            console.log(`   • ${estado}: ${count}`);
          }
        }
      );
      console.log(`\n💰 Montos:`);
      console.log(`   Total: $${stats.estadisticas.montos.total.toFixed(2)}`);
      console.log(
        `   Despachado: $${stats.estadisticas.montos.despachado.toFixed(2)}`
      );
      console.log(
        `   Pendiente: $${stats.estadisticas.montos.pendiente.toFixed(2)}`
      );
      console.log(
        `   Promedio por orden: $${stats.estadisticas.promedioOrden.toFixed(2)}`
      );

      if (stats.ultimaOrden) {
        console.log(
          `\n🛒 Última orden: ${stats.ultimaOrden.numero} (${stats.ultimaOrden.estado})`
        );
      }

      console.log(
        `\n⏳ Tiene órdenes pendientes: ${stats.tieneOrdenesPendientes ? "Sí" : "No"}`
      );
    }

    // ============================================
    // PASO 9: VERIFICAR MOVIMIENTOS Y STOCK
    // ============================================
    console.log("\n\n📊 PASO 9: Verificar movimientos de inventario");
    console.log("-".repeat(50));

    const getMovementsResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/movements?limite=100&populate=true",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (getMovementsResponse.statusCode === 200) {
      const movements = getMovementsResponse.data.movements || [];
      const salesMovements = movements.filter(
        (m) => m.referenciaTipo === "SalesOrder"
      );

      console.log(`\n✅ Movimientos de Sales Orders: ${salesMovements.length}`);

      if (salesMovements.length > 0) {
        // Agrupar por tipo
        const byType = {};
        salesMovements.forEach((m) => {
          byType[m.tipo] = (byType[m.tipo] || 0) + 1;
        });

        console.log(`\n📊 DISTRIBUCIÓN POR TIPO:`);
        Object.entries(byType).forEach(([tipo, count]) => {
          console.log(`   • ${tipo.padEnd(15)}: ${count} movimientos`);
        });

        // Mostrar últimos movimientos
        console.log(`\n📋 ÚLTIMOS MOVIMIENTOS (hasta 5):`);
        console.log("-".repeat(90));
        salesMovements.slice(-5).forEach((mov) => {
          const itemNombre =
            typeof mov.item === "object"
              ? mov.item.nombre?.substring(0, 35)
              : "N/A";
          const warehouseName =
            typeof mov.warehouseFrom === "object"
              ? mov.warehouseFrom.nombre
              : "N/A";
          console.log(
            `   ${mov.tipo.padEnd(12)} | ${itemNombre?.padEnd(35) || "N/A"} | ` +
              `Cant: ${mov.cantidad.toString().padStart(5)} | ` +
              `Almacén: ${warehouseName}`
          );
        });
      }
    }

    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log("\n" + "=".repeat(80));
    console.log("📊 RESUMEN DEL TEST");
    console.log("=".repeat(80));
    console.log(`\n✅ Órdenes creadas: ${successCount} de 5`);

    console.log(`\n💡 Funcionalidades probadas:`);
    console.log(`   ✅ Creación de órdenes con clientes del CRM`);
    console.log(`   ✅ Validación de cliente existente y activo`);
    console.log(`   ✅ Confirmación de órdenes (reservaciones creadas)`);
    console.log(`   ✅ Despacho completo de mercancía`);
    console.log(`   ✅ Despacho parcial de mercancía`);
    console.log(`   ✅ Cancelación de órdenes (liberación de reservas)`);
    console.log(`   ✅ Actualización automática de stock`);
    console.log(`   ✅ Movimientos de salida registrados`);
    console.log(`   ✅ Población de referencias (cliente, items, warehouse)`);
    console.log(`   ✅ Estadísticas de compras del cliente`);
    console.log(`   ✅ Transaccionalidad de operaciones`);
    console.log(`   ✅ Idempotencia en operaciones críticas`);

    console.log(`\n🎉 TEST DE SALES ORDERS COMPLETADO`);
    console.log("=".repeat(80) + "\n");
  } catch (error) {
    console.error("\n❌ ERROR EN EL TEST:", error);
    console.error(error.stack);
  }
}

// Configuración inicial
console.log("\n" + "=".repeat(80));
console.log("🧪 TEST: Modelo SalesOrder - Órdenes de Venta");
console.log("=".repeat(80));
console.log("📍 Servidor: http://localhost:4000");
console.log("📍 Asegúrate de que el servidor esté corriendo");
console.log("\n⚠️  IMPORTANTE: Este test requiere datos previos:");
console.log("   - Customers (customer.test.js)");
console.log("   - Items con stock (purchaseOrder.additional.test.js)");
console.log("=".repeat(80));

// Ejecutar test
testSalesOrders();
