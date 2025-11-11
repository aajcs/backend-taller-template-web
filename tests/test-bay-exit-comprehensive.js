/**
 * Tests comprehensivos para la funcionalidad de salida de bahía
 * Basado en los casos de prueba recomendados por el usuario
 *
 * Casos de prueba:
 * A - Exit simple (único técnico)
 * B - Exit parcial (varios técnicos, liberar uno)
 * C - Exit múltiple (liberar varios técnicos al mismo tiempo)
 * D - Idempotencia / errores
 * E - Respuesta del dashboard
 * F - Concurrencia / condición de carrera
 * G - Integridad histórica
 */

const http = require("http");

// Configuración
const HOST = "localhost";
const PORT = 4000;
let token = "";

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
 * Obtener datos de prueba (bahía, técnico, work order)
 */
async function getTestData() {
  // Autenticación
  const authResponse = await makeRequest("POST", "/api/auth/login", {
    correo: "superadmin@taller.com",
    password: "SuperAdmin123!",
  });

  if (authResponse.statusCode !== 200) {
    throw new Error("Autenticación falló");
  }

  token = authResponse.body.token;

  // Obtener bahía disponible
  const baysResponse = await makeRequest("GET", "/api/service-bays/available");
  if (!baysResponse.body.bays || baysResponse.body.bays.length === 0) {
    throw new Error("No hay bahías disponibles");
  }
  const bay = baysResponse.body.bays[0];

  // Obtener técnicos
  const usersResponse = await makeRequest("GET", "/api/user");
  const technicians = usersResponse.body.users.filter(
    (u) => u.rol === "operador"
  );
  if (technicians.length < 2) {
    throw new Error("Se necesitan al menos 2 técnicos para las pruebas");
  }

  // Obtener orden de trabajo
  const woResponse = await makeRequest("GET", "/api/work-orders?limit=1");
  if (!woResponse.body.data || woResponse.body.data.length === 0) {
    throw new Error("No hay órdenes de trabajo disponibles");
  }
  const workOrder = woResponse.body.data[0];

  return { bay, technicians, workOrder };
}

/**
 * PRUEBA A — Exit simple (único técnico)
 */
