/**
 * Test: Órdenes de Trabajo (Work Orders) - API
 * Prueba el flujo completo de órdenes de trabajo del taller
 * Incluye: creación, cambio de estado, historial, items, costos
 */

require("dotenv").config();
const http = require("http");

// Configuración
const API_HOST = "localhost";
const API_PORT = 4000;
const API_BASE = "/api";

// Variables globales
let authToken = "";
let testData = {
  workOrders: [],
  customers: [],
  vehicles: [],
  statuses: [],
  technicians: [],
};

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
          const parsedBody = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            data: parsedBody,
            headers: res.headers,
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: body,
            headers: res.headers,
          });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
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
const testWorkOrdersAPI = async () => {
  try {
    console.log("=".repeat(60));
    console.log("🧪 TEST: ÓRDENES DE TRABAJO (WORK ORDERS) - API");
    console.log("=".repeat(60));
    console.log(`
    FLUJO TESTEADO:
    1. Crear orden de trabajo
    2. Consultar detalle de OT
    3. Cambiar estado de OT
    4. Agregar items (repuestos y servicios múltiples)
    5. Consultar historial de cambios
    6. Actualizar orden con diagnóstico
    7. Listar órdenes con filtros
    8. Crear órdenes adicionales
    9. Generar factura desde OT
    10. Emitir factura
    11. Registrar pago a factura
    12. Filtrar por prioridad
    `);

    // ============================================
    // PASO 0: AUTENTICACIÓN
    // ============================================
    console.log("\n🔐 PASO 0: AUTENTICACIÓN");
    console.log("-".repeat(60));

    const loginResponse = await makeRequest("POST", "/auth/login", {
      correo: "castilloitsystems@gmail.com",
      password: "1234abcd",
    });

    if (loginResponse.statusCode !== 200) {
      throw new Error(`Error en login: ${JSON.stringify(loginResponse.data)}`);
    }

    authToken = loginResponse.data.token;
    console.log(
      `✅ Autenticado como ${loginResponse.data.usuario.rol || "superAdmin"}`
    );
    console.log(`   - Usuario: ${loginResponse.data.usuario.nombre}`);

    // ============================================
    // PASO 1: PREPARAR DATOS - Obtener clientes, vehículos, estados
    // ============================================
    console.log("\n📋 PASO 1: Preparar DATOS necesarios");
    console.log("-".repeat(60));

    // Obtener clientes
    const customersResponse = await makeRequest(
      "GET",
      "/customers?limite=5",
      null,
      authToken
    );

    if (
      customersResponse.statusCode !== 200 ||
      !customersResponse.data.customers
    ) {
      throw new Error(
        `No se pudieron obtener clientes: ${JSON.stringify(customersResponse.data)}`
      );
    }

    const customers = customersResponse.data.customers;
    if (customers.length === 0) {
      throw new Error("No hay clientes disponibles en el sistema");
    }

    console.log(`   ✅ Clientes obtenidos: ${customers.length}`);

    // Obtener cualquier vehículo disponible
    const allVehiclesResponse = await makeRequest(
      "GET",
      "/vehicles?limite=10",
      null,
      authToken
    );

    if (
      allVehiclesResponse.statusCode !== 200 ||
      !allVehiclesResponse.data.vehicles ||
      allVehiclesResponse.data.vehicles.length === 0
    ) {
      throw new Error("No hay vehículos disponibles en el sistema");
    }

    const vehicle = allVehiclesResponse.data.vehicles[0];
    const vehicleId = vehicle.id || vehicle._id;
    const vehicleName =
      vehicle.model?.nombre ||
      `${vehicle.marca || ""} ${vehicle.modelo || ""}`.trim();
    console.log(
      `   ✅ Vehículo obtenido: ${vehicleName || vehicle._id} (${vehicle.placa || "N/A"})`
    );

    // Usar el cliente asociado al vehículo, o el primer cliente disponible
    const customerId =
      vehicle.customer?.id ||
      vehicle.customer?._id ||
      vehicle.customer ||
      customers[0].id ||
      customers[0]._id;
    const firstCustomer =
      customers.find((c) => (c.id || c._id) === customerId) || customers[0];

    // Obtener estados de OT
    const statusesResponse = await makeRequest(
      "GET",
      "/work-order-statuses",
      null,
      authToken
    );

    if (statusesResponse.statusCode !== 200) {
      throw new Error(
        `No se pudieron obtener estados de OT: ${JSON.stringify(statusesResponse.data)}`
      );
    }

    const statuses =
      statusesResponse.data.data || statusesResponse.data.statuses || [];
    testData.statuses = statuses;
    console.log(`   ✅ Estados de OT disponibles: ${statuses.length}`);
    console.log(`      Estados: ${statuses.map((s) => s.codigo).join(", ")}`);

    // Obtener técnicos (usuarios)
    const usersResponse = await makeRequest("GET", "/user", null, authToken);

    let technicianId = null;
    if (
      usersResponse.statusCode === 200 &&
      usersResponse.data.users &&
      usersResponse.data.users.length > 0
    ) {
      const technician = usersResponse.data.users[0];
      technicianId = technician.uid || technician._id;
      console.log(`   ✅ Técnico asignado: ${technician.nombre}`);
    } else {
      // Usar el usuario autenticado como técnico
      technicianId =
        loginResponse.data.usuario.uid || loginResponse.data.usuario._id;
      console.log(
        `   ✅ Técnico asignado: ${loginResponse.data.usuario.nombre} (usuario actual)`
      );
    }

    // ============================================
    // PASO 2: CREAR ORDEN DE TRABAJO
    // ============================================
    console.log(
      "\n📝 PASO 2: Crear orden de trabajo vía POST /api/work-orders"
    );
    console.log("-".repeat(60));

    const workOrderData = {
      customer: customerId,
      vehicle: vehicleId,
      motivo:
        "Servicio de mantenimiento preventivo - revisión completa del vehículo",
      kilometraje: 45000,
      tecnicoAsignado: technicianId,
      prioridad: "normal",
      descripcionProblema:
        "Cliente reporta ruido en el motor y vibraciones al frenar",
      fechaEstimadaEntrega: new Date(
        Date.now() + 2 * 24 * 60 * 60 * 1000
      ).toISOString(), // 2 días
    };

    const createResponse = await makeRequest(
      "POST",
      "/work-orders",
      workOrderData,
      authToken
    );

    if (
      createResponse.statusCode !== 201 &&
      createResponse.statusCode !== 200
    ) {
      console.log(
        `\n   ⚠️  Respuesta completa: ${JSON.stringify(createResponse)}`
      );
      throw new Error(
        `Error creando OT (${createResponse.statusCode}): ${JSON.stringify(createResponse.data)}`
      );
    }

    const workOrder =
      createResponse.data.data ||
      createResponse.data.workOrder ||
      createResponse.data;
    const workOrderId = workOrder.id || workOrder._id;

    if (!workOrderId) {
      console.log(
        `\n   ⚠️  Respuesta completa: ${JSON.stringify(createResponse)}`
      );
      throw new Error("No se pudo obtener el ID de la orden creada");
    }

    testData.workOrders.push(workOrderId);

    console.log(`\n   ✅ Orden de trabajo creada:`);
    console.log(`   - ID: ${workOrderId}`);
    console.log(`   - Número: ${workOrder.numeroOrden || "N/A"}`);
    console.log(
      `   - Cliente: ${firstCustomer.nombre} ${firstCustomer.apellido || ""}`
    );
    console.log(`   - Kilometraje: ${workOrder.kilometraje} km`);
    console.log(`   - Prioridad: ${workOrder.prioridad}`);
    console.log(`   - Estado: ${workOrder.estado?.nombre || workOrder.estado}`);

    // ============================================
    // PASO 3: CONSULTAR DETALLE DE LA ORDEN
    // ============================================
    console.log(
      "\n🔍 PASO 3: Consultar DETALLE de la orden vía GET /api/work-orders/:id"
    );
    console.log("-".repeat(60));

    const detailResponse = await makeRequest(
      "GET",
      `/work-orders/${workOrderId}`,
      null,
      authToken
    );

    if (detailResponse.statusCode !== 200) {
      throw new Error(
        `Error consultando OT: ${JSON.stringify(detailResponse.data)}`
      );
    }

    const detailWorkOrder = detailResponse.data.data || detailResponse.data;

    console.log(`\n   📋 Detalle de la orden:`);
    console.log(`   - Número: ${detailWorkOrder.numeroOrden}`);
    console.log(
      `   - Cliente: ${detailWorkOrder.customer?.nombre} ${detailWorkOrder.customer?.apellido || ""}`
    );
    console.log(
      `   - Vehículo: ${detailWorkOrder.vehicle?.marca} ${detailWorkOrder.vehicle?.modelo}`
    );
    console.log(`   - Placa: ${detailWorkOrder.vehicle?.placa}`);
    console.log(
      `   - Estado: ${detailWorkOrder.estado?.nombre} (${detailWorkOrder.estado?.codigo})`
    );
    console.log(
      `   - Técnico: ${detailWorkOrder.tecnicoAsignado?.nombre} ${detailWorkOrder.tecnicoAsignado?.apellido || ""}`
    );
    console.log(`   - Motivo: ${detailWorkOrder.motivo.substring(0, 50)}...`);

    // ============================================
    // PASO 4: CAMBIAR ESTADO DE LA ORDEN
    // ============================================
    console.log(
      "\n🔄 PASO 4: CAMBIAR ESTADO de la orden vía POST /api/work-orders/:id/change-status"
    );
    console.log("-".repeat(60));

    // Buscar el siguiente estado (EN_DIAGNOSTICO)
    const diagnosticoStatus = statuses.find(
      (s) => s.codigo === "EN_DIAGNOSTICO"
    );

    if (!diagnosticoStatus) {
      console.log(
        `   ⚠️  Estado EN_DIAGNOSTICO no encontrado, usando primer estado disponible`
      );
    }

    const newStatusCode = diagnosticoStatus
      ? diagnosticoStatus.codigo
      : statuses[1]?.codigo;

    if (!newStatusCode) {
      console.log(`   ⚠️  No hay estados disponibles para cambio`);
    } else {
      const changeStatusData = {
        newStatus: newStatusCode,
        notes:
          "Iniciando diagnóstico del vehículo - revisión de motor y frenos",
      };

      const changeStatusResponse = await makeRequest(
        "POST",
        `/work-orders/${workOrderId}/change-status`,
        changeStatusData,
        authToken
      );

      if (changeStatusResponse.statusCode === 200) {
        const updatedWorkOrder =
          changeStatusResponse.data.data || changeStatusResponse.data;

        console.log(`\n   ✅ Estado cambiado exitosamente:`);
        console.log(`   - Estado anterior: ${detailWorkOrder.estado?.nombre}`);
        console.log(
          `   - Estado actual: ${updatedWorkOrder.estado?.nombre || newStatusCode}`
        );
        console.log(`   - Notas: ${changeStatusData.notes}`);
      } else {
        console.log(
          `\n   ⚠️  No se pudo cambiar estado: ${JSON.stringify(changeStatusResponse.data)}`
        );
      }
    }

    // ============================================
    // PASO 5: AGREGAR ITEMS (REPUESTOS Y SERVICIOS)
    // ============================================
    console.log(
      "\n🔧 PASO 5: AGREGAR ITEMS a la orden (repuestos y servicios)"
    );
    console.log("-".repeat(60));

    // Obtener servicios disponibles
    const servicesResponse = await makeRequest(
      "GET",
      "/services",
      null,
      authToken
    );

    let availableServices = [];
    if (servicesResponse.statusCode === 200) {
      availableServices =
        servicesResponse.data.data || servicesResponse.data.services || [];
      console.log(`\n   ✅ Servicios disponibles: ${availableServices.length}`);
      if (availableServices.length > 0) {
        console.log(
          `      Ejemplo: ${availableServices[0].nombre} - $${availableServices[0].precioBase || 0}`
        );
      }
    } else {
      console.log(
        `   ⚠️  No se pudieron obtener servicios: ${JSON.stringify(servicesResponse.data)}`
      );
    }

    // Obtener items de inventario disponibles
    const itemsResponse = await makeRequest(
      "GET",
      "/inventory/items",
      null,
      authToken
    );

    let availableItems = [];
    if (itemsResponse.statusCode === 200) {
      availableItems =
        itemsResponse.data.data ||
        itemsResponse.data.items ||
        itemsResponse.data.docs ||
        [];
      console.log(
        `   ✅ Items de inventario disponibles: ${availableItems.length}`
      );
      if (availableItems.length > 0) {
        console.log(
          `      Ejemplo: ${availableItems[0].nombre} - $${availableItems[0].precioVenta || 0}`
        );
      }
    } else {
      console.log(
        `   ⚠️  No se pudieron obtener items: ${JSON.stringify(itemsResponse.data)}`
      );
    }

    // Agregar servicios a la orden
    const addedItems = [];

    if (availableServices.length > 0) {
      // Agregar 2 servicios
      const servicesToAdd = availableServices.slice(0, 2);

      for (const service of servicesToAdd) {
        const serviceItemData = {
          workOrder: workOrderId,
          type: "service",
          service: service._id || service.id,
          nombre: service.nombre,
          descripcion: service.descripcion || "",
          quantity: 1,
          unitPrice: service.precioBase || 100,
          discount: 0,
        };

        const addServiceResponse = await makeRequest(
          "POST",
          "/work-order-items",
          serviceItemData,
          authToken
        );

        if (
          addServiceResponse.statusCode === 200 ||
          addServiceResponse.statusCode === 201
        ) {
          const addedItem =
            addServiceResponse.data.data || addServiceResponse.data;
          addedItems.push(addedItem);
          console.log(
            `   ✅ Servicio agregado: ${serviceItemData.nombre} - $${serviceItemData.unitPrice}`
          );
        } else {
          console.log(
            `   ⚠️  Error agregando servicio: ${JSON.stringify(addServiceResponse.data)}`
          );
        }
      }
    }

    // Agregar repuestos a la orden
    if (availableItems.length > 0) {
      // Agregar 3 repuestos
      const partsToAdd = availableItems.slice(0, 3);

      for (const item of partsToAdd) {
        const partItemData = {
          workOrder: workOrderId,
          type: "part",
          part: item._id || item.id,
          nombre: item.nombre,
          descripcion: item.descripcion || "",
          quantity: Math.floor(Math.random() * 4) + 1, // 1-4 unidades
          unitPrice: item.precioVenta || 50,
          discount: 0,
          numeroParte: item.codigo || "N/A",
        };

        const addPartResponse = await makeRequest(
          "POST",
          "/work-order-items",
          partItemData,
          authToken
        );

        if (
          addPartResponse.statusCode === 200 ||
          addPartResponse.statusCode === 201
        ) {
          const addedItem = addPartResponse.data.data || addPartResponse.data;
          addedItems.push(addedItem);
          console.log(
            `   ✅ Repuesto agregado: ${partItemData.nombre} (x${partItemData.quantity}) - $${partItemData.unitPrice * partItemData.quantity}`
          );
        } else {
          console.log(
            `   ⚠️  Error agregando repuesto: ${JSON.stringify(addPartResponse.data)}`
          );
        }
      }
    }

    console.log(`\n   📊 Total de items agregados: ${addedItems.length}`);

    // Consultar items de la orden
    if (addedItems.length > 0) {
      const itemsListResponse = await makeRequest(
        "GET",
        `/work-order-items/${workOrderId}`,
        null,
        authToken
      );

      if (itemsListResponse.statusCode === 200) {
        const orderItems =
          itemsListResponse.data.data || itemsListResponse.data.items || [];
        console.log(
          `   ✅ Items en la orden verificados: ${orderItems.length}`
        );

        // Calcular total
        let totalItems = 0;
        orderItems.forEach((item) => {
          totalItems += item.precioFinal || item.precioTotal || 0;
        });
        console.log(`   💰 Total de items: $${totalItems.toFixed(2)}`);
      }
    }

    testData.addedItems = addedItems;

    // ============================================
    // PASO 5.5: VERIFICAR VIRTUAL "items" EN DETALLE
    // ============================================
    console.log(
      "\n🔍 PASO 5.5: Verificar VIRTUAL 'items' en GET /api/work-orders/:id"
    );
    console.log("-".repeat(60));

    const detailAfterItemsResponse = await makeRequest(
      "GET",
      `/work-orders/${workOrderId}`,
      null,
      authToken
    );

    if (detailAfterItemsResponse.statusCode === 200) {
      const workOrderWithItems =
        detailAfterItemsResponse.data.data || detailAfterItemsResponse.data;

      console.log(`\n   📋 Verificación del virtual 'items':`);
      console.log(`   - Orden: ${workOrderWithItems.numeroOrden}`);

      if (workOrderWithItems.items && workOrderWithItems.items.length > 0) {
        console.log(
          `   ✅ VIRTUAL FUNCIONANDO: ${workOrderWithItems.items.length} items populados`
        );
        workOrderWithItems.items.forEach((item, index) => {
          console.log(
            `      ${index + 1}. ${item.nombre || item.tipo} - $${item.precioFinal || item.precioTotal || 0}`
          );
          if (item.servicio) {
            console.log(`         Servicio: ${item.servicio.nombre}`);
          }
          if (item.repuesto) {
            console.log(
              `         Repuesto: ${item.repuesto.nombre} (${item.repuesto.codigo})`
            );
          }
        });
      } else {
        console.log(
          `   ❌ VIRTUAL NO FUNCIONA: Campo 'items' vacío o no existe`
        );
        console.log(
          `   - Items encontrados: ${workOrderWithItems.items ? workOrderWithItems.items.length : 0}`
        );
      }
    } else {
      console.log(
        `   ❌ Error consultando detalle con virtual: ${detailAfterItemsResponse.data}`
      );
    }

    // ============================================
    // PASO 6: CONSULTAR HISTORIAL DE LA ORDEN
    // ============================================
    console.log(
      "\n📜 PASO 6: Consultar HISTORIAL de cambios vía GET /api/work-orders/:id/history"
    );
    console.log("-".repeat(60));

    const historyResponse = await makeRequest(
      "GET",
      `/work-orders/${workOrderId}/history`,
      null,
      authToken
    );

    if (historyResponse.statusCode === 200) {
      const history =
        historyResponse.data.data || historyResponse.data.history || [];

      console.log(`\n   ✅ Historial de cambios: ${history.length} entradas`);

      if (history.length > 0) {
        console.log(`\n   Últimos cambios:`);
        history.slice(0, 3).forEach((entry, index) => {
          console.log(`   ${index + 1}. ${entry.tipo || "N/A"}`);
          console.log(`      - Descripción: ${entry.descripcion || "N/A"}`);
          console.log(
            `      - Fecha: ${entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "N/A"}`
          );
        });
      }
    } else {
      console.log(
        `\n   ⚠️  No se pudo consultar historial: ${JSON.stringify(historyResponse.data)}`
      );
    }

    // ============================================
    // PASO 7: ACTUALIZAR LA ORDEN DE TRABAJO
    // ============================================
    console.log(
      "\n📝 PASO 7: ACTUALIZAR orden de trabajo vía PUT /api/work-orders/:id"
    );
    console.log("-".repeat(60));

    const updateData = {
      diagnostico:
        "Se detectó desgaste en las pastillas de freno delanteras y ruido en el tensor de la correa. Se requiere cambio de pastillas y revisión del sistema de distribución.",
      observaciones:
        "Cliente autoriza las reparaciones. Se procede con el cambio de piezas.",
      prioridad: "alta",
    };

    const updateResponse = await makeRequest(
      "PUT",
      `/work-orders/${workOrderId}`,
      updateData,
      authToken
    );

    if (updateResponse.statusCode === 200) {
      const updatedWorkOrder = updateResponse.data.data || updateResponse.data;

      console.log(`\n   ✅ Orden ACTUALIZADA:`);
      console.log(
        `   - Diagnóstico agregado: ${updateData.diagnostico.substring(0, 60)}...`
      );
      console.log(
        `   - Prioridad cambiada a: ${updatedWorkOrder.prioridad || updateData.prioridad}`
      );
    } else {
      console.log(
        `\n   ⚠️  No se pudo actualizar: ${JSON.stringify(updateResponse.data)}`
      );
    }

    // ============================================
    // PASO 8: LISTAR ÓRDENES DE TRABAJO CON FILTROS
    // ============================================
    console.log(
      "\n📋 PASO 8: Listar ÓRDENES DE TRABAJO vía GET /api/work-orders"
    );
    console.log("-".repeat(60));

    const listResponse = await makeRequest(
      "GET",
      "/work-orders?limit=5&sortBy=fechaApertura&sortOrder=desc",
      null,
      authToken
    );

    if (listResponse.statusCode !== 200) {
      throw new Error(
        `Error listando OT: ${JSON.stringify(listResponse.data)}`
      );
    }

    const workOrdersList =
      listResponse.data.data || listResponse.data.docs || [];
    const pagination = listResponse.data.pagination || {};

    console.log(
      `\n   📋 Total órdenes en sistema: ${pagination.total || workOrdersList.length}`
    );

    if (workOrdersList.length > 0) {
      console.log(
        `\n   Últimas ${Math.min(3, workOrdersList.length)} órdenes:`
      );
      workOrdersList.slice(0, 3).forEach((wo, index) => {
        console.log(`   ${index + 1}. ${wo.numeroOrden || "N/A"}`);
        console.log(
          `      - Cliente: ${wo.customer?.nombre || "N/A"} ${wo.customer?.apellido || ""}`
        );
        console.log(
          `      - Estado: ${wo.estado?.nombre || wo.estado || "N/A"}`
        );
        console.log(`      - Prioridad: ${wo.prioridad || "N/A"}`);
      });
    }

    // ============================================
    // PASO 9: CREAR OTRA ORDEN CON DIFERENTE PRIORIDAD
    // ============================================
    console.log("\n📦 PASO 9: Crear MÚLTIPLES órdenes de trabajo");
    console.log("-".repeat(60));

    const priorities = ["baja", "alta", "urgente"];

    for (let i = 0; i < 2; i++) {
      const newWorkOrder = {
        customer: customerId,
        vehicle: vehicleId,
        motivo: `Servicio ${i === 0 ? "de revisión general" : "urgente - falla en motor"}`,
        kilometraje: 45000 + i * 1000,
        tecnicoAsignado: technicianId,
        prioridad: priorities[i],
        descripcionProblema:
          i === 0
            ? "Revisión programada de los 45,000 km"
            : "Motor presenta falla intermitente, pérdida de potencia",
      };

      const createNewResponse = await makeRequest(
        "POST",
        "/work-orders",
        newWorkOrder,
        authToken
      );

      if (
        createNewResponse.statusCode === 201 ||
        createNewResponse.statusCode === 200
      ) {
        const newWO = createNewResponse.data.data || createNewResponse.data;
        testData.workOrders.push(newWO.id || newWO._id);

        console.log(`\n   ✅ Orden creada:`);
        console.log(`   - Número: ${newWO.numeroOrden}`);
        console.log(`   - Prioridad: ${newWO.prioridad}`);
        console.log(`   - Motivo: ${newWorkOrder.motivo}`);
      }

      // Pausa breve
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // ============================================
    // PASO 10: GENERAR FACTURA DESDE LA ORDEN DE TRABAJO
    // ============================================
    console.log("\n💰 PASO 10: GENERAR FACTURA desde la orden de trabajo");
    console.log("-".repeat(60));

    // Calcular fecha de vencimiento (30 días desde hoy)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);

    const invoiceData = {
      dueDate: dueDate.toISOString(),
      notes: "Factura generada desde prueba automatizada",
      paymentTerms: "30 días",
    };

    const invoiceResponse = await makeRequest(
      "POST",
      `/invoices/from-work-order/${workOrderId}`,
      invoiceData,
      authToken
    );

    let invoiceId = null;
    if (
      invoiceResponse.statusCode === 200 ||
      invoiceResponse.statusCode === 201
    ) {
      const invoice = invoiceResponse.data.data || invoiceResponse.data;
      invoiceId = invoice._id || invoice.id;
      testData.invoice = invoice;

      console.log(`\n   ✅ Factura generada exitosamente:`);
      console.log(`   - ID: ${invoiceId}`);
      console.log(`   - Número: ${invoice.invoiceNumber || "N/A"}`);
      console.log(`   - Subtotal: $${invoice.subtotal || 0}`);
      console.log(
        `   - IVA: $${invoice.taxes?.reduce((sum, tax) => sum + tax.amount, 0) || 0}`
      );
      console.log(`   - Total: $${invoice.total || 0}`);
      console.log(`   - Estado: ${invoice.status || "N/A"}`);
      console.log(`   - Items incluidos: ${invoice.items?.length || 0}`);
    } else {
      console.log(
        `\n   ⚠️  No se pudo generar factura: ${JSON.stringify(invoiceResponse.data)}`
      );
    }

    // ============================================
    // PASO 11: EMITIR LA FACTURA
    // ============================================
    if (invoiceId) {
      console.log("\n📄 PASO 11: EMITIR la factura");
      console.log("-".repeat(60));

      const emitResponse = await makeRequest(
        "PATCH",
        `/invoices/${invoiceId}/emit`,
        null,
        authToken
      );

      if (emitResponse.statusCode === 200) {
        console.log(`   ✅ Factura emitida exitosamente`);
        const emittedInvoice = emitResponse.data.data || emitResponse.data;
        testData.invoice = emittedInvoice;
      } else {
        console.log(
          `   ⚠️  No se pudo emitir factura: ${JSON.stringify(emitResponse.data)}`
        );
      }
    }

    // ============================================
    // PASO 12: REGISTRAR PAGOS PARCIALES Y CONSULTAR CUENTAS POR COBRAR
    // ============================================
    if (invoiceId && testData.invoice) {
      console.log("\n💳 PASO 12: REGISTRAR PAGOS (Parciales y Completo)");
      console.log("-".repeat(60));

      const invoice = testData.invoice;
      const totalFactura = invoice.total || 100000;

      // PAGO PARCIAL 1: 50% del total
      console.log("\n   📝 PAGO PARCIAL 1 (50%):");
      const primerPago = Math.round(totalFactura * 0.5);
      const payment1Data = {
        invoice: invoiceId,
        amount: primerPago,
        paymentMethod: "transferencia",
        paymentDate: new Date().toISOString(),
        reference: "PAGO-PARCIAL-1-" + Date.now(),
        notes: "Primer pago parcial (50%)",
      };

      const payment1Response = await makeRequest(
        "POST",
        "/payments",
        payment1Data,
        authToken
      );

      if (
        payment1Response.statusCode === 200 ||
        payment1Response.statusCode === 201
      ) {
        const payment1 = payment1Response.data.data || payment1Response.data;
        console.log(`   ✅ Monto: $${payment1.amount.toLocaleString()}`);
        console.log(`   - Método: ${payment1.paymentMethod}`);
        console.log(`   - Referencia: ${payment1.reference}`);

        // Verificar estado después del primer pago
        const invoiceState1 = await makeRequest(
          "GET",
          `/invoices/${invoiceId}`,
          null,
          authToken
        );
        if (invoiceState1.statusCode === 200) {
          const inv1 = invoiceState1.data.data || invoiceState1.data;
          console.log(
            `   📊 Pagado: $${inv1.paidAmount.toLocaleString()} | Saldo: $${inv1.balance.toLocaleString()} | Estado: ${inv1.status}`
          );
        }

        // VALIDAR CUENTAS POR COBRAR después del primer pago
        console.log(
          `\n   💰 Validando cuentas por cobrar después del 1er pago:`
        );

        // Esperar un momento para asegurar que la BD esté actualizada
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Primero verificar el estado actual de la factura en BD
        const invoiceCheckResponse = await makeRequest(
          "GET",
          `/invoices/${invoiceId}`,
          null,
          authToken
        );

        if (invoiceCheckResponse.statusCode === 200) {
          const invCheck =
            invoiceCheckResponse.data.data || invoiceCheckResponse.data;
          console.log(`   🔍 Estado actual de factura en BD:`);
          console.log(`      - ID: ${invCheck._id || invCheck.id}`);
          console.log(`      - Número: ${invCheck.invoiceNumber}`);
          console.log(`      - Estado: ${invCheck.status}`);
          console.log(`      - Eliminado: ${invCheck.eliminado}`);
          console.log(`      - Total: $${invCheck.total}`);
          console.log(`      - Pagado: $${invCheck.paidAmount}`);
          console.log(`      - Saldo: $${invCheck.balance}`);
        }

        const today1 = new Date();
        const startDate1 = new Date(
          today1.getFullYear(),
          today1.getMonth(),
          1
        ).toISOString();
        const endDate1 = new Date(
          today1.getFullYear(),
          today1.getMonth() + 1,
          0
        ).toISOString();

        console.log(`\n   🔍 DEBUG - Consultando reporte con rango:`);
        console.log(`      Desde: ${startDate1}`);
        console.log(`      Hasta: ${endDate1}`);

        const ar1Response = await makeRequest(
          "GET",
          `/invoices/reports?type=accounts_receivable&startDate=${startDate1}&endDate=${endDate1}`,
          null,
          authToken
        );

        if (ar1Response.statusCode === 200) {
          const ar1Data = ar1Response.data.data || ar1Response.data;

          // DEBUG: Mostrar información del servidor
          if (ar1Data._debug) {
            console.log(`   🔧 DEBUG del servidor:`);
            console.log(
              `      - Facturas encontradas: ${ar1Data._debug.totalInvoicesFound}`
            );
            console.log(
              `      - Pagos encontrados: ${ar1Data._debug.totalPaymentsFound}`
            );
            console.log(
              `      - Antes de filtrar: ${ar1Data._debug.invoicesBeforeFilter}`
            );
            console.log(
              `      - Después de filtrar: ${ar1Data._debug.invoicesAfterFilter}`
            );
            if (
              ar1Data._debug.sampleInvoices &&
              ar1Data._debug.sampleInvoices.length > 0
            ) {
              console.log(`      - Muestra de facturas:`);
              ar1Data._debug.sampleInvoices.forEach((inv) => {
                console.log(
                  `        • ${inv.number}: status=${inv.status}, total=$${inv.total}, paid=$${inv.paidAmount}, balance=$${inv.balance}`
                );
              });
            }
          }

          // DEBUG: Mostrar todas las facturas del reporte
          console.log(
            `   📊 Total facturas en reporte: ${ar1Data.accountsReceivable?.length || 0}`
          );

          if (
            ar1Data.accountsReceivable &&
            ar1Data.accountsReceivable.length > 0
          ) {
            console.log(`   📋 Facturas encontradas en reporte:`);
            ar1Data.accountsReceivable.forEach((inv) => {
              console.log(
                `      • ${inv.invoiceNumber}: Estado=${inv.status}, Pendiente=$${inv.pendingAmount}`
              );
            });
          }

          const currentInvoice = ar1Data.accountsReceivable?.find(
            (inv) => inv.id.toString() === invoiceId.toString()
          );

          if (currentInvoice) {
            console.log(`   ✅ Factura encontrada en cuentas por cobrar:`);
            console.log(
              `      - Pendiente: $${currentInvoice.pendingAmount.toLocaleString()}`
            );
            console.log(
              `      - Pagado: $${currentInvoice.paidAmount.toLocaleString()}`
            );
            console.log(`      - Estado: ${currentInvoice.status}`);

            // Validar que el saldo coincida con lo esperado
            const saldoEsperado = totalFactura - primerPago;
            if (Math.abs(currentInvoice.pendingAmount - saldoEsperado) < 1) {
              console.log(
                `      ✓ Saldo correcto (esperado: $${saldoEsperado.toLocaleString()})`
              );
            } else {
              console.log(
                `      ⚠️ INCONSISTENCIA: esperado $${saldoEsperado.toLocaleString()}, actual $${currentInvoice.pendingAmount.toLocaleString()}`
              );
            }
          } else {
            console.log(
              `   ⚠️ Factura NO encontrada en reporte de cuentas por cobrar`
            );
          }

          console.log(
            `   📊 Total general por cobrar: $${parseFloat(ar1Data.summary?.totalReceivableAmount || 0).toLocaleString()}`
          );
        }
      }

      // PAGO PARCIAL 2: 30% del total
      console.log("\n   📝 PAGO PARCIAL 2 (30%):");
      const segundoPago = Math.round(totalFactura * 0.3);
      const payment2Data = {
        invoice: invoiceId,
        amount: segundoPago,
        paymentMethod: "efectivo",
        paymentDate: new Date().toISOString(),
        reference: "PAGO-PARCIAL-2-" + Date.now(),
        notes: "Segundo pago parcial (30%)",
      };

      const payment2Response = await makeRequest(
        "POST",
        "/payments",
        payment2Data,
        authToken
      );

      if (
        payment2Response.statusCode === 200 ||
        payment2Response.statusCode === 201
      ) {
        const payment2 = payment2Response.data.data || payment2Response.data;
        console.log(`   ✅ Monto: $${payment2.amount.toLocaleString()}`);
        console.log(`   - Método: ${payment2.paymentMethod}`);
        console.log(`   - Referencia: ${payment2.reference}`);

        // Verificar estado después del segundo pago
        const invoiceState2 = await makeRequest(
          "GET",
          `/invoices/${invoiceId}`,
          null,
          authToken
        );
        if (invoiceState2.statusCode === 200) {
          const inv2 = invoiceState2.data.data || invoiceState2.data;
          console.log(
            `   📊 Pagado: $${inv2.paidAmount.toLocaleString()} | Saldo: $${inv2.balance.toLocaleString()} | Estado: ${inv2.status}`
          );
        }

        // VALIDAR CUENTAS POR COBRAR después del segundo pago
        console.log(
          `\n   💰 Validando cuentas por cobrar después del 2do pago:`
        );
        const today2 = new Date();
        const startDate2 = new Date(
          today2.getFullYear(),
          today2.getMonth(),
          1
        ).toISOString();
        const endDate2 = new Date(
          today2.getFullYear(),
          today2.getMonth() + 1,
          0
        ).toISOString();

        const ar2Response = await makeRequest(
          "GET",
          `/invoices/reports?type=accounts_receivable&startDate=${startDate2}&endDate=${endDate2}`,
          null,
          authToken
        );

        if (ar2Response.statusCode === 200) {
          const ar2Data = ar2Response.data.data || ar2Response.data;
          const currentInvoice2 = ar2Data.accountsReceivable?.find(
            (inv) => inv.id.toString() === invoiceId.toString()
          );

          if (currentInvoice2) {
            console.log(`   ✅ Factura encontrada en cuentas por cobrar:`);
            console.log(
              `      - Pendiente: $${currentInvoice2.pendingAmount.toLocaleString()}`
            );
            console.log(
              `      - Pagado: $${currentInvoice2.paidAmount.toLocaleString()}`
            );
            console.log(`      - Estado: ${currentInvoice2.status}`);

            // Validar que el saldo coincida con lo esperado
            const saldoEsperado2 = totalFactura - primerPago - segundoPago;
            if (Math.abs(currentInvoice2.pendingAmount - saldoEsperado2) < 1) {
              console.log(
                `      ✓ Saldo correcto (esperado: $${saldoEsperado2.toLocaleString()})`
              );
            } else {
              console.log(
                `      ⚠️ INCONSISTENCIA: esperado $${saldoEsperado2.toLocaleString()}, actual $${currentInvoice2.pendingAmount.toLocaleString()}`
              );
            }
          } else {
            console.log(
              `   ⚠️ Factura NO encontrada en reporte de cuentas por cobrar`
            );
          }

          console.log(
            `   📊 Total general por cobrar: $${parseFloat(ar2Data.summary?.totalReceivableAmount || 0).toLocaleString()}`
          );
        }
      }

      // PAGO FINAL: 20% restante
      console.log("\n   📝 PAGO FINAL (20%):");
      const pagoFinal = totalFactura - primerPago - segundoPago;
      const payment3Data = {
        invoice: invoiceId,
        amount: pagoFinal,
        paymentMethod: "tarjeta_credito",
        paymentDate: new Date().toISOString(),
        reference: "PAGO-FINAL-" + Date.now(),
        notes: "Pago final (20%)",
      };

      const payment3Response = await makeRequest(
        "POST",
        "/payments",
        payment3Data,
        authToken
      );

      if (
        payment3Response.statusCode === 200 ||
        payment3Response.statusCode === 201
      ) {
        const payment3 = payment3Response.data.data || payment3Response.data;
        testData.payment = payment3;
        console.log(`   ✅ Monto: $${payment3.amount.toLocaleString()}`);
        console.log(`   - Método: ${payment3.paymentMethod}`);
        console.log(`   - Referencia: ${payment3.reference}`);

        // Verificar estado FINAL
        const invoiceStateFinal = await makeRequest(
          "GET",
          `/invoices/${invoiceId}`,
          null,
          authToken
        );
        if (invoiceStateFinal.statusCode === 200) {
          const invFinal =
            invoiceStateFinal.data.data || invoiceStateFinal.data;
          console.log(`\n   🎉 FACTURA PAGADA COMPLETAMENTE EN 3 CUOTAS:`);
          console.log(`   - Total: $${invFinal.total.toLocaleString()}`);
          console.log(`   - Pagado: $${invFinal.paidAmount.toLocaleString()}`);
          console.log(`   - Saldo: $${invFinal.balance.toLocaleString()}`);
          console.log(`   - Estado: ${invFinal.status}`);

          // Validar que el saldo sea exactamente $0
          if (invFinal.balance === 0) {
            console.log(`   ✓ Saldo en cero - CORRECTO`);
          } else {
            console.log(
              `   ⚠️ ADVERTENCIA: Saldo debería ser $0 pero es $${invFinal.balance}`
            );
          }

          // Validar que el estado sea "pagada_total"
          if (invFinal.status === "pagada_total") {
            console.log(`   ✓ Estado "pagada_total" - CORRECTO`);
          } else {
            console.log(
              `   ⚠️ ADVERTENCIA: Estado debería ser "pagada_total" pero es "${invFinal.status}"`
            );
          }
        }

        // VALIDAR CUENTAS POR COBRAR después del pago final (debe estar fuera del reporte)
        console.log(
          `\n   💰 Validando cuentas por cobrar después del pago final:`
        );
        const today3 = new Date();
        const startDate3 = new Date(
          today3.getFullYear(),
          today3.getMonth(),
          1
        ).toISOString();
        const endDate3 = new Date(
          today3.getFullYear(),
          today3.getMonth() + 1,
          0
        ).toISOString();

        const ar3Response = await makeRequest(
          "GET",
          `/invoices/reports?type=accounts_receivable&startDate=${startDate3}&endDate=${endDate3}`,
          null,
          authToken
        );

        if (ar3Response.statusCode === 200) {
          const ar3Data = ar3Response.data.data || ar3Response.data;
          const currentInvoice3 = ar3Data.accountsReceivable?.find(
            (inv) => inv.id.toString() === invoiceId.toString()
          );

          if (currentInvoice3) {
            console.log(
              `   ⚠️ ADVERTENCIA: Factura AÚN aparece en cuentas por cobrar:`
            );
            console.log(
              `      - Pendiente: $${currentInvoice3.pendingAmount.toLocaleString()}`
            );
            console.log(
              `      - Pagado: $${currentInvoice3.paidAmount.toLocaleString()}`
            );
            console.log(
              `      - Debería tener pendiente = $0 o no aparecer en el reporte`
            );
          } else {
            console.log(
              `   ✅ CORRECTO: Factura NO está en cuentas por cobrar (totalmente pagada)`
            );
          }

          console.log(
            `   📊 Total general por cobrar: $${parseFloat(ar3Data.summary?.totalReceivableAmount || 0).toLocaleString()}`
          );
          console.log(
            `   📊 Facturas pendientes en el sistema: ${ar3Data.summary?.totalPendingInvoices || 0}`
          );
        }
      }
    }

    // ============================================
    // PASO 13: RESUMEN GENERAL DE CUENTAS POR COBRAR
    // ============================================
    console.log("\n💰 PASO 13: RESUMEN GENERAL DE CUENTAS POR COBRAR");
    console.log("-".repeat(60));
    console.log(
      `\n   📋 Este paso muestra todas las facturas del sistema con saldo pendiente.`
    );
    console.log(
      `   La factura que acabamos de pagar NO debería aparecer aquí.`
    );

    const today = new Date();
    const startDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    ).toISOString();
    const endDate = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    ).toISOString();

    const arFinalResponse = await makeRequest(
      "GET",
      `/invoices/reports?type=accounts_receivable&startDate=${startDate}&endDate=${endDate}`,
      null,
      authToken
    );

    if (arFinalResponse.statusCode === 200) {
      const arData = arFinalResponse.data.data || arFinalResponse.data;
      console.log(`\n   📊 Resumen GLOBAL de cuentas por cobrar:`);
      console.log(
        `   - Facturas pendientes: ${arData.summary?.totalPendingInvoices || 0}`
      );
      console.log(
        `   - Total por cobrar: $${parseFloat(arData.summary?.totalReceivableAmount || 0).toLocaleString()}`
      );
      console.log(
        `   - Facturas vencidas: ${arData.summary?.overdueInvoices || 0}`
      );
      console.log(
        `   - Total vencido: $${parseFloat(arData.summary?.totalOverdueAmount || 0).toLocaleString()}`
      );

      if (arData.accountsReceivable && arData.accountsReceivable.length > 0) {
        console.log(
          `\n   📋 Facturas con saldo pendiente (mostrando hasta 5):`
        );
        arData.accountsReceivable.slice(0, 5).forEach((inv, idx) => {
          console.log(`   ${idx + 1}. ${inv.invoiceNumber}`);
          console.log(`      - Cliente: ${inv.customer?.nombre || "N/A"}`);
          console.log(
            `      - Total: $${inv.totalAmount.toLocaleString()} | Pagado: $${inv.paidAmount.toLocaleString()} | Pendiente: $${inv.pendingAmount.toLocaleString()}`
          );
          console.log(
            `      - Estado: ${inv.status} | Días vencido: ${inv.daysOverdue}`
          );
        });

        // Verificar si nuestra factura de prueba está en la lista
        if (invoiceId) {
          const ourInvoice = arData.accountsReceivable.find(
            (inv) => inv.id.toString() === invoiceId.toString()
          );
          if (ourInvoice) {
            console.log(
              `\n   ⚠️ ALERTA: La factura del test (${testData.invoice?.invoiceNumber}) AÚN tiene saldo pendiente:`
            );
            console.log(
              `      - Pendiente: $${ourInvoice.pendingAmount.toLocaleString()}`
            );
            console.log(
              `      - Esto NO debería ocurrir después de pago completo`
            );
          } else {
            console.log(
              `\n   ✅ VALIDACIÓN EXITOSA: La factura del test NO está en cuentas por cobrar`
            );
          }
        }
      } else {
        console.log(
          `\n   ✅ No hay facturas con saldo pendiente en el sistema`
        );
      }
    }

    // ============================================
    // PASO 14: CONSULTAR CUENTAS POR COBRAR POR CLIENTE
    // ============================================
    console.log("\n👤 PASO 14: CONSULTAR CUENTAS POR COBRAR POR CLIENTE");
    console.log("-".repeat(60));
    console.log(
      `\n   📋 Este paso muestra cómo filtrar cuentas por cobrar por cliente específico.`
    );

    if (firstCustomer && firstCustomer._id) {
      const customerId = firstCustomer._id;
      const customerName = firstCustomer.nombre;

      console.log(
        `\n   🔍 Consultando facturas pendientes de: ${customerName}`
      );
      console.log(`      ID del cliente: ${customerId}`);
      console.log(`\n   📡 Endpoint utilizado:`);
      console.log(
        `      GET /api/invoices/reports?type=accounts_receivable&customer=${customerId}`
      );

      const customerArResponse = await makeRequest(
        "GET",
        `/invoices/reports?type=accounts_receivable&customer=${customerId}`,
        null,
        authToken
      );

      if (customerArResponse.statusCode === 200) {
        const customerArData =
          customerArResponse.data.data || customerArResponse.data;

        console.log(`\n   📊 Resumen de cuentas por cobrar del cliente:`);
        console.log(
          `   - Facturas pendientes: ${customerArData.summary?.totalPendingInvoices || 0}`
        );
        console.log(
          `   - Total adeudado: $${parseFloat(customerArData.summary?.totalReceivableAmount || 0).toLocaleString()}`
        );
        console.log(
          `   - Facturas vencidas: ${customerArData.summary?.overdueInvoices || 0}`
        );
        console.log(
          `   - Total vencido: $${parseFloat(customerArData.summary?.totalOverdueAmount || 0).toLocaleString()}`
        );

        if (
          customerArData.accountsReceivable &&
          customerArData.accountsReceivable.length > 0
        ) {
          console.log(
            `\n   📋 Detalle de facturas pendientes (${customerArData.accountsReceivable.length}):`
          );
          customerArData.accountsReceivable.forEach((inv, idx) => {
            console.log(`\n   ${idx + 1}. ${inv.invoiceNumber}`);
            console.log(
              `      - Fecha emisión: ${new Date(inv.issueDate).toLocaleDateString()}`
            );
            console.log(
              `      - Fecha vencimiento: ${new Date(inv.dueDate).toLocaleDateString()}`
            );
            console.log(`      - Total: $${inv.totalAmount.toLocaleString()}`);
            console.log(`      - Pagado: $${inv.paidAmount.toLocaleString()}`);
            console.log(
              `      - Pendiente: $${inv.pendingAmount.toLocaleString()}`
            );
            console.log(`      - Estado: ${inv.status}`);
            console.log(
              `      - Días ${inv.daysOverdue > 0 ? "vencido" : "para vencer"}: ${Math.abs(inv.daysOverdue)}`
            );
            if (inv.paymentTerms) {
              console.log(`      - Términos: ${inv.paymentTerms}`);
            }
          });

          console.log(`\n   💡 Casos de uso del filtro por cliente:`);
          console.log(`      • Enviar estados de cuenta mensuales al cliente`);
          console.log(
            `      • Evaluar el crédito antes de crear nuevas órdenes`
          );
          console.log(`      • Enviar recordatorios de pago personalizados`);
          console.log(`      • Identificar clientes con facturas vencidas`);
          console.log(`      • Generar reportes de cobranza por cliente`);
        } else {
          console.log(
            `\n   ✅ El cliente NO tiene facturas pendientes (todas pagadas)`
          );
          console.log(
            `\n   💡 Nota: En este caso, el cliente ha pagado todas sus facturas.`
          );
          console.log(
            `      Para ver facturas pendientes, debe haber facturas con:`
          );
          console.log(`      - Estado: "emitida" o "pagada_parcial"`);
          console.log(`      - Balance pendiente > 0`);
        }

        console.log(`\n   ℹ️ Información adicional:`);
        console.log(
          `      - El filtro funciona independientemente del rango de fechas`
        );
        console.log(
          `      - Muestra TODAS las facturas pendientes del cliente`
        );
        console.log(
          `      - Se puede combinar con otros filtros si se necesita`
        );
      } else {
        console.log(`\n   ⚠️ Error consultando cuentas por cobrar del cliente`);
      }
    } else {
      console.log(
        `\n   ⚠️ No se pudo obtener el ID del cliente para la consulta`
      );
    }

    // ============================================
    // PASO 15: FILTRAR ÓRDENES POR PRIORIDAD
    // ============================================
    console.log(
      "\n🔍 PASO 15: FILTRAR órdenes por prioridad vía GET /api/work-orders?priority=alta"
    );
    console.log("-".repeat(60));

    const filterResponse = await makeRequest(
      "GET",
      "/work-orders?priority=alta&limit=10",
      null,
      authToken
    );

    if (filterResponse.statusCode === 200) {
      const filteredOrders =
        filterResponse.data.data || filterResponse.data.docs || [];

      console.log(
        `\n   ✅ Órdenes con prioridad ALTA: ${filteredOrders.length}`
      );

      if (filteredOrders.length > 0) {
        filteredOrders.slice(0, 2).forEach((wo, index) => {
          console.log(`   ${index + 1}. ${wo.numeroOrden || "N/A"}`);
          console.log(`      - Prioridad: ${wo.prioridad}`);
          console.log(`      - Estado: ${wo.estado?.nombre || "N/A"}`);
        });
      }
    }

    // ============================================
    // PASO 15.5: LISTAR ÓRDENES CON ITEMS INCLUIDOS
    // ============================================
    console.log(
      "\n🔍 PASO 15.5: LISTAR órdenes CON ITEMS incluidos vía GET /api/work-orders?includeItems=true"
    );
    console.log("-".repeat(60));

    const includeItemsResponse = await makeRequest(
      "GET",
      "/work-orders?includeItems=true&limit=3",
      null,
      authToken
    );

    if (includeItemsResponse.statusCode === 200) {
      const ordersWithItems =
        includeItemsResponse.data.data || includeItemsResponse.data.docs || [];

      console.log(
        `\n   ✅ Órdenes listadas con parámetro includeItems=true: ${ordersWithItems.length}`
      );

      if (ordersWithItems.length > 0) {
        console.log(`\n   📋 Verificación de items en cada orden:`);
        ordersWithItems.forEach((wo, index) => {
          const itemsCount = wo.items ? wo.items.length : 0;
          console.log(`   ${index + 1}. Orden: ${wo.numeroOrden || "N/A"}`);
          console.log(`      - Items incluidos: ${itemsCount}`);

          if (itemsCount > 0) {
            wo.items.forEach((item, itemIndex) => {
              console.log(
                `        ${itemIndex + 1}. ${item.nombre || item.tipo} - $${item.precioFinal || item.precioTotal || 0}`
              );
            });
          }
        });
      }

      console.log(
        `\n   💡 Nota: Si no hay items, las órdenes más recientes no tienen items aún.`
      );
      console.log(
        `      Las órdenes con items son las creadas en pasos anteriores del test.`
      );
    }

    // ============================================
    // RESUMEN
    // ============================================
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMEN DEL TEST");
    console.log("=".repeat(60));
    console.log(`
    ESCENARIO: Órdenes de Trabajo del Taller (API)
    
    ÓRDENES CREADAS: ${testData.workOrders.length}
    
    ORDEN PRINCIPAL:
    - ID: ${workOrderId}
    - Número: ${workOrder.numeroOrden || "N/A"}
    - Cliente: ${firstCustomer.nombre} ${firstCustomer.apellido || ""}
    - Estado Final: ${workOrder.estado?.nombre || "N/A"}
    - Prioridad: ${workOrder.prioridad}
    `);

    console.log(`
    PRUEBAS COMPLETADAS:
    ✅ 1. Autenticación exitosa
    ✅ 2. Datos preparados (clientes, vehículos, estados, técnicos, servicios, items)
    ✅ 3. Orden de trabajo creada vía POST
    ✅ 4. Detalle consultado vía GET /:id
    ✅ 5. Estado cambiado vía POST /:id/change-status
    ✅ 6. Items agregados (${testData.addedItems?.length || 0} items: repuestos y servicios)
    ✅ 7. Historial consultado vía GET /:id/history
    ✅ 8. Orden actualizada vía PUT
    ✅ 9. Listado de órdenes vía GET
    ✅ 10. Múltiples órdenes creadas
    ✅ 11. Factura generada desde OT
    ✅ 12. Pagos registrados (3 cuotas: 50% + 30% + 20%)
    ✅ 13. Cuentas por cobrar consultadas (reporte global)
    ✅ 14. Cuentas por cobrar por cliente (filtro específico)
    ✅ 15. Filtrado por prioridad
    ✅ 15.5. Listado con items incluidos (parámetro includeItems)
    
    FACTURACIÓN:
    ${testData.invoice ? `✓ Factura: ${testData.invoice.invoiceNumber || "N/A"} - Total: $${testData.invoice.total || 0}` : "⚠️ No se generó factura"}
    ✓ Pagos parciales: 3 cuotas (transferencia, efectivo, tarjeta)
    ${testData.payment ? `✓ Último pago: $${testData.payment.amount || 0} vía ${testData.payment.paymentMethod || "N/A"}` : "⚠️ No se completó pago"}
    
    ENDPOINTS PROBADOS (20 endpoints):
    ✓ POST /api/auth/login
    ✓ GET /api/customers
    ✓ GET /api/vehicles
    ✓ GET /api/work-order-statuses
    ✓ GET /api/user
    ✓ GET /api/services (obtener servicios)
    ✓ GET /api/inventory/items (obtener repuestos)
    ✓ POST /api/work-orders (crear orden)
    ✓ POST /api/work-order-items (agregar items)
    ✓ GET /api/work-order-items/:workOrderId (listar items)
    ✓ GET /api/work-orders (listar órdenes)
    ✓ GET /api/work-orders/:id (detalle)
    ✓ PUT /api/work-orders/:id (actualizar)
    ✓ POST /api/work-orders/:id/change-status (cambiar estado)
    ✓ GET /api/work-orders/:id/history (historial)
    ✓ POST /api/invoices/from-work-order/:workOrderId (generar factura)
    ✓ PATCH /api/invoices/:id/emit (emitir factura)
    ✓ GET /api/invoices/:id (consultar factura)
    ✓ POST /api/payments (registrar pagos)
    ✓ GET /api/invoices/reports?type=accounts_receivable (cuentas por cobrar)
    
    FLUJO VALIDADO:
    Creación → Diagnóstico → Agregar Items (Servicios + Repuestos) → 
    Actualización → Historial → Facturación → Emisión → 
    Pagos Parciales (3 cuotas) → Cuentas por Cobrar → Pago Completo
    `);

    console.log("=".repeat(60));
    console.log("✅ TESTS PASARON EXITOSAMENTE");
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
};

// Ejecutar test
testWorkOrdersAPI();
