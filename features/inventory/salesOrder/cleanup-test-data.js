const http = require("http");

/**
 * Script de limpieza de reservaciones y órdenes de prueba
 *
 * Este script limpia:
 * 1. Reservaciones activas de tests anteriores
 * 2. Órdenes de prueba en estado borrador/confirmada
 * 3. Libera stock reservado
 */

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

async function cleanupTestData() {
  try {
    console.log("\n" + "=".repeat(80));
    console.log("🧹 LIMPIEZA DE DATOS DE PRUEBA");
    console.log("=".repeat(80));

    // Autenticación
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
      console.error("❌ Error en login");
      return;
    }

    const token = loginResponse.data.token;
    console.log("✅ Autenticado\n");

    // Obtener todas las órdenes de prueba
    console.log("📋 Buscando órdenes de prueba...");
    const getOrdersResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/salesOrder?limite=100",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (getOrdersResponse.statusCode === 200) {
      const allOrders = getOrdersResponse.data || [];

      // Filtrar órdenes de prueba (que contengan "TEST" o "SO-" del día de hoy)
      const testOrders = allOrders.filter(
        (o) => o.numero.includes("TEST") || o.numero.includes("SO-")
      );

      console.log(`✅ Encontradas ${testOrders.length} órdenes de prueba\n`);

      // Cancelar órdenes confirmadas para liberar reservaciones
      let canceladas = 0;
      for (const order of testOrders) {
        if (
          order.estado === "confirmada" ||
          order.estado === "borrador" ||
          order.estado === "pendiente"
        ) {
          console.log(`🔄 Cancelando: ${order.numero} (${order.estado})`);

          const cancelResponse = await makeRequest(
            {
              hostname: "localhost",
              port: 4000,
              path: `/api/inventory/salesOrder/${order.id || order._id}/cancel`,
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "x-token": token,
              },
            },
            {
              idempotencyKey: `CLEANUP-${order.numero}-${Date.now()}`,
            }
          );

          if (cancelResponse.statusCode === 200) {
            console.log(
              `   ✅ Cancelada - ${cancelResponse.data.liberatedReservations?.length || 0} reservaciones liberadas`
            );
            canceladas++;
          } else {
            console.log(
              `   ⚠️  Error:`,
              cancelResponse.data.msg || cancelResponse.data.message
            );
          }

          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      console.log(`\n✅ ${canceladas} órdenes canceladas`);
    }

    // Obtener stock actual
    console.log("\n📊 Verificando stock actual...");
    const getStockResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/stock?limite=50&populate=true",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (getStockResponse.statusCode === 200) {
      const stocks = getStockResponse.data.stocks || [];

      console.log(`\n📊 RESUMEN DE STOCK:`);
      console.log("-".repeat(90));
      console.log(
        `${"Item".padEnd(35)} | ${"Cantidad".padEnd(12)} | ${"Reservado".padEnd(12)} | ${"Disponible"}`
      );
      console.log("-".repeat(90));

      let totalConStock = 0;
      stocks.forEach((s) => {
        const itemNombre = typeof s.item === "object" ? s.item.nombre : "N/A";
        const disponible = (s.cantidad || 0) - (s.reservado || 0);

        if (disponible >= 10) {
          totalConStock++;
          console.log(
            `${(itemNombre?.substring(0, 33) || "N/A").padEnd(35)} | ` +
              `${s.cantidad.toString().padEnd(12)} | ` +
              `${s.reservado.toString().padEnd(12)} | ` +
              `${disponible}`
          );
        }
      });

      console.log("-".repeat(90));
      console.log(
        `\n✅ Items con stock disponible (≥10 unidades): ${totalConStock}`
      );
    }

    // Verificar reservaciones activas
    console.log("\n📊 Verificando reservaciones activas...");
    const getReservationsResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/reservations?limite=100",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (getReservationsResponse.statusCode === 200) {
      const reservations = getReservationsResponse.data.reservations || [];
      const activas = reservations.filter((r) => r.estado === "activo");

      console.log(`✅ Reservaciones totales: ${reservations.length}`);
      console.log(`   • Activas: ${activas.length}`);
      console.log(
        `   • Consumidas: ${reservations.filter((r) => r.estado === "consumido").length}`
      );
      console.log(
        `   • Liberadas: ${reservations.filter((r) => r.estado === "liberado").length}`
      );
    }

    console.log("\n" + "=".repeat(80));
    console.log("✅ LIMPIEZA COMPLETADA");
    console.log("=".repeat(80) + "\n");
  } catch (error) {
    console.error("\n❌ ERROR:", error);
    console.error(error.stack);
  }
}

cleanupTestData();