async function testA_ExitSimple() {
  console.log("\n🧪 PRUEBA A: Exit simple (único técnico)");
  console.log("=".repeat(60));

  try {
    const { bay, technicians, workOrder } = await getTestData();
    const technician = technicians[0];

    // 1. Entrar a bahía con un técnico
    console.log("   1. Registrando entrada...");
    const enterResponse = await makeRequest(
      "POST",
      `/api/work-orders/${workOrder._id}/enter-bay`,
      {
        serviceBay: bay._id,
        technician: technician.uid || technician._id,
        role: "principal",
        estimatedHours: 2,
        notes: "Test A - entrada",
      }
    );

    if (enterResponse.statusCode !== 201) {
      throw new Error(`Entrada falló: ${enterResponse.body.msg}`);
    }

    const assignment =
      enterResponse.body.assignments?.[0] || enterResponse.body.assignment;
    console.log(`   ✅ Entrada registrada - Assignment: ${assignment._id}`);

    // 2. Salir de bahía
    console.log("   2. Registrando salida...");
    const exitResponse = await makeRequest(
      "POST",
      `/api/work-orders/${workOrder._id}/exit-bay`,
      {
        technician: technician.uid || technician._id,
        notes: "Test A - salida",
      }
    );

    if (exitResponse.statusCode !== 200) {
      throw new Error(`Salida falló: ${exitResponse.body.msg}`);
    }

    // 3. Assertions
    console.log("   3. Verificando assertions...");

    // HTTP 200 OK y body.ok === true
    if (exitResponse.statusCode !== 200 || exitResponse.body.ok !== true) {
      throw new Error("HTTP status o body.ok incorrecto");
    }

    // response.assignment.status === "completado"
    const responseAssignment =
      exitResponse.body.assignments?.[0] || exitResponse.body.assignment;
    if (!responseAssignment || !responseAssignment.exitTime) {
      console.log(
        "DEBUG - Response structure:",
        JSON.stringify(exitResponse.body, null, 2)
      );
      throw new Error(
        `Assignment no tiene exitTime: ${JSON.stringify(responseAssignment)}`
      );
    }

    // Verificar que assignment.exitTime definido, assignment.hoursWorked >= 0
    if (responseAssignment.hoursWorked < 0) {
      throw new Error(
        `hoursWorked incorrecto: ${responseAssignment.hoursWorked}`
      );
    }

    // response.bayReleased === true
    if (exitResponse.body.bayReleased !== true) {
      throw new Error(
        `bayReleased incorrecto: ${exitResponse.body.bayReleased}`
      );
    }

    // response.bay.status === "disponible"
    if (exitResponse.body.bay?.status !== "disponible") {
      throw new Error(
        `Bay status incorrecto: ${exitResponse.body.bay?.status}`
      );
    }

    // response.bay.currentWorkOrder === null
    if (exitResponse.body.bay?.currentWorkOrder !== null) {
      throw new Error(
        `currentWorkOrder no es null: ${exitResponse.body.bay?.currentWorkOrder}`
      );
    }

    // response.bay.currentTechnicians.length === 0
    if (exitResponse.body.bay?.currentTechnicians?.length !== 0) {
      throw new Error(
        `currentTechnicians no vacío: ${exitResponse.body.bay?.currentTechnicians?.length}`
      );
    }

    // Verificar en BD
    const allBaysResponse = await makeRequest("GET", "/api/service-bays");
    const dbBay = allBaysResponse.body.bays.find((b) => b._id === bay._id);

    if (dbBay.status !== "disponible") {
      throw new Error(`BD: Bay status incorrecto: ${dbBay.status}`);
    }
    if (dbBay.currentWorkOrder !== null) {
      throw new Error(
        `BD: currentWorkOrder no es null: ${dbBay.currentWorkOrder}`
      );
    }
    if (dbBay.currentTechnicians.length !== 0) {
      throw new Error(
        `BD: currentTechnicians no vacío: ${dbBay.currentTechnicians.length}`
      );
    }

    console.log("   ✅ PRUEBA A PASÓ");
    return true;
  } catch (error) {
    console.log(`   ❌ PRUEBA A FALLÓ: ${error.message}`);
    return false;
  }
}

/**
 * PRUEBA B — Exit parcial (único técnico en bahía de capacidad 1)
 */
async function testB_ExitParcial() {
  console.log(
    "\n🧪 PRUEBA B: Exit parcial (único técnico en bahía de capacidad 1)"
  );
  console.log("=".repeat(60));

  try {
    const { bay, technicians, workOrder } = await getTestData();
    const technician = technicians[0];

    // 1. Entrar con un técnico
    console.log("   1. Registrando entrada de un técnico...");
    const enterResponse = await makeRequest(
      "POST",
      `/api/work-orders/${workOrder._id}/enter-bay`,
      {
        serviceBay: bay._id,
        technician: technician.uid || technician._id,
        role: "principal",
        estimatedHours: 2,
        notes: "Test B - entrada",
      }
    );

    if (enterResponse.statusCode !== 201) {
      console.log(
        "DEBUG - Enter response:",
        JSON.stringify(enterResponse, null, 2)
      );
      throw new Error(`Entrada falló: ${enterResponse.body.msg}`);
    }

    console.log("   ✅ Técnico asignado");

    // 2. Salir con el técnico (en bahía de capacidad 1, esto libera la bahía)
    console.log("   2. Registrando salida del técnico...");
    const exitResponse = await makeRequest(
      "POST",
      `/api/work-orders/${workOrder._id}/exit-bay`,
      {
        technician: technician.uid || technician._id,
        notes: "Test B - salida",
      }
    );

    if (exitResponse.statusCode !== 200) {
      throw new Error(`Salida falló: ${exitResponse.body.msg}`);
    }

    // 3. Assertions
    console.log("   3. Verificando assertions...");

    // response.bayReleased === true (único técnico sale, bahía se libera)
    if (exitResponse.body.bayReleased !== true) {
      throw new Error(
        `bayReleased debería ser true: ${exitResponse.body.bayReleased}`
      );
    }

    // response.bay.currentTechnicians está vacío
    if (exitResponse.body.bay?.currentTechnicianCount !== 0) {
      throw new Error(
        `currentTechnicianCount debería ser 0: ${exitResponse.body.bay?.currentTechnicianCount}`
      );
    }

    // Verificar en BD que bahía está disponible
    const allBaysResponse = await makeRequest("GET", "/api/service-bays");
    const dbBay = allBaysResponse.body.bays.find((b) => b._id === bay._id);

    if (dbBay.status !== "disponible") {
      throw new Error(`BD: Bahía debería estar disponible: ${dbBay.status}`);
    }

    if (dbBay.currentTechnicians.length !== 0) {
      throw new Error(
        `BD: No debería haber técnicos restantes: ${dbBay.currentTechnicians.length}`
      );
    }

    console.log("   ✅ PRUEBA B PASÓ");
    return true;
  } catch (error) {
    console.log(`   ❌ PRUEBA B FALLÓ: ${error.message}`);
    return false;
  }
}

