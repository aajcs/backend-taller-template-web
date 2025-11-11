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

// Test para verificar la actualización de collapsed en WorkOrderStatus
const testUpdateWorkOrderStatusCollapsed = async () => {
  console.log("=".repeat(70));
  console.log(
    "🧪 TEST: Actualización de propiedad collapsed en WorkOrderStatus"
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
    // PASO 2: CREAR ESTADO DE PRUEBA
    // ============================================
    console.log("\n📝 PASO 2: Crear estado de prueba");
    console.log("-".repeat(40));

    const testStatusData = {
      codigo: "TEST_UPDATE",
      nombre: "Estado de Prueba para Update",
      descripcion: "Estado para probar actualización de collapsed",
      color: "#FF9800",
      orden: 200,
      tipo: "intermedio",
      activo: true,
      collapsed: false, // Inicialmente false
    };

    const createResponse = await makeRequest(
      "POST",
      "/work-order-statuses",
      testStatusData,
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
    console.log(`   - Collapsed inicial: ${createdStatus.collapsed}`);

    // ============================================
    // PASO 3: ACTUALIZAR COLLAPSED A TRUE
    // ============================================
    console.log("\n📝 PASO 3: Actualizar collapsed a true");
    console.log("-".repeat(45));

    const updateData = {
      collapsed: true,
      descripcion: "Estado actualizado con collapsed = true",
    };

    const updateResponse = await makeRequest(
      "PUT",
      `/work-order-statuses/${createdStatus._id}`,
      updateData,
      authToken
    );

    if (updateResponse.statusCode !== 200) {
      console.log(
        "❌ Error actualizando estado:",
        JSON.stringify(updateResponse.data, null, 2)
      );
      throw new Error(
        `Error actualizando estado: ${JSON.stringify(updateResponse.data)}`
      );
    }

    const updatedStatus = updateResponse.data.data;
    console.log(`✅ Estado actualizado: ${updatedStatus.nombre}`);
    console.log(`   - Collapsed actualizado: ${updatedStatus.collapsed}`);
    console.log(`   - Descripción actualizada: ${updatedStatus.descripcion}`);

    // ============================================
    // PASO 4: VERIFICAR ACTUALIZACIÓN
    // ============================================
    console.log("\n📋 PASO 4: Verificar actualización");
    console.log("-".repeat(35));

    if (updatedStatus.collapsed === true) {
      console.log("✅ Propiedad collapsed actualizada correctamente a true");
    } else {
      console.log(
        `❌ Error: collapsed debería ser true pero es ${updatedStatus.collapsed}`
      );
    }

    // ============================================
    // PASO 5: ACTUALIZAR COLLAPSED A FALSE
    // ============================================
    console.log("\n📝 PASO 5: Actualizar collapsed a false");
    console.log("-".repeat(45));

    const updateData2 = {
      collapsed: false,
    };

    const updateResponse2 = await makeRequest(
      "PUT",
      `/work-order-statuses/${createdStatus._id}`,
      updateData2,
      authToken
    );

    if (updateResponse2.statusCode !== 200) {
      console.log(
        "❌ Error actualizando estado:",
        JSON.stringify(updateResponse2.data, null, 2)
      );
      throw new Error(
        `Error actualizando estado: ${JSON.stringify(updateResponse2.data)}`
      );
    }

    const updatedStatus2 = updateResponse2.data.data;
    console.log(`✅ Estado actualizado nuevamente: ${updatedStatus2.nombre}`);
    console.log(`   - Collapsed actualizado: ${updatedStatus2.collapsed}`);

    // ============================================
    // PASO 6: VALIDACIÓN FINAL
    // ============================================
    console.log("\n✅ PASO 6: Validación final");
    console.log("-".repeat(30));

    if (updatedStatus2.collapsed === false) {
      console.log("✅ Propiedad collapsed puede actualizarse correctamente");
      console.log(
        "✅ La funcionalidad de edición de estados funciona correctamente"
      );
      console.log("\n🎉 TEST COMPLETADO EXITOSAMENTE");
    } else {
      console.log(
        `❌ Error: collapsed debería ser false pero es ${updatedStatus2.collapsed}`
      );
    }
  } catch (error) {
    console.error("❌ Error en el test:", error.message);
  }
};

// Ejecutar el test
testUpdateWorkOrderStatusCollapsed();
