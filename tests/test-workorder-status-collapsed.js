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

// Test para verificar la nueva propiedad collapsed en WorkOrderStatus
const testWorkOrderStatusCollapsed = async () => {
  console.log("=".repeat(70));
  console.log("🧪 TEST: Nueva propiedad collapsed en WorkOrderStatus");
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
    // PASO 2: CREAR ESTADO CON COLLAPSED = TRUE
    // ============================================
    console.log("\n📝 PASO 2: Crear estado con collapsed = true");
    console.log("-".repeat(50));

    const statusDataCollapsed = {
      codigo: "TEST_COLLAPSED",
      nombre: "Estado de Prueba Colapsado",
      descripcion: "Estado para probar la propiedad collapsed",
      color: "#FF5722",
      orden: 100,
      tipo: "intermedio",
      activo: true,
      collapsed: true, // Nueva propiedad
      // transicionesPermitidas no especificadas para evitar validaciones complejas
    };

    const createResponse = await makeRequest(
      "POST",
      "/work-order-statuses",
      statusDataCollapsed,
      authToken
    );

    if (createResponse.statusCode !== 201) {
      console.log(
        "❌ Error creando estado:",
        JSON.stringify(createResponse.data, null, 2)
      );
      throw new Error(
        `Error creando estado: ${JSON.stringify(createResponse.data)}`
      );
    }

    const createdStatus = createResponse.data.data;
    console.log(`✅ Estado creado: ${createdStatus.nombre}`);
    console.log(`   - ID: ${createdStatus._id}`);
    console.log(`   - Código: ${createdStatus.codigo}`);
    console.log(`   - Collapsed: ${createdStatus.collapsed}`);

    // ============================================
    // PASO 3: CREAR ESTADO CON COLLAPSED = FALSE (POR DEFECTO)
    // ============================================
    console.log("\n📝 PASO 3: Crear estado con collapsed por defecto (false)");
    console.log("-".repeat(60));

    const statusDataExpanded = {
      codigo: "TEST_EXPANDED",
      nombre: "Estado de Prueba Expandido",
      descripcion: "Estado para probar el valor por defecto de collapsed",
      color: "#4CAF50",
      orden: 101,
      tipo: "intermedio",
      activo: true,
      // collapsed no especificado, debe ser false por defecto
      // transicionesPermitidas no especificadas para evitar validaciones complejas
    };

    const createResponse2 = await makeRequest(
      "POST",
      "/work-order-statuses",
      statusDataExpanded,
      authToken
    );

    if (createResponse2.statusCode !== 201) {
      console.log(
        "❌ Error creando estado:",
        JSON.stringify(createResponse2.data, null, 2)
      );
      throw new Error(
        `Error creando estado: ${JSON.stringify(createResponse2.data)}`
      );
    }

    const createdStatus2 = createResponse2.data.data;
    console.log(`✅ Estado creado: ${createdStatus2.nombre}`);
    console.log(`   - ID: ${createdStatus2._id}`);
    console.log(`   - Código: ${createdStatus2.codigo}`);
    console.log(`   - Collapsed: ${createdStatus2.collapsed}`);

    // ============================================
    // PASO 4: LISTAR ESTADOS Y VERIFICAR COLLAPSED
    // ============================================
    console.log("\n📋 PASO 4: Listar estados y verificar propiedad collapsed");
    console.log("-".repeat(60));

    const listResponse = await makeRequest(
      "GET",
      "/work-order-statuses",
      null,
      authToken
    );

    if (listResponse.statusCode !== 200) {
      throw new Error(
        `Error listando estados: ${JSON.stringify(listResponse.data)}`
      );
    }

    const statuses = listResponse.data.statuses || listResponse.data.data || [];
    const testStatuses = statuses.filter((s) => s.nombre.includes("Prueba"));

    console.log(`📊 Estados de prueba encontrados: ${testStatuses.length}`);
    testStatuses.forEach((status) => {
      console.log(`   - ${status.nombre}: collapsed = ${status.collapsed}`);
    });

    // ============================================
    // PASO 5: VALIDACIÓN FINAL
    // ============================================
    console.log("\n✅ PASO 5: Validación final");
    console.log("-".repeat(30));

    const collapsedStatus = testStatuses.find((s) => s.collapsed === true);
    const expandedStatus = testStatuses.find((s) => s.collapsed === false);

    if (collapsedStatus && expandedStatus) {
      console.log("✅ Propiedad collapsed funciona correctamente:");
      console.log(`   - Estado colapsado: ${collapsedStatus.name}`);
      console.log(`   - Estado expandido: ${expandedStatus.name}`);

      console.log("\n🎉 TEST COMPLETADO EXITOSAMENTE");
      console.log(
        "✅ La propiedad collapsed se agregó correctamente al modelo WorkOrderStatus"
      );
    } else {
      console.log("❌ Error en validación de collapsed");
      if (!collapsedStatus)
        console.log("   - No se encontró estado con collapsed = true");
      if (!expandedStatus)
        console.log("   - No se encontró estado con collapsed = false");
    }
  } catch (error) {
    console.error("❌ Error en el test:", error.message);
  }
};

testWorkOrderStatusCollapsed();