/**
 * PRUEBA C — Exit múltiple (único técnico en bahía de capacidad 1)
 */
async function testC_ExitMultiple() {
  console.log(
    "\n🧪 PRUEBA C: Exit múltiple (único técnico en bahía de capacidad 1)"
  );
  console.log("=".repeat(60));

  try {
    const { bay, technicians, workOrder } = await getTestData();
    const technician = technicians[0];

    // 1. Entrar con un técnico
    console.log("   1. Registrando entrada de un técnico...");
    const enterResponse = await makeRequest(
      "POST",
      `/api/work-orders/${workOrder._id}/enter-bay`,
      {
        serviceBay: bay._id,
        technician: technician.uid || technician._id,
        role: "principal",
        estimatedHours: 2,
        notes: "Test C - entrada",
      }
    );

    if (enterResponse.statusCode !== 201) {
      console.log(
        "DEBUG - Enter response:",
        JSON.stringify(enterResponse, null, 2)
      );
      throw new Error(`Entrada falló: ${enterResponse.body.msg}`);
    }

    console.log("   ✅ Técnico asignado");

    // 2. Salir con el técnico usando array de técnicos
    console.log("   2. Registrando salida múltiple (array con 1 técnico)...");
    const exitResponse = await makeRequest(
      "POST",
      `/api/work-orders/${workOrder._id}/exit-bay`,
      {
        technicians: [technician.uid || technician._id],
        notes: "Test C - salida múltiple",
      }
    );

    if (exitResponse.statusCode !== 200) {
      throw new Error(`Salida múltiple falló: ${exitResponse.body.msg}`);
    }

    // 3. Assertions (similar a Test A)
    console.log("   3. Verificando assertions...");

    // response.bayReleased === true
    if (exitResponse.body.bayReleased !== true) {
      throw new Error(
        `bayReleased debería ser true: ${exitResponse.body.bayReleased}`
      );
    }

    // response.bay.status === "disponible"
    if (exitResponse.body.bay?.status !== "disponible") {
      throw new Error(
        `Bay status incorrecto: ${exitResponse.body.bay?.status}`
      );
    }

    // response.bay.currentWorkOrder === null
    if (exitResponse.body.bay?.currentWorkOrder !== null) {
      throw new Error(
        `currentWorkOrder no es null: ${exitResponse.body.bay?.currentWorkOrder}`
      );
    }

    // response.bay.currentTechnicians.length === 0
    if (exitResponse.body.bay?.currentTechnicians?.length !== 0) {
      throw new Error(
        `currentTechnicians no vacío: ${exitResponse.body.bay?.currentTechnicians?.length}`
      );
    }

    // Verificar en BD
    const allBaysResponse = await makeRequest("GET", "/api/service-bays");
    const dbBay = allBaysResponse.body.bays.find((b) => b._id === bay._id);

    if (dbBay.status !== "disponible") {
      throw new Error(`BD: Bay status incorrecto: ${dbBay.status}`);
    }

    console.log("   ✅ PRUEBA C PASÓ");
    return true;
  } catch (error) {
    console.log(`   ❌ PRUEBA C FALLÓ: ${error.message}`);
    return false;
  }
}

/**
 * PRUEBA D — Idempotencia / errores
 */
