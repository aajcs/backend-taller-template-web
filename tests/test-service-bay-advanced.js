/**
 * Test Avanzado: Sistema de Bahías de Servicio
 * Tests completos con datos del seed
 */

require("dotenv").config();
const http = require("http");

// Configuración
const API_HOST = "localhost";
const API_PORT = 4000;

// Variables globales
let authToken = "";
let testData = {
  bays: [],
  technicians: [],
  workOrders: [],
  assignments: [],
};

/**
 * Helper para hacer requests HTTP
 */
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
        "x-token": authToken,
      },
      timeout: 10000,
    };

    const req = http.request(options, (res) => {
      let body = "";

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: JSON.parse(body),
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            body: body,
          });
        }
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * TEST 1: Autenticación
 */
async function testAuthentication() {
  console.log("\n🔐 TEST 1: Autenticación");
  console.log("=".repeat(60));

  try {
    const response = await makeRequest("POST", "/api/auth/login", {
      correo: "superadmin@taller.com",
      password: "SuperAdmin123!",
    });

    if (response.statusCode === 200 && response.body.token) {
      authToken = response.body.token;
      console.log("✅ Autenticación exitosa");
      console.log(`   Usuario: ${response.body.usuario.nombre}`);
      return true;
    }

    console.log("❌ Falló autenticación");
    return false;
  } catch (error) {
    console.log("❌ Error:", error.message);
    return false;
  }
}

/**
 * TEST 2: Listar todas las bahías
 */
async function testListAllBays() {
  console.log("\n📋 TEST 2: Listar todas las bahías");
  console.log("=".repeat(60));

  try {
    const response = await makeRequest("GET", "/api/service-bays");

    if (response.statusCode === 200) {
      testData.bays = response.body.bays || [];
      console.log(`✅ Bahías obtenidas: ${testData.bays.length}`);

      // Agrupar por área
      const byArea = testData.bays.reduce((acc, bay) => {
        acc[bay.area] = (acc[bay.area] || 0) + 1;
        return acc;
      }, {});

      console.log("\n   Distribución por área:");
      Object.entries(byArea).forEach(([area, count]) => {
        console.log(`   - ${area}: ${count} bahía(s)`);
      });

      return true;
    }

    console.log("❌ Error al listar bahías");
    return false;
  } catch (error) {
    console.log("❌ Error:", error.message);
    return false;
  }
}

/**
 * TEST 3: Filtrar bahías por área
 */
async function testFilterBaysByArea() {
  console.log("\n🔍 TEST 3: Filtrar bahías por área");
  console.log("=".repeat(60));

  const areas = ["mecanica", "electricidad", "pintura"];
  let allPassed = true;

  for (const area of areas) {
    try {
      const response = await makeRequest(
        "GET",
        `/api/service-bays?area=${area}`
      );

      if (response.statusCode === 200) {
        const bays = response.body.bays || [];
        console.log(`   ✅ Área "${area}": ${bays.length} bahía(s)`);

        if (bays.length > 0) {
          console.log(`      Ejemplo: ${bays[0].name} (${bays[0].code})`);
        }
      } else {
        console.log(`   ❌ Error filtrando área "${area}"`);
        allPassed = false;
      }
    } catch (error) {
      console.log(`   ❌ Error en área "${area}":`, error.message);
      allPassed = false;
    }
  }

  return allPassed;
}

/**
 * TEST 4: Obtener bahías disponibles
 */
