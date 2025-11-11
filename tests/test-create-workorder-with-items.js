/**
 * Test: Crear WorkOrder con items incluidos
 * Prueba la funcionalidad de crear una orden de trabajo con items en el body
 */

require("dotenv").config();
const http = require("http");

// Configuración
const API_HOST = "localhost";
const API_PORT = 4000;
const API_BASE = "/api";

// Variables globales
let authToken = "";
let testData = {};

/**
 * Función helper para hacer requests HTTP
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
      timeout: 15000,
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
          const responseData = body ? JSON.parse(body) : {};
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
}

/**
 * Test principal
 */
async function testCreateWorkOrderWithItems() {
  try {
    console.log("=".repeat(60));
    console.log("🧪 TEST: Crear WorkOrder con items incluidos");
    console.log("=".repeat(60));

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
    // PASO 2: OBTENER DATOS NECESARIOS
    // ============================================
    console.log("\n📋 PASO 2: Obtener datos necesarios");
    console.log("-".repeat(40));

    // Obtener clientes
    const customersResponse = await makeRequest(
      "GET",
      "/customers?limit=5",
      null,
      authToken
    );
    if (customersResponse.statusCode !== 200) {
      throw new Error(
        `Error obteniendo clientes: ${JSON.stringify(customersResponse.data)}`
      );
    }
    const customers =
      customersResponse.data.customers ||
      customersResponse.data.data ||
      customersResponse.data.docs ||
      [];
    if (customers.length === 0) {
      throw new Error("No hay clientes disponibles");
    }
    testData.customer = customers[0];
    console.log(`✅ Cliente obtenido: ${testData.customer.nombre}`);

    // Obtener vehículos
    const vehiclesResponse = await makeRequest(
      "GET",
      "/vehicles?limit=5",
      null,
      authToken
    );
    if (vehiclesResponse.statusCode !== 200) {
      throw new Error(
        `Error obteniendo vehículos: ${JSON.stringify(vehiclesResponse.data)}`
      );
    }
    const vehicles =
      vehiclesResponse.data.vehicles ||
      vehiclesResponse.data.data ||
      vehiclesResponse.data.docs ||
      [];
    if (vehicles.length === 0) {
      throw new Error("No hay vehículos disponibles");
    }
    testData.vehicle = vehicles[0];
    console.log(`✅ Vehículo obtenido: ${testData.vehicle.placa}`);

    // Obtener servicios
    const servicesResponse = await makeRequest(
      "GET",
      "/services?limit=5",
      null,
      authToken
    );
    if (servicesResponse.statusCode !== 200) {
      throw new Error(
        `Error obteniendo servicios: ${JSON.stringify(servicesResponse.data)}`
      );
    }
    const services =
      servicesResponse.data.services ||
      servicesResponse.data.data ||
      servicesResponse.data.docs ||
      [];
    testData.services = services;
    console.log(`✅ Servicios obtenidos: ${services.length}`);

    // Obtener técnicos
    const usersResponse = await makeRequest(
      "GET",
      "/user?limit=10",
      null,
      authToken
    );
    if (usersResponse.statusCode !== 200) {
      throw new Error(
        `Error obteniendo usuarios: ${JSON.stringify(usersResponse.data)}`
      );
    }
    const users =
      usersResponse.data.users ||
      usersResponse.data.data ||
      usersResponse.data.docs ||
      [];
    const technicians = users.filter(
      (u) => u.rol === "operador" || u.rol === "admin"
    );
    if (technicians.length === 0) {
      throw new Error("No hay técnicos disponibles");
    }
    testData.technician = technicians[0];
    console.log(`✅ Técnico obtenido: ${testData.technician.nombre}`);

    // ============================================
    // PASO 3: CREAR WORKORDER CON ITEMS
    // ============================================
    console.log("\n📝 PASO 3: Crear WorkOrder con items incluidos");
    console.log("-".repeat(40));

    // Preparar datos de la orden con items
    const workOrderData = {
      customer: testData.customer._id,
      vehicle: testData.vehicle._id,
      motivo: "Mantenimiento preventivo con múltiples servicios",
      kilometraje: 45000,
      tecnicoAsignado: testData.technician._id,
      prioridad: "normal",
      descripcionProblema:
        "Revisión completa del vehículo con servicios programados",
      items: [
        {
          tipo: "servicio",
          servicio: testData.services[0]?._id,
          nombre: testData.services[0]?.nombre || "Servicio de prueba 1",
          precioFinal: 350000,
          cantidad: 1,
          notas: "Servicio prioritario",
        },
        {
          tipo: "servicio",
          servicio: testData.services[1]?._id,
          nombre: testData.services[1]?.nombre || "Servicio de prueba 2",
          precioFinal: 180000,
          cantidad: 1,
          notas: "Servicio adicional",
        },
      ].filter((item) => item.servicio), // Filtrar items sin servicio válido
    };

    console.log(
      `📤 Enviando WorkOrder con ${workOrderData.items.length} items:`
    );
    workOrderData.items.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.tipo} - $${item.precioFinal}`);
    });

    const createResponse = await makeRequest(
      "POST",
      "/work-orders",
      workOrderData,
      authToken
    );

    if (createResponse.statusCode !== 201) {
      console.log(
        "❌ Error en creación:",
        JSON.stringify(createResponse.data, null, 2)
      );
      throw new Error(
        `Error creando WorkOrder: ${JSON.stringify(createResponse.data)}`
      );
    }

    const createdWorkOrder = createResponse.data.workOrder;
    testData.workOrder = createdWorkOrder;

    console.log("✅ WorkOrder creada exitosamente:");
    console.log(`   - Número: ${createdWorkOrder.numeroOrden}`);
    console.log(`   - Cliente: ${createdWorkOrder.customer?.nombre || "N/A"}`);
    console.log(`   - Vehículo: ${createdWorkOrder.vehicle?.placa || "N/A"}`);

    // ============================================
    // PASO 4: VERIFICAR DETALLE Y COSTOS
    // ============================================
    console.log("\n� PASO 4: Verificar detalle y costos");
    console.log("-".repeat(40));

    // Verificar detalle de la orden con populate
    const detailResponse = await makeRequest(
      "GET",
      `/work-orders/${createdWorkOrder._id}`,
      null,
      authToken
    );

    if (detailResponse.statusCode !== 200) {
      throw new Error(
        `Error obteniendo detalle: ${JSON.stringify(detailResponse.data)}`
      );
    }

    const workOrderDetail = detailResponse.data.data;
    console.log(`📋 Detalle de la orden ${workOrderDetail.numeroOrden}:`);

    // Verificar costos calculados
    const expectedSubtotalServicios = 350000 + 180000; // Suma de precios finales
    const expectedCostoTotal = expectedSubtotalServicios; // Sin descuento ni impuesto

    console.log(`� Costos esperados:`);
    console.log(`   - Subtotal Servicios: $${expectedSubtotalServicios}`);
    console.log(`   - Subtotal Repuestos: $0`);
    console.log(`   - Descuento: $0`);
    console.log(`   - Impuesto: $0`);
    console.log(`   - Costo Total: $${expectedCostoTotal}`);

    console.log(`� Costos en WorkOrder:`);
    console.log(
      `   - Subtotal Servicios: $${workOrderDetail.subtotalServicios || 0}`
    );
    console.log(
      `   - Subtotal Repuestos: $${workOrderDetail.subtotalRepuestos || 0}`
    );
    console.log(`   - Descuento: $${workOrderDetail.descuento || 0}`);
    console.log(`   - Impuesto: $${workOrderDetail.impuesto || 0}`);
    console.log(`   - Costo Total: $${workOrderDetail.costoTotal || 0}`);

    // Verificar que los costos sean correctos
    if (workOrderDetail.subtotalServicios !== expectedSubtotalServicios) {
      throw new Error(
        `Subtotal servicios incorrecto. Esperado: ${expectedSubtotalServicios}, Actual: ${workOrderDetail.subtotalServicios}`
      );
    }

    if (workOrderDetail.subtotalRepuestos !== 0) {
      throw new Error(
        `Subtotal repuestos incorrecto. Esperado: 0, Actual: ${workOrderDetail.subtotalRepuestos}`
      );
    }

    if (workOrderDetail.costoTotal !== expectedCostoTotal) {
      throw new Error(
        `Costo total incorrecto. Esperado: ${expectedCostoTotal}, Actual: ${workOrderDetail.costoTotal}`
      );
    }

    console.log("✅ COSTOS CALCULADOS CORRECTAMENTE");

    // ============================================
    // PASO 5: VERIFICAR ITEMS CREADOS
    // ============================================
    console.log("\n🔍 PASO 5: Verificar items creados");
    console.log("-".repeat(40)); // ============================================
    // PASO 6: VERIFICAR ITEMS EN BD
    // ============================================
    console.log("\n� PASO 6: Verificar items en base de datos");
    console.log("-".repeat(40)); // Verificar detalle de la orden con populate
    const detailResponse = await makeRequest(
      "GET",
      `/work-orders/${createdWorkOrder._id}`,
      null,
      authToken
    );

    if (detailResponse.statusCode !== 200) {
      throw new Error(
        `Error obteniendo detalle: ${JSON.stringify(detailResponse.data)}`
      );
    }

    const workOrderDetail = detailResponse.data.data;
    console.log(`📋 Detalle de la orden ${workOrderDetail.numeroOrden}:`);

    if (workOrderDetail.items && workOrderDetail.items.length > 0) {
      console.log(`✅ ITEMS ENCONTRADOS: ${workOrderDetail.items.length}`);
      workOrderDetail.items.forEach((item, index) => {
        console.log(
          `   ${index + 1}. ${item.tipo}: ${item.nombre || item.servicio?.nombre || "N/A"} - $${item.precioFinal}`
        );
        console.log(`      Estado: ${item.estado || "N/A"}`);
        console.log(`      Notas: ${item.notas || "Sin notas"}`);
      });
    } else {
      console.log("❌ NO SE ENCONTRARON ITEMS EN LA ORDEN");
      console.log(
        "   Items en BD:",
        workOrderDetail.items ? workOrderDetail.items.length : 0
      );
    }

    // Verificar items directamente en la colección
    const itemsResponse = await makeRequest(
      "GET",
      `/work-order-items/${createdWorkOrder._id}`,
      null,
      authToken
    );

    if (itemsResponse.statusCode === 200) {
      const orderItems =
        itemsResponse.data.data || itemsResponse.data.items || [];
      console.log(
        `\n📦 Items en colección work-order-items: ${orderItems.length}`
      );

      if (orderItems.length !== workOrderDetail.items?.length) {
        console.log("⚠️  DISCREPANCIA: Items en colección vs items populados");
        console.log(`   Colección: ${orderItems.length}`);
        console.log(`   Populadas: ${workOrderDetail.items?.length || 0}`);
      }
    }

    // ============================================
    // PASO 7: VALIDACIÓN FINAL
    // ============================================
    console.log("\n✅ PASO 7: Validación final");
    console.log("-".repeat(40));

    const expectedItems = workOrderData.items.length;
    const actualItems = workOrderDetail.items?.length || 0;

    if (actualItems === expectedItems) {
      console.log(`🎉 ÉXITO: Se crearon ${actualItems} items correctamente`);
      console.log("✅ La funcionalidad de crear WorkOrder con items funciona!");
    } else {
      console.log(
        `❌ ERROR: Se esperaban ${expectedItems} items, pero se encontraron ${actualItems}`
      );
      throw new Error("La creación de items falló");
    }

    console.log("\n" + "=".repeat(60));
    console.log("🎉 TEST COMPLETADO EXITOSAMENTE");
    console.log("=".repeat(60));

    process.exit(0);
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ ERROR EN EL TEST");
    console.error("=".repeat(60));
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Ejecutar test
testCreateWorkOrderWithItems();
