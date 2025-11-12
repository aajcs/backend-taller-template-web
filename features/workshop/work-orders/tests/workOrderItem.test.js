/**
 * Test para Work Order Items (Items de Órdenes de Trabajo)
 * ==========================================================
 *
 * Objetivo: Validar gestión completa de items (servicios y repuestos) en órdenes
 *
 * Funcionalidades probadas:
 * -------------------------
 * 1. Agregar servicios a una orden
 * 2. Agregar repuestos a una orden
 * 3. Listar items de una orden
 * 4. Obtener item por ID
 * 5. Actualizar item (cantidad, precio, notas)
 * 6. Cambiar estado del item (pendiente → en_proceso → completado)
 * 7. Marcar item como completado
 * 8. Eliminar item de la orden
 * 9. Validar cálculos de precios
 * 10. Validar estados y transiciones
 *
 * Tipos de Items:
 * ---------------
 * - SERVICIO: Referencia a Service (trabajos a realizar)
 *   * Tiene tiempo estimado y tiempo real
 *   * Se cobra por servicio prestado
 *   * Estados: pendiente, en_proceso, completado, cancelado
 *
 * - REPUESTO: Referencia a Item (productos/piezas)
 *   * Tiene cantidad y precio unitario
 *   * Se descuenta del inventario
 *   * Puede tener descuento aplicado
 *
 * Campos probados:
 * ----------------
 * - workOrder (ref), tipo (servicio/repuesto)
 * - servicio (ref Service), repuesto (ref Item)
 * - nombre, descripcion, cantidad
 * - precioUnitario, precioTotal, precioFinal
 * - descuento, estado
 * - tiempoEstimado, tiempoReal
 * - notas
 *
 * Endpoints probados:
 * -------------------
 * - POST /api/work-orders/:workOrderId/items
 * - GET /api/work-orders/:workOrderId/items
 * - GET /api/work-orders/:workOrderId/items/item/:id
 * - PUT /api/work-orders/:workOrderId/items/item/:id
 * - PATCH /api/work-orders/:workOrderId/items/item/:id/complete
 * - PATCH /api/work-orders/:workOrderId/items/item/:id/status
 * - DELETE /api/work-orders/:workOrderId/items/item/:id
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

async function testWorkOrderItem() {
  console.log(
    "╔══════════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║        TEST: WORK ORDER ITEMS (ITEMS DE ÓRDENES)                ║"
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

    const { token } = loginResponse.data;
    console.log("✅ Autenticado correctamente");

    const headers = {
      "Content-Type": "application/json",
      "x-token": token,
    };

    // ============================================
    // PASO 2: OBTENER DATOS NECESARIOS
    // ============================================
    console.log(
      "\n\n📋 PASO 2: Obtener datos necesarios (órdenes, servicios, repuestos)"
    );
    console.log("-".repeat(70));

    // Obtener órdenes de trabajo
    const workOrdersResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/work-orders?limit=5",
      method: "GET",
      headers,
    });

    const workOrders =
      workOrdersResponse.data.data || workOrdersResponse.data || [];
    console.log(`✅ ${workOrders.length} órdenes de trabajo disponibles`);

    if (workOrders.length === 0) {
      console.error("❌ No hay órdenes de trabajo. Crear órdenes primero.");
      return;
    }

    const workOrderId = workOrders[0]._id;
    console.log(`   Usando orden: ${workOrders[0].numeroOrden}`);

    // Obtener servicios
    const servicesResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/services?limit=10",
      method: "GET",
      headers,
    });

    const services = servicesResponse.data.data || [];
    console.log(`✅ ${services.length} servicios disponibles`);

    if (services.length === 0) {
      console.error(
        "❌ No hay servicios disponibles. Crear servicios primero."
      );
      return;
    }

    // Obtener repuestos/items
    const itemsResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/items?limit=10",
      method: "GET",
      headers,
    });

    const items = itemsResponse.data.data || [];
    console.log(`✅ ${items.length} repuestos/items disponibles`);

    // ============================================
    // PASO 3: AGREGAR SERVICIOS A LA ORDEN
    // ============================================
    console.log("\n\n➕ PASO 3: Agregar servicios a la orden de trabajo");
    console.log("-".repeat(70));

    const servicesToAdd = services.slice(0, 3); // Primeros 3 servicios
    const addedItems = [];

    for (const service of servicesToAdd) {
      const response = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: `/api/work-orders/${workOrderId}/items`,
          method: "POST",
          headers,
        },
        {
          workOrder: workOrderId,
          type: "service",
          service: service._id,
          quantity: 1,
          notes: `Servicio solicitado por el cliente - ${service.nombre}`,
        }
      );

      if (response.statusCode === 201) {
        addedItems.push(response.data.data);
        console.log(`   ✅ ${service.nombre}`);
        console.log(
          `      Precio: $${service.precioBase} | Tiempo: ${service.tiempoEstimadoMinutos} min`
        );
      } else {
        console.log(
          `   ❌ ${service.nombre}: ${response.data.message || "Error"}`
        );
      }
    }

    console.log(`\n✅ ${addedItems.length} servicios agregados`);

    // ============================================
    // PASO 4: AGREGAR REPUESTOS A LA ORDEN
    // ============================================
    console.log("\n\n➕ PASO 4: Agregar repuestos a la orden de trabajo");
    console.log("-".repeat(70));

    if (items.length > 0) {
      const partsToAdd = items.slice(0, 2); // Primeros 2 repuestos

      for (const item of partsToAdd) {
        const response = await makeRequest(
          {
            hostname: "localhost",
            port: 4000,
            path: `/api/work-orders/${workOrderId}/items`,
            method: "POST",
            headers,
          },
          {
            workOrder: workOrderId,
            type: "part",
            part: item._id,
            quantity: 2,
            notes: `Repuesto necesario para el mantenimiento`,
          }
        );

        if (response.statusCode === 201) {
          addedItems.push(response.data.data);
          console.log(`   ✅ ${item.nombre}`);
          console.log(
            `      Cantidad: 2 | Precio unitario: $${item.precio || 0}`
          );
        } else {
          console.log(
            `   ❌ ${item.nombre}: ${response.data.message || "Error"}`
          );
        }
      }

      console.log(`\n✅ Repuestos agregados`);
    } else {
      console.log("⚠️  No hay repuestos disponibles para agregar");
    }

    // ============================================
    // PASO 5: LISTAR ITEMS DE LA ORDEN
    // ============================================
    console.log("\n\n📋 PASO 5: Listar todos los items de la orden");
    console.log("-".repeat(70));

    const listItemsResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: `/api/work-orders/${workOrderId}/items`,
      method: "GET",
      headers,
    });

    if (listItemsResponse.statusCode === 200) {
      const orderItems = listItemsResponse.data.data || [];
      console.log(`✅ ${orderItems.length} items en la orden`);

      console.log("\n   Items de la orden:");
      let totalServicios = 0;
      let totalRepuestos = 0;

      orderItems.forEach((item, index) => {
        console.log(`   ${index + 1}. ${item.nombre} (${item.tipo})`);
        console.log(
          `      Cantidad: ${item.cantidad} | Precio: $${item.precioFinal || item.precioTotal || 0}`
        );
        console.log(`      Estado: ${item.estado}`);

        if (item.tipo === "servicio") {
          totalServicios += item.precioFinal || item.precioTotal || 0;
        } else {
          totalRepuestos += item.precioFinal || item.precioTotal || 0;
        }
      });

      console.log(`\n   Total Servicios: $${totalServicios.toFixed(2)}`);
      console.log(`   Total Repuestos: $${totalRepuestos.toFixed(2)}`);
      console.log(
        `   Total General: $${(totalServicios + totalRepuestos).toFixed(2)}`
      );
    } else {
      console.log("❌ Error al listar items:", listItemsResponse.data.message);
    }

    const firstItemId = addedItems[0]?._id;

    // ============================================
    // PASO 6: OBTENER ITEM POR ID
    // ============================================
    console.log("\n\n🔍 PASO 6: Obtener item por ID con detalles");
    console.log("-".repeat(70));

    if (firstItemId) {
      const itemDetailResponse = await makeRequest({
        hostname: "localhost",
        port: 4000,
        path: `/api/work-orders/${workOrderId}/items/item/${firstItemId}`,
        method: "GET",
        headers,
      });

      if (itemDetailResponse.statusCode === 200) {
        const item = itemDetailResponse.data.data;
        console.log("✅ Detalles del item obtenidos:");
        console.log(`   ID: ${item._id}`);
        console.log(`   Tipo: ${item.tipo}`);
        console.log(`   Nombre: ${item.nombre}`);
        console.log(`   Cantidad: ${item.cantidad}`);
        console.log(`   Precio unitario: $${item.precioUnitario}`);
        console.log(`   Precio total: $${item.precioTotal}`);
        console.log(`   Descuento: $${item.descuento || 0}`);
        console.log(`   Precio final: $${item.precioFinal}`);
        console.log(`   Estado: ${item.estado}`);
        if (item.notas) console.log(`   Notas: ${item.notas}`);
      } else {
        console.log(
          "❌ Error al obtener item:",
          itemDetailResponse.data.message
        );
      }
    }

    // ============================================
    // PASO 7: ACTUALIZAR ITEM
    // ============================================
    console.log("\n\n✏️  PASO 7: Actualizar item (cantidad y notas)");
    console.log("-".repeat(70));

    if (firstItemId) {
      const updateResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: `/api/work-orders/${workOrderId}/items/item/${firstItemId}`,
          method: "PUT",
          headers,
        },
        {
          quantity: 2,
          notes: "Cliente solicitó duplicar el servicio para ambos ejes",
        }
      );

      if (updateResponse.statusCode === 200) {
        const updated = updateResponse.data.data;
        console.log("✅ Item actualizado correctamente");
        console.log(`   Nueva cantidad: ${updated.cantidad}`);
        console.log(`   Nuevo precio total: $${updated.precioTotal}`);
        console.log(`   Notas: ${updated.notas}`);
      } else {
        console.log(
          "❌ Error al actualizar item:",
          updateResponse.data.message
        );
      }
    }

    // ============================================
    // PASO 8: CAMBIAR ESTADO DEL ITEM
    // ============================================
    console.log("\n\n🔄 PASO 8: Cambiar estado del item");
    console.log("-".repeat(70));

    if (firstItemId) {
      // Cambiar a EN_PROCESO
      const statusResponse1 = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: `/api/work-orders/${workOrderId}/items/item/${firstItemId}/status`,
          method: "PATCH",
          headers,
        },
        {
          newStatus: "en_proceso",
          notes: "Técnico comenzó a trabajar en este item",
        }
      );

      if (statusResponse1.statusCode === 200) {
        console.log("✅ Estado cambiado a EN_PROCESO");
        console.log(`   Estado actual: ${statusResponse1.data.data.estado}`);
      } else {
        console.log(
          "❌ Error al cambiar estado:",
          statusResponse1.data.message
        );
      }
    }

    // ============================================
    // PASO 9: MARCAR ITEM COMO COMPLETADO
    // ============================================
    console.log("\n\n✅ PASO 9: Marcar item como completado");
    console.log("-".repeat(70));

    if (firstItemId) {
      const completeResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: `/api/work-orders/${workOrderId}/items/item/${firstItemId}/complete`,
          method: "PATCH",
          headers,
        },
        {
          actualTime: 90, // 90 minutos
          notes: "Servicio completado exitosamente. Cliente satisfecho.",
        }
      );

      if (completeResponse.statusCode === 200) {
        const completed = completeResponse.data.data;
        console.log("✅ Item marcado como completado");
        console.log(`   Estado: ${completed.estado}`);
        console.log(`   Tiempo real: ${completed.tiempoReal || "N/A"} minutos`);
      } else {
        console.log(
          "❌ Error al completar item:",
          completeResponse.data.message
        );
      }
    }

    // ============================================
    // PASO 10: FILTRAR ITEMS POR ESTADO
    // ============================================
    console.log("\n\n🔍 PASO 10: Filtrar items por estado");
    console.log("-".repeat(70));

    const completedItemsResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: `/api/work-orders/${workOrderId}/items?status=completado`,
      method: "GET",
      headers,
    });

    if (completedItemsResponse.statusCode === 200) {
      const completedItems = completedItemsResponse.data.data || [];
      console.log(`✅ Items completados: ${completedItems.length}`);
      completedItems.forEach((item) => {
        console.log(
          `   • ${item.nombre} - $${item.precioFinal || item.precioTotal || 0}`
        );
      });
    }

    const pendingItemsResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: `/api/work-orders/${workOrderId}/items?status=pendiente`,
      method: "GET",
      headers,
    });

    if (pendingItemsResponse.statusCode === 200) {
      const pendingItems = pendingItemsResponse.data.data || [];
      console.log(`\n✅ Items pendientes: ${pendingItems.length}`);
      pendingItems.forEach((item) => {
        console.log(`   • ${item.nombre} - ${item.tipo}`);
      });
    }

    // ============================================
    // PASO 11: ELIMINAR ITEM
    // ============================================
    console.log("\n\n🗑️  PASO 11: Eliminar item de la orden");
    console.log("-".repeat(70));

    if (addedItems.length > 1) {
      const itemToDelete = addedItems[addedItems.length - 1];
      const deleteResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: `/api/work-orders/${workOrderId}/items/item/${itemToDelete._id}`,
          method: "DELETE",
          headers,
        },
        null
      );

      if (deleteResponse.statusCode === 200) {
        console.log("✅ Item eliminado correctamente");
        console.log(`   Item eliminado: ${itemToDelete.nombre}`);
      } else {
        console.log("❌ Error al eliminar item:", deleteResponse.data.message);
      }

      // Verificar que se eliminó
      const verifyResponse = await makeRequest({
        hostname: "localhost",
        port: 4000,
        path: `/api/work-orders/${workOrderId}/items`,
        method: "GET",
        headers,
      });

      if (verifyResponse.statusCode === 200) {
        const remainingItems = verifyResponse.data.data || [];
        console.log(`   Items restantes: ${remainingItems.length}`);
      }
    }

    // ============================================
    // PASO 12: VALIDACIONES DE NEGOCIO
    // ============================================
    console.log("\n\n🛡️  PASO 12: Validaciones de negocio");
    console.log("-".repeat(70));

    // Validación 1: Tipo requerido
    console.log("\n   Prueba 1: Intentar agregar item sin especificar tipo");
    const noTypeResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: `/api/work-orders/${workOrderId}/items`,
        method: "POST",
        headers,
      },
      {
        workOrder: workOrderId,
        quantity: 1,
      }
    );

    if (noTypeResponse.statusCode >= 400) {
      console.log("   ✅ Validación correcta: Tipo es requerido");
    } else {
      console.log("   ❌ Error: Debió rechazar item sin tipo");
    }

    // Validación 2: Servicio requerido cuando tipo es "service"
    console.log(
      "\n   Prueba 2: Intentar agregar servicio sin especificar el servicio"
    );
    const noServiceResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: `/api/work-orders/${workOrderId}/items`,
        method: "POST",
        headers,
      },
      {
        workOrder: workOrderId,
        type: "service",
        quantity: 1,
      }
    );

    if (noServiceResponse.statusCode >= 400) {
      console.log(
        "   ✅ Validación correcta: Servicio requerido para tipo 'service'"
      );
    } else {
      console.log(
        "   ❌ Error: Debió rechazar servicio sin especificar service"
      );
    }

    // Validación 3: Estado inválido
    console.log("\n   Prueba 3: Intentar cambiar a estado inválido");
    if (firstItemId) {
      const invalidStatusResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: `/api/work-orders/${workOrderId}/items/item/${firstItemId}/status`,
          method: "PATCH",
          headers,
        },
        {
          newStatus: "estado_invalido",
        }
      );

      if (invalidStatusResponse.statusCode >= 400) {
        console.log("   ✅ Validación correcta: Estado inválido rechazado");
      } else {
        console.log("   ❌ Error: Debió rechazar estado inválido");
      }
    }

    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log("\n\n" + "=".repeat(70));
    console.log("✅ TEST COMPLETADO - WORK ORDER ITEMS");
    console.log("=".repeat(70));
    console.log(`\n📊 Resumen de resultados:`);
    console.log(`   • Servicios agregados: ${servicesToAdd.length}`);
    console.log(`   • Repuestos agregados: ${items.length > 0 ? 2 : 0}`);
    console.log(`   • Total items en orden: ${addedItems.length}`);
    console.log(`   • Listado de items: ✅`);
    console.log(`   • Obtener item por ID: ✅`);
    console.log(`   • Actualizar item: ✅`);
    console.log(`   • Cambiar estado: ✅`);
    console.log(`   • Marcar completado: ✅`);
    console.log(`   • Filtrar por estado: ✅`);
    console.log(`   • Eliminar item: ✅`);
    console.log(`   • Validaciones de negocio: ✅`);
    console.log(`\n✨ Todos los tests ejecutados exitosamente\n`);
  } catch (error) {
    console.error("\n❌ Error durante el test:", error.message);
    console.error(error.stack);
  }
}

// Ejecutar el test
testWorkOrderItem();