async function testGetAvailableBays() {
  console.log("\n🟢 TEST 4: Obtener bahías disponibles");
  console.log("=".repeat(60));

  try {
    const response = await makeRequest("GET", "/api/service-bays/available");

    if (response.statusCode === 200) {
      const available = response.body.bays || [];
      const total = testData.bays.length;
      const percentage =
        total > 0 ? ((available.length / total) * 100).toFixed(1) : 0;

      console.log(
        `✅ Bahías disponibles: ${available.length}/${total} (${percentage}%)`
      );

      if (available.length > 0) {
        console.log("\n   Bahías disponibles:");
        available.slice(0, 3).forEach((bay, i) => {
          console.log(`   ${i + 1}. ${bay.name} (${bay.code}) - ${bay.area}`);
          console.log(
            `      Capacidad: ${bay.capacity} | Técnicos max: ${bay.maxTechnicians}`
          );
        });
      }

      return true;
    }

    console.log("❌ Error al obtener bahías disponibles");
    return false;
  } catch (error) {
    console.log("❌ Error:", error.message);
    return false;
  }
}

/**
 * TEST 5: Obtener técnicos
 */
async function testGetTechnicians() {
  console.log("\n👷 TEST 5: Obtener técnicos");
  console.log("=".repeat(60));

  try {
    const response = await makeRequest("GET", "/api/user");

    if (response.statusCode === 200 && response.body.users) {
      // Filtrar solo técnicos (rol: operador)
      testData.technicians = response.body.users.filter(
        (u) => u.rol === "operador"
      );

      console.log(`✅ Técnicos encontrados: ${testData.technicians.length}`);

      if (testData.technicians.length > 0) {
        console.log("\n   Lista de técnicos:");
        testData.technicians.slice(0, 5).forEach((tech, i) => {
          console.log(`   ${i + 1}. ${tech.nombre} ${tech.apellido || ""}`);
          console.log(`      Email: ${tech.correo}`);
        });
      }

      return testData.technicians.length > 0;
    }

    console.log("❌ Error al obtener técnicos");
    return false;
  } catch (error) {
    console.log("❌ Error:", error.message);
    return false;
  }
}

/**
 * TEST 6: Dashboard - Estado en tiempo real
 */
async function testDashboard() {
  console.log("\n📊 TEST 6: Dashboard - Estado del taller");
  console.log("=".repeat(60));

  try {
    const response = await makeRequest("GET", "/api/dashboard/taller-status");

    if (response.statusCode === 200) {
      const data = response.body;

      console.log("✅ Dashboard obtenido:");
      console.log(`\n   📈 Métricas generales:`);
      console.log(`   - Total bahías: ${data.totalBays}`);
      console.log(`   - Ocupadas: ${data.occupiedBays}`);
      console.log(`   - Disponibles: ${data.availableBays}`);
      console.log(`   - En mantenimiento: ${data.maintenanceBays || 0}`);
      console.log(`   - Utilización: ${data.utilizationRate}%`);
      console.log(`   - Técnicos activos: ${data.activeTechnicians || 0}`);

      if (data.activeBays && data.activeBays.length > 0) {
        console.log(`\n   🔧 Bahías activas (${data.activeBays.length}):`);
        data.activeBays.forEach((bay, i) => {
          console.log(`\n   ${i + 1}. ${bay.name} (${bay.code})`);
          console.log(`      OT: ${bay.workOrder?.numeroOrden || "N/A"}`);
          console.log(`      Técnicos: ${bay.technicians?.length || 0}`);
          if (bay.technicians && bay.technicians.length > 0) {
            bay.technicians.forEach((tech) => {
              console.log(`         - ${tech.nombre} (${tech.role})`);
            });
          }
          console.log(
            `      Ocupada desde: ${new Date(bay.occupiedSince).toLocaleString()}`
          );
          console.log(`      Horas: ${bay.hoursInBay || 0}h`);
        });
      } else {
        console.log("\n   ℹ️  No hay bahías activas en este momento");
      }

      return true;
    }

    console.log("❌ Error al obtener dashboard");
    return false;
  } catch (error) {
    console.log("❌ Error:", error.message);
    return false;
  }
}

/**
 * TEST 7: Reporte de horas por técnico
 */
