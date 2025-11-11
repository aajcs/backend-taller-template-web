/**
 * Test para el endpoint GET /api/service-bays/:id/history
 * Prueba el historial de ocupación de una bahía específica
 */

const http = require("http");

// Configuración
const HOST = "localhost";
const PORT = 4000;
let token = "";
let testBayId = "";

/**
 * Hacer request HTTP
 */
function makeRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
        ...(token && { "x-token": token }),
      },
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            body: parsed,
          });
        } catch (error) {
          reject(new Error(`Error parsing JSON: ${data}`));
        }
      });
    });

    req.on("error", reject);

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Helper: Login y obtener token
 */
const login = async () => {
  try {
    const response = await makeRequest("POST", "/api/auth/login", {
      correo: "admin@autosys.com",
      password: "Admin123!",
    });

    if (response.statusCode !== 200) {
      console.error("❌ Error en login:", response.body);
      return false;
    }

    token = response.body.token;
    console.log("✅ Login exitoso");
    return true;
  } catch (error) {
    console.error("❌ Error en login:", error.message);
    return false;
  }
};

/**
 * Test 1: Obtener la primera bahía disponible para usar en las pruebas
 */
const getFirstBay = async () => {
  try {
    console.log("\n📋 TEST 1: Obtener bahía de prueba");
    console.log("-".repeat(60));

    const response = await makeRequest("GET", "/api/service-bays");

    if (!response.body.bays || response.body.bays.length === 0) {
      console.log("❌ No hay bahías disponibles para probar");
      return false;
    }

    testBayId = response.body.bays[0]._id;
    console.log(`✅ Bahía obtenida: ${response.body.bays[0].name}`);
    console.log(`   ID: ${testBayId}\n`);
    return true;
  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
};

/**
 * Test 2: Obtener historial sin parámetros
 */
const testGetHistoryBasic = async () => {
  try {
    console.log("\n📋 TEST 2: Obtener historial básico");
    console.log("-".repeat(60));

    const response = await makeRequest(
      "GET",
      `/api/dashboard/bays/${testBayId}/history`
    );

    console.log("✅ Respuesta recibida:");
    console.log(`   Total órdenes: ${response.body.summary.totalOrders}`);
    console.log(`   Total horas: ${response.body.summary.totalHours}`);
    console.log(
      `   Duración promedio: ${response.body.summary.averageDuration} hrs`
    );
    console.log(`   Registros devueltos: ${response.body.history.length}`);

    if (response.body.history.length > 0) {
      const firstRecord = response.body.history[0];
      console.log("\n   Primer registro:");
      console.log(`   - Work Order: ${firstRecord.workOrder?.numeroOrden}`);
      console.log(`   - Vehicle: ${JSON.stringify(firstRecord.vehicle)}`);
      console.log(`   - Customer: ${JSON.stringify(firstRecord.customer)}`);
      console.log(`   - Entry Time: ${firstRecord.entryTime}`);
      console.log(`   - Exit Time: ${firstRecord.exitTime}`);
      console.log(`   - Duration: ${firstRecord.duration} hrs`);
      console.log(`   - Technicians: ${firstRecord.technicians?.length || 0}`);
    }

    return response.body.ok;
  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
};

/**
 * Test 3: Obtener historial con límite
 */
const testGetHistoryWithLimit = async () => {
  try {
    console.log("\n📋 TEST 3: Obtener historial con límite (10 registros)");
    console.log("-".repeat(60));

    const response = await makeRequest(
      "GET",
      `/api/dashboard/bays/${testBayId}/history?limit=10`
    );

    console.log("✅ Respuesta recibida:");
    console.log(`   Registros devueltos: ${response.body.history.length}`);
    console.log(
      `   Límite aplicado correctamente: ${response.body.history.length <= 10}`
    );

    return response.body.ok;
  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
};

/**
 * Test 4: Obtener historial con rango de fechas
 */
const testGetHistoryWithDateRange = async () => {
  try {
    console.log("\n📋 TEST 4: Obtener historial con rango de fechas");
    console.log("-".repeat(60));

    const endDate = new Date().toISOString();
    const startDate = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString(); // Últimos 30 días

    const response = await makeRequest(
      "GET",
      `/api/dashboard/bays/${testBayId}/history?startDate=${startDate}&endDate=${endDate}`
    );

    console.log("✅ Respuesta recibida:");
    console.log(
      `   Período: ${startDate.split("T")[0]} a ${endDate.split("T")[0]}`
    );
    console.log(`   Registros encontrados: ${response.body.history.length}`);

    return response.body.ok;
  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
};

/**
 * Test 5: Probar con ID inválido
 */
const testGetHistoryInvalidId = async () => {
  try {
    console.log("\n📋 TEST 5: Probar con ID de bahía inválido");
    console.log("-".repeat(60));

    const invalidId = "000000000000000000000000";
    const response = await makeRequest(
      "GET",
      `/api/dashboard/bays/${invalidId}/history`
    );

    console.log("✅ Respuesta recibida (bahía sin historial):");
    console.log(`   Total órdenes: ${response.body.summary.totalOrders}`);
    console.log(`   Registros: ${response.body.history.length}`);

    return response.body.ok;
  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
};

/**
 * Ejecutar todos los tests
 */
const runTests = async () => {
  console.log("=".repeat(60));
  console.log("🧪 TESTS: GET /api/service-bays/:id/history");
  console.log("=".repeat(60));

  // Login
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.error("\n❌ No se pudo hacer login. Tests abortados.");
    process.exit(1);
  }

  // Obtener bahía de prueba
  const baySuccess = await getFirstBay();
  if (!baySuccess) {
    console.error("\n❌ No se pudo obtener bahía de prueba. Tests abortados.");
    process.exit(1);
  }

  // Ejecutar tests
  const results = {
    test1: await testGetHistoryBasic(),
    test2: await testGetHistoryWithLimit(),
    test3: await testGetHistoryWithDateRange(),
    test4: await testGetHistoryInvalidId(),
  };

  // Resumen
  console.log("\n" + "=".repeat(60));
  console.log("📊 RESUMEN DE TESTS");
  console.log("=".repeat(60));

  const passed = Object.values(results).filter((r) => r).length;
  const total = Object.values(results).length;

  console.log(`✅ Tests exitosos: ${passed}/${total}`);
  console.log(`❌ Tests fallidos: ${total - passed}/${total}`);

  Object.entries(results).forEach(([test, result]) => {
    console.log(`   ${result ? "✅" : "❌"} ${test}`);
  });

  console.log("\n" + "=".repeat(60));

  if (passed === total) {
    console.log("🎉 ¡TODOS LOS TESTS PASARON!");
  } else {
    console.log("⚠️  ALGUNOS TESTS FALLARON");
  }

  process.exit(passed === total ? 0 : 1);
};

// Ejecutar tests
runTests();
