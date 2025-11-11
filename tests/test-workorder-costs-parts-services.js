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

// Test para verificar cálculo de costos con servicios y repuestos
const testWorkOrderCostsWithPartsAndServices = async () => {
  console.log("=".repeat(70));
  console.log("🧪 TEST: Cálculo de costos con Servicios y Repuestos");
  console.log("=".repeat(70));

  let authToken = "";
  const testData = {};

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
    const customers =
      customersResponse.data.customers || customersResponse.data.data || [];
    testData.customer = customers[0];
    console.log(`✅ Cliente obtenido: ${testData.customer.nombre}`);

    // Obtener vehículos
    const vehiclesResponse = await makeRequest(
      "GET",
      "/vehicles?limit=5",
      null,
      authToken
    );
    const vehicles =
      vehiclesResponse.data.vehicles || vehiclesResponse.data.data || [];
    testData.vehicle = vehicles[0];
    console.log(`✅ Vehículo obtenido: ${testData.vehicle.placa}`);

    // Obtener servicios
    const servicesResponse = await makeRequest(
      "GET",
      "/services?limit=5",
      null,
      authToken
    );
    const services =
      servicesResponse.data.services || servicesResponse.data.data || [];
    testData.services = services;
    console.log(`✅ Servicios obtenidos: ${services.length}`);

    // Obtener repuestos
    const partsResponse = await makeRequest(
      "GET",
      "/inventory/items?limit=5",
      null,
      authToken
    );
    const parts =
      partsResponse.data.items ||
      partsResponse.data.data ||
      partsResponse.data.docs ||
      [];
    testData.parts = parts;
    console.log(`✅ Repuestos obtenidos: ${parts.length}`);
    if (parts.length > 0) {
      console.log(
        `   📋 Primer repuesto: ${parts[0].nombre} (ID: ${parts[0]._id || parts[0].id})`
      );
    }

    // Obtener técnicos
    const usersResponse = await makeRequest(
      "GET",
      "/user?limit=10",
      null,
      authToken
    );
    const users = usersResponse.data.users || usersResponse.data.data || [];
    const technicians = users.filter(
      (u) => u.rol === "operador" || u.rol === "admin"
    );
    testData.technician = technicians[0];
    console.log(`✅ Técnico obtenido: ${testData.technician.nombre}`);

    // ============================================
    // PASO 3: CREAR WORKORDER CON SERVICIOS Y REPUESTOS
    // ============================================
    console.log("\n📝 PASO 3: Crear WorkOrder con Servicios y Repuestos");
    console.log("-".repeat(40));

    const workOrderData = {
      customer: testData.customer._id,
      vehicle: testData.vehicle._id,
      motivo: "Mantenimiento completo con servicios y repuestos",
      kilometraje: 60000,
      tecnicoAsignado: testData.technician._id,
      prioridad: "normal",
      descripcionProblema: "Mantenimiento completo del vehículo",
      items: [
        // Servicios
        {
          tipo: "servicio",
          servicio: testData.services[0]?._id,
          nombre:
            testData.services[0]?.nombre || "Servicio de Cambio de Aceite",
          precioFinal: 200000,
          cantidad: 1,
        },
        {
          tipo: "servicio",
          servicio: testData.services[1]?._id,
          nombre:
            testData.services[1]?.nombre || "Servicio de Revisión de Frenos",
          precioFinal: 150000,
          cantidad: 1,
        },
        // Repuestos
        {
          tipo: "repuesto",
          repuesto: testData.parts[0]?.id || testData.parts[0]?._id,
          nombre: testData.parts[0]?.nombre || "Filtro de Aceite",
          precioFinal: 80000,
          cantidad: 1,
        },
        {
          tipo: "repuesto",
          repuesto: testData.parts[1]?.id || testData.parts[1]?._id,
          nombre: testData.parts[1]?.nombre || "Pastillas de Freno",
          precioFinal: 120000,
          cantidad: 1,
        },
      ].filter(
        (item) =>
          (item.tipo === "servicio" && item.servicio) ||
          (item.tipo === "repuesto" && item.repuesto)
      ),
    };

    console.log(
      `📤 Creando WorkOrder con ${workOrderData.items.length} items:`
    );
    const servicios = workOrderData.items.filter(
      (item) => item.tipo === "servicio"
    );
    const repuestos = workOrderData.items.filter(
      (item) => item.tipo === "repuesto"
    );

    console.log(
      `   - ${servicios.length} Servicios: ${servicios.map((s) => `$${s.precioFinal}`).join(" + ")}`
    );
    console.log(
      `   - ${repuestos.length} Repuestos: ${repuestos.map((r) => `$${r.precioFinal}`).join(" + ")}`
    );

    // Debug: mostrar qué items se están enviando realmente
    console.log(`   📋 Items que se enviarán:`);
    workOrderData.items.forEach((item, index) => {
      console.log(
        `      ${index + 1}. ${item.tipo}: ${item.nombre} - $${item.precioFinal} (ID: ${item.servicio || item.repuesto})`
      );
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
    console.log(`✅ WorkOrder creada: ${createdWorkOrder.numeroOrden}`);

    // ============================================
    // PASO 4: VERIFICAR COSTOS CALCULADOS
    // ============================================
    console.log("\n💰 PASO 4: Verificar costos calculados");
    console.log("-".repeat(40));

    // Obtener detalle completo de la WorkOrder
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

    // Cálculos esperados
    const expectedSubtotalServicios = 200000 + 150000; // 350000
    const expectedSubtotalRepuestos = 80000 + 120000; // 200000
    const expectedDescuento = 0;
    const expectedImpuesto = 0;
    const expectedCostoTotal =
      expectedSubtotalServicios +
      expectedSubtotalRepuestos -
      expectedDescuento +
      expectedImpuesto; // 550000

    console.log("📊 COSTOS ESPERADOS:");
    console.log(`   - Subtotal Servicios: $${expectedSubtotalServicios}`);
    console.log(`   - Subtotal Repuestos: $${expectedSubtotalRepuestos}`);
    console.log(`   - Descuento: $${expectedDescuento}`);
    console.log(`   - Impuesto: $${expectedImpuesto}`);
    console.log(`   - Costo Total: $${expectedCostoTotal}`);

    console.log("\n📊 COSTOS CALCULADOS:");
    console.log(
      `   - Subtotal Servicios: $${workOrderDetail.subtotalServicios || 0}`
    );
    console.log(
      `   - Subtotal Repuestos: $${workOrderDetail.subtotalRepuestos || 0}`
    );
    console.log(`   - Descuento: $${workOrderDetail.descuento || 0}`);
    console.log(`   - Impuesto: $${workOrderDetail.impuesto || 0}`);
    console.log(`   - Costo Total: $${workOrderDetail.costoTotal || 0}`);

    // Verificaciones
    const errors = [];

    if (workOrderDetail.subtotalServicios !== expectedSubtotalServicios) {
      errors.push(
        `Subtotal servicios incorrecto. Esperado: ${expectedSubtotalServicios}, Actual: ${workOrderDetail.subtotalServicios}`
      );
    }

    if (workOrderDetail.subtotalRepuestos !== expectedSubtotalRepuestos) {
      errors.push(
        `Subtotal repuestos incorrecto. Esperado: ${expectedSubtotalRepuestos}, Actual: ${workOrderDetail.subtotalRepuestos}`
      );
    }

    if (workOrderDetail.descuento !== expectedDescuento) {
      errors.push(
        `Descuento incorrecto. Esperado: ${expectedDescuento}, Actual: ${workOrderDetail.descuento}`
      );
    }

    if (workOrderDetail.impuesto !== expectedImpuesto) {
      errors.push(
        `Impuesto incorrecto. Esperado: ${expectedImpuesto}, Actual: ${workOrderDetail.impuesto}`
      );
    }

    if (workOrderDetail.costoTotal !== expectedCostoTotal) {
      errors.push(
        `Costo total incorrecto. Esperado: ${expectedCostoTotal}, Actual: ${workOrderDetail.costoTotal}`
      );
    }

    if (errors.length > 0) {
      console.log("\n❌ ERRORES ENCONTRADOS:");
      errors.forEach((error) => console.log(`   - ${error}`));
      throw new Error("Los costos no se calcularon correctamente");
    }

    console.log("\n✅ TODOS LOS COSTOS CALCULADOS CORRECTAMENTE");
    console.log("   - ✅ Servicios sumados correctamente en subtotalServicios");
    console.log("   - ✅ Repuestos sumados correctamente en subtotalRepuestos");
    console.log("   - ✅ Costo total = subtotalServicios + subtotalRepuestos");

    // ============================================
    // PASO 5: VERIFICAR ITEMS
    // ============================================
    console.log("\n🔍 PASO 5: Verificar items");
    console.log("-".repeat(40));

    const items = workOrderDetail.items || [];
    console.log(`📦 Items encontrados: ${items.length}`);

    const serviciosItems = items.filter((item) => item.tipo === "servicio");
    const repuestosItems = items.filter((item) => item.tipo === "repuesto");

    console.log(`   - Servicios: ${serviciosItems.length}`);
    console.log(`   - Repuestos: ${repuestosItems.length}`);

    if (items.length !== 4) {
      throw new Error(
        `Se esperaban 4 items pero se encontraron ${items.length}`
      );
    }

    if (serviciosItems.length !== 2) {
      throw new Error(
        `Se esperaban 2 servicios pero se encontraron ${serviciosItems.length}`
      );
    }

    if (repuestosItems.length !== 2) {
      throw new Error(
        `Se esperaban 2 repuestos pero se encontraron ${repuestosItems.length}`
      );
    }

    console.log("✅ Items verificados correctamente");

    console.log("\n" + "=".repeat(70));
    console.log("🎉 TEST COMPLETADO EXITOSAMENTE");
    console.log("=".repeat(70));
    console.log(
      "✅ Los costos se calculan correctamente con Servicios y Repuestos"
    );
  } catch (error) {
    console.log("\n" + "=".repeat(70));
    console.log("❌ ERROR EN EL TEST");
    console.log("=".repeat(70));
    console.log("Error:", error.message);
    console.log("\n🔍 Depuración:");
    console.log("- Verifica que el servidor esté corriendo en puerto 4000");
    console.log("- Verifica que tengas datos sembrados");
    console.log("- Revisa los logs del servidor para más detalles");
  }
};

// Ejecutar el test
testWorkOrderCostsWithPartsAndServices();