async function testTechnicianHoursReport() {
  console.log("\n⏱️  TEST 7: Reporte de horas por técnico");
  console.log("=".repeat(60));

  try {
    const response = await makeRequest("GET", "/api/reports/technician-hours");

    if (response.statusCode === 200) {
      const data = response.body;

      console.log(
        `✅ Reporte generado: ${data.totalTechnicians || 0} técnico(s)`
      );

      if (data.report && data.report.length > 0) {
        console.log("\n   📊 Top técnicos por horas trabajadas:");

        data.report
          .sort(
            (a, b) => b.summary.totalHoursWorked - a.summary.totalHoursWorked
          )
          .slice(0, 5)
          .forEach((tech, i) => {
            console.log(
              `\n   ${i + 1}. ${tech.technician.nombre} ${tech.technician.apellido || ""}`
            );
            console.log(
              `      Total asignaciones: ${tech.summary.totalAssignments}`
            );
            console.log(
              `      Horas totales: ${tech.summary.totalHoursWorked}h`
            );
            console.log(
              `      Promedio/orden: ${tech.summary.averageHoursPerAssignment}h`
            );

            if (tech.recentAssignments && tech.recentAssignments.length > 0) {
              console.log(
                `      Última asignación: ${new Date(tech.recentAssignments[0].entryTime).toLocaleDateString()}`
              );
            }
          });
      } else {
        console.log("\n   ℹ️  No hay datos de horas trabajadas");
      }

      return true;
    }

    console.log("❌ Error al generar reporte");
    return false;
  } catch (error) {
    console.log("❌ Error:", error.message);
    return false;
  }
}

/**
 * TEST 8: Reporte de utilización de bahías
 */
async function testBayUtilizationReport() {
  console.log("\n📈 TEST 8: Reporte de utilización de bahías");
  console.log("=".repeat(60));

  try {
    const response = await makeRequest("GET", "/api/reports/bay-utilization");

    if (response.statusCode === 200) {
      const data = response.body;

      console.log("✅ Reporte de utilización obtenido");

      if (data.report && data.report.length > 0) {
        console.log(`\n   📊 Bahías más utilizadas (${data.report.length}):`);

        data.report
          .filter((bay) => bay.summary && bay.bay)
          .sort(
            (a, b) =>
              (b.summary?.totalOrders || 0) - (a.summary?.totalOrders || 0)
          )
          .slice(0, 5)
          .forEach((bay, i) => {
            console.log(`\n   ${i + 1}. ${bay.bay.name} (${bay.bay.code})`);
            console.log(`      Total órdenes: ${bay.summary.totalOrders || 0}`);
            console.log(
              `      Horas ocupadas: ${bay.summary.occupiedHours || 0}h`
            );
            console.log(
              `      Horas técnicos: ${bay.summary.totalTechnicianHours || 0}h`
            );
            console.log(
              `      Promedio/orden: ${bay.summary.averageOrderDuration || 0}h`
            );
          });

        // Calcular totales
        const totals = data.report
          .filter((bay) => bay.summary)
          .reduce(
            (acc, bay) => ({
              orders: acc.orders + (bay.summary.totalOrders || 0),
              hours: acc.hours + (bay.summary.occupiedHours || 0),
              techHours:
                acc.techHours + (bay.summary.totalTechnicianHours || 0),
            }),
            { orders: 0, hours: 0, techHours: 0 }
          );

        console.log(`\n   📊 Totales generales:`);
        console.log(`      Total órdenes: ${totals.orders}`);
        console.log(`      Total horas ocupadas: ${totals.hours.toFixed(2)}h`);
        console.log(
          `      Total horas técnicos: ${totals.techHours.toFixed(2)}h`
        );
      } else {
        console.log("\n   ℹ️  No hay datos de utilización aún");
      }

      return true;
    }

    console.log("❌ Error al generar reporte");
    return false;
  } catch (error) {
    console.log("❌ Error:", error.message);
    return false;
  }
}

