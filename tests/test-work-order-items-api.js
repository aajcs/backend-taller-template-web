/**
 * TEST: Work Order Items API
 * Valida el funcionamiento de items en órdenes de trabajo
 */

const http = require("http");

// Configuración
const baseURL = "http://localhost:4000";
let authToken = "";

// Datos de prueba
const testData = {
  workOrderId: null,
  itemIds: [],
  serviceId: null,
  partId: null,
};

// Helper para hacer requests HTTP
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, baseURL);
    const options = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token && { "x-token": token }),
      },
    };

    const req = http.request(url, options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const parsed = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsed,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: body,
          });
        }
      });
    });

    req.on("error", reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function testWorkOrderItemsAPI() {
  console.log("============================================================");
  console.log("🧪 TEST: WORK ORDER ITEMS - API");
  console.log("============================================================\n");

  try {
    // ============================================
    // PASO 0: AUTENTICACIÓN
    // ============================================
    console.log("🔐 PASO 0: AUTENTICACIÓN");
    console.log("-".repeat(60));

    const loginResponse = await makeRequest("POST", "/api/auth/login", {
      correo: "superadmin@taller.com",
      password: "SuperAdmin123!",
    });

    if (loginResponse.statusCode !== 200) {
      throw new Error(
        `Error en autenticación: ${JSON.stringify(loginResponse.data)}`
      );
    }

    authToken = loginResponse.data.token;
    console.log("✅ Autenticado como superAdmin");
    console.log(`   - Usuario: ${loginResponse.data.usuario.nombre}\n`);

    // ============================================
    // PASO 1: Usar orden de trabajo específica
    // ============================================
    console.log("📋 PASO 1: Verificar Orden de Trabajo");
    console.log("-".repeat(60));

    // Usar ID específico proporcionado
    testData.workOrderId = "690ea178e825d4af4f088605";

    // Verificar que la orden existe
    const verifyWOResponse = await makeRequest(
      "GET",
      `/api/work-orders/${testData.workOrderId}`,
      null,
      authToken
    );

    console.log(`Status de verificación: ${verifyWOResponse.statusCode}`);

    if (verifyWOResponse.statusCode === 200) {
      console.log(`✅ Orden de trabajo encontrada: ${testData.workOrderId}`);
      console.log(
        `   - Cliente: ${verifyWOResponse.data.workOrder?.customer?.nombre || "N/A"}`
      );
      console.log(
        `   - Vehículo: ${verifyWOResponse.data.workOrder?.vehicle?.placa || "N/A"}`
      );
      console.log(
        `   - Estado: ${verifyWOResponse.data.workOrder?.status?.nombre || "N/A"}`
      );
    } else {
      throw new Error(
        `Orden de trabajo no encontrada: ${JSON.stringify(verifyWOResponse.data)}`
      );
    }

    // ============================================
    // PASO 2: Obtener servicio y repuesto
    // ============================================
    console.log("\n🔧 PASO 2: Obtener Servicio y Repuesto");
    console.log("-".repeat(60));

    // Obtener servicio
    const servicesResponse = await makeRequest(
      "GET",
      "/api/services?limite=1",
      null,
      authToken
    );
    if (
      servicesResponse.statusCode === 200 &&
      servicesResponse.data.services?.length > 0
    ) {
      testData.serviceId =
        servicesResponse.data.services[0]._id ||
        servicesResponse.data.services[0].id;
      console.log(`✅ Servicio encontrado: ${testData.serviceId}`);
    }

    // Obtener repuesto
    const itemsResponse = await makeRequest(
      "GET",
      "/api/inventory/items?limite=1",
      null,
      authToken
    );
    if (
      itemsResponse.statusCode === 200 &&
      (itemsResponse.data.items?.length > 0 ||
        itemsResponse.data.results?.length > 0)
    ) {
      const items = itemsResponse.data.items || itemsResponse.data.results;
      testData.partId = items[0]._id || items[0].id;
      console.log(`✅ Repuesto encontrado: ${testData.partId}`);
    }

    // ============================================
    // PASO 3: Probar ruta RESTful GET /api/work-orders/:id/items
    // ============================================
    console.log("\n📦 PASO 3: GET Items (Ruta RESTful)");
    console.log("-".repeat(60));

    const itemsRestfulResponse = await makeRequest(
      "GET",
      `/api/work-orders/${testData.workOrderId}/items`,
      null,
      authToken
    );

    console.log(`Status: ${itemsRestfulResponse.statusCode}`);
    console.log(
      `Response:`,
      JSON.stringify(itemsRestfulResponse.data, null, 2)
    );

    if (itemsRestfulResponse.statusCode === 200) {
      console.log(`✅ Ruta RESTful funcionando correctamente`);
      console.log(
        `   - Items encontrados: ${itemsRestfulResponse.data.data?.length || 0}`
      );
    } else {
      console.log(`❌ Error en ruta RESTful`);
    }

    // ============================================
    // PASO 4: Probar ruta legacy GET /api/work-order-items/:workOrderId
    // ============================================
    console.log("\n📦 PASO 4: GET Items (Ruta Legacy)");
    console.log("-".repeat(60));

    const itemsLegacyResponse = await makeRequest(
      "GET",
      `/api/work-order-items/${testData.workOrderId}`,
      null,
      authToken
    );

    console.log(`Status: ${itemsLegacyResponse.statusCode}`);
    console.log(`Response:`, JSON.stringify(itemsLegacyResponse.data, null, 2));

    if (itemsLegacyResponse.statusCode === 200) {
      console.log(`✅ Ruta legacy funcionando correctamente`);
      console.log(
        `   - Items encontrados: ${itemsLegacyResponse.data.data?.length || 0}`
      );
    } else {
      console.log(`❌ Error en ruta legacy`);
    }

    // ============================================
    // PASO 5: Agregar item (servicio) usando ruta RESTful
    // ============================================
    if (testData.serviceId) {
      console.log("\n➕ PASO 5: Agregar Item de Servicio (RESTful)");
      console.log("-".repeat(60));

      const addServiceResponse = await makeRequest(
        "POST",
        `/api/work-orders/${testData.workOrderId}/items`,
        {
          tipo: "servicio",
          servicio: testData.serviceId,
          cantidad: 1,
          precioUnitario: 50000,
          notas: "Test de servicio por API",
        },
        authToken
      );

      console.log(`Status: ${addServiceResponse.statusCode}`);
      console.log(
        `Response:`,
        JSON.stringify(addServiceResponse.data, null, 2)
      );

      if (addServiceResponse.statusCode === 201) {
        const itemId =
          addServiceResponse.data.item?._id || addServiceResponse.data.item?.id;
        testData.itemIds.push(itemId);
        console.log(`✅ Servicio agregado: ${itemId}`);
      } else {
        console.log(`❌ Error agregando servicio`);
      }
    }

    // ============================================
    // PASO 6: Agregar item (repuesto) usando ruta legacy
    // ============================================
    if (testData.partId) {
      console.log("\n➕ PASO 6: Agregar Item de Repuesto (Legacy)");
      console.log("-".repeat(60));

      const addPartResponse = await makeRequest(
        "POST",
        `/api/work-order-items/${testData.workOrderId}`,
        {
          tipo: "repuesto",
          repuesto: testData.partId,
          cantidad: 2,
          precioUnitario: 25000,
          notas: "Test de repuesto por API",
        },
        authToken
      );

      console.log(`Status: ${addPartResponse.statusCode}`);
      console.log(`Response:`, JSON.stringify(addPartResponse.data, null, 2));

      if (addPartResponse.statusCode === 201) {
        const itemId =
          addPartResponse.data.item?._id || addPartResponse.data.item?.id;
        testData.itemIds.push(itemId);
        console.log(`✅ Repuesto agregado: ${itemId}`);
      } else {
        console.log(`❌ Error agregando repuesto`);
      }
    }

    // ============================================
    // PASO 7: Verificar items agregados
    // ============================================
    console.log("\n✅ PASO 7: Verificar Items Agregados");
    console.log("-".repeat(60));

    const finalItemsResponse = await makeRequest(
      "GET",
      `/api/work-orders/${testData.workOrderId}/items`,
      null,
      authToken
    );

    if (finalItemsResponse.statusCode === 200) {
      console.log(
        `✅ Total de items: ${finalItemsResponse.data.data?.length || 0}`
      );
      finalItemsResponse.data.data?.forEach((item, index) => {
        console.log(`\n${index + 1}. ${item.tipo.toUpperCase()}`);
        console.log(`   - ID: ${item._id || item.id}`);
        console.log(`   - Cantidad: ${item.cantidad}`);
        console.log(`   - Precio: $${item.precioUnitario?.toLocaleString()}`);
        console.log(`   - Estado: ${item.estado}`);
      });
    }

    // ============================================
    // RESUMEN
    // ============================================
    console.log(
      "\n============================================================"
    );
    console.log("📊 RESUMEN DEL TEST");
    console.log("============================================================");
    console.log(`\nORDEN DE TRABAJO: ${testData.workOrderId}`);
    console.log(`ITEMS AGREGADOS: ${testData.itemIds.length}`);
    console.log(`\nRUTAS PROBADAS:`);
    console.log(
      `✓ GET /api/work-orders/:id/items (RESTful) - ${
        itemsRestfulResponse.statusCode === 200 ? "✅" : "❌"
      }`
    );
    console.log(
      `✓ GET /api/work-order-items/:id (Legacy) - ${
        itemsLegacyResponse.statusCode === 200 ? "✅" : "❌"
      }`
    );

    console.log(
      "\n============================================================"
    );
    console.log("✅ TEST COMPLETADO");
    console.log(
      "============================================================\n"
    );
  } catch (error) {
    console.log(
      "\n============================================================"
    );
    console.log("❌ ERROR EN EL TEST");
    console.log("============================================================");
    console.log(error.message);
    console.log("\nStack trace:");
    console.log(error.stack);
    process.exit(1);
  }
}

// Ejecutar test
testWorkOrderItemsAPI().catch((error) => {
  console.error("Error fatal:", error);
  process.exit(1);
});
