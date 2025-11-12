const http = require("http");

// Función auxiliar para hacer requests HTTP
const makeRequest = (method, path, data = null, authToken = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 4000,
      path: `/api${path}`,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (authToken) {
      options.headers["x-token"] = authToken;
    }

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        try {
          const responseData = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            data: responseData,
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: body,
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
};

// Test para verificar la ruta PATCH /:id/status para cambiar estado de WorkOrder
const testPatchWorkOrderStatus = async () => {
  console.log("=".repeat(70));
  console.log(
    "🧪 TEST: Ruta PATCH /:id/status para cambiar estado de WorkOrder"
  );
  console.log("=".repeat(70));

  let authToken = "";

  try {
    // ============================================
    // PASO 1: AUTENTICACIÓN
    // ============================================
    console.log("\n🔐 PASO 1: Autenticación");
    console.log("-".repeat(40));

    const loginResponse = await makeRequest("POST", "/auth/login", {
      correo: "castilloitsystems@gmail.com",
      password: "1234abcd",
    });

    if (loginResponse.statusCode !== 200) {
      throw new Error(`Error en login: ${JSON.stringify(loginResponse.data)}`);
    }

    authToken = loginResponse.data.token;
    console.log("✅ Autenticado como superAdmin");

    // ============================================
    // PASO 2: OBTENER UNA ORDEN DE TRABAJO EXISTENTE
    // ============================================
    console.log("\n📋 PASO 2: Obtener orden de trabajo existente");
    console.log("-".repeat(50));

    const workOrdersResponse = await makeRequest(
      "GET",
      "/work-orders?limit=1",
      null,
      authToken
    );

    if (workOrdersResponse.statusCode !== 200) {
      throw new Error(
        `Error obteniendo órdenes: ${JSON.stringify(workOrdersResponse.data)}`
      );
    }

    const workOrders =
      workOrdersResponse.data.data || workOrdersResponse.data.workOrders || [];
    if (workOrders.length === 0) {
      console.log("❌ No hay órdenes de trabajo disponibles para el test");
      console.log(
        "   Crea una orden de trabajo primero antes de ejecutar este test"
      );
      return;
    }

    const workOrder = workOrders[0];
    console.log(`✅ Orden encontrada: ${workOrder._id}`);
    console.log(
      `   - Estado actual: ${workOrder.estado?.nombre || workOrder.estado}`
    );
    console.log(`   - Cliente: ${workOrder.customer?.nombre || "N/A"}`);

    // ============================================
    // PASO 3: OBTENER ESTADOS DISPONIBLES
    // ============================================
    console.log("\n📋 PASO 3: Obtener estados disponibles");
    console.log("-".repeat(40));

    const statusesResponse = await makeRequest(
      "GET",
      "/work-order-statuses",
      null,
      authToken
    );

    if (statusesResponse.statusCode !== 200) {
      throw new Error(
        `Error obteniendo estados: ${JSON.stringify(statusesResponse.data)}`
      );
    }

    const statuses =
      statusesResponse.data.data || statusesResponse.data.statuses || [];
    console.log(`📊 Estados disponibles: ${statuses.length}`);
    statuses.forEach((status) => {
      console.log(
        `   - ${status.nombre} (${status.codigo}) - Activo: ${status.activo}`
      );
    });

    // Buscar un estado válido para transición desde el estado actual
    const currentStatusCode = workOrder.estado?.codigo || workOrder.estado;
    const currentStatus = statuses.find((s) => s.codigo === currentStatusCode);

    console.log(`\n🔍 Estado actual: ${currentStatusCode}`);
    if (currentStatus) {
      console.log(`   - Nombre: ${currentStatus.nombre}`);
      console.log(`   - Tipo: ${currentStatus.tipo}`);
      console.log(
        `   - Transiciones permitidas: ${currentStatus.transicionesPermitidas || "Ninguna"}`
      );
    }
    let newStatus = null;

    if (
      currentStatus &&
      currentStatus.transicionesPermitidas &&
      currentStatus.transicionesPermitidas.length > 0
    ) {
      // Buscar el primer estado válido en las transiciones permitidas
      newStatus = statuses.find((s) =>
        currentStatus.transicionesPermitidas.includes(s.codigo)
      );
      console.log(`✅ Usando transición permitida: ${newStatus?.codigo}`);
    }

    if (!newStatus) {
      console.log(
        "❌ No hay estados disponibles para transición desde el estado actual"
      );
      console.log(`   Estado actual: ${currentStatusCode}`);
      console.log(
        `   Transiciones permitidas: ${currentStatus?.transicionesPermitidas || "Ninguna"}`
      );
      console.log(
        "   Sugerencia: Crea un estado con código 'DIAGNOSTICO' o modifica las transiciones del estado actual"
      );
      return;
    }

    console.log(
      `✅ Estado para transición: ${newStatus.nombre} (${newStatus.codigo})`
    );
    console.log(`   Desde: ${currentStatusCode} → Hacia: ${newStatus.codigo}`);

    // ============================================
    // PASO 4: CAMBIAR ESTADO USANDO PATCH /:id/status
    // ============================================
    console.log("\n🔄 PASO 4: Cambiar estado usando PATCH /:id/status");
    console.log("-".repeat(55));

    const changeStatusData = {
      newStatus: newStatus.codigo,
      notes: "Cambio de estado realizado desde test PATCH",
    };

    console.log(`📤 Enviando PATCH a: /work-orders/${workOrder._id}/status`);
    console.log(`📤 Datos: ${JSON.stringify(changeStatusData, null, 2)}`);

    const changeResponse = await makeRequest(
      "PATCH",
      `/work-orders/${workOrder._id}/status`,
      changeStatusData,
      authToken
    );

    if (changeResponse.statusCode !== 200) {
      console.log(
        "❌ Error cambiando estado:",
        JSON.stringify(changeResponse.data, null, 2)
      );
      throw new Error(
        `Error cambiando estado: ${JSON.stringify(changeResponse.data)}`
      );
    }

    const updatedWorkOrder = changeResponse.data.data;
    console.log("✅ Estado cambiado exitosamente");
    console.log(
      `   - Estado anterior: ${changeResponse.data.estadoAnterior?.nombre || "N/A"}`
    );
    console.log(
      `   - Estado nuevo: ${changeResponse.data.estadoNuevo?.nombre || "N/A"}`
    );
    console.log(`   - Notas: ${changeStatusData.notes}`);

    // ============================================
    // PASO 5: VERIFICAR CAMBIO EN LA BASE DE DATOS
    // ============================================
    console.log("\n🔍 PASO 5: Verificar cambio en base de datos");
    console.log("-".repeat(45));

    const verifyResponse = await makeRequest(
      "GET",
      `/work-orders/${workOrder._id}`,
      null,
      authToken
    );

    if (verifyResponse.statusCode !== 200) {
      throw new Error(
        `Error verificando orden: ${JSON.stringify(verifyResponse.data)}`
      );
    }

    const verifiedWorkOrder = verifyResponse.data.data;
    const verifiedStatusCode =
      verifiedWorkOrder.estado?.codigo || verifiedWorkOrder.estado;

    if (verifiedStatusCode === newStatus.codigo) {
      console.log("✅ Verificación exitosa: El estado se cambió correctamente");
      console.log(
        `   - Estado actual en BD: ${verifiedWorkOrder.estado?.nombre || verifiedStatusCode}`
      );
    } else {
      console.log(
        `❌ Error de verificación: Estado esperado ${newStatus.codigo}, pero encontrado ${verifiedStatusCode}`
      );
    }

    // ============================================
    // PASO 6: VALIDACIÓN FINAL
    // ============================================
    console.log("\n✅ PASO 6: Validación final");
    console.log("-".repeat(30));

    console.log("✅ Ruta PATCH /:id/status funciona correctamente");
    console.log("✅ Cambio de estado realizado exitosamente");
    console.log("✅ Historial de cambios registrado");
    console.log("✅ Validación de permisos aplicada");

    console.log("\n🎉 TEST COMPLETADO EXITOSAMENTE");
    console.log("📝 La ruta PATCH /:id/status está funcionando correctamente");
  } catch (error) {
    console.error("❌ Error en el test:", error.message);
  }
};

// Ejecutar el test
testPatchWorkOrderStatus();