/**
 * TEST 9: Historial de una bahía específica
 */
async function testBayHistory() {
  console.log("\n📜 TEST 9: Historial de bahía específica");
  console.log("=".repeat(60));

  if (testData.bays.length === 0) {
    console.log("⚠️  No hay bahías disponibles");
    return false;
  }

  const bay = testData.bays[0];

  try {
    const response = await makeRequest(
      "GET",
      `/api/reports/bays/${bay._id}/history`
    );

    if (response.statusCode === 200) {
      const data = response.body;

      console.log(`✅ Historial de ${bay.name}:`);
      console.log(`   Total órdenes: ${data.summary.totalOrders}`);
      console.log(`   Total horas: ${data.summary.totalHours}h`);
      console.log(`   Promedio: ${data.summary.averageDuration}h`);

      if (data.history && data.history.length > 0) {
        console.log(
          `\n   📋 Últimas ${Math.min(3, data.history.length)} órdenes:`
        );
        data.history.slice(0, 3).forEach((record, i) => {
          console.log(
            `\n   ${i + 1}. OT: ${record.workOrder?.numeroOrden || "N/A"}`
          );
          console.log(`      Duración: ${record.duration}h`);
          console.log(`      Técnicos: ${record.technicians?.length || 0}`);
          console.log(
            `      Entrada: ${new Date(record.entryTime).toLocaleString()}`
          );
          console.log(
            `      Salida: ${record.exitTime ? new Date(record.exitTime).toLocaleString() : "En progreso"}`
          );
        });
      }

      return true;
    }

    console.log("❌ Error al obtener historial");
    return false;
  } catch (error) {
    console.log("❌ Error:", error.message);
    return false;
  }
}

/**
 * TEST 10: Flujo completo - Asignar y completar trabajo
 */
async function testCompleteWorkflow() {
  console.log("\n🔄 TEST 10: Flujo completo - Asignar y completar");
  console.log("=".repeat(60));

  // Necesitamos bahía disponible, técnico, y orden de trabajo
  try {
    // 1. Obtener bahía disponible
    const baysResponse = await makeRequest(
      "GET",
      "/api/service-bays/available"
    );
    if (
      baysResponse.statusCode !== 200 ||
      !baysResponse.body.bays ||
      baysResponse.body.bays.length === 0
    ) {
      console.log("⚠️  No hay bahías disponibles");
      return false;
    }
    const availableBay = baysResponse.body.bays[0];

    // 2. Obtener orden de trabajo
    const woResponse = await makeRequest("GET", "/api/work-orders?limit=1");
    if (
      woResponse.statusCode !== 200 ||
      !woResponse.body.data ||
      woResponse.body.data.length === 0
    ) {
      console.log("⚠️  No hay órdenes de trabajo disponibles");
      return false;
    }
    const workOrder = woResponse.body.data[0];

    // 3. Obtener técnico
    if (testData.technicians.length === 0) {
      console.log("⚠️  No hay técnicos disponibles");
      return false;
    }
    const technician = testData.technicians[0];

    console.log("\n   📝 Datos del flujo:");
    console.log(`   Bahía: ${availableBay.name}`);
    console.log(
      `   Técnico: ${technician.nombre} ${technician.apellido || ""}`
    );
    console.log(`   OT: ${workOrder.numeroOrden}`);

    // 4. Asignar técnico a bahía (entrada)
    console.log("\n   🚪 Registrando entrada...");
    const enterResponse = await makeRequest(
      "POST",
      `/api/work-orders/${workOrder._id}/enter-bay`,
      {
        serviceBay: availableBay._id,
        technician: technician.uid || technician._id,
        role: "principal",
        estimatedHours: 2,
      }
    );

    if (enterResponse.statusCode !== 201 && enterResponse.statusCode !== 200) {
      console.log("   ❌ Error al registrar entrada");
      return false;
    }

    console.log("   ✅ Entrada registrada");
    const assignment =
      enterResponse.body.assignments?.[0] || enterResponse.body;

    // 5. Simular trabajo (2 segundos)
    console.log("\n   ⏱️  Simulando trabajo (2 segundos)...");
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 6. Registrar salida
    console.log("\n   🚪 Registrando salida...");
    const exitResponse = await makeRequest(
      "POST",
      `/api/work-orders/${workOrder._id}/exit-bay`,
      {
        technician: technician.uid || technician._id,
        exitNotes: "Trabajo completado satisfactoriamente",
        exitReason: "completado",
      }
    );

    if (exitResponse.statusCode !== 200) {
      console.log("   ❌ Error al registrar salida");
      return false;
    }

    const exitData = exitResponse.body.assignments?.[0] || exitResponse.body;
    console.log("   ✅ Salida registrada");
    console.log(`   ⏱️  Horas trabajadas: ${exitData.hoursWorked || 0}h`);

    // 7. Verificar que la bahía quedó disponible
    const bayCheckResponse = await makeRequest(
      "GET",
      `/api/service-bays/${availableBay._id}`
    );
    if (bayCheckResponse.statusCode === 200) {
      const updatedBay = bayCheckResponse.body.bay;
      console.log(`   📊 Estado final bahía: ${updatedBay.status}`);

      if (updatedBay.status === "disponible") {
        console.log("   ✅ Bahía liberada correctamente");
      }
    }

    return true;
  } catch (error) {
    console.log("❌ Error:", error.message);
    return false;
  }
}