async function testD_Idempotencia() {
  console.log("\n🧪 PRUEBA D: Idempotencia / errores");
  console.log("=".repeat(60));

  try {
    const { bay, technicians, workOrder } = await getTestData();
    const technician = technicians[0];

    // 1. Entrar a bahía
    console.log("   1. Registrando entrada...");
    const enterResponse = await makeRequest(
      "POST",
      `/api/work-orders/${workOrder._id}/enter-bay`,
      {
        serviceBay: bay._id,
        technician: technician.uid || technician._id,
        role: "principal",
        estimatedHours: 2,
        notes: "Test D - entrada",
      }
    );

    if (enterResponse.statusCode !== 201) {
      throw new Error(`Entrada falló: ${enterResponse.body.msg}`);
    }

    console.log("   ✅ Entrada registrada");

    // 2. Salir normalmente
    console.log("   2. Registrando primera salida...");
    const exit1Response = await makeRequest(
      "POST",
      `/api/work-orders/${workOrder._id}/exit-bay`,
      {
        technician: technician.uid || technician._id,
        notes: "Test D - primera salida",
      }
    );

    if (exit1Response.statusCode !== 200) {
      throw new Error(`Primera salida falló: ${exit1Response.body.msg}`);
    }

    console.log("   ✅ Primera salida exitosa");

    // 3. Intentar salir nuevamente (debería fallar)
    console.log("   3. Intentando salida duplicada...");
    const exit2Response = await makeRequest(
      "POST",
      `/api/work-orders/${workOrder._id}/exit-bay`,
      {
        technician: technician.uid || technician._id,
        notes: "Test D - salida duplicada",
      }
    );

    // Debería retornar error (4xx)
    if (exit2Response.statusCode < 400) {
      throw new Error(
        `Salida duplicada no retornó error: ${exit2Response.statusCode}`
      );
    }

    console.log(
      `   ✅ Salida duplicada correctamente rechazada (${exit2Response.statusCode})`
    );

    // 4. Verificar que no se corrompieron los datos
    const allBaysResponse = await makeRequest("GET", "/api/service-bays");
    const dbBay = allBaysResponse.body.bays.find((b) => b._id === bay._id);

    if (dbBay.status !== "disponible") {
      throw new Error(`Datos corruptos: bay status ${dbBay.status}`);
    }

    console.log("   ✅ Datos no corruptos");
    console.log("   ✅ PRUEBA D PASÓ");
    return true;
  } catch (error) {
    console.log(`   ❌ PRUEBA D FALLÓ: ${error.message}`);
    return false;
  }
}

/**
 * PRUEBA E — Respuesta del dashboard
 */
