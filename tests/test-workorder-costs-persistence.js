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

// Test para verificar que los costos se guardan en la WorkOrder
const testWorkOrderCostsPersistence = async () => {
  console.log("=".repeat(80));
  console.log("🧪 TEST: Verificación de persistencia de costos en WorkOrder");
  console.log("=".repeat(80));

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
    // PASO 3: CREAR WORKORDER CON ITEMS Y COSTOS
    // ============================================
    console.log("\n📝 PASO 3: Crear WorkOrder con items y costos");
    console.log("-".repeat(40));

    const workOrderData = {
      customer: testData.customer._id,
      vehicle: testData.vehicle._id,
      motivo: "Verificación de persistencia de costos",
      kilometraje: 75000,
      tecnicoAsignado: testData.technician._id,
      prioridad: "normal",
      descripcionProblema:
        "Test para verificar que los costos se guardan correctamente",
      descuento: 25000, // Descuento de $25,000
      impuesto: 50000, // Impuesto de $50,000
      items: [
        // Servicios
        {
          tipo: "servicio",
          servicio: testData.services[0]?._id,
          nombre:
            testData.services[0]?.nombre || "Servicio de Cambio de Aceite",
          precioFinal: 150000,
          cantidad: 1,
        },
        {
          tipo: "servicio",
          servicio: testData.services[1]?._id,
          nombre:
            testData.services[1]?.nombre || "Servicio de Revisión de Frenos",
          precioFinal: 100000,
          cantidad: 1,
        },
        // Repuestos
        {
          tipo: "repuesto",
          repuesto: testData.parts[0]?.id || testData.parts[0]?._id,
          nombre: testData.parts[0]?.nombre || "Filtro de Aceite",
          precioFinal: 75000,
          cantidad: 1,
        },
        {
          tipo: "repuesto",
          repuesto: testData.parts[1]?.id || testData.parts[1]?._id,
          nombre: testData.parts[1]?.nombre || "Pastillas de Freno",
          precioFinal: 50000,
          cantidad: 1,
        },
      ].filter(
        (item) =>
          (item.tipo === "servicio" && item.servicio) ||
          (item.tipo === "repuesto" && item.repuesto)
      ),
    };

    console.log(`📤 Creando WorkOrder con:`);
    console.log(`   - Servicios: $150,000 + $100,000 = $250,000`);
    console.log(`   - Repuestos: $75,000 + $50,000 = $125,000`);
    console.log(`   - Descuento: $25,000`);
    console.log(`   - Impuesto: $50,000`);
    console.log(
      `   - Costo Total Esperado: ($250,000 + $125,000) - $25,000 + $50,000 = $400,000`
    );

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
    // PASO 4: VERIFICAR COSTOS EN LA RESPUESTA DE CREACIÓN
    // ============================================
    console.log("\n💰 PASO 4: Verificar costos en respuesta de creación");
    console.log("-".repeat(55));

    console.log("📊 COSTOS EN RESPUESTA DE CREACIÓN:");
    console.log(
      `   - Subtotal Servicios: $${createdWorkOrder.subtotalServicios || 0}`
    );
    console.log(
      `   - Subtotal Repuestos: $${createdWorkOrder.subtotalRepuestos || 0}`
    );
    console.log(`   - Descuento: $${createdWorkOrder.descuento || 0}`);
    console.log(`   - Impuesto: $${createdWorkOrder.impuesto || 0}`);
    console.log(`   - Costo Total: $${createdWorkOrder.costoTotal || 0}`);

    // ============================================
    // PASO 5: BUSCAR LA WORKORDER POR ID Y VERIFICAR COSTOS
    // ============================================
    console.log("\n🔍 PASO 5: Buscar WorkOrder por ID y verificar costos");
    console.log("-".repeat(55));

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
    console.log("📊 COSTOS EN BÚSQUEDA POR ID:");
    console.log(
      `   - Subtotal Servicios: $${workOrderDetail.subtotalServicios || 0}`
    );
    console.log(
      `   - Subtotal Repuestos: $${workOrderDetail.subtotalRepuestos || 0}`
    );
    console.log(`   - Descuento: $${workOrderDetail.descuento || 0}`);
    console.log(`   - Impuesto: $${workOrderDetail.impuesto || 0}`);
    console.log(`   - Costo Total: $${workOrderDetail.costoTotal || 0}`);

    // ============================================
    // PASO 6: BUSCAR WORKORDERS EN LISTA Y VERIFICAR COSTOS
    // ============================================
    console.log("\n📋 PASO 6: Buscar WorkOrders en lista y verificar costos");
    console.log("-".repeat(55));

    const listResponse = await makeRequest(
      "GET",
      "/work-orders?limit=10",
      null,
      authToken
    );

    if (listResponse.statusCode !== 200) {
      throw new Error(
        `Error obteniendo lista: ${JSON.stringify(listResponse.data)}`
      );
    }

    const workOrders =
      listResponse.data.data || listResponse.data.workOrders || [];
    const foundWorkOrder = workOrders.find(
      (wo) => wo._id === createdWorkOrder._id
    );

    if (!foundWorkOrder) {
      console.log("⚠️  WorkOrder no encontrada en la lista");
    } else {
      console.log("📊 COSTOS EN LISTA DE WORKORDERS:");
      console.log(
        `   - Subtotal Servicios: $${foundWorkOrder.subtotalServicios || 0}`
      );
      console.log(
        `   - Subtotal Repuestos: $${foundWorkOrder.subtotalRepuestos || 0}`
      );
      console.log(`   - Descuento: $${foundWorkOrder.descuento || 0}`);
      console.log(`   - Impuesto: $${foundWorkOrder.impuesto || 0}`);
      console.log(`   - Costo Total: $${foundWorkOrder.costoTotal || 0}`);
    }

    // ============================================
    // PASO 7: VALIDACIÓN FINAL
    // ============================================
    console.log("\n✅ PASO 7: Validación final");
    console.log("-".repeat(30));

    const expectedSubtotalServicios = 250000;
    const expectedSubtotalRepuestos = 125000;
    const expectedDescuento = 25000;
    const expectedImpuesto = 50000;
    const expectedCostoTotal = 400000;

    const validations = [
      {
        field: "subtotalServicios",
        expected: expectedSubtotalServicios,
        actual: workOrderDetail.subtotalServicios,
        source: "detalle por ID",
      },
      {
        field: "subtotalRepuestos",
        expected: expectedSubtotalRepuestos,
        actual: workOrderDetail.subtotalRepuestos,
        source: "detalle por ID",
      },
      {
        field: "descuento",
        expected: expectedDescuento,
        actual: workOrderDetail.descuento,
        source: "detalle por ID",
      },
      {
        field: "impuesto",
        expected: expectedImpuesto,
        actual: workOrderDetail.impuesto,
        source: "detalle por ID",
      },
      {
        field: "costoTotal",
        expected: expectedCostoTotal,
        actual: workOrderDetail.costoTotal,
        source: "detalle por ID",
      },
    ];

    let allValid = true;
    for (const validation of validations) {
      if (validation.actual !== validation.expected) {
        console.log(
          `❌ ERROR en ${validation.field} (${validation.source}): Esperado ${validation.expected}, Actual ${validation.actual}`
        );
        allValid = false;
      } else {
        console.log(`✅ ${validation.field} correcto: $${validation.actual}`);
      }
    }

    if (allValid) {
      console.log("\n🎉 TEST COMPLETADO EXITOSAMENTE");
      console.log(
        "✅ Todos los costos se guardan y recuperan correctamente en WorkOrder"
      );
    } else {
      console.log("\n❌ TEST FALLIDO");
      console.log(
        "Los costos no se están guardando o recuperando correctamente"
      );
    }
  } catch (error) {
    console.error("❌ Error en el test:", error.message);
  }
};

testWorkOrderCostsPersistence();
