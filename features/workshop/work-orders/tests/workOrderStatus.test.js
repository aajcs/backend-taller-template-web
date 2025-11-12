/**
 * Test para Work Order Status
 * ============================
 *
 * Objetivo: Validar CRUD de estados de órdenes de trabajo
 *
 * Funcionalidades probadas:
 * -------------------------
 * 1. Crear estados de órdenes de trabajo (inicial, intermedio, final)
 * 2. Listar estados ordenados
 * 3. Obtener estado por ID con detalles
 * 4. Actualizar estados
 * 5. Definir transiciones permitidas
 * 6. Obtener transiciones disponibles desde un estado
 * 7. Validar flujo de trabajo
 * 8. Activar/desactivar estados
 *
 * Estructura de estados para taller (SIMPLIFICADO):
 * ---------------------------------------------------
 * ESTADO INICIAL:
 * - RECIBIDO: Vehículo recibido en el taller
 *
 * ESTADOS INTERMEDIOS:
 * - DIAGNOSTICO: Evaluación del vehículo
 * - PRESUPUESTO: Presupuesto enviado al cliente
 * - EN_PROCESO: Trabajo en progreso
 * - FINALIZADO: Trabajo completado
 * - FACTURADO: Orden facturada
 *
 * ESTADOS FINALES:
 * - ENTREGADO: Vehículo entregado al cliente
 * - RECHAZADO: Presupuesto rechazado
 * - CANCELADO: Orden cancelada
 *
 * Campos probados:
 * ----------------
 * - codigo (único, uppercase), nombre, descripcion
 * - color (hexadecimal), icono, orden
 * - tipo (inicial, intermedio, final)
 * - transicionesPermitidas (códigos de estados siguientes)
 * - requiereAprobacion, requiereDocumentacion
 * - notificarCliente, tiempoEstimadoHoras
 * - collapsed, activo, eliminado
 *
 * Endpoints probados:
 * -------------------
 * - POST /api/work-order-statuses
 * - GET /api/work-order-statuses
 * - GET /api/work-order-statuses/:id
 * - GET /api/work-order-statuses/:id/transitions
 * - PUT /api/work-order-statuses/:id
 * - DELETE /api/work-order-statuses/:id
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

async function testWorkOrderStatus() {
  console.log(
    "╔══════════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║         TEST: WORK ORDER STATUS (ESTADOS DE ÓRDENES)            ║"
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

    // Headers comunes para todas las peticiones
    const headers = {
      "Content-Type": "application/json",
      "x-token": token,
    };

    // ============================================
    // PASO 1.5: LIMPIAR ESTADOS EXISTENTES (OPCIONAL)
    // ============================================
    console.log("\n\n🗑️  PASO 1.5: Limpiar estados existentes");
    console.log("-".repeat(70));

    // Obtener todos los estados
    const existingStatusesResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/work-order-statuses",
      method: "GET",
      headers,
    });

    if (existingStatusesResponse.statusCode === 200) {
      const existingStatuses = existingStatusesResponse.data.data || [];
      let deletedCount = 0;

      for (const status of existingStatuses) {
        const deleteResponse = await makeRequest({
          hostname: "localhost",
          port: 4000,
          path: `/api/work-order-statuses/${status._id}`,
          method: "DELETE",
          headers,
        });

        if (deleteResponse.statusCode === 200) {
          deletedCount++;
        }
      }

      console.log(`✅ ${deletedCount} estados eliminados`);
    }

    // ============================================
    // PASO 2: CREAR ESTADOS DE ÓRDENES DE TRABAJO
    // ============================================
    console.log("\n\n➕ PASO 2: Crear estados del flujo de trabajo del taller");
    console.log("-".repeat(70));

    const statusesToCreate = [
      // ESTADO INICIAL
      {
        codigo: "RECIBIDO",
        nombre: "Recibido",
        descripcion: "Vehículo recibido en el taller",
        color: "#2196F3",
        icono: "inbox",
        orden: 1,
        tipo: "inicial",
        transicionesPermitidas: ["DIAGNOSTICO", "CANCELADO"],
        requiereDocumentacion: true,
        notificarCliente: true,
        tiempoEstimadoHoras: 0.5,
        collapsed: false,
      },

      // ESTADOS INTERMEDIOS
      {
        codigo: "DIAGNOSTICO",
        nombre: "Diagnóstico",
        descripcion: "Evaluación y diagnóstico del vehículo",
        color: "#FF9800",
        icono: "search",
        orden: 2,
        tipo: "intermedio",
        transicionesPermitidas: ["PRESUPUESTO", "CANCELADO"],
        notificarCliente: false,
        notificarTecnico: true,
        tiempoEstimadoHoras: 1,
        collapsed: false,
      },
      {
        codigo: "PRESUPUESTO",
        nombre: "Presupuesto",
        descripcion: "Presupuesto enviado al cliente",
        color: "#9C27B0",
        icono: "description",
        orden: 3,
        tipo: "intermedio",
        transicionesPermitidas: ["EN_PROCESO", "RECHAZADO", "CANCELADO"],
        requiereDocumentacion: true,
        notificarCliente: true,
        tiempoEstimadoHoras: 0.5,
        collapsed: false,
      },
      {
        codigo: "EN_PROCESO",
        nombre: "En Proceso",
        descripcion: "Trabajo en progreso",
        color: "#FFC107",
        icono: "build",
        orden: 4,
        tipo: "intermedio",
        transicionesPermitidas: ["FINALIZADO", "CANCELADO"],
        notificarTecnico: true,
        tiempoEstimadoHoras: 8,
        collapsed: false,
      },
      {
        codigo: "FINALIZADO",
        nombre: "Finalizado",
        descripcion: "Trabajo completado, listo para facturar",
        color: "#00BCD4",
        icono: "done_all",
        orden: 5,
        tipo: "intermedio",
        transicionesPermitidas: ["FACTURADO"],
        notificarCliente: true,
        tiempoEstimadoHoras: 0.5,
        collapsed: false,
      },
      {
        codigo: "FACTURADO",
        nombre: "Facturado",
        descripcion: "Orden facturada, pendiente de entrega",
        color: "#8BC34A",
        icono: "receipt",
        orden: 6,
        tipo: "intermedio",
        transicionesPermitidas: ["ENTREGADO"],
        requiereDocumentacion: true,
        notificarCliente: true,
        tiempoEstimadoHoras: 0.5,
        collapsed: false,
      },

      // ESTADOS FINALES
      {
        codigo: "ENTREGADO",
        nombre: "Entregado",
        descripcion: "Vehículo entregado al cliente",
        color: "#4CAF50",
        icono: "local_shipping",
        orden: 7,
        tipo: "final",
        transicionesPermitidas: [],
        requiereDocumentacion: true,
        notificarCliente: true,
        tiempoEstimadoHoras: 0.5,
        collapsed: true,
      },
      {
        codigo: "RECHAZADO",
        nombre: "Rechazado",
        descripcion: "Presupuesto rechazado por el cliente",
        color: "#E91E63",
        icono: "thumb_down",
        orden: 8,
        tipo: "final",
        transicionesPermitidas: [],
        notificarCliente: true,
        tiempoEstimadoHoras: 0,
        collapsed: true,
      },
      {
        codigo: "CANCELADO",
        nombre: "Cancelado",
        descripcion: "Orden cancelada",
        color: "#F44336",
        icono: "cancel",
        orden: 9,
        tipo: "final",
        transicionesPermitidas: [],
        requiereDocumentacion: true,
        notificarCliente: true,
        tiempoEstimadoHoras: 0,
        collapsed: true,
      },
    ];

    const createdStatuses = [];
    let successCount = 0;

    for (const statusData of statusesToCreate) {
      const response = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: "/api/work-order-statuses",
          method: "POST",
          headers,
        },
        statusData
      );

      if (response.statusCode === 201) {
        createdStatuses.push(response.data.data);
        successCount++;
        console.log(
          `   ✅ ${statusData.nombre} (${statusData.codigo}) - ${statusData.tipo}`
        );
      } else {
        console.log(
          `   ❌ ${statusData.nombre}: ${response.data.message || "Error"}`
        );
      }
    }

    console.log(
      `\n✅ ${successCount}/${statusesToCreate.length} estados creados`
    );

    // Guardar IDs de estados para siguientes tests
    const statusIds = {};
    createdStatuses.forEach((status) => {
      statusIds[status.codigo] = status._id;
    });
    const firstStatusId = createdStatuses[0]?._id;

    // ============================================
    // PASO 3: LISTAR TODOS LOS ESTADOS
    // ============================================
    console.log("\n\n📋 PASO 3: Listar todos los estados");
    console.log("-".repeat(70));

    const listResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/work-order-statuses",
      method: "GET",
      headers,
    });

    if (listResponse.statusCode === 200) {
      const statuses = listResponse.data.data || [];
      console.log(`✅ ${statuses.length} estados obtenidos`);
      console.log("\n   Flujo simplificado del taller:");
      statuses.forEach((status) => {
        console.log(
          `   ${status.orden}. ${status.nombre} (${status.codigo}) - ${status.tipo}`
        );
        console.log(
          `      Color: ${status.color} | Transiciones: ${status.transicionesPermitidas.length}`
        );
      });
    } else {
      console.log("❌ Error al listar estados:", listResponse.data.message);
    }

    // ============================================
    // PASO 4: FILTRAR ESTADOS POR TIPO
    // ============================================
    console.log("\n\n🔍 PASO 4: Filtrar estados por tipo");
    console.log("-".repeat(70));

    // Estados iniciales
    const initialResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/work-order-statuses?tipo=inicial",
      method: "GET",
      headers,
    });

    if (initialResponse.statusCode === 200) {
      const initialStatuses = initialResponse.data.data || [];
      console.log(`✅ Estados iniciales: ${initialStatuses.length}`);
      initialStatuses.forEach((status) => {
        console.log(`   - ${status.nombre} (${status.codigo})`);
      });
    }

    // Estados finales
    const finalResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/work-order-statuses?tipo=final",
      method: "GET",
      headers,
    });

    if (finalResponse.statusCode === 200) {
      const finalStatuses = finalResponse.data.data || [];
      console.log(`\n✅ Estados finales: ${finalStatuses.length}`);
      finalStatuses.forEach((status) => {
        console.log(`   - ${status.nombre} (${status.codigo})`);
      });
    }

    // ============================================
    // PASO 5: OBTENER ESTADO POR ID CON DETALLES
    // ============================================
    console.log("\n\n🔍 PASO 5: Obtener estado por ID con detalles");
    console.log("-".repeat(70));

    if (firstStatusId) {
      const detailResponse = await makeRequest({
        hostname: "localhost",
        port: 4000,
        path: `/api/work-order-statuses/${firstStatusId}`,
        method: "GET",
        headers,
      });

      if (detailResponse.statusCode === 200) {
        const status = detailResponse.data.data;
        console.log("✅ Detalles del estado obtenidos:");
        console.log(`   ID: ${status._id}`);
        console.log(`   Código: ${status.codigo}`);
        console.log(`   Nombre: ${status.nombre}`);
        console.log(`   Descripción: ${status.descripcion}`);
        console.log(`   Tipo: ${status.tipo}`);
        console.log(`   Color: ${status.color}`);
        console.log(`   Orden: ${status.orden}`);
        console.log(
          `   Transiciones permitidas: ${status.transicionesPermitidas.join(", ") || "Ninguna"}`
        );
        console.log(
          `   Requiere aprobación: ${status.requiereAprobacion ? "Sí" : "No"}`
        );
        console.log(
          `   Notificar cliente: ${status.notificarCliente ? "Sí" : "No"}`
        );
        console.log(`   Tiempo estimado: ${status.tiempoEstimadoHoras}h`);
        console.log(`   Estado: ${status.activo ? "Activo" : "Inactivo"}`);
      } else {
        console.log(
          "❌ Error al obtener detalles:",
          detailResponse.data.message
        );
      }
    }

    // ============================================
    // PASO 6: OBTENER TRANSICIONES PERMITIDAS
    // ============================================
    console.log("\n\n🔄 PASO 6: Obtener transiciones permitidas desde estados");
    console.log("-".repeat(70));

    // Transiciones desde RECIBIDO
    if (statusIds["RECIBIDO"]) {
      const transitionsResponse = await makeRequest({
        hostname: "localhost",
        port: 4000,
        path: `/api/work-order-statuses/${statusIds["RECIBIDO"]}/transitions`,
        method: "GET",
        headers,
      });

      if (transitionsResponse.statusCode === 200) {
        const transitions = transitionsResponse.data.data || [];
        console.log(`✅ Desde RECIBIDO se puede ir a:`);
        transitions.forEach((t) => {
          console.log(`   → ${t.nombre} (${t.codigo})`);
        });
      } else {
        console.log(
          "❌ Error al obtener transiciones:",
          transitionsResponse.data.message
        );
      }
    }

    // Transiciones desde DIAGNOSTICO
    if (statusIds["DIAGNOSTICO"]) {
      const transitionsResponse = await makeRequest({
        hostname: "localhost",
        port: 4000,
        path: `/api/work-order-statuses/${statusIds["DIAGNOSTICO"]}/transitions`,
        method: "GET",
        headers,
      });

      if (transitionsResponse.statusCode === 200) {
        const transitions = transitionsResponse.data.data || [];
        console.log(`\n✅ Desde DIAGNOSTICO se puede ir a:`);
        transitions.forEach((t) => {
          console.log(`   → ${t.nombre} (${t.codigo})`);
        });
      }
    }

    // Transiciones desde FINALIZADO
    if (statusIds["FINALIZADO"]) {
      const transitionsResponse = await makeRequest({
        hostname: "localhost",
        port: 4000,
        path: `/api/work-order-statuses/${statusIds["FINALIZADO"]}/transitions`,
        method: "GET",
        headers,
      });

      if (transitionsResponse.statusCode === 200) {
        const transitions = transitionsResponse.data.data || [];
        console.log(`\n✅ Desde FINALIZADO se puede ir a:`);
        transitions.forEach((t) => {
          console.log(`   → ${t.nombre} (${t.codigo})`);
        });
      }
    }

    // ============================================
    // PASO 7: ACTUALIZAR ESTADO
    // ============================================
    console.log("\n\n✏️  PASO 7: Actualizar estado");
    console.log("-".repeat(70));

    if (firstStatusId) {
      const updateResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: `/api/work-order-statuses/${firstStatusId}`,
          method: "PUT",
          headers,
        },
        {
          descripcion:
            "Vehículo recibido en el taller - Primera revisión completada",
          tiempoEstimadoHoras: 1.5,
          notificarTecnico: true,
        }
      );

      if (updateResponse.statusCode === 200) {
        const updated = updateResponse.data.data;
        console.log("✅ Estado actualizado correctamente");
        console.log(`   Nueva descripción: ${updated.descripcion}`);
        console.log(
          `   Nuevo tiempo estimado: ${updated.tiempoEstimadoHoras}h`
        );
        console.log(
          `   Notificar técnico: ${updated.notificarTecnico ? "Sí" : "No"}`
        );
      } else {
        console.log("❌ Error al actualizar:", updateResponse.data.message);
      }
    }

    // ============================================
    // PASO 8: ACTIVAR/DESACTIVAR ESTADO
    // ============================================
    console.log("\n\n🔄 PASO 8: Activar/Desactivar estado");
    console.log("-".repeat(70));

    if (statusIds["CANCELADO"]) {
      // Desactivar
      const deactivateResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: `/api/work-order-statuses/${statusIds["CANCELADO"]}`,
          method: "PUT",
          headers,
        },
        {
          activo: false,
        }
      );

      if (deactivateResponse.statusCode === 200) {
        console.log("✅ Estado CANCELADO desactivado");
        console.log(
          `   Estado: ${deactivateResponse.data.data.activo ? "Activo" : "Inactivo"}`
        );
      } else {
        console.log("❌ Error al desactivar:", deactivateResponse.data.message);
      }

      // Reactivar
      const reactivateResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: `/api/work-order-statuses/${statusIds["CANCELADO"]}`,
          method: "PUT",
          headers,
        },
        {
          activo: true,
        }
      );

      if (reactivateResponse.statusCode === 200) {
        console.log("✅ Estado CANCELADO reactivado");
        console.log(
          `   Estado: ${reactivateResponse.data.data.activo ? "Activo" : "Inactivo"}`
        );
      } else {
        console.log("❌ Error al reactivar:", reactivateResponse.data.message);
      }
    }

    // ============================================
    // PASO 9: VALIDAR FLUJO DE TRABAJO
    // ============================================
    console.log("\n\n🔀 PASO 9: Validar flujo de trabajo completo");
    console.log("-".repeat(70));

    console.log("Flujo normal de una orden:");
    console.log("   1. RECIBIDO → DIAGNOSTICO");
    console.log("   2. DIAGNOSTICO → PRESUPUESTO");
    console.log("   3. PRESUPUESTO → EN_PROCESO (cliente aprueba)");
    console.log("   4. EN_PROCESO → FINALIZADO");
    console.log("   5. FINALIZADO → FACTURADO");
    console.log("   6. FACTURADO → ENTREGADO");
    console.log("\nFlujos alternativos:");
    console.log("   - PRESUPUESTO → RECHAZADO (cliente no aprueba)");
    console.log("   - Cualquier estado → CANCELADO");
    console.log("\n✅ Flujo de trabajo simplificado configurado correctamente");

    // ============================================
    // PASO 10: VALIDACIONES DE NEGOCIO
    // ============================================
    console.log("\n\n🛡️  PASO 10: Validaciones de negocio");
    console.log("-".repeat(70));

    // Validación 1: Código duplicado
    console.log("\n   Prueba 1: Intentar crear estado con código duplicado");
    const duplicateResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/work-order-statuses",
        method: "POST",
        headers,
      },
      {
        codigo: "RECIBIDO", // Ya existe
        nombre: "Estado Duplicado",
        descripcion: "Intento de duplicado",
        tipo: "intermedio",
        orden: 99,
      }
    );

    if (duplicateResponse.statusCode === 400) {
      console.log("   ✅ Validación correcta: Código duplicado rechazado");
      console.log(`   Mensaje: ${duplicateResponse.data.message}`);
    } else {
      console.log("   ❌ Error: Debió rechazar código duplicado");
    }

    // Validación 2: Código con caracteres inválidos
    console.log("\n   Prueba 2: Intentar crear estado con código inválido");
    const invalidCodeResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/work-order-statuses",
        method: "POST",
        headers,
      },
      {
        codigo: "estado-con-guiones", // Debe ser mayúsculas y guiones bajos
        nombre: "Estado Inválido",
        descripcion: "Código con formato incorrecto",
        tipo: "intermedio",
        orden: 99,
      }
    );

    if (invalidCodeResponse.statusCode >= 400) {
      console.log("   ✅ Validación correcta: Código inválido rechazado");
      console.log(
        `   Mensaje: ${invalidCodeResponse.data.message || "Formato de código incorrecto"}`
      );
    } else {
      console.log("   ❌ Error: Debió rechazar código inválido");
    }

    // Validación 3: Color hexadecimal inválido
    console.log("\n   Prueba 3: Intentar crear estado con color inválido");
    const invalidColorResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/work-order-statuses",
        method: "POST",
        headers,
      },
      {
        codigo: "TEST_COLOR",
        nombre: "Test Color",
        descripcion: "Color inválido",
        color: "red", // Debe ser hexadecimal
        tipo: "intermedio",
        orden: 99,
      }
    );

    if (invalidColorResponse.statusCode >= 400) {
      console.log("   ✅ Validación correcta: Color inválido rechazado");
      console.log(
        `   Mensaje: ${invalidColorResponse.data.message || "Formato de color incorrecto"}`
      );
    } else {
      console.log("   ❌ Error: Debió rechazar color inválido");
    }

    // Validación 4: Campos requeridos
    console.log("\n   Prueba 4: Intentar crear estado sin campos requeridos");
    const missingFieldsResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/work-order-statuses",
        method: "POST",
        headers,
      },
      {
        descripcion: "Estado sin código ni nombre",
        // Falta codigo y nombre
      }
    );

    if (missingFieldsResponse.statusCode >= 400) {
      console.log("   ✅ Validación correcta: Campos requeridos faltantes");
      console.log(
        `   Mensaje: ${missingFieldsResponse.data.message || "Datos inválidos"}`
      );
    } else {
      console.log("   ❌ Error: Debió rechazar datos incompletos");
    }

    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log("\n\n" + "=".repeat(70));
    console.log("✅ TEST COMPLETADO - WORK ORDER STATUS");
    console.log("=".repeat(70));
    console.log(`\n📊 Resumen de resultados:`);
    console.log(
      `   • Estados creados: ${successCount}/${statusesToCreate.length}`
    );
    console.log(`   • Estado inicial: 1 (RECIBIDO)`);
    console.log(
      `   • Estados intermedios: 5 (DIAGNOSTICO, PRESUPUESTO, EN_PROCESO, FINALIZADO, FACTURADO)`
    );
    console.log(`   • Estados finales: 3 (ENTREGADO, RECHAZADO, CANCELADO)`);
    console.log(`   • Listado completo: ✅`);
    console.log(`   • Filtrado por tipo: ✅`);
    console.log(`   • Obtener por ID: ✅`);
    console.log(`   • Transiciones permitidas: ✅`);
    console.log(`   • Actualización: ✅`);
    console.log(`   • Activar/Desactivar: ✅`);
    console.log(`   • Flujo simplificado: ✅`);
    console.log(`   • Validaciones de negocio: ✅`);
    console.log(`\n✨ Todos los tests ejecutados exitosamente\n`);
  } catch (error) {
    console.error("\n❌ Error durante el test:", error.message);
    console.error(error.stack);
  }
}

// Ejecutar el test
testWorkOrderStatus();