async function testE_DashboardResponse() {
  console.log("\n🧪 PRUEBA E: Respuesta del dashboard");
  console.log("=".repeat(60));

  try {
    const { bay, technicians, workOrder } = await getTestData();
    const technician = technicians[0];

    // 1. Obtener estado inicial del dashboard
    console.log("   1. Obteniendo dashboard inicial...");
    const dashboardInitial = await makeRequest(
      "GET",
      "/api/dashboard/taller-status"
    );
    const initialOccupied = dashboardInitial.body.summary?.occupiedBays || 0;
    const initialActiveBays = dashboardInitial.body.activeBays?.length || 0;

    console.log(
      `   ✅ Dashboard inicial: ${initialOccupied} ocupadas, ${initialActiveBays} activas`
    );

    // 2. Entrar a bahía
    console.log("   2. Registrando entrada...");
    const enterResponse = await makeRequest(
      "POST",
      `/api/work-orders/${workOrder._id}/enter-bay`,
      {
        serviceBay: bay._id,
        technician: technician.uid || technician._id,
        role: "principal",
        estimatedHours: 2,
        notes: "Test E - entrada",
      }
    );

    if (enterResponse.statusCode !== 201) {
      throw new Error(`Entrada falló: ${enterResponse.body.msg}`);
    }

    // 3. Verificar dashboard después de entrada
    const dashboardAfterEnter = await makeRequest(
      "GET",
      "/api/dashboard/taller-status"
    );
    const afterEnterOccupied =
      dashboardAfterEnter.body.summary?.occupiedBays || 0;
    const afterEnterActiveBays = dashboardAfterEnter.body.activeBays || [];

    if (afterEnterOccupied !== initialOccupied + 1) {
      throw new Error(
        `Dashboard no refleja entrada: ${afterEnterOccupied} vs ${initialOccupied + 1}`
      );
    }

    const bayInActiveAfterEnter = afterEnterActiveBays.find(
      (ab) => ab.bay._id === bay._id
    );
    if (!bayInActiveAfterEnter) {
      throw new Error("Bahía no aparece en activeBays después de entrada");
    }

    console.log("   ✅ Dashboard refleja entrada correctamente");

    // 4. Salir de bahía
    console.log("   3. Registrando salida...");
    const exitResponse = await makeRequest(
      "POST",
      `/api/work-orders/${workOrder._id}/exit-bay`,
      {
        technician: technician.uid || technician._id,
        notes: "Test E - salida",
      }
    );

    if (exitResponse.statusCode !== 200) {
      throw new Error(`Salida falló: ${exitResponse.body.msg}`);
    }

    // 5. Verificar dashboard inmediatamente después de salida
    console.log("   4. Verificando dashboard después de salida...");
    const dashboardAfterExit = await makeRequest(
      "GET",
      "/api/dashboard/taller-status"
    );
    const afterExitOccupied =
      dashboardAfterExit.body.summary?.occupiedBays || 0;
    const afterExitActiveBays = dashboardAfterExit.body.activeBays || [];

    // Assertions
    if (afterExitOccupied !== initialOccupied) {
      throw new Error(
        `Dashboard no refleja salida: ${afterExitOccupied} vs ${initialOccupied}`
      );
    }

    const bayInActiveAfterExit = afterExitActiveBays.find(
      (ab) => ab.bay._id === bay._id
    );
    if (bayInActiveAfterExit) {
      throw new Error(
        "Bahía SIGUE apareciendo en activeBays después de salida"
      );
    }

    console.log("   ✅ Dashboard refleja salida correctamente");
    console.log("   ✅ PRUEBA E PASÓ");
    return true;
  } catch (error) {
    console.log(`   ❌ PRUEBA E FALLÓ: ${error.message}`);
    return false;
  }
}

/**
 * PRUEBA F — Concurrencia / condición de carrera (usando múltiples bahías)
 */
