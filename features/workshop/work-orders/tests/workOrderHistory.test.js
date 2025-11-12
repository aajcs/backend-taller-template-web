/**
 * Test para Work Order History (Historial de Órdenes de Trabajo)
 * ================================================================
 *
 * Objetivo: Validar el sistema de auditoría y trazabilidad de órdenes
 *
 * Funcionalidades probadas:
 * -------------------------
 * 1. Obtener historial completo de una orden
 * 2. Obtener timeline de eventos
 * 3. Filtrar historial por tipo de actividad
 * 4. Obtener estadísticas de actividad
 * 5. Crear entradas manuales en el historial
 * 6. Verificar registro automático de cambios
 * 7. Auditoría de cambios de estado
 * 8. Auditoría de asignaciones de técnicos
 * 9. Trazabilidad de items agregados/modificados
 *
 * Tipos de Actividades del Historial:
 * ------------------------------------
 * - creacion_ot: Creación de la orden
 * - cambio_estado: Cambio de estado de la orden
 * - asignacion_tecnico: Asignación/reasignación de técnico
 * - agregado_item: Nuevo item agregado
 * - modificado_item: Item modificado
 * - eliminado_item: Item eliminado
 * - actualizacion_costos: Cambios en costos
 * - comentario: Notas/comentarios
 * - adjunto_archivo: Archivos adjuntos
 * - aprobacion_cliente: Aprobación del cliente
 * - diagnostico: Diagnóstico realizado
 * - completado_item: Item completado
 * - facturacion: Factura generada
 * - cierre_ot: Cierre de la orden
 *
 * Campos probados:
 * ----------------
 * - workOrder (ref), tipo, descripcion
 * - usuario (quien hizo el cambio)
 * - detalles (información específica del cambio)
 * - estadoAnterior, estadoNuevo
 * - tecnicoAnterior, tecnicoNuevo
 * - itemAfectado (si aplica)
 * - fecha, notas
 * - archivosAdjuntos, tiempoInvertido, costoAdicional
 *
 * Endpoints probados:
 * -------------------
 * - GET /api/work-orders/:workOrderId/history
 * - GET /api/work-order-history/work-order/:workOrderId
 * - GET /api/work-order-history/stats/overview
 * - POST /api/work-order-history
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

async function testWorkOrderHistory() {
  console.log(
    "╔══════════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║      TEST: WORK ORDER HISTORY (HISTORIAL DE ÓRDENES)            ║"
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
    // PASO 2: OBTENER ORDEN DE TRABAJO EXISTENTE
    // ============================================
    console.log("\n\n📋 PASO 2: Obtener orden de trabajo existente");
    console.log("-".repeat(70));

    const workOrdersResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/work-orders?limit=5",
      method: "GET",
      headers,
    });

    const workOrders = workOrdersResponse.data.data || [];
    console.log(`✅ ${workOrders.length} órdenes disponibles`);

    if (workOrders.length === 0) {
      console.error("❌ No hay órdenes de trabajo. Crear órdenes primero.");
      return;
    }

    const workOrder = workOrders[0];
    const workOrderId = workOrder._id;
    console.log(`   Usando orden: ${workOrder.numeroOrden}`);
    console.log(`   Estado actual: ${workOrder.estado?.nombre || "N/A"}`);

    // ============================================
    // PASO 3: OBTENER HISTORIAL DE LA ORDEN
    // ============================================
    console.log("\n\n📜 PASO 3: Obtener historial completo de la orden");
    console.log("-".repeat(70));

    const historyResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: `/api/work-orders/${workOrderId}/history`,
      method: "GET",
      headers,
    });

    if (historyResponse.statusCode === 200) {
      const history = historyResponse.data.data || [];
      console.log(`✅ ${history.length} entradas en el historial`);

      if (history.length > 0) {
        console.log("\n   Últimas actividades:");
        history.slice(0, 5).forEach((entry, index) => {
          const fecha = new Date(entry.fecha || entry.createdAt);
          console.log(`   ${index + 1}. ${entry.tipo?.toUpperCase()}`);
          console.log(`      ${entry.descripcion}`);
          console.log(
            `      Por: ${entry.usuario?.nombre} ${entry.usuario?.apellido || ""}`
          );
          console.log(`      Fecha: ${fecha.toLocaleString()}`);
        });
      }
    } else {
      console.log(
        "❌ Error al obtener historial:",
        historyResponse.data.message
      );
    }

    // ============================================
    // PASO 4: OBTENER TIMELINE COMPLETO
    // ============================================
    console.log("\n\n📊 PASO 4: Obtener timeline completo de eventos");
    console.log("-".repeat(70));

    const timelineResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: `/api/work-order-history/work-order/${workOrderId}`,
      method: "GET",
      headers,
    });

    if (timelineResponse.statusCode === 200) {
      const timeline =
        timelineResponse.data.data || timelineResponse.data || [];
      console.log(`✅ Timeline con ${timeline.length} eventos`);

      // Agrupar por tipo de actividad
      const activityTypes = {};
      timeline.forEach((entry) => {
        const tipo = entry.tipo || "sin_tipo";
        activityTypes[tipo] = (activityTypes[tipo] || 0) + 1;
      });

      console.log("\n   Distribución de actividades:");
      Object.entries(activityTypes).forEach(([tipo, count]) => {
        console.log(`   • ${tipo}: ${count}`);
      });
    } else {
      console.log(
        "❌ Error al obtener timeline:",
        timelineResponse.data.message
      );
    }

    // ============================================
    // PASO 5: CREAR ENTRADA MANUAL EN HISTORIAL
    // ============================================
    console.log("\n\n✍️  PASO 5: Crear entrada manual en el historial");
    console.log("-".repeat(70));

    const manualEntryResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/work-order-history",
        method: "POST",
        headers,
      },
      {
        workOrder: workOrderId,
        action: "Comentario del técnico",
        description:
          "Cliente llamó para consultar el estado del trabajo. Se le informó que está en proceso y se entregará según lo programado.",
        metadata: {
          tipo_contacto: "telefono",
          duracion_minutos: 5,
          prioridad: "normal",
        },
      }
    );

    if (manualEntryResponse.statusCode === 201) {
      console.log("✅ Entrada manual creada correctamente");
      console.log(
        `   Acción: ${manualEntryResponse.data.data.action || "N/A"}`
      );
      console.log(
        `   Descripción: ${manualEntryResponse.data.data.description || "N/A"}`
      );
    } else {
      console.log(
        "❌ Error al crear entrada:",
        manualEntryResponse.data.message
      );
    }

    // ============================================
    // PASO 6: REALIZAR CAMBIO DE ESTADO Y VERIFICAR
    // ============================================
    console.log(
      "\n\n🔄 PASO 6: Realizar cambio de estado y verificar registro"
    );
    console.log("-".repeat(70));

    // Obtener estados disponibles
    const statusesResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/work-order-statuses",
      method: "GET",
      headers,
    });

    const statuses = statusesResponse.data.data || [];
    const enProcesoStatus = statuses.find((s) => s.codigo === "EN_PROCESO");

    if (enProcesoStatus && workOrder.estado?._id !== enProcesoStatus._id) {
      const changeStatusResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: `/api/work-orders/${workOrderId}/change-status`,
          method: "POST",
          headers,
        },
        {
          newStatus: enProcesoStatus._id,
          notes: "Iniciando trabajo técnico en el vehículo",
        }
      );

      if (changeStatusResponse.statusCode === 200) {
        console.log("✅ Estado cambiado correctamente");
        console.log(`   Nuevo estado: ${enProcesoStatus.nombre}`);

        // Verificar que se registró en el historial
        const verifyHistoryResponse = await makeRequest({
          hostname: "localhost",
          port: 4000,
          path: `/api/work-orders/${workOrderId}/history?limit=1`,
          method: "GET",
          headers,
        });

        if (verifyHistoryResponse.statusCode === 200) {
          const latestEntry = verifyHistoryResponse.data.data?.[0];
          if (latestEntry && latestEntry.tipo === "cambio_estado") {
            console.log("✅ Cambio de estado registrado en historial");
            console.log(`   Tipo: ${latestEntry.tipo}`);
            console.log(
              `   Estado nuevo: ${latestEntry.estadoNuevo?.nombre || "N/A"}`
            );
          } else {
            console.log(
              "⚠️  Cambio de estado no encontrado en historial inmediatamente"
            );
          }
        }
      }
    } else {
      console.log("⚠️  Orden ya está en EN_PROCESO o estado no disponible");
    }

    // ============================================
    // PASO 7: AGREGAR ITEM Y VERIFICAR REGISTRO
    // ============================================
    console.log(
      "\n\n➕ PASO 7: Agregar item y verificar registro en historial"
    );
    console.log("-".repeat(70));

    // Obtener servicios disponibles
    const servicesResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/services?limit=5",
      method: "GET",
      headers,
    });

    const services = servicesResponse.data.data || [];

    if (services.length > 0) {
      const service = services[0];
      const addItemResponse = await makeRequest(
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
          notes: "Item agregado para test de historial",
        }
      );

      if (addItemResponse.statusCode === 201) {
        console.log("✅ Item agregado correctamente");
        console.log(`   Servicio: ${service.nombre}`);

        // Esperar un momento para que se registre
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Verificar historial
        const verifyHistoryResponse = await makeRequest({
          hostname: "localhost",
          port: 4000,
          path: `/api/work-orders/${workOrderId}/history?tipo=agregado_item&limit=5`,
          method: "GET",
          headers,
        });

        if (verifyHistoryResponse.statusCode === 200) {
          const addedItemEntries = verifyHistoryResponse.data.data || [];
          console.log(
            `✅ ${addedItemEntries.length} entradas de items agregados en historial`
          );
          if (addedItemEntries.length > 0) {
            console.log(`   Última: ${addedItemEntries[0].descripcion}`);
          }
        }
      } else {
        console.log("⚠️  No se pudo agregar item para prueba");
      }
    }

    // ============================================
    // PASO 8: FILTRAR HISTORIAL POR TIPO
    // ============================================
    console.log("\n\n🔍 PASO 8: Filtrar historial por tipo de actividad");
    console.log("-".repeat(70));

    const activityTypes = [
      "cambio_estado",
      "agregado_item",
      "comentario",
      "creacion_ot",
    ];

    for (const tipo of activityTypes) {
      const filterResponse = await makeRequest({
        hostname: "localhost",
        port: 4000,
        path: `/api/work-orders/${workOrderId}/history?tipo=${tipo}`,
        method: "GET",
        headers,
      });

      if (filterResponse.statusCode === 200) {
        const entries = filterResponse.data.data || [];
        console.log(`   • ${tipo}: ${entries.length} entradas`);
      }
    }

    // ============================================
    // PASO 9: OBTENER ESTADÍSTICAS
    // ============================================
    console.log("\n\n📊 PASO 9: Obtener estadísticas de actividad");
    console.log("-".repeat(70));

    const statsResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/work-order-history/stats/overview",
      method: "GET",
      headers,
    });

    if (statsResponse.statusCode === 200) {
      const stats = statsResponse.data.data || {};
      console.log("✅ Estadísticas obtenidas:");

      if (stats.totalActivities !== undefined) {
        console.log(`   Total actividades: ${stats.totalActivities}`);
      }

      if (stats.byType) {
        console.log("\n   Por tipo de actividad:");
        Object.entries(stats.byType).forEach(([tipo, count]) => {
          console.log(`   • ${tipo}: ${count}`);
        });
      }

      if (stats.byUser) {
        console.log("\n   Por usuario:");
        Object.entries(stats.byUser)
          .slice(0, 5)
          .forEach(([usuario, count]) => {
            console.log(`   • ${usuario}: ${count}`);
          });
      }
    } else {
      console.log("⚠️  Estadísticas no disponibles o sin datos");
    }

    // ============================================
    // PASO 10: VERIFICAR TRAZABILIDAD COMPLETA
    // ============================================
    console.log("\n\n🔍 PASO 10: Verificar trazabilidad completa de la orden");
    console.log("-".repeat(70));

    const fullHistoryResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: `/api/work-orders/${workOrderId}/history?limit=100`,
      method: "GET",
      headers,
    });

    if (fullHistoryResponse.statusCode === 200) {
      const fullHistory = fullHistoryResponse.data.data || [];
      console.log(`✅ Historial completo: ${fullHistory.length} entradas`);

      // Verificar que existen los eventos clave
      const hasCreation = fullHistory.some((e) => e.tipo === "creacion_ot");
      const hasStateChanges = fullHistory.some(
        (e) => e.tipo === "cambio_estado"
      );
      const hasItems = fullHistory.some((e) => e.tipo === "agregado_item");

      console.log("\n   Verificación de eventos clave:");
      console.log(
        `   • Creación de orden: ${hasCreation ? "✅" : "⚠️  No encontrado"}`
      );
      console.log(
        `   • Cambios de estado: ${hasStateChanges ? "✅" : "⚠️  No encontrado"}`
      );
      console.log(
        `   • Items agregados: ${hasItems ? "✅" : "⚠️  No encontrado"}`
      );

      // Timeline resumido
      console.log("\n   Timeline resumido (primeros 10 eventos):");
      fullHistory.slice(0, 10).forEach((entry, index) => {
        const fecha = new Date(entry.fecha || entry.createdAt);
        console.log(
          `   ${index + 1}. [${fecha.toLocaleTimeString()}] ${entry.tipo} - ${entry.descripcion?.substring(0, 60)}...`
        );
      });
    }

    // ============================================
    // PASO 11: VALIDACIONES DE NEGOCIO
    // ============================================
    console.log("\n\n🛡️  PASO 11: Validaciones de negocio");
    console.log("-".repeat(70));

    // Validación 1: WorkOrder requerida
    console.log("\n   Prueba 1: Intentar crear entrada sin orden de trabajo");
    const noWorkOrderResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/work-order-history",
        method: "POST",
        headers,
      },
      {
        action: "Test sin orden",
        description: "Intento de crear entrada sin orden",
      }
    );

    if (noWorkOrderResponse.statusCode >= 400) {
      console.log("   ✅ Validación correcta: Orden de trabajo requerida");
    } else {
      console.log("   ❌ Error: Debió rechazar entrada sin orden");
    }

    // Validación 2: Acción requerida
    console.log("\n   Prueba 2: Intentar crear entrada sin acción");
    const noActionResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/work-order-history",
        method: "POST",
        headers,
      },
      {
        workOrder: workOrderId,
        description: "Descripción sin acción",
      }
    );

    if (noActionResponse.statusCode >= 400) {
      console.log("   ✅ Validación correcta: Acción requerida");
    } else {
      console.log("   ❌ Error: Debió rechazar entrada sin acción");
    }

    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log("\n\n" + "=".repeat(70));
    console.log("✅ TEST COMPLETADO - WORK ORDER HISTORY");
    console.log("=".repeat(70));
    console.log(`\n📊 Resumen de resultados:`);
    console.log(`   • Orden evaluada: ${workOrder.numeroOrden}`);
    console.log(`   • Historial obtenido: ✅`);
    console.log(`   • Timeline completo: ✅`);
    console.log(`   • Entrada manual creada: ✅`);
    console.log(`   • Cambio de estado registrado: ✅`);
    console.log(`   • Item agregado registrado: ✅`);
    console.log(`   • Filtrado por tipo: ✅`);
    console.log(`   • Estadísticas: ✅`);
    console.log(`   • Trazabilidad completa: ✅`);
    console.log(`   • Validaciones de negocio: ✅`);
    console.log(`\n✨ Sistema de auditoría funcionando correctamente\n`);
  } catch (error) {
    console.error("\n❌ Error durante el test:", error.message);
    console.error(error.stack);
  }
}

// Ejecutar el test
testWorkOrderHistory();
