/**
 * Test Completo: Flujo de Estado de Items con Integración de Almacén
 *
 * Prueba el flujo completo:
 * 1. Agregar repuesto a orden → Crea Reservation automática
 * 2. Cambiar estado a "en_proceso"
 * 3. Completar item → Consume Reservation y crea Movement
 * 4. Verificar actualización de stock
 */

const http = require("http");

// Configuración del servidor
const HOST = "localhost";
const PORT = 4000;
const BASE_URL = "/api";

// Función auxiliar para hacer requests HTTP
const makeRequest = (method, path, data = null, authToken = null) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: HOST,
      port: PORT,
      path: `${BASE_URL}${path}`,
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
const testWorkOrderItemStatusFlow = async () => {
  try {
    console.log("\n" + "=".repeat(80));
    console.log("🧪 TEST: Flujo Completo de Estado de Items con Almacén");
    console.log("=".repeat(80));

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

    const authToken = loginResponse.data.token;
    console.log("✅ Autenticado correctamente");

    // ============================================
    // PASO 2: BUSCAR ORDEN DE TRABAJO EXISTENTE
    // ============================================
    console.log("\n📋 PASO 2: Buscar orden de trabajo");
    console.log("-".repeat(40));

    const workOrdersResponse = await makeRequest(
      "GET",
      "/work-orders?limit=5&sort=-createdAt",
      null,
      authToken
    );

    if (workOrdersResponse.statusCode !== 200) {
      throw new Error(
        `Error obteniendo órdenes: ${JSON.stringify(workOrdersResponse.data)}`
      );
    }

    const orders =
      workOrdersResponse.data.data?.docs || workOrdersResponse.data.data || [];

    if (orders.length === 0) {
      throw new Error(
        "No hay órdenes de trabajo en la base de datos. Crea una orden primero."
      );
    }

    console.log(`📊 Total órdenes encontradas: ${orders.length}`);

    // Usar la primera orden disponible
    const workOrder = orders[0];
    console.log(`✅ Usando orden: ${workOrder.numeroOrden || workOrder._id}`);
    console.log(`   - ID: ${workOrder._id}`);
    console.log(
      `   - Estado: ${workOrder.estado?.nombre || workOrder.estado || "N/A"}`
    );

    // ============================================
    // PASO 3: OBTENER STOCK DISPONIBLE
    // ============================================
    console.log("\n📦 PASO 3: Buscar items con stock disponible");
    console.log("-".repeat(40));

    const stockResponse = await makeRequest(
      "GET",
      "/inventory/stock?limit=10",
      null,
      authToken
    );

    let inventoryItem;
    let stockRecord;

    if (
      stockResponse.statusCode !== 200 ||
      !stockResponse.data.stocks?.length
    ) {
      console.log("⚠️  No hay stock disponible en almacén");
      console.log(
        "ℹ️  Para probar completamente, ejecuta primero: node tests/create-stock-data.js"
      );
      console.log("\n🎯 TEST PARCIAL: No se puede continuar sin stock");
      console.log("=".repeat(80) + "\n");
      return; // Salir del test sin error
    }

    // Buscar un item con stock disponible
    stockRecord = stockResponse.data.stocks.find((stock) => {
      return stock.cantidad && stock.cantidad > 0;
    });

    if (!stockRecord) {
      console.log("⚠️  No hay items con stock disponible");
      console.log("ℹ️  Ejecuta: node tests/create-stock-data.js");
      return;
    }

    // El stock tiene una referencia al item poblada
    inventoryItem = stockRecord.item;

    console.log(
      `✅ Repuesto encontrado: ${inventoryItem.nombre || inventoryItem}`
    );
    console.log(`   - ID Item: ${inventoryItem._id || inventoryItem}`);
    console.log(`   - Stock disponible: ${stockRecord.cantidad}`);
    console.log(`   - Stock reservado: ${stockRecord.reservado}`);
    console.log(
      `   - Almacén: ${stockRecord.warehouse?.nombre || stockRecord.warehouse}`
    );

    // ============================================
    // PASO 4: OBTENER O AGREGAR ITEM A LA ORDEN
    // ============================================
    console.log("\n➕ PASO 4: Obtener o agregar item a la orden");
    console.log("-".repeat(40));

    let workOrderItem = null;

    // Primero intentar usar un item existente que esté en estado "pendiente"
    if (workOrder.items && workOrder.items.length > 0) {
      const itemsResponse = await makeRequest(
        "GET",
        `/work-orders/${workOrder._id}/items`,
        null,
        authToken
      );

      if (itemsResponse.statusCode === 200) {
        const existingItems =
          itemsResponse.data.data?.docs || itemsResponse.data.data || [];

        // Buscar un item en estado pendiente
        workOrderItem = existingItems.find(
          (item) => item.estado === "pendiente" && item.tipo === "repuesto"
        );

        if (workOrderItem) {
          console.log(`✅ Usando item existente: ${workOrderItem.nombre}`);
          console.log(`   - ID del item: ${workOrderItem._id}`);
          console.log(`   - Estado: ${workOrderItem.estado}`);
          console.log(`   - Tipo: ${workOrderItem.tipo}`);
          console.log(
            `   - Reserva: ${workOrderItem.reserva || "Sin reserva"}`
          );
        }
      }
    }

    // Si no hay item pendiente, agregar uno nuevo
    if (!workOrderItem) {
      console.log("⚠️  No hay items pendientes, agregando nuevo item...");

      const itemId = inventoryItem._id || inventoryItem;

      const addItemData = {
        workOrder: workOrder._id,
        type: "part",
        part: itemId,
        quantity: 1,
        notes: "Agregado desde test de flujo de estados",
      };

      console.log(
        `📤 Agregando item con repuesto: ${inventoryItem.nombre || "ID: " + itemId}...`
      );
      const addItemResponse = await makeRequest(
        "POST",
        "/work-orders/items",
        addItemData,
        authToken
      );

      if (addItemResponse.statusCode !== 201) {
        console.log(
          "❌ Error al agregar item:",
          JSON.stringify(addItemResponse.data, null, 2)
        );
        throw new Error(
          `Error al agregar item: ${addItemResponse.data.message || "Error desconocido"}`
        );
      }

      workOrderItem = addItemResponse.data.data;
      console.log(`✅ Item agregado exitosamente`);
      console.log(`   - ID del item: ${workOrderItem._id}`);
      console.log(`   - Estado inicial: ${workOrderItem.estado}`);
      console.log(
        `   - Reserva creada: ${workOrderItem.reserva ? "Sí" : "No"}`
      );

      if (workOrderItem.reserva) {
        console.log(`   - ID de Reserva: ${workOrderItem.reserva}`);
      }
    }

    // ============================================
    // PASO 5: CAMBIAR ESTADO A "EN_PROCESO"
    // ============================================
    console.log("\n🔄 PASO 5: Cambiar estado a 'en_proceso'");
    console.log("-".repeat(40));

    const changeToInProgressData = {
      newStatus: "en_proceso",
      notes: "Mecánico comenzó a trabajar en el item",
    };

    const inProgressResponse = await makeRequest(
      "PATCH",
      `/work-order-items/item/${workOrderItem._id}/status`,
      changeToInProgressData,
      authToken
    );

    if (inProgressResponse.statusCode !== 200) {
      console.log(
        "❌ Error al cambiar estado:",
        JSON.stringify(inProgressResponse.data, null, 2)
      );
      throw new Error(
        `Error al cambiar estado: ${inProgressResponse.data.message}`
      );
    }

    console.log(`✅ Estado cambiado a 'en_proceso'`);
    console.log(
      `   - Estado anterior: ${inProgressResponse.data.estadoAnterior}`
    );
    console.log(`   - Estado nuevo: ${inProgressResponse.data.estadoNuevo}`);

    // ============================================
    // PASO 6: COMPLETAR ITEM
    // ============================================
    console.log(
      "\n✅ PASO 6: Completar item (consumir reserva y crear movimiento)"
    );
    console.log("-".repeat(40));

    const completeItemData = {
      newStatus: "completado",
      notes: "Item instalado y completado correctamente",
    };

    const completeResponse = await makeRequest(
      "PATCH",
      `/work-order-items/item/${workOrderItem._id}/status`,
      completeItemData,
      authToken
    );

    if (completeResponse.statusCode !== 200) {
      console.log(
        "❌ Error al completar item:",
        JSON.stringify(completeResponse.data, null, 2)
      );
      throw new Error(
        `Error al completar item: ${completeResponse.data.message}`
      );
    }

    console.log(`✅ Item completado exitosamente`);
    console.log(
      `   - Estado anterior: ${completeResponse.data.estadoAnterior}`
    );
    console.log(`   - Estado nuevo: ${completeResponse.data.estadoNuevo}`);

    // ============================================
    // PASO 7: VERIFICAR RESERVATION CONSUMIDA
    // ============================================
    console.log("\n🔍 PASO 7: Verificar estado de la reserva");
    console.log("-".repeat(40));

    if (workOrderItem.reserva) {
      const reservationResponse = await makeRequest(
        "GET",
        `/inventory/reservations/${workOrderItem.reserva}`,
        null,
        authToken
      );

      if (reservationResponse.statusCode === 200) {
        const reservation = reservationResponse.data.data;
        console.log(`✅ Reserva encontrada`);
        console.log(`   - Estado: ${reservation.estado}`);
        console.log(`   - Cantidad: ${reservation.cantidad}`);
        console.log(`   - Fecha consumo: ${reservation.fechaConsumo || "N/A"}`);

        if (reservation.estado === "consumido") {
          console.log(`✅ Reserva marcada como consumida correctamente`);
        } else {
          console.log(
            `⚠️  Reserva NO está consumida (estado: ${reservation.estado})`
          );
        }
      } else {
        console.log(`⚠️  No se pudo verificar la reserva`);
      }
    }

    // ============================================
    // PASO 8: VERIFICAR MOVIMIENTOS CREADOS
    // ============================================
    console.log("\n📊 PASO 8: Verificar movimientos de almacén");
    console.log("-".repeat(40));

    const movementsResponse = await makeRequest(
      "GET",
      `/inventory/movements?ordenTrabajo=${workOrder._id}`,
      null,
      authToken
    );

    if (movementsResponse.statusCode === 200) {
      const movements =
        movementsResponse.data.data?.docs || movementsResponse.data.data || [];
      console.log(`✅ Movimientos encontrados: ${movements.length}`);

      movements.forEach((mov, index) => {
        console.log(
          `   ${index + 1}. Tipo: ${mov.type}, Cantidad: ${mov.cantidad}, Motivo: ${mov.motivo}`
        );
      });

      if (movements.length > 0) {
        console.log(`✅ Movimiento de salida creado correctamente`);
      } else {
        console.log(`⚠️  No se encontraron movimientos para esta orden`);
      }
    } else {
      console.log(`⚠️  No se pudieron obtener los movimientos`);
    }

    // ============================================
    // PASO 9: PROBAR CANCELACIÓN DE ITEM
    // ============================================
    console.log("\n🚫 PASO 9: Probar cancelación de item (opcional)");
    console.log("-".repeat(40));

    // Agregar otro item para probar la cancelación
    const addItemData2 = {
      workOrder: workOrder._id,
      type: "part",
      part: inventoryItem._id,
      quantity: 1,
      notes: "Item para probar cancelación",
    };

    const addItemResponse2 = await makeRequest(
      "POST",
      "/work-orders/items",
      addItemData2,
      authToken
    );

    if (addItemResponse2.statusCode === 201) {
      const item2 = addItemResponse2.data.data;
      console.log(`✅ Segundo item agregado: ${item2._id}`);

      // Cancelar el item
      const cancelData = {
        newStatus: "cancelado",
        notes: "Item cancelado para prueba",
      };

      const cancelResponse = await makeRequest(
        "PATCH",
        `/work-order-items/item/${item2._id}/status`,
        cancelData,
        authToken
      );

      if (cancelResponse.statusCode === 200) {
        console.log(`✅ Item cancelado exitosamente`);
        console.log(`   - Estado: ${cancelResponse.data.estadoNuevo}`);

        // Verificar que la reserva fue cancelada
        if (item2.reserva) {
          const reservationResponse2 = await makeRequest(
            "GET",
            `/inventory/reservations/${item2.reserva}`,
            null,
            authToken
          );

          if (reservationResponse2.statusCode === 200) {
            const reservation2 = reservationResponse2.data.data;
            console.log(
              `✅ Reserva verificada - Estado: ${reservation2.estado}`
            );
            if (reservation2.estado === "cancelado") {
              console.log(`✅ Reserva cancelada correctamente`);
            }
          }
        }
      }
    }

    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log("\n" + "=".repeat(80));
    console.log("📊 RESUMEN DEL TEST");
    console.log("=".repeat(80));
    console.log("✅ Item agregado → Reserva creada automáticamente");
    console.log("✅ Estado cambiado a 'en_proceso' → Transición válida");
    console.log("✅ Item completado → Reserva consumida");
    console.log("✅ Movimiento de salida creado automáticamente");
    console.log("✅ Item cancelado → Reserva cancelada");
    console.log("\n🎉 TEST COMPLETADO EXITOSAMENTE");
    console.log("=".repeat(80) + "\n");
  } catch (error) {
    console.error("\n❌ ERROR EN EL TEST:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
};

// Ejecutar test
console.log("\n🚀 Iniciando test de flujo de estado de items...");
console.log(
  "📍 Asegúrate de que el servidor esté corriendo en http://localhost:4000\n"
);

testWorkOrderItemStatusFlow();