/**
 * Ejecutar todos los tests
 */
async function runAllTests() {
  console.log("\n╔════════════════════════════════════════════════════╗");
  console.log("║    TEST AVANZADO: SISTEMA DE BAHÍAS DE SERVICIO  ║");
  console.log("╚════════════════════════════════════════════════════╝");

  const tests = [
    { name: "Autenticación", fn: testAuthentication },
    { name: "Listar bahías", fn: testListAllBays },
    { name: "Filtrar por área", fn: testFilterBaysByArea },
    { name: "Bahías disponibles", fn: testGetAvailableBays },
    { name: "Obtener técnicos", fn: testGetTechnicians },
    { name: "Dashboard", fn: testDashboard },
    { name: "Reporte horas técnicos", fn: testTechnicianHoursReport },
    { name: "Reporte utilización", fn: testBayUtilizationReport },
    { name: "Historial bahía", fn: testBayHistory },
    { name: "Flujo completo", fn: testCompleteWorkflow },
  ];

  const results = [];

  for (const test of tests) {
    try {
      const passed = await test.fn();
      results.push({ name: test.name, passed });
    } catch (error) {
      console.log(`\n❌ Error en test "${test.name}":`, error.message);
      results.push({ name: test.name, passed: false });
    }
  }

  // Resumen
  console.log("\n\n╔════════════════════════════════════════════════════╗");
  console.log("║                  RESUMEN DE TESTS                  ║");
  console.log("╚════════════════════════════════════════════════════╝\n");

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  results.forEach((result, i) => {
    const icon = result.passed ? "✅" : "❌";
    console.log(`${icon} Test ${i + 1}: ${result.name}`);
  });

  console.log(`\n${"=".repeat(60)}`);
  console.log(`✅ Tests exitosos: ${passed}`);
  console.log(`❌ Tests fallidos: ${failed}`);
  console.log(`📊 Total: ${results.length}`);
  console.log(`${"=".repeat(60)}\n`);

  if (failed === 0) {
    console.log("🎉 ¡Todos los tests pasaron exitosamente!\n");
  } else {
    console.log("⚠️  Algunos tests fallaron. Revisar logs arriba.\n");
  }

  process.exit(failed === 0 ? 0 : 1);
}

// Ejecutar
runAllTests().catch((error) => {
  console.error("Error fatal:", error);
  process.exit(1);
});
