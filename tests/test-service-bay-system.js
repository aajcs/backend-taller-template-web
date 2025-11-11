/**
 * Test para Sistema de Bahías de Servicio (Service Bay)
 *
 * Este test valida:
 * 1. Creación de bahías
 * 2. Asignación de técnicos a bahías (entrada)
 * 3. Registro de salida y cálculo de horas
 * 4. Dashboard de estado del taller
 * 5. Reportes de horas trabajadas
 */

const http = require("http");

const BASE_URL = "localhost";
const PORT = 4000;

// Token de autenticación (reemplazar con un token válido)
let AUTH_TOKEN = "";

// IDs que se usarán en las pruebas
let bayId = null;
let workOrderId = "690ea178e825d4af4f088605"; // Orden existente
let technicianId = null;
let assignmentId = null;

/**
 * Helper para hacer requests HTTP
 */
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: PORT,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
        "x-token": AUTH_TOKEN,
      },
    };

    const req = http.request(options, (res) => {
      let body = "";

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        try {
          const response = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: response,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
          });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Test 1: Autenticación
 */
async function testAuthentication() {
  console.log("\n🔐 Test 1: Autenticación");
  console.log("==========================================");

  try {
    const response = await makeRequest("POST", "/api/auth/login", {
      correo: "superadmin@taller.com",
      password: "SuperAdmin123!",
    });

    if (response.statusCode === 200 && response.body.token) {
      AUTH_TOKEN = response.body.token;
      console.log("✅ Autenticación exitosa");
      console.log(`   Token obtenido: ${AUTH_TOKEN.substring(0, 20)}...`);
      return true;
    } else {
      console.log("❌ Autenticación fallida");
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Response:`, response.body);
      return false;
    }
  } catch (error) {
    console.log("❌ Error en autenticación:", error.message);
    return false;
  }
}

/**
 * Test 2: Crear Bahía de Servicio
 */
async function testCreateServiceBay() {
  console.log("\n🏗️  Test 2: Crear Bahía de Servicio");
  console.log("==========================================");

  try {
    // Generar código único para evitar duplicados
    const timestamp = Date.now().toString().slice(-6);
    const bayData = {
      name: "Bahía de Prueba 1",
      code: `BAY-TEST-${timestamp}`,
      area: "mecanica",
      capacity: "multiple",
      equipment: [
        "Elevador 2 columnas",
        "Compresor",
        "Herramientas eléctricas",
      ],
      maxTechnicians: 2,
      isActive: true,
      order: 1,
    };

    const response = await makeRequest("POST", "/api/service-bays", bayData);

    if (response.statusCode === 201 && response.body.ok) {
      bayId = response.body.bay._id;
      console.log("✅ Bahía creada exitosamente");
      console.log(`   ID: ${bayId}`);
      console.log(`   Nombre: ${response.body.bay.name}`);
      console.log(`   Código: ${response.body.bay.code}`);
      console.log(`   Estado: ${response.body.bay.status}`);
      return true;
    } else {
      console.log("❌ Error al crear bahía");
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Response:`, response.body);
      return false;
    }
  } catch (error) {
    console.log("❌ Error en crear bahía:", error.message);
    return false;
  }
}

/**
 * Test 3: Obtener Bahías Disponibles
 */
