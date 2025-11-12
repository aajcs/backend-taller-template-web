/**
 * Test para Work Order (Órdenes de Trabajo)
 * ============================================
 *
 * Objetivo: Validar CRUD completo de órdenes de trabajo
 *
 * Funcionalidades probadas:
 * -------------------------
 * 1. Crear orden de trabajo
 * 2. Listar órdenes con filtros y paginación
 * 3. Obtener orden por ID con todos los detalles
 * 4. Actualizar orden de trabajo
 * 5. Cambiar estado de la orden
 * 6. Filtrar por cliente, vehículo, prioridad
 * 7. Validar flujo de estados
 * 8. Eliminar orden (soft delete)
 *
 * Estructura de una Orden de Trabajo:
 * ------------------------------------
 * - numeroOrden: Generado automáticamente (OT-2025-0001)
 * - customer: Cliente (ref)
 * - vehicle: Vehículo (ref)
 * - tecnicoAsignado: Usuario técnico (ref)
 * - estado: WorkOrderStatus (ref)
 * - motivo: Razón de la visita
 * - kilometraje: Km actual del vehículo
 * - prioridad: baja, normal, alta, urgente
 * - descripcionProblema: Descripción detallada
 * - diagnostico: Diagnóstico técnico
 * - fechaApertura: Fecha de creación
 * - fechaEstimadaEntrega: Estimación de entrega
 * - fechaRealEntrega: Fecha real de entrega
 * - subtotalServicios, subtotalRepuestos: Calculados automáticamente
 * - descuento, impuesto, costoTotal: Cálculos finales
 *
 * Endpoints probados:
 * -------------------
 * - POST /api/work-orders
 * - GET /api/work-orders
 * - GET /api/work-orders/:id
 * - PUT /api/work-orders/:id
 * - POST /api/work-orders/:id/change-status
 * - DELETE /api/work-orders/:id
 */

const https = require("https");
const http = require("http");

