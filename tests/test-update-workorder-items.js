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

// Test principal
const testUpdateWorkOrderItems = async () => {
  console.log("=".repeat(60));
  console.log("🧪 TEST: Actualizar items de WorkOrder");
  console.log("=".repeat(60));

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
    // PASO 3: CREAR WORKORDER INICIAL CON ITEMS
    // ============================================
    console.log("\n📝 PASO 3: Crear WorkOrder inicial con items");
    console.log("-".repeat(40));

    const initialWorkOrderData = {
      customer: testData.customer._id,
      vehicle: testData.vehicle._id,
      motivo: "Mantenimiento inicial para actualizar items",
      kilometraje: 50000,
      tecnicoAsignado: testData.technician._id,
      prioridad: "normal",
      descripcionProblema: "Mantenimiento programado",
      items: [
        {
          tipo: "servicio",
          servicio: testData.services[0]?._id,
          nombre: testData.services[0]?.nombre || "Servicio inicial 1",
          precioFinal: 250000,
          cantidad: 1,
        },
        {
          tipo: "servicio",
          servicio: testData.services[1]?._id,
          nombre: testData.services[1]?.nombre || "Servicio inicial 2",
          precioFinal: 150000,
          cantidad: 1,
        },
      ].filter((item) => item.servicio),
    };

    console.log(
      `📤 Creando WorkOrder inicial con ${initialWorkOrderData.items.length} items`
    );

    const createResponse = await makeRequest(
      "POST",
      "/work-orders",
      initialWorkOrderData,
      authToken
    );

    if (createResponse.statusCode !== 201) {
      console.log(
        "❌ Error en creación:",
        JSON.stringify(createResponse.data, null, 2)
      );
      throw new Error(
        `Error creando WorkOrder inicial: ${JSON.stringify(createResponse.data)}`
      );
    }

    const createdWorkOrder = createResponse.data.workOrder;
    testData.workOrder = createdWorkOrder;

    console.log("✅ WorkOrder inicial creada:");
    console.log(`   - Número: ${createdWorkOrder.numeroOrden}`);
    console.log(`   - Items iniciales: ${createdWorkOrder.items?.length || 0}`);

    // ============================================
    // PASO 4: ACTUALIZAR ITEMS DE LA WORKORDER
    // ============================================
    console.log("\n🔄 PASO 4: Actualizar items de la WorkOrder");
    console.log("-".repeat(40));

    // Preparar actualización: modificar item existente, agregar nuevo, eliminar uno
    const updatedItems = [
      // Modificar el primer item (cambiar precio)
      {
        _id: createdWorkOrder.items[0]._id,
        tipo: "servicio",
        servicio: testData.services[0]._id,
        nombre: testData.services[0]?.nombre || "Servicio modificado",
        precioFinal: 300000, // Precio modificado
        cantidad: 1,
      },
      // Eliminar el segundo item (no lo incluimos)
      // Agregar un nuevo item
      {
        tipo: "servicio",
        servicio: testData.services[2]?._id || testData.services[0]._id,
        nombre: testData.services[2]?.nombre || "Servicio nuevo agregado",
        precioFinal: 200000,
        cantidad: 1,
      },
    ];

    const updateData = {
      items: updatedItems,
      descripcionProblema: "Mantenimiento actualizado con items modificados",
    };

    console.log("📤 Actualizando WorkOrder:");
    console.log(`   - Modificar 1 item existente`);
    console.log(`   - Eliminar 1 item existente`);
    console.log(`   - Agregar 1 item nuevo`);
    console.log(`   - Total esperado: 2 items`);

    const updateResponse = await makeRequest(
      "PUT",
      `/work-orders/${createdWorkOrder._id}`,
      updateData,
      authToken
    );

    if (updateResponse.statusCode !== 200) {
      console.log(
        "❌ Error en actualización:",
        JSON.stringify(updateResponse.data, null, 2)
      );
      throw new Error(
        `Error actualizando WorkOrder: ${JSON.stringify(updateResponse.data)}`
      );
    }

    const updatedWorkOrder = updateResponse.data.data;
    console.log("✅ WorkOrder actualizada exitosamente");

    // ============================================
    // PASO 5: VERIFICAR CAMBIOS
    // ============================================
    console.log("\n🔍 PASO 5: Verificar cambios aplicados");
    console.log("-".repeat(40));

    // Obtener la WorkOrder actualizada para verificar
    const getResponse = await makeRequest(
      "GET",
      `/work-orders/${createdWorkOrder._id}`,
      null,
      authToken
    );

    if (getResponse.statusCode !== 200) {
      throw new Error(
        `Error obteniendo WorkOrder actualizada: ${JSON.stringify(getResponse.data)}`
      );
    }

    const finalWorkOrder = getResponse.data.data;
    const finalItems = finalWorkOrder.items || [];

    console.log(
      `📋 WorkOrder ${finalWorkOrder.numeroOrden} - Items finales: ${finalItems.length}`
    );

    // Verificar que tenemos exactamente 2 items
    if (finalItems.length !== 2) {
      throw new Error(
        `Se esperaban 2 items pero se encontraron ${finalItems.length}`
      );
    }

    // Verificar que el primer item fue modificado
    const modifiedItem = finalItems.find(
      (item) => item._id === updatedItems[0]._id
    );
    if (!modifiedItem) {
      throw new Error("No se encontró el item modificado");
    }

    if (modifiedItem.precioFinal !== 300000) {
      throw new Error(
        `Precio del item modificado incorrecto. Esperado: 300000, Actual: ${modifiedItem.precioFinal}`
      );
    }

    // Verificar que hay un item nuevo (sin el _id del original)
    const newItem = finalItems.find((item) => item._id !== updatedItems[0]._id);
    if (!newItem) {
      throw new Error("No se encontró el item nuevo agregado");
    }

    if (newItem.precioFinal !== 200000) {
      throw new Error(
        `Precio del item nuevo incorrecto. Esperado: 200000, Actual: ${newItem.precioFinal}`
      );
    }

    // Verificar que el item eliminado ya no existe
    const deletedItemExists = finalItems.some(
      (item) => item._id === createdWorkOrder.items[1]._id
    );
    if (deletedItemExists) {
      throw new Error("El item eliminado aún existe en la WorkOrder");
    }

    console.log("✅ Verificaciones completadas:");
    console.log(
      `   - ✅ Item modificado: precio actualizado a ${modifiedItem.precioFinal}`
    );
    console.log(`   - ✅ Item nuevo agregado: precio ${newItem.precioFinal}`);
    console.log(`   - ✅ Item eliminado: ya no existe`);
    console.log(`   - ✅ Total items correcto: ${finalItems.length}`);

    // ============================================
    // PASO 6: VERIFICAR EN BASE DE DATOS
    // ============================================
    console.log("\n💾 PASO 6: Verificar en base de datos");
    console.log("-".repeat(40));

    // Verificar que el item "eliminado" esté marcado como eliminado en la BD
    // Esto es más difícil de verificar desde aquí, pero podemos contar los items activos

    console.log("✅ Todos los tests pasaron exitosamente!");

    console.log("\n" + "=".repeat(60));
    console.log("🎉 TEST COMPLETADO EXITOSAMENTE");
    console.log("=".repeat(60));
  } catch (error) {
    console.log("\n" + "=".repeat(60));
    console.log("❌ ERROR EN EL TEST");
    console.log("=".repeat(60));
    console.log("Error:", error.message);
    console.log("\n🔍 Depuración:");
    console.log("- Verifica que el servidor esté corriendo en puerto 4000");
    console.log("- Verifica que tengas datos sembrados");
    console.log("- Revisa los logs del servidor para más detalles");
  }
};

// Ejecutar el test
testUpdateWorkOrderItems();