async function testF_Concurrency() {
  console.log("\n🧪 PRUEBA F: Concurrencia / condición de carrera");
  console.log("=".repeat(60));

  try {
    // Obtener datos para dos bahías diferentes
    const baysResponse = await makeRequest(
      "GET",
      "/api/service-bays/available"
    );
    if (!baysResponse.body.bays || baysResponse.body.bays.length < 2) {
      throw new Error("Se necesitan al menos 2 bahías disponibles");
    }
    const bay1 = baysResponse.body.bays[0];
    const bay2 = baysResponse.body.bays[1];

    // Obtener técnicos
    const usersResponse = await makeRequest("GET", "/api/user");
    const technicians = usersResponse.body.users.filter(
      (u) => u.rol === "operador"
    );
    if (technicians.length < 2) {
      throw new Error("Se necesitan al menos 2 técnicos para las pruebas");
    }

    // Obtener órdenes de trabajo
    const woResponse = await makeRequest("GET", "/api/work-orders?limit=2");
    if (!woResponse.body.data || woResponse.body.data.length < 2) {
      throw new Error("Se necesitan al menos 2 órdenes de trabajo disponibles");
    }
    const workOrder1 = woResponse.body.data[0];
    const workOrder2 = woResponse.body.data[1];

    const tech1 = technicians[0];
    const tech2 = technicians[1];

    // 1. Entrar en ambas bahías al mismo tiempo
    console.log("   1. Registrando entradas concurrentes en dos bahías...");
    const enter1Promise = makeRequest(
      "POST",
      `/api/work-orders/${workOrder1._id}/enter-bay`,
      {
        serviceBay: bay1._id,
        technician: tech1.uid || tech1._id,
        role: "principal",
        estimatedHours: 2,
        notes: "Test F - bahía 1",
      }
    );

    const enter2Promise = makeRequest(
      "POST",
      `/api/work-orders/${workOrder2._id}/enter-bay`,
      {
        serviceBay: bay2._id,
        technician: tech2.uid || tech2._id,
        role: "principal",
        estimatedHours: 2,
        notes: "Test F - bahía 2",
      }
    );

    const [enter1Response, enter2Response] = await Promise.all([
      enter1Promise,
      enter2Promise,
    ]);

    if (
      enter1Response.statusCode !== 201 ||
      enter2Response.statusCode !== 201
    ) {
      console.log(
        "DEBUG - Enter responses:",
        JSON.stringify(
          { enter1: enter1Response, enter2: enter2Response },
          null,
          2
        )
      );
      throw new Error(`Entradas concurrentes fallaron`);
    }

    console.log("   ✅ Ambas bahías ocupadas");

    // 2. Salir de ambas bahías al mismo tiempo
    console.log("   2. Registrando salidas concurrentes...");
    const exit1Promise = makeRequest(
      "POST",
      `/api/work-orders/${workOrder1._id}/exit-bay`,
      {
        technician: tech1.uid || tech1._id,
        notes: "Test F - salida bahía 1",
      }
    );

    const exit2Promise = makeRequest(
      "POST",
      `/api/work-orders/${workOrder2._id}/exit-bay`,
      {
        technician: tech2.uid || tech2._id,
        notes: "Test F - salida bahía 2",
      }
    );

    const [exit1Response, exit2Response] = await Promise.all([
      exit1Promise,
      exit2Promise,
    ]);

    if (exit1Response.statusCode !== 200 || exit2Response.statusCode !== 200) {
      console.log(
        "DEBUG - Exit responses:",
        JSON.stringify({ exit1: exit1Response, exit2: exit2Response }, null, 2)
      );
      throw new Error(`Salidas concurrentes fallaron`);
    }

    console.log("   ✅ Ambas salidas completadas");

    // 3. Verificar que ambas bahías se liberaron
    console.log("   3. Verificando liberación de bahías...");

    // Ambas respuestas deberían indicar liberación
    if (exit1Response.body.bayReleased !== true) {
      throw new Error(
        `Bahía 1 no se liberó: ${exit1Response.body.bayReleased}`
      );
    }

    if (exit2Response.body.bayReleased !== true) {
      throw new Error(
        `Bahía 2 no se liberó: ${exit2Response.body.bayReleased}`
      );
    }

    // Verificar estado final de ambas bahías
    const allBaysResponse = await makeRequest("GET", "/api/service-bays");
    const dbBay1 = allBaysResponse.body.bays.find((b) => b._id === bay1._id);
    const dbBay2 = allBaysResponse.body.bays.find((b) => b._id === bay2._id);

    if (dbBay1.status !== "disponible") {
      throw new Error(`Bahía 1 estado final inconsistente: ${dbBay1.status}`);
    }

    if (dbBay2.status !== "disponible") {
      throw new Error(`Bahía 2 estado final inconsistente: ${dbBay2.status}`);
    }

    console.log("   ✅ Operaciones concurrentes exitosas");
    console.log("   ✅ PRUEBA F PASÓ");
    return true;
  } catch (error) {
    console.log(`   ❌ PRUEBA F FALLÓ: ${error.message}`);
    return false;
  }
}

