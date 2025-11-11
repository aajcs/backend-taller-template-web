/**
 * Test para validar actualización de RIF en clientes
 * Verifica que se pueda actualizar el RIF del mismo cliente sin conflicto
 */

const http = require("http");

// Configuración
const PORT = 4000;
const HOST = "localhost";

let authToken = "";
let customerId = "";
let customer2Id = "";

/**
 * Helper para hacer requests HTTP
 */
const makeRequest = (method, path, body = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: method,
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { "x-token": authToken }),
      },
    };

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            body: parsedData,
          });
        } catch (error) {
          reject(new Error(`Error parsing response: ${data}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
};

/**
 * Test 0: Login
 */
const testLogin = async () => {
  try {
    console.log("\n🔐 Iniciando sesión...");

    const response = await makeRequest("POST", "/api/auth/login", {
      correo: "admin@autosys.com",
      password: "Admin123!",
    });

    if (response.body.token) {
      authToken = response.body.token;
      console.log("✅ Login exitoso");
      return true;
    } else {
      console.log("❌ Login fallido");
      return false;
    }
  } catch (error) {
    console.error("❌ Error en login:", error.message);
    return false;
  }
};

/**
 * Test 1: Crear primer cliente con RIF J-12345678-9
 */
const testCreateCustomer1 = async () => {
  try {
    console.log("\n📋 TEST 1: Crear primer cliente");
    console.log("-".repeat(60));

    const customerData = {
      nombre: "Empresa Test 1",
      tipo: "empresa",
      rif: "J-12345678-9",
      razonSocial: "Empresa Test 1 C.A.",
      telefono: "+584241234567",
      correo: "empresa1@test.com",
      direccion: "Dirección Test 1",
    };

    const response = await makeRequest("POST", "/api/customers", customerData);

    console.log(`Status: ${response.statusCode}`);
    console.log(`Respuesta: ${JSON.stringify(response.body, null, 2)}`);

    if (response.statusCode === 201 && response.body.customer) {
      customerId = response.body.customer._id;
      console.log(`✅ Cliente 1 creado con ID: ${customerId}`);
      console.log(`   RIF: ${response.body.customer.rif}`);
      return true;
    } else {
      console.log("❌ Error al crear cliente 1");
      return false;
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
};

/**
 * Test 2: Crear segundo cliente con RIF diferente J-98765432-1
 */
const testCreateCustomer2 = async () => {
  try {
    console.log("\n📋 TEST 2: Crear segundo cliente");
    console.log("-".repeat(60));

    const customerData = {
      nombre: "Empresa Test 2",
      tipo: "empresa",
      rif: "J-98765432-1",
      razonSocial: "Empresa Test 2 C.A.",
      telefono: "+584247654321",
      correo: "empresa2@test.com",
      direccion: "Dirección Test 2",
    };

    const response = await makeRequest("POST", "/api/customers", customerData);

    console.log(`Status: ${response.statusCode}`);

    if (response.statusCode === 201 && response.body.customer) {
      customer2Id = response.body.customer._id;
      console.log(`✅ Cliente 2 creado con ID: ${customer2Id}`);
      console.log(`   RIF: ${response.body.customer.rif}`);
      return true;
    } else {
      console.log("❌ Error al crear cliente 2");
      return false;
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
};

/**
 * Test 3: Actualizar el RIF del cliente 1 al mismo valor (debe permitirlo)
 */
const testUpdateSameRif = async () => {
  try {
    console.log("\n📋 TEST 3: Actualizar RIF del cliente 1 al mismo valor");
    console.log("-".repeat(60));

    const updateData = {
      rif: "J-12345678-9", // Mismo RIF
      nombre: "Empresa Test 1 Modificada",
    };

    const response = await makeRequest(
      "PUT",
      `/api/customers/${customerId}`,
      updateData
    );

    console.log(`Status: ${response.statusCode}`);
    console.log(`Respuesta: ${JSON.stringify(response.body, null, 2)}`);

    if (response.statusCode === 200 && response.body.ok) {
      console.log("✅ Actualización exitosa (mismo RIF permitido)");
      console.log(`   RIF: ${response.body.customer.rif}`);
      console.log(`   Nombre: ${response.body.customer.nombre}`);
      return true;
    } else {
      console.log("❌ Error: No debería fallar al actualizar con el mismo RIF");
      return false;
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
};

/**
 * Test 4: Intentar actualizar cliente 1 con el RIF del cliente 2 (debe fallar)
 */
const testUpdateConflictingRif = async () => {
  try {
    console.log(
      "\n📋 TEST 4: Intentar actualizar cliente 1 con RIF del cliente 2"
    );
    console.log("-".repeat(60));

    const updateData = {
      rif: "J-98765432-1", // RIF del cliente 2
      nombre: "Intento de duplicar RIF",
    };

    const response = await makeRequest(
      "PUT",
      `/api/customers/${customerId}`,
      updateData
    );

    console.log(`Status: ${response.statusCode}`);
    console.log(`Respuesta: ${JSON.stringify(response.body, null, 2)}`);

    if (response.statusCode === 400 && !response.body.ok) {
      console.log("✅ Validación correcta (RIF duplicado rechazado)");
      console.log(`   Error: ${response.body.msg || response.body.errors}`);
      return true;
    } else {
      console.log("❌ Error: Debería rechazar el RIF duplicado");
      return false;
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
};

/**
 * Test 5: Actualizar el RIF del cliente 1 a un valor nuevo válido
 */
const testUpdateNewRif = async () => {
  try {
    console.log("\n📋 TEST 5: Actualizar RIF del cliente 1 a valor nuevo");
    console.log("-".repeat(60));

    const updateData = {
      rif: "J-11111111-1", // Nuevo RIF válido
      nombre: "Empresa Test 1 con Nuevo RIF",
    };

    const response = await makeRequest(
      "PUT",
      `/api/customers/${customerId}`,
      updateData
    );

    console.log(`Status: ${response.statusCode}`);
    console.log(`Respuesta: ${JSON.stringify(response.body, null, 2)}`);

    if (response.statusCode === 200 && response.body.ok) {
      console.log("✅ Actualización exitosa (nuevo RIF válido)");
      console.log(`   RIF anterior: J-12345678-9`);
      console.log(`   RIF nuevo: ${response.body.customer.rif}`);
      console.log(`   Nombre: ${response.body.customer.nombre}`);
      return true;
    } else {
      console.log("❌ Error al actualizar con nuevo RIF");
      return false;
    }
  } catch (error) {
    console.error("❌ Error:", error.message);
    return false;
  }
};

/**
 * Test 6: Limpiar - Eliminar clientes de prueba
 */
const testCleanup = async () => {
  try {
    console.log("\n🧹 Limpiando datos de prueba...");

    if (customerId) {
      await makeRequest("DELETE", `/api/customers/${customerId}`);
      console.log(`✅ Cliente 1 eliminado`);
    }

    if (customer2Id) {
      await makeRequest("DELETE", `/api/customers/${customer2Id}`);
      console.log(`✅ Cliente 2 eliminado`);
    }

    return true;
  } catch (error) {
    console.error("❌ Error en limpieza:", error.message);
    return false;
  }
};

/**
 * Ejecutar todos los tests
 */
const runTests = async () => {
  console.log("============================================================");
  console.log("🧪 TESTS: Validación de actualización de RIF");
  console.log("============================================================");

  const results = {
    test1: false,
    test2: false,
    test3: false,
    test4: false,
    test5: false,
  };

  // Login
  const loginSuccess = await testLogin();
  if (!loginSuccess) {
    console.log("\n❌ No se pudo hacer login. Abortando tests.");
    return;
  }

  // Tests
  results.test1 = await testCreateCustomer1();
  results.test2 = await testCreateCustomer2();
  results.test3 = await testUpdateSameRif();
  results.test4 = await testUpdateConflictingRif();
  results.test5 = await testUpdateNewRif();

  // Limpieza
  await testCleanup();

  // Resumen
  console.log("\n============================================================");
  console.log("📊 RESUMEN DE TESTS");
  console.log("============================================================");

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter((r) => r).length;
  const failedTests = totalTests - passedTests;

  console.log(`✅ Tests exitosos: ${passedTests}/${totalTests}`);
  console.log(`❌ Tests fallidos: ${failedTests}/${totalTests}`);

  Object.entries(results).forEach(([test, passed]) => {
    console.log(`   ${passed ? "✅" : "❌"} ${test}`);
  });

  console.log("\n============================================================");
  if (failedTests === 0) {
    console.log("🎉 ¡TODOS LOS TESTS PASARON!");
  } else {
    console.log("⚠️  ALGUNOS TESTS FALLARON");
  }
  console.log("============================================================\n");
};

// Ejecutar
runTests();