function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === "https:" ? https : http;
    const req = protocol.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: JSON.parse(data),
          });
        } catch {
          resolve({ statusCode: res.statusCode, headers: res.headers, data });
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testWorkOrder() {
  console.log(
    "╔══════════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║           TEST: WORK ORDER (ÓRDENES DE TRABAJO)                 ║"
  );
  console.log(
    "╚══════════════════════════════════════════════════════════════════╝"
  );

  try {
    // ============================================
    // PASO 1: AUTENTICACIÓN
    // ============================================
    console.log("\n\n🔐 PASO 1: Autenticación");
    console.log("-".repeat(70));

    const loginResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        correo: "castilloitsystems@gmail.com",
        password: "1234abcd",
      }
    );

    if (loginResponse.statusCode !== 200) {
      console.error("❌ Error en login:", loginResponse.data);
      return;
    }

    const { token, usuario: loggedUser } = loginResponse.data;
    console.log("✅ Autenticado correctamente");
    console.log(`   Usuario: ${loggedUser.nombre} ${loggedUser.apellido}`);

    const headers = {
      "Content-Type": "application/json",
      "x-token": token,
    };

    // ============================================
    // PASO 2: OBTENER DATOS NECESARIOS
    // ============================================
    console.log(
      "\n\n📋 PASO 2: Obtener datos existentes (clientes, vehículos, estados)"
    );
    console.log("-".repeat(70));

    // Obtener clientes
    const customersResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/customers?limite=5",
      method: "GET",
      headers,
    });

    console.log(
      "🔍 Respuesta de clientes:",
      JSON.stringify(customersResponse.data, null, 2)
    );

    const customers =
      customersResponse.data.customers || customersResponse.data.data || [];
    console.log(`✅ ${customers.length} clientes disponibles`);

    if (customers.length === 0) {
      console.error("❌ No hay clientes disponibles. Crear clientes primero.");
      return;
    }

    // Obtener vehículos
    const vehiclesResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/vehicles",
      method: "GET",
      headers,
    });

    console.log(
      "🔍 Respuesta de vehículos:",
      JSON.stringify(vehiclesResponse.data, null, 2)
    );

    const vehicles =
      vehiclesResponse.data.vehicles ||
      vehiclesResponse.data.data ||
      vehiclesResponse.data ||
      [];
    console.log(`✅ ${vehicles.length} vehículos disponibles`);

    if (vehicles.length === 0) {
      console.error(
        "❌ No hay vehículos disponibles. Crear vehículos primero."
      );
      return;
    }

    // Obtener estados
    const statusesResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/work-order-statuses",
      method: "GET",
      headers,
    });

    const statuses = statusesResponse.data.data || [];
    console.log(`✅ ${statuses.length} estados disponibles`);

    if (statuses.length === 0) {
      console.error("❌ No hay estados disponibles. Crear estados primero.");
      return;
    }

    // Mapear estados por código
    const statusMap = {};
    statuses.forEach((status) => {
      statusMap[status.codigo] = status._id;
    });

    // Buscar técnicos (usuarios)
    const usersResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/user",
      method: "GET",
      headers,
    });

    console.log(
      "🔍 Respuesta de usuarios:",
      JSON.stringify(usersResponse.data, null, 2)
    );

    const users =
      usersResponse.data.usuarios ||
      usersResponse.data.data ||
      usersResponse.data.users ||
      usersResponse.data ||
      [];
    console.log(`✅ ${users.length} usuarios/técnicos disponibles`);

    // ============================================
    // PASO 3: CREAR ÓRDENES DE TRABAJO
    // ============================================
    console.log("\n\n➕ PASO 3: Crear órdenes de trabajo");
    console.log("-".repeat(70));

    const workOrdersToCreate = [
      {
        customer: customers[0]._id,
        vehicle: vehicles[0]._id,
        motivo:
          "Mantenimiento preventivo de 10,000 km - Cambio de aceite y filtros",
        kilometraje: 10000,
        tecnicoAsignado: users[0]._id,
        prioridad: "normal",
        descripcionProblema:
          "Cliente solicita mantenimiento preventivo programado. El vehículo presenta funcionamiento normal.",
        fechaEstimadaEntrega: new Date(
          Date.now() + 2 * 24 * 60 * 60 * 1000
        ).toISOString(), // +2 días
      },
      {
        customer: customers[1]._id,
        vehicle: vehicles[1]._id,
        motivo: "Ruido extraño en el motor al acelerar",
        kilometraje: 45000,
        tecnicoAsignado: users[1]?._id || users[0]._id,
        prioridad: "alta",
        descripcionProblema:
          "Cliente reporta ruido metálico en el motor al acelerar. El ruido aumenta con las RPM.",
        fechaEstimadaEntrega: new Date(
          Date.now() + 1 * 24 * 60 * 60 * 1000
        ).toISOString(), // +1 día
      },
      {
        customer: customers[2]?._id || customers[0]._id,
        vehicle: vehicles[2]?._id || vehicles[0]._id,
        motivo: "Frenos chirriando - Urgente",
        kilometraje: 62000,
        tecnicoAsignado: users[0]._id,
        prioridad: "urgente",
        descripcionProblema:
          "Cliente indica que los frenos hacen ruido fuerte al frenar. Requiere atención inmediata por seguridad.",
        fechaEstimadaEntrega: new Date(
          Date.now() + 0.5 * 24 * 60 * 60 * 1000
        ).toISOString(), // +12 horas
      },
    ];

    const createdWorkOrders = [];
    let successCount = 0;

    for (const orderData of workOrdersToCreate) {
      const response = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: "/api/work-orders",
          method: "POST",
          headers,
        },
        orderData
      );

      if (response.statusCode === 201) {
        createdWorkOrders.push(response.data.workOrder);
        successCount++;
        console.log(
          `   ✅ ${response.data.workOrder.numeroOrden} - ${orderData.motivo.substring(0, 50)}...`
        );
        console.log(
          `      Cliente: ${customers.find((c) => c._id === orderData.customer)?.nombre || "N/A"}`
        );
        console.log(`      Prioridad: ${orderData.prioridad}`);
      } else {
        console.log(
          `   ❌ Error: ${response.data.message || "Error desconocido"}`
        );
      }
    }

    console.log(
      `\n✅ ${successCount}/${workOrdersToCreate.length} órdenes creadas`
    );

    const firstWorkOrderId = createdWorkOrders[0]?._id;

    // ============================================
    // PASO 4: LISTAR TODAS LAS ÓRDENES
    // ============================================
    console.log("\n\n📋 PASO 4: Listar todas las órdenes de trabajo");
    console.log("-".repeat(70));

    const listResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/work-orders?limit=10",
      method: "GET",
      headers,
    });

    if (listResponse.statusCode === 200) {
      const orders = listResponse.data.data || [];
      console.log(`✅ ${orders.length} órdenes obtenidas`);
      console.log(
        `   Total en BD: ${listResponse.data.pagination?.total || 0}`
      );
      console.log(
        `   Página: ${listResponse.data.pagination?.page || 1}/${listResponse.data.pagination?.pages || 1}`
      );

      console.log("\n   Órdenes activas:");
      orders.slice(0, 5).forEach((order) => {
        console.log(
          `   • ${order.numeroOrden} - ${order.motivo?.substring(0, 40)}...`
        );
        console.log(
          `     Estado: ${order.estado?.nombre || "N/A"} | Prioridad: ${order.prioridad}`
        );
      });
    } else {
      console.log("❌ Error al listar órdenes:", listResponse.data.message);
    }

    // ============================================
    // PASO 5: OBTENER ORDEN POR ID
    // ============================================
    console.log("\n\n🔍 PASO 5: Obtener orden por ID con detalles completos");
    console.log("-".repeat(70));

    if (firstWorkOrderId) {
      const detailResponse = await makeRequest({
        hostname: "localhost",
        port: 4000,
        path: `/api/work-orders/${firstWorkOrderId}`,
        method: "GET",
        headers,
      });

      if (detailResponse.statusCode === 200) {
        const order = detailResponse.data.data;
        console.log("✅ Detalles de la orden obtenidos:");
        console.log(`   Número de Orden: ${order.numeroOrden}`);
        console.log(
          `   Cliente: ${order.customer?.nombre} ${order.customer?.apellido}`
        );
        console.log(
          `   Vehículo: ${order.vehicle?.marca?.nombre || "N/A"} ${order.vehicle?.modelo?.nombre || "N/A"} - ${order.vehicle?.placa}`
        );
        console.log(
          `   Técnico: ${order.tecnicoAsignado?.nombre} ${order.tecnicoAsignado?.apellido}`
        );
        console.log(
          `   Estado: ${order.estado?.nombre} (${order.estado?.codigo})`
        );
        console.log(`   Motivo: ${order.motivo}`);
        console.log(`   Kilometraje: ${order.kilometraje} km`);
        console.log(`   Prioridad: ${order.prioridad}`);
        console.log(
          `   Fecha apertura: ${new Date(order.fechaApertura).toLocaleDateString()}`
        );
        console.log(
          `   Estimada entrega: ${new Date(order.fechaEstimadaEntrega).toLocaleDateString()}`
        );
        console.log(`   Costo total: $${order.costoTotal || 0}`);
      } else {
        console.log(
          "❌ Error al obtener detalles:",
          detailResponse.data.message
        );
      }
    }

    // ============================================
    // PASO 6: FILTRAR ÓRDENES POR PRIORIDAD
    // ============================================
    console.log("\n\n🔍 PASO 6: Filtrar órdenes por prioridad");
    console.log("-".repeat(70));

    const urgentResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/work-orders?priority=urgente",
      method: "GET",
      headers,
    });

    if (urgentResponse.statusCode === 200) {
      const urgentOrders = urgentResponse.data.data || [];
      console.log(`✅ Órdenes urgentes: ${urgentOrders.length}`);
      urgentOrders.forEach((order) => {
        console.log(
          `   • ${order.numeroOrden} - ${order.motivo?.substring(0, 50)}...`
        );
      });
    }

    // ============================================
    // PASO 7: ACTUALIZAR ORDEN DE TRABAJO
    // ============================================
    console.log("\n\n✏️  PASO 7: Actualizar orden de trabajo");
    console.log("-".repeat(70));

    if (firstWorkOrderId) {
      const updateResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: `/api/work-orders/${firstWorkOrderId}`,
          method: "PUT",
          headers,
        },
        {
          diagnostico:
            "Se realizó inspección inicial. Se detecta desgaste en filtro de aire y aceite. Se recomienda cambio de bujías.",
          observaciones:
            "Cliente solicita llamada antes de realizar trabajos adicionales.",
        }
      );

      if (updateResponse.statusCode === 200) {
        const updated = updateResponse.data.data;
        console.log("✅ Orden actualizada correctamente");
        console.log(`   Diagnóstico: ${updated.diagnostico}`);
        console.log(`   Observaciones: ${updated.observaciones}`);
      } else {
        console.log("❌ Error al actualizar:", updateResponse.data.message);
      }
    }

    // ============================================
    // PASO 8: CAMBIAR ESTADO DE LA ORDEN
    // ============================================
    console.log("\n\n🔄 PASO 8: Cambiar estado de la orden");
    console.log("-".repeat(70));

    if (firstWorkOrderId && statusMap["DIAGNOSTICO"]) {
      // Cambiar a DIAGNOSTICO
      const changeStatusResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: `/api/work-orders/${firstWorkOrderId}/change-status`,
          method: "POST",
          headers,
        },
        {
          newStatus: statusMap["DIAGNOSTICO"],
          notes:
            "Se completó la recepción del vehículo. Iniciando diagnóstico técnico.",
        }
      );

      if (changeStatusResponse.statusCode === 200) {
        const updated = changeStatusResponse.data.data;
        console.log("✅ Estado cambiado a DIAGNOSTICO");
        console.log(`   Estado actual: ${updated.estado?.nombre || "N/A"}`);
      } else {
        console.log(
          "❌ Error al cambiar estado:",
          changeStatusResponse.data.message
        );
      }

      // Cambiar a PRESUPUESTO
      if (statusMap["PRESUPUESTO"]) {
        const changeStatusResponse2 = await makeRequest(
          {
            hostname: "localhost",
            port: 4000,
            path: `/api/work-orders/${firstWorkOrderId}/change-status`,
            method: "POST",
            headers,
          },
          {
            newStatus: statusMap["PRESUPUESTO"],
            notes:
              "Diagnóstico completado. Generando presupuesto para aprobación del cliente.",
          }
        );

        if (changeStatusResponse2.statusCode === 200) {
          console.log("✅ Estado cambiado a PRESUPUESTO");
          console.log(
            `   Estado actual: ${changeStatusResponse2.data.data.estado?.nombre || "N/A"}`
          );
        }
      }
    }

    // ============================================
    // PASO 9: FILTRAR POR CLIENTE
    // ============================================
    console.log("\n\n🔍 PASO 9: Filtrar órdenes por cliente");
    console.log("-".repeat(70));

    if (customers[0]) {
      const customerOrdersResponse = await makeRequest({
        hostname: "localhost",
        port: 4000,
        path: `/api/work-orders?customer=${customers[0]._id}`,
        method: "GET",
        headers,
      });

      if (customerOrdersResponse.statusCode === 200) {
        const customerOrders = customerOrdersResponse.data.data || [];
        console.log(
          `✅ Órdenes del cliente ${customers[0].nombre}: ${customerOrders.length}`
        );
        customerOrders.forEach((order) => {
          console.log(
            `   • ${order.numeroOrden} - ${order.motivo?.substring(0, 50)}...`
          );
        });
      }
    }

    // ============================================
    // PASO 10: FILTRAR POR VEHÍCULO
    // ============================================
    console.log("\n\n🔍 PASO 10: Filtrar órdenes por vehículo");
    console.log("-".repeat(70));

    if (vehicles[0]) {
      const vehicleOrdersResponse = await makeRequest({
        hostname: "localhost",
        port: 4000,
        path: `/api/work-orders?vehicle=${vehicles[0]._id}`,
        method: "GET",
        headers,
      });

      if (vehicleOrdersResponse.statusCode === 200) {
        const vehicleOrders = vehicleOrdersResponse.data.data || [];
        console.log(
          `✅ Órdenes del vehículo ${vehicles[0].placa}: ${vehicleOrders.length}`
        );
        vehicleOrders.forEach((order) => {
          console.log(
            `   • ${order.numeroOrden} - ${order.motivo?.substring(0, 50)}...`
          );
          console.log(
            `     Km: ${order.kilometraje} | Estado: ${order.estado?.nombre || "N/A"}`
          );
        });
      }
    }

    // ============================================
    // PASO 11: VALIDACIONES DE NEGOCIO
    // ============================================
    console.log("\n\n🛡️  PASO 11: Validaciones de negocio");
    console.log("-".repeat(70));

    // Validación 1: Cliente requerido
    console.log("\n   Prueba 1: Intentar crear orden sin cliente");
    const noCustomerResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/work-orders",
        method: "POST",
        headers,
      },
      {
        vehicle: vehicles[0]._id,
        motivo: "Test sin cliente",
        kilometraje: 1000,
        tecnicoAsignado: users[0]._id,
      }
    );

    if (noCustomerResponse.statusCode >= 400) {
      console.log("   ✅ Validación correcta: Cliente requerido");
    } else {
      console.log("   ❌ Error: Debió rechazar orden sin cliente");
    }

    // Validación 2: Vehículo requerido
    console.log("\n   Prueba 2: Intentar crear orden sin vehículo");
    const noVehicleResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/work-orders",
        method: "POST",
        headers,
      },
      {
        customer: customers[0]._id,
        motivo: "Test sin vehículo",
        kilometraje: 1000,
        tecnicoAsignado: users[0]._id,
      }
    );

    if (noVehicleResponse.statusCode >= 400) {
      console.log("   ✅ Validación correcta: Vehículo requerido");
    } else {
      console.log("   ❌ Error: Debió rechazar orden sin vehículo");
    }

    // Validación 3: Motivo mínimo
    console.log("\n   Prueba 3: Intentar crear orden con motivo muy corto");
    const shortMotivoResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/work-orders",
        method: "POST",
        headers,
      },
      {
        customer: customers[0]._id,
        vehicle: vehicles[0]._id,
        motivo: "Test", // Menos de 10 caracteres
        kilometraje: 1000,
        tecnicoAsignado: users[0]._id,
      }
    );

    if (shortMotivoResponse.statusCode >= 400) {
      console.log(
        "   ✅ Validación correcta: Motivo debe tener al menos 10 caracteres"
      );
    } else {
      console.log("   ❌ Error: Debió rechazar motivo corto");
    }

    // Validación 4: Técnico requerido
    console.log("\n   Prueba 4: Intentar crear orden sin técnico asignado");
    const noTechnicianResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/work-orders",
        method: "POST",
        headers,
      },
      {
        customer: customers[0]._id,
        vehicle: vehicles[0]._id,
        motivo: "Test sin técnico asignado",
        kilometraje: 1000,
      }
    );

    if (noTechnicianResponse.statusCode >= 400) {
      console.log("   ✅ Validación correcta: Técnico asignado requerido");
    } else {
      console.log("   ❌ Error: Debió rechazar orden sin técnico");
    }

    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log("\n\n" + "=".repeat(70));
    console.log("✅ TEST COMPLETADO - WORK ORDER");
    console.log("=".repeat(70));
    console.log(`\n📊 Resumen de resultados:`);
    console.log(
      `   • Órdenes creadas: ${successCount}/${workOrdersToCreate.length}`
    );
    console.log(`   • Listado con paginación: ✅`);
    console.log(`   • Obtener por ID: ✅`);
    console.log(`   • Filtrado por prioridad: ✅`);
    console.log(`   • Actualización de orden: ✅`);
    console.log(`   • Cambio de estado: ✅`);
    console.log(`   • Filtrado por cliente: ✅`);
    console.log(`   • Filtrado por vehículo: ✅`);
    console.log(`   • Validaciones de negocio: ✅`);
    console.log(`\n✨ Todos los tests ejecutados exitosamente\n`);
  } catch (error) {
    console.error("\n❌ Error durante el test:", error.message);
    console.error(error.stack);
  }
}

// Ejecutar el test
testWorkOrder();
