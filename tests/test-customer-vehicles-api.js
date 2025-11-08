/**
 * Test: API de Clientes y Vehículos Asociados
 * Prueba los endpoints reales del API para validar que los vehículos
 * aparezcan correctamente al buscar clientes
 */

require("dotenv").config();
const http = require("http");

// Configuración del API
const API_HOST = "localhost";
const API_PORT = 4000;
const API_BASE = `/api`;

// Variables globales para el test
let authToken = "";
let testCustomerId = "";
let testVehicleIds = [];
let testBrandId = "";
let testModelIds = [];

/**
 * Función auxiliar para hacer requests HTTP
 */
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: `${API_BASE}${path}`,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (token) {
      options.headers["x-token"] = token;
    }

    const req = http.request(options, (res) => {
      let body = "";

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        try {
          const parsedBody = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            data: parsedBody,
          });
        } catch (error) {
          reject(new Error(`Error parsing response: ${body}`));
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
 * Test principal
 */
const testCustomerVehiclesAPI = async () => {
  try {
    console.log("🔗 Probando API en http://localhost:4000\n");

    console.log("=".repeat(60));
    console.log("🧪 TEST: API DE CLIENTES Y VEHÍCULOS ASOCIADOS");
    console.log("=".repeat(60));

    // ============================================
    // PASO 1: Autenticación
    // ============================================
    console.log("\n🔐 PASO 1: AUTENTICAR usuario");
    console.log("-".repeat(60));

    const loginResponse = await makeRequest("POST", "/auth/login", {
      correo: "superadmin@taller.com",
      password: "SuperAdmin123!",
    });

    if (!loginResponse.data.token) {
      throw new Error("Error en autenticación: No se recibió token");
    }

    authToken = loginResponse.data.token;
    console.log(`✅ Usuario autenticado correctamente`);
    console.log(`   Token: ${authToken.substring(0, 20)}...`);

    // ============================================
    // PASO 2: Crear Marca
    // ============================================
    console.log("\n📝 PASO 2: CREAR marca de vehículo");
    console.log("-".repeat(60));

    const timestamp = Date.now();
    const brandResponse = await makeRequest(
      "POST",
      "/vehicles/brands",
      {
        nombre: `Toyota API Test ${timestamp}`,
        pais: "Japón",
        descripcion: "Marca creada vía API para test",
      },
      authToken
    );

    if (!brandResponse.data.vehicleBrand && !brandResponse.data.brand) {
      throw new Error(
        "Error creando marca: " + JSON.stringify(brandResponse.data)
      );
    }

    const brand = brandResponse.data.vehicleBrand || brandResponse.data.brand;
    testBrandId = brand.uid || brand._id || brand.id;
    console.log(`✅ Marca creada: ${brand.nombre}`);
    console.log(`   ID: ${testBrandId}`);

    // ============================================
    // PASO 3: Crear Modelos
    // ============================================
    console.log("\n📝 PASO 3: CREAR modelos de vehículo");
    console.log("-".repeat(60));

    const modelos = ["Corolla", "Camry", "RAV4"];
    const tipos = ["sedan", "sedan", "suv"];

    for (let i = 0; i < modelos.length; i++) {
      const modelResponse = await makeRequest(
        "POST",
        "/vehicles/models",
        {
          nombre: modelos[i],
          tipo: tipos[i],
          brand: testBrandId,
        },
        authToken
      );

      if (!modelResponse.data.vehicleModel && !modelResponse.data.model) {
        throw new Error(
          `Error creando modelo ${modelos[i]}: ${JSON.stringify(modelResponse.data)}`
        );
      }

      const model = modelResponse.data.vehicleModel || modelResponse.data.model;
      testModelIds.push(model.uid || model._id || model.id);
      console.log(`✅ Modelo creado: ${modelos[i]} (${tipos[i]})`);
    }

    // ============================================
    // PASO 4: Crear Cliente
    // ============================================
    console.log("\n📝 PASO 4: CREAR cliente");
    console.log("-".repeat(60));
    const customerResponse = await makeRequest(
      "POST",
      "/customers",
      {
        nombre: "Cliente API Test",
        tipo: "persona",
        telefono: "+584121112222",
        correo: `cliente.test.api.${timestamp}@example.com`,
        direccion: "Dirección de prueba API",
      },
      authToken
    );

    if (!customerResponse.data.customer) {
      throw new Error(
        "Error creando cliente: " + JSON.stringify(customerResponse.data)
      );
    }

    const customer = customerResponse.data.customer;
    testCustomerId = customer.uid || customer._id || customer.id;
    console.log(`✅ Cliente creado: ${customer.nombre}`);
    console.log(`   ID: ${testCustomerId}`);

    // ============================================
    // PASO 5: Crear Vehículos
    // ============================================
    console.log("\n📝 PASO 5: CREAR vehículos asociados al cliente");
    console.log("-".repeat(60));

    const randomSuffix = Math.floor(Math.random() * 10000);
    const vehiculos = [
      {
        placa: `API${randomSuffix}A`,
        model: testModelIds[0],
        year: 2020,
        color: "Blanco",
        vin: `1HGBH41JXMN10${randomSuffix}`.padEnd(17, "0"),
        kilometraje: 50000,
        customer: testCustomerId,
      },
      {
        placa: `API${randomSuffix}B`,
        model: testModelIds[1],
        year: 2019,
        color: "Negro",
        vin: `2HGBH41JXMN20${randomSuffix}`.padEnd(17, "0"),
        kilometraje: 75000,
        customer: testCustomerId,
      },
      {
        placa: `API${randomSuffix}C`,
        model: testModelIds[2],
        year: 2021,
        color: "Rojo",
        vin: `3HGBH41JXMN30${randomSuffix}`.padEnd(17, "0"),
        kilometraje: 30000,
        customer: testCustomerId,
      },
    ];

    for (const vehiculoData of vehiculos) {
      const vehicleResponse = await makeRequest(
        "POST",
        "/vehicles",
        vehiculoData,
        authToken
      );

      if (!vehicleResponse.data.vehicle) {
        throw new Error(
          `Error creando vehículo: ${JSON.stringify(vehicleResponse.data)}`
        );
      }

      const vehicle = vehicleResponse.data.vehicle;
      testVehicleIds.push(vehicle.uid || vehicle._id || vehicle.id);
      console.log(
        `✅ Vehículo creado: ${vehiculoData.placa} - ${vehiculoData.color}`
      );
    }

    // ============================================
    // PASO 6: VALIDAR - Buscar Cliente por ID
    // ============================================
    console.log(
      "\n🔍 PASO 6: VALIDAR - Buscar cliente por ID (Controlador Real)"
    );
    console.log("-".repeat(60));

    const getCustomerResponse = await makeRequest(
      "GET",
      `/customers/${testCustomerId}`,
      null,
      authToken
    );

    if (!getCustomerResponse.data.customer) {
      throw new Error(
        "Error obteniendo cliente: " + JSON.stringify(getCustomerResponse.data)
      );
    }

    const customerWithVehicles = getCustomerResponse.data.customer;
    console.log(`✅ Cliente obtenido: ${customerWithVehicles.nombre}`);
    console.log(
      `   ID: ${customerWithVehicles.uid || customerWithVehicles._id}`
    );

    // VALIDACIÓN CRÍTICA: ¿Tiene vehículos?
    if (!customerWithVehicles.vehicles) {
      console.log(
        "\n❌ ERROR CRÍTICO: El cliente NO tiene la propiedad 'vehicles'"
      );
      console.log(
        "   El controlador NO está retornando los vehículos asociados"
      );
      throw new Error("El controlador no retorna vehículos asociados");
    }

    if (!Array.isArray(customerWithVehicles.vehicles)) {
      console.log("\n❌ ERROR: La propiedad 'vehicles' NO es un array");
      throw new Error("vehicles no es un array");
    }

    if (customerWithVehicles.vehicles.length === 0) {
      console.log("\n❌ ERROR: El array de vehículos está VACÍO");
      console.log("   Se crearon 3 vehículos pero no aparecen en la respuesta");
      throw new Error("Array de vehículos vacío");
    }

    console.log(
      `\n✅ ÉXITO: El cliente tiene ${customerWithVehicles.vehicles.length} vehículos asociados`
    );

    // Validar estructura de cada vehículo
    console.log("\n   📋 Validando estructura de vehículos:");
    customerWithVehicles.vehicles.forEach((vehicle, index) => {
      console.log(`\n   Vehículo ${index + 1}:`);
      console.log(`      - Placa: ${vehicle.placa}`);
      console.log(`      - Color: ${vehicle.color}`);
      console.log(`      - Año: ${vehicle.year}`);

      // Validar modelo poblado
      if (vehicle.model && typeof vehicle.model === "object") {
        console.log(
          `      - Modelo: ${vehicle.model.nombre} (${vehicle.model.tipo}) ✅`
        );

        // Validar marca poblada dentro del modelo
        if (vehicle.model.brand && typeof vehicle.model.brand === "object") {
          console.log(`      - Marca: ${vehicle.model.brand.nombre} ✅`);
        } else {
          console.log(`      - Marca: NO POBLADA ❌`);
          throw new Error("Marca no poblada en vehículo");
        }
      } else {
        console.log(`      - Modelo: NO POBLADO ❌`);
        throw new Error("Modelo no poblado en vehículo");
      }
    });

    // ============================================
    // PASO 7: VALIDAR - Listar Todos los Clientes
    // ============================================
    console.log(
      "\n🔍 PASO 7: VALIDAR - Listar todos los clientes (Controlador Real)"
    );
    console.log("-".repeat(60));

    const listCustomersResponse = await makeRequest(
      "GET",
      "/customers?limite=50",
      null,
      authToken
    );

    if (!listCustomersResponse.data.customers) {
      throw new Error(
        "Error listando clientes: " + JSON.stringify(listCustomersResponse.data)
      );
    }

    const customers = listCustomersResponse.data.customers;
    console.log(`✅ Se obtuvieron ${customers.length} clientes`);

    // Buscar nuestro cliente de prueba
    const foundCustomer = customers.find(
      (c) => (c.uid || c._id).toString() === testCustomerId.toString()
    );

    if (!foundCustomer) {
      console.log(`   ⚠️  Cliente de prueba no encontrado en los resultados`);
    } else {
      console.log(`   ✅ Cliente de prueba encontrado en la lista`);

      if (foundCustomer.vehicles && foundCustomer.vehicles.length > 0) {
        console.log(
          `   ✅ El cliente en la lista tiene ${foundCustomer.vehicles.length} vehículos`
        );
      } else {
        console.log(`   ❌ El cliente en la lista NO tiene vehículos`);
        throw new Error("Cliente en lista sin vehículos");
      }
    }

    // ============================================
    // LIMPIEZA
    // ============================================
    console.log("\n🧹 LIMPIEZA: Eliminando datos de prueba");
    console.log("-".repeat(60));

    // Eliminar vehículos
    for (const vehicleId of testVehicleIds) {
      await makeRequest("DELETE", `/vehicles/${vehicleId}`, null, authToken);
    }
    console.log(`✅ ${testVehicleIds.length} vehículos eliminados`);

    // Eliminar cliente
    await makeRequest(
      "DELETE",
      `/customers/${testCustomerId}`,
      null,
      authToken
    );
    console.log(`✅ Cliente eliminado`);

    // Eliminar modelos
    for (const modelId of testModelIds) {
      await makeRequest(
        "DELETE",
        `/vehicles/models/${modelId}`,
        null,
        authToken
      );
    }
    console.log(`✅ ${testModelIds.length} modelos eliminados`);

    // Eliminar marca
    await makeRequest(
      "DELETE",
      `/vehicles/brands/${testBrandId}`,
      null,
      authToken
    );
    console.log(`✅ Marca eliminada`);

    // ============================================
    // RESULTADO FINAL
    // ============================================
    console.log("\n" + "=".repeat(60));
    console.log("✅ TODOS LOS TESTS DEL API PASARON EXITOSAMENTE");
    console.log("=".repeat(60));
    console.log("\n✓ El controlador GET /customers/:id retorna vehículos");
    console.log("✓ El controlador GET /customers retorna vehículos en lista");
    console.log("✓ Los vehículos están poblados con modelo y marca");
    console.log("✓ La estructura de datos es correcta");
    console.log("\n🎉 Los endpoints reales funcionan correctamente\n");

    process.exit(0);
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ ERROR EN EL TEST DEL API");
    console.error("=".repeat(60));
    console.error(`\n${error.message}`);
    console.error("\nDetalles del error:");
    console.error(error);

    // Intentar limpieza
    try {
      console.log("\n🧹 Intentando limpieza...");
      if (testVehicleIds.length > 0) {
        for (const vehicleId of testVehicleIds) {
          await makeRequest(
            "DELETE",
            `/vehicles/${vehicleId}`,
            null,
            authToken
          );
        }
      }
      if (testCustomerId) {
        await makeRequest(
          "DELETE",
          `/customers/${testCustomerId}`,
          null,
          authToken
        );
      }
      if (testModelIds.length > 0) {
        for (const modelId of testModelIds) {
          await makeRequest(
            "DELETE",
            `/vehicles/models/${modelId}`,
            null,
            authToken
          );
        }
      }
      if (testBrandId) {
        await makeRequest(
          "DELETE",
          `/vehicles/brands/${testBrandId}`,
          null,
          authToken
        );
      }
      console.log("✅ Limpieza completada");
    } catch (cleanupError) {
      console.error("⚠️  Error durante la limpieza:", cleanupError.message);
    }

    process.exit(1);
  }
};

// Ejecutar el test
testCustomerVehiclesAPI();