async function testGetAvailableBays() {
  console.log("\n📋 Test 3: Obtener Bahías Disponibles");
  console.log("==========================================");

  try {
    const response = await makeRequest("GET", "/api/service-bays/available");

    if (response.statusCode === 200 && response.body.ok) {
      console.log("✅ Bahías disponibles obtenidas");
      console.log(`   Total: ${response.body.total}`);
      response.body.bays.slice(0, 3).forEach((bay) => {
        console.log(`   - ${bay.name} (${bay.code}) - ${bay.area}`);
      });
      return true;
    } else {
      console.log("❌ Error al obtener bahías");
      console.log(`   Status: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
    return false;
  }
}

/**
 * Test 4: Obtener Técnicos (para usar en asignación)
 */
async function testGetTechnicians() {
  console.log("\n👷 Test 4: Obtener Técnicos");
  console.log("==========================================");

  try {
    const response = await makeRequest("GET", "/api/user");

    if (response.statusCode === 200 && response.body.users) {
      if (response.body.users.length > 0) {
        technicianId = response.body.users[0].uid || response.body.users[0]._id;
        console.log("✅ Técnico encontrado");
        console.log(`   ID: ${technicianId}`);
        console.log(`   Nombre: ${response.body.users[0].nombre}`);
        return true;
      } else {
        console.log("⚠️  No hay técnicos disponibles");
        return false;
      }
    } else {
      console.log("❌ Error al obtener técnicos");
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Response:`, response.body);
      return false;
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
    return false;
  }
}

/**
 * Test 5: Asignar Técnico a Bahía (Entrada)
 */
async function testEnterBay() {
  console.log("\n🚪 Test 5: Asignar Técnico a Bahía (Entrada)");
  console.log("==========================================");

  if (!bayId || !technicianId || !workOrderId) {
    console.log("⚠️  Faltan IDs necesarios para el test");
    return false;
  }

  try {
    const entryData = {
      serviceBay: bayId,
      technician: technicianId,
      role: "principal",
      entryNotes: "Iniciando reparación de frenos",
      estimatedHours: 2,
    };

    const response = await makeRequest(
      "POST",
      `/api/work-orders/${workOrderId}/enter-bay`,
      entryData
    );

    if (response.statusCode === 201 && response.body.ok) {
      assignmentId = response.body.assignments[0]._id;
      console.log("✅ Técnico asignado a bahía exitosamente");
      console.log(`   Assignment ID: ${assignmentId}`);
      console.log(
        `   Bahía: ${response.body.bay.name} (${response.body.bay.code})`
      );
      console.log(`   Estado bahía: ${response.body.bay.status}`);
      console.log(
        `   Técnico: ${response.body.assignments[0].technician.nombre}`
      );
      console.log(`   Hora entrada: ${response.body.assignments[0].entryTime}`);
      return true;
    } else {
      console.log("❌ Error al asignar técnico");
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Response:`, response.body);
      return false;
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
    return false;
  }
}

/**
 * Test 6: Obtener Estado del Taller (Dashboard)
 */
async function testGetTallerStatus() {
  console.log("\n📊 Test 6: Dashboard - Estado del Taller");
  console.log("==========================================");

  try {
    const response = await makeRequest("GET", "/api/dashboard/taller-status");

    if (response.statusCode === 200 && response.body.ok) {
      console.log("✅ Estado del taller obtenido");
      console.log(`   Total bahías: ${response.body.summary.totalBays}`);
      console.log(`   Bahías ocupadas: ${response.body.summary.occupiedBays}`);
      console.log(
        `   Bahías disponibles: ${response.body.summary.availableBays}`
      );
      console.log(`   Utilización: ${response.body.summary.utilizationRate}%`);

      if (response.body.activeBays.length > 0) {
        console.log("\n   Bahías activas:");
        response.body.activeBays.forEach((bay) => {
          console.log(`   - ${bay.bay.name}:`);
          console.log(`     OT: ${bay.workOrder?.numeroOrden || "N/A"}`);
          console.log(`     Vehículo: ${bay.workOrder?.vehicle || "N/A"}`);
          console.log(`     Técnicos: ${bay.technicians.length}`);
        });
      }
      return true;
    } else {
      console.log("❌ Error al obtener estado");
      console.log(`   Status: ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
    return false;
  }
}

/**
 * Test 7: Simular trabajo (esperar un momento)
 */
async function testSimulateWork() {
  console.log("\n⏱️  Test 7: Simulando trabajo...");
  console.log("==========================================");
  console.log("   Esperando 5 segundos para simular tiempo de trabajo...");

  return new Promise((resolve) => {
    setTimeout(() => {
      console.log("✅ Tiempo de trabajo simulado");
      resolve(true);
    }, 5000);
  });
}

/**
 * Test 8: Registrar Salida de Bahía
 */
async function testExitBay() {
  console.log("\n🚪 Test 8: Registrar Salida de Bahía");
  console.log("==========================================");

  if (!technicianId || !workOrderId) {
    console.log("⚠️  Faltan IDs necesarios para el test");
    return false;
  }

  try {
    const exitData = {
      technician: technicianId,
      exitNotes: "Cambio de pastillas completado. Sistema probado OK.",
      exitReason: "completado",
    };

    const response = await makeRequest(
      "POST",
      `/api/work-orders/${workOrderId}/exit-bay`,
      exitData
    );

    if (response.statusCode === 200 && response.body.ok) {
      console.log("✅ Salida registrada exitosamente");
      console.log(
        `   Técnico: ${response.body.assignments[0].technician.nombre}`
      );
      console.log(
        `   Horas trabajadas: ${response.body.assignments[0].hoursWorked}`
      );
      console.log(
        `   Duración: ${response.body.assignments[0].duration?.formatted}`
      );
      console.log(`   Estado bahía: ${response.body.bay.status}`);
      console.log(
        `   Total horas OT: ${response.body.workOrder.totalHoursWorked}`
      );
      return true;
    } else {
      console.log("❌ Error al registrar salida");
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Response:`, response.body);
      return false;
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
    return false;
  }
}

/**
 * Test 9: Obtener Historial de Asignaciones de Técnico
 */
async function testGetTechnicianAssignments() {
  console.log("\n📖 Test 9: Historial de Asignaciones del Técnico");
  console.log("==========================================");

  if (!technicianId) {
    console.log("⚠️  Falta ID de técnico");
    return false;
  }

  try {
    const response = await makeRequest(
      "GET",
      `/api/work-orders/technicians/${technicianId}/assignments`
    );

    if (response.statusCode === 200 && response.body.ok) {
      console.log("✅ Historial obtenido");
      console.log(`   Total asignaciones: ${response.body.total}`);
      console.log(`   Total horas: ${response.body.totalHoursWorked}`);

      if (response.body.assignments && response.body.assignments.length > 0) {
        console.log("\n   Últimas asignaciones:");
        response.body.assignments.slice(0, 3).forEach((a, i) => {
          console.log(`   ${i + 1}. OT: ${a.workOrder?.numeroOrden || "N/A"}`);
          console.log(`      Bahía: ${a.serviceBay?.name || "N/A"}`);
          console.log(`      Horas: ${a.hoursWorked || 0}`);
          console.log(`      Estado: ${a.status}`);
        });
      }
      return true;
    } else {
      console.log("❌ Error al obtener historial");
      console.log(`   Status: ${response.statusCode}`);
      console.log(`   Response:`, response.body);
      return false;
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
    return false;
  }
}

/**
 * Test 10: Reporte de Horas por Técnico
 */
async function testTechnicianHoursReport() {
  console.log("\n📊 Test 10: Reporte de Horas por Técnico");
  console.log("==========================================");

  try {
    const response = await makeRequest("GET", "/api/reports/technician-hours");

    if (response.statusCode === 200 && response.body.ok) {
      console.log("✅ Reporte generado");
      console.log(`   Total técnicos: ${response.body.totalTechnicians}`);

      if (response.body.report && response.body.report.length > 0) {
        console.log("\n   Resumen por técnico:");
        response.body.report.slice(0, 3).forEach((tech, i) => {
          console.log(
            `   ${i + 1}. ${tech.technician.nombre} ${tech.technician.apellido}`
          );
          console.log(`      Asignaciones: ${tech.summary.totalAssignments}`);
          console.log(`      Horas totales: ${tech.summary.totalHoursWorked}`);
          console.log(
            `      Promedio/orden: ${tech.summary.averageHoursPerAssignment}h`
          );
        });
      }
      return true;
    } else {
      console.log("❌ Error al generar reporte");
      return false;
    }
  } catch (error) {
    console.log("❌ Error:", error.message);
    return false;
  }
}

/**
 * Test 11: Limpiar datos de prueba
 */
async function testCleanup() {
  console.log("\n🧹 Test 11: Limpieza de Datos de Prueba");
  console.log("==========================================");

  if (!bayId) {
    console.log("⚠️  No hay bahía para eliminar");
    return true;
  }

  try {
    const response = await makeRequest("DELETE", `/api/service-bays/${bayId}`);

    if (response.statusCode === 200 && response.body.ok) {
      console.log("✅ Bahía de prueba eliminada");
      return true;
    } else {
      console.log("⚠️  No se pudo eliminar la bahía de prueba");
      console.log(`   Status: ${response.statusCode}`);
      return true; // No fallar el test por esto
    }
  } catch (error) {
    console.log("⚠️  Error al limpiar:", error.message);
    return true; // No fallar el test por esto
  }
}

/**
 * Ejecutar todos los tests
 */
async function runAllTests() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════╗");
  console.log("║   TEST SUITE: SISTEMA DE BAHÍAS DE SERVICIO      ║");
  console.log("╚════════════════════════════════════════════════════╝");

  const results = [];

  // Ejecutar tests en secuencia
  results.push(await testAuthentication());
  if (!results[results.length - 1]) {
    console.log("\n❌ Tests detenidos: Autenticación fallida");
    return;
  }

  results.push(await testCreateServiceBay());
  results.push(await testGetAvailableBays());
  results.push(await testGetTechnicians());
  results.push(await testEnterBay());
  results.push(await testGetTallerStatus());
  results.push(await testSimulateWork());
  results.push(await testExitBay());
  results.push(await testGetTechnicianAssignments());
  results.push(await testTechnicianHoursReport());
  results.push(await testCleanup());

  // Resumen
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════╗");
  console.log("║                  RESUMEN DE TESTS                  ║");
  console.log("╚════════════════════════════════════════════════════╝");

  const passed = results.filter((r) => r === true).length;
  const failed = results.filter((r) => r === false).length;

  console.log(`\n✅ Tests exitosos: ${passed}`);
  console.log(`❌ Tests fallidos: ${failed}`);
  console.log(`📊 Total: ${results.length}`);

  if (failed === 0) {
    console.log("\n🎉 ¡Todos los tests pasaron exitosamente!");
  } else {
    console.log("\n⚠️  Algunos tests fallaron. Revisar logs arriba.");
  }

  console.log("\n");
}

// Ejecutar tests
runAllTests().catch((error) => {
  console.error("❌ Error fatal en tests:", error);
  process.exit(1);
});
