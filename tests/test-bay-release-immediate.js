/**
 * Test específico para reproducir el problema del frontend:
 * 1. Entrar a bahía
 * 2. Salir de bahía
 * 3. Verificar INMEDIATAMENTE que la bahía NO aparece en activeBays del dashboard
 */

const http = require("http");

// Configuración
const HOST = "localhost";
const PORT = 4000;
let token = "";
let testData = {
  workOrder: null,
  bay: null,
  technician: null,
};

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
 * Test principal
 */
async function runTest() {
  console.log("\n╔════════════════════════════════════════════════════╗");
  console.log("║  TEST: LIBERACIÓN DE BAHÍA Y DASHBOARD INMEDIATO ║");
  console.log("╚════════════════════════════════════════════════════╝\n");

  try {
    // 1. Autenticación
    console.log("🔐 PASO 1: Autenticación");
    console.log("=".repeat(60));
    const authResponse = await makeRequest("POST", "/api/auth/login", {
      correo: "superadmin@taller.com",
      password: "SuperAdmin123!",
    });

    if (authResponse.statusCode !== 200) {
      throw new Error("Autenticación falló");
    }

    token = authResponse.body.token;
    console.log("✅ Token obtenido\n");

    // 2. Obtener bahía disponible
    console.log("🏗️  PASO 2: Obtener bahía disponible");
    console.log("=".repeat(60));
    const baysResponse = await makeRequest(
      "GET",
      "/api/service-bays/available"
    );

    if (!baysResponse.body.bays || baysResponse.body.bays.length === 0) {
      throw new Error("No hay bahías disponibles");
    }

    testData.bay = baysResponse.body.bays[0];
    console.log(
      `✅ Bahía seleccionada: ${testData.bay.name} (${testData.bay.code})`
    );
    console.log(`   Estado inicial: ${testData.bay.status}\n`);

    // 3. Obtener técnico
    console.log("👷 PASO 3: Obtener técnico");
    console.log("=".repeat(60));
    const usersResponse = await makeRequest("GET", "/api/user");

    const technicians = usersResponse.body.users.filter(
      (u) => u.rol === "operador"
    );
    if (technicians.length === 0) {
      throw new Error("No hay técnicos disponibles");
    }

    testData.technician = technicians[0];
    console.log(`✅ Técnico seleccionado: ${testData.technician.nombre}`);
    console.log(
      `   ID: ${testData.technician.uid || testData.technician._id}\n`
    );

    // 4. Obtener orden de trabajo
    console.log("📋 PASO 4: Obtener orden de trabajo");
    console.log("=".repeat(60));
    const woResponse = await makeRequest("GET", "/api/work-orders?limit=1");

    if (!woResponse.body.data || woResponse.body.data.length === 0) {
      throw new Error("No hay órdenes de trabajo disponibles");
    }

    testData.workOrder = woResponse.body.data[0];
    console.log(
      `✅ OT seleccionada: ${testData.workOrder.numeroOrden || "N/A"}`
    );
    console.log(`   ID: ${testData.workOrder._id}\n`);

    // 5. Dashboard ANTES de entrada
    console.log("📊 PASO 5: Dashboard ANTES de entrada");
    console.log("=".repeat(60));
    const dashboardBefore = await makeRequest(
      "GET",
      "/api/dashboard/taller-status"
    );
    const activeBaysBefore = dashboardBefore.body.activeBays || [];
    const bayInDashboardBefore = activeBaysBefore.find(
      (ab) => ab.bay._id === testData.bay._id
    );

    console.log(`   Bahías activas: ${activeBaysBefore.length}`);
    console.log(
      `   Nuestra bahía está activa: ${bayInDashboardBefore ? "SÍ ❌" : "NO ✅"}\n`
    );

    // 6. Registrar entrada
    console.log("🚪 PASO 6: Registrar entrada a bahía");
    console.log("=".repeat(60));
    const enterResponse = await makeRequest(
      "POST",
      `/api/work-orders/${testData.workOrder._id}/enter-bay`,
      {
        serviceBay: testData.bay._id,
        technician: testData.technician.uid || testData.technician._id,
        role: "principal",
        estimatedHours: 2,
        notes: "Test de liberación",
      }
    );

    if (enterResponse.statusCode !== 201) {
      throw new Error(`Entrada falló: ${enterResponse.body.msg}`);
    }

    const assignment = enterResponse.body.assignments
      ? enterResponse.body.assignments[0]
      : enterResponse.body.assignment;

    console.log("✅ Entrada registrada");
    console.log(`   Assignment ID: ${assignment._id}`);
    console.log(
      `   Bahía status: ${enterResponse.body.bay?.status || "N/A"}\n`
    );

    // 7. Dashboard DESPUÉS de entrada
    console.log("📊 PASO 7: Dashboard DESPUÉS de entrada");
    console.log("=".repeat(60));
    const dashboardAfterEnter = await makeRequest(
      "GET",
      "/api/dashboard/taller-status"
    );
    const activeBaysAfterEnter = dashboardAfterEnter.body.activeBays || [];
    const bayInDashboardAfterEnter = activeBaysAfterEnter.find(
      (ab) => ab.bay._id === testData.bay._id
    );

    console.log(`   Bahías activas: ${activeBaysAfterEnter.length}`);
    console.log(
      `   Nuestra bahía está activa: ${bayInDashboardAfterEnter ? "SÍ ✅" : "NO ❌"}`
    );

    if (!bayInDashboardAfterEnter) {
      throw new Error(
        "❌ ERROR: La bahía debería estar activa después de la entrada"
      );
    }

    console.log(
      `   Técnicos en bahía: ${bayInDashboardAfterEnter.technicians.length}`
    );
    console.log(
      `   OT: ${bayInDashboardAfterEnter.workOrder?.numeroOrden || "N/A"}\n`
    );

    // 8. Registrar salida
    console.log("🚪 PASO 8: Registrar salida de bahía");
    console.log("=".repeat(60));
    const exitResponse = await makeRequest(
      "POST",
      `/api/work-orders/${testData.workOrder._id}/exit-bay`,
      {
        technician: testData.technician.uid || testData.technician._id,
        notes: "Test completado",
      }
    );

    if (exitResponse.statusCode !== 200) {
      throw new Error(`Salida falló: ${exitResponse.body.msg}`);
    }

    console.log("✅ Salida registrada");
    console.log(
      `   Horas trabajadas: ${exitResponse.body.assignments?.[0]?.hoursWorked || 0}h`
    );
    console.log(
      `   Bahía status en respuesta: ${exitResponse.body.workOrder?.serviceBay || "N/A"}\n`
    );

    // 9. Dashboard INMEDIATAMENTE después de salida (sin esperas)
    console.log("📊 PASO 9: Dashboard INMEDIATAMENTE después de salida");
    console.log("=".repeat(60));
    const dashboardAfterExit = await makeRequest(
      "GET",
      "/api/dashboard/taller-status"
    );
    const activeBaysAfterExit = dashboardAfterExit.body.activeBays || [];
    const bayInDashboardAfterExit = activeBaysAfterExit.find(
      (ab) => ab.bay._id === testData.bay._id
    );

    console.log(`   Bahías activas: ${activeBaysAfterExit.length}`);
    console.log(
      `   Nuestra bahía está activa: ${bayInDashboardAfterExit ? "SÍ ❌" : "NO ✅"}`
    );

    // 10. Verificar estado directo de la bahía
    console.log("\n🔍 PASO 10: Verificar estado directo de la bahía");
    console.log("=".repeat(60));
    const allBaysResponse = await makeRequest("GET", "/api/service-bays");
    const ourBay = allBaysResponse.body.bays.find(
      (b) => b._id === testData.bay._id
    );

    if (ourBay) {
      console.log(`   Status: ${ourBay.status}`);
      console.log(`   currentWorkOrder: ${ourBay.currentWorkOrder || "null"}`);
      console.log(`   currentTechnicians: ${ourBay.currentTechnicians.length}`);
    }

    // RESULTADO FINAL
    console.log("\n\n╔════════════════════════════════════════════════════╗");
    console.log("║                  RESULTADO FINAL                   ║");
    console.log("╚════════════════════════════════════════════════════╝\n");

    if (bayInDashboardAfterExit) {
      console.log("❌ TEST FALLIDO: La bahía SIGUE apareciendo en activeBays");
      console.log("\n🔍 Detalles de la bahía en activeBays:");
      console.log(JSON.stringify(bayInDashboardAfterExit, null, 2));
      console.log("\n🔍 Estado real de la bahía:");
      console.log(JSON.stringify(ourBay, null, 2));
      process.exit(1);
    } else if (ourBay && ourBay.status !== "disponible") {
      console.log(
        "❌ TEST FALLIDO: La bahía NO está en activeBays pero su status no es 'disponible'"
      );
      console.log(`\n   Status actual: ${ourBay.status}`);
      console.log(`   Debería ser: disponible`);
      process.exit(1);
    } else {
      console.log("✅ TEST EXITOSO: La bahía fue liberada correctamente");
      console.log("\n   ✓ No aparece en activeBays del dashboard");
      console.log("   ✓ Status cambiado a 'disponible'");
      console.log("   ✓ currentWorkOrder limpiado");
      console.log("   ✓ currentTechnicians vacío");
      console.log("\n🎉 El flujo de liberación funciona correctamente!\n");
    }
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar test
runTest();