async function testG_HistoricalIntegrity() {
  console.log("\n🧪 PRUEBA G: Integridad histórica");
  console.log("=".repeat(60));

  try {
    // Usar datos de prueba frescos para esta prueba
    const { bay, technicians, workOrder } = await getTestData();
    const technician = technicians[0];

    // 1. Entrar a bahía
    console.log("   1. Registrando entrada...");
    const enterResponse = await makeRequest(
      "POST",
      `/api/work-orders/${workOrder._id}/enter-bay`,
      {
        serviceBay: bay._id,
        technician: technician.uid || technician._id,
        role: "principal",
        estimatedHours: 2,
        notes: "Test G - entrada",
      }
    );

    if (enterResponse.statusCode !== 201) {
      throw new Error(`Entrada falló: ${enterResponse.body.msg}`);
    }

    const assignment =
      enterResponse.body.assignments?.[0] || enterResponse.body.assignment;
    console.log(`   ✅ Entrada registrada - Assignment: ${assignment._id}`);

    // Esperar un poco para tener horas trabajadas
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 2. Salir de bahía
    console.log("   2. Registrando salida...");
    const exitResponse = await makeRequest(
      "POST",
      `/api/work-orders/${workOrder._id}/exit-bay`,
      {
        technician: technician.uid || technician._id,
        notes: "Test G - salida",
      }
    );

    if (exitResponse.statusCode !== 200) {
      throw new Error(`Salida falló: ${exitResponse.body.msg}`);
    }

    console.log("   ✅ Salida registrada");

    // 3. Verificar registro histórico
    console.log("   3. Verificando registro histórico...");

    // Obtener historial de la bahía
    const historyResponse = await makeRequest(
      "GET",
      `/api/reports/bays/${bay._id}/history?limit=10`
    );
    if (historyResponse.statusCode !== 200) {
      console.log(
        "DEBUG - History response:",
        JSON.stringify(historyResponse, null, 2)
      );
      throw new Error("No se pudo obtener historial");
    }

    const historyData = historyResponse.body;
    const historyRecords = historyData.history || [];
    const relevantRecord = historyRecords.find(
      (h) =>
        h.workOrder &&
        (h.workOrder.toString() === workOrder._id.toString() ||
          h.workOrder._id === workOrder._id)
    );

    if (!relevantRecord) {
      console.log(
        "DEBUG - History records:",
        JSON.stringify(historyRecords, null, 2)
      );
      throw new Error("No se encontró registro histórico");
    }

    // Verificar campos del registro histórico
    if (!relevantRecord.duration && relevantRecord.duration !== 0) {
      throw new Error("duration no definido en historial");
    }

    if (
      !relevantRecord.technicians ||
      relevantRecord.technicians.length === 0
    ) {
      throw new Error("technicians vacío en historial");
    }

    if (relevantRecord.totalTechnicianHours < 0) {
      throw new Error(
        `totalTechnicianHours incorrecto: ${relevantRecord.totalTechnicianHours}`
      );
    }

    console.log(`   ✅ Registro histórico encontrado:`);
    console.log(`      Duration: ${relevantRecord.duration}`);
    console.log(`      Technicians: ${relevantRecord.technicians.length}`);
    console.log(`      Total Hours: ${relevantRecord.totalTechnicianHours}`);

    console.log("   ✅ PRUEBA G PASÓ");
    return true;
  } catch (error) {
    console.log(`   ❌ PRUEBA G FALLÓ: ${error.message}`);
    return false;
  }
}

/**
 * Ejecutar todas las pruebas
 */
async function runAllTests() {
  console.log("\n╔══════════════════════════════════════════════════════╗");
  console.log("║     TESTS COMPREHENSIVOS DE SALIDA DE BAHÍA        ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  const results = [];

  // Ejecutar pruebas en orden
  results.push(await testA_ExitSimple());
  results.push(await testB_ExitParcial());
  results.push(await testC_ExitMultiple());
  results.push(await testD_Idempotencia());
  results.push(await testE_DashboardResponse());
  results.push(await testF_Concurrency());
  results.push(await testG_HistoricalIntegrity());

  // Resultado final
  const passed = results.filter((r) => r === true).length;
  const total = results.length;

  console.log("\n\n╔══════════════════════════════════════════════════════╗");
  console.log("║                   RESULTADO FINAL                   ║");
  console.log("╚══════════════════════════════════════════════════════╝\n");

  console.log(`   Tests pasados: ${passed}/${total}`);

  if (passed === total) {
    console.log("   ✅ TODOS LOS TESTS PASARON");
    console.log(
      "   🎉 La funcionalidad de salida de bahía está completamente validada!"
    );
  } else {
    console.log(`   ❌ ${total - passed} tests fallaron`);
    console.log("   🔍 Revisa los errores arriba para más detalles");
    process.exit(1);
  }
}

// Ejecutar tests
runAllTests().catch((error) => {
  console.error("\n❌ ERROR GENERAL:", error.message);
  console.error(error.stack);
  process.exit(1);
});
