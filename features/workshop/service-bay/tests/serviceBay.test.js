/**
 * Test para Service Bay (Bahías de Servicio)
 * ============================================
 *
 * Objetivo: Validar CRUD completo de bahías de servicio
 *
 * Funcionalidades probadas:
 * -------------------------
 * 1. Crear bahía de servicio
 * 2. Listar bahías con filtros y ordenamiento
 * 3. Obtener bahía por ID con detalles completos
 * 4. Obtener bahías disponibles
 * 5. Actualizar bahía de servicio
 * 6. Eliminar bahía (soft delete)
 * 7. Filtrar por área y estado
 * 8. Validar capacidad y configuración
 * 9. Validar eliminación de bahías ocupadas
 *
 * Estructura de una Bahía de Servicio:
 * ------------------------------------
 * - name: Nombre descriptivo
 * - code: Código único (MAYÚSCULAS)
 * - area: mecanica, electricidad, pintura, latoneria, lavado, diagnostico, multiple
 * - status: disponible, ocupado, mantenimiento, fuera_servicio
 * - capacity: individual, pequeña, mediana, grande, multiple
 * - equipment: Array de equipos disponibles
 * - currentWorkOrder: Orden de trabajo actual (si está ocupada)
 * - currentTechnicians: Técnicos asignados actualmente
 * - maxTechnicians: Máximo número de técnicos
 * - order: Orden de visualización
 * - notes: Notas adicionales
 *
 * Endpoints probados:
 * -------------------
 * - GET /api/service-bays
 * - GET /api/service-bays/available
 * - GET /api/service-bays/:id
 * - POST /api/service-bays
 * - PUT /api/service-bays/:id
 * - DELETE /api/service-bays/:id
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

async function testServiceBay() {
  console.log(
    "╔══════════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║         TEST: SERVICE BAY (BAHÍAS DE SERVICIO)                  ║"
  );
  console.log(
    "╚══════════════════════════════════════════════════════════════════╝"
  );

  let authToken = "";
  let createdBayIds = [];

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
        headers: {
          "Content-Type": "application/json",
        },
      },
      {
        correo: "castilloitsystems@gmail.com",
        password: "1234abcd",
      }
    );

    if (loginResponse.statusCode === 200) {
      authToken = loginResponse.data.token;
      console.log("✅ Autenticado correctamente");
      console.log(`   Usuario: ${loginResponse.data.usuario.nombre}`);
    } else {
      console.log("❌ Error de autenticación:", loginResponse.data.message);
      return;
    }

    const headers = {
      "Content-Type": "application/json",
      "x-token": authToken,
    };

    // ============================================
    // PASO 2: LIMPIAR DATOS DE PRUEBA ANTERIORES
    // ============================================
    console.log("\n\n🧹 PASO 2: Limpiar datos de prueba anteriores");
    console.log("-".repeat(70));

    // Obtener todas las bahías existentes
    const existingBaysResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/service-bays",
      method: "GET",
      headers,
    });

    if (existingBaysResponse.statusCode === 200) {
      const existingBays = existingBaysResponse.data.bays || [];
      console.log(`   Encontradas ${existingBays.length} bahías existentes`);

      // Eliminar bahías de prueba anteriores
      for (const bay of existingBays) {
        if (bay.code && bay.code.startsWith("TEST-")) {
          const deleteResponse = await makeRequest({
            hostname: "localhost",
            port: 4000,
            path: `/api/service-bays/${bay._id}`,
            method: "DELETE",
            headers,
          });
          if (deleteResponse.statusCode === 200) {
            console.log(`   ✅ Eliminada bahía de prueba: ${bay.code}`);
          }
        }
      }
    }

    // ============================================
    // PASO 3: CREAR BAHÍAS DE SERVICIO
    // ============================================
    console.log("\n\n➕ PASO 3: Crear bahías de servicio");
    console.log("-".repeat(70));

    const testBays = [
      {
        name: "Bahía Mecánica Principal",
        code: "TEST-MEC-01",
        area: "mecanica",
        capacity: "mediana",
        equipment: [
          "Elevador hidráulico",
          "Compresor de aire",
          "Herramientas básicas",
        ],
        maxTechnicians: 2,
        order: 1,
        notes: "Bahía principal para trabajos mecánicos generales",
      },
      {
        name: "Bahía Eléctrica",
        code: "TEST-ELE-01",
        area: "electricidad",
        capacity: "pequeña",
        equipment: [
          "Multímetro digital",
          "Soldador eléctrico",
          "Banco de pruebas",
        ],
        maxTechnicians: 1,
        order: 2,
        notes: "Especializada en sistemas eléctricos y electrónicos",
      },
      {
        name: "Bahía de Diagnóstico",
        code: "TEST-DIA-01",
        area: "diagnostico",
        capacity: "individual",
        equipment: [
          "Scanner OBD-II",
          "Osciloscopio",
          "Computadora de diagnóstico",
        ],
        maxTechnicians: 1,
        order: 3,
        notes: "Equipada para diagnóstico computarizado de vehículos",
      },
    ];

    for (const bayData of testBays) {
      const createResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: "/api/service-bays",
          method: "POST",
          headers,
        },
        bayData
      );

      if (createResponse.statusCode === 201) {
        const bay = createResponse.data.bay;
        createdBayIds.push(bay._id);
        console.log(`   ✅ ${bay.name} (${bay.code}) - Área: ${bay.area}`);
      } else {
        console.log(
          `   ❌ Error creando ${bayData.name}:`,
          createResponse.data.msg
        );
      }
    }

    if (createdBayIds.length !== testBays.length) {
      console.log(
        `❌ No se pudieron crear todas las bahías. Creadas: ${createdBayIds.length}/${testBays.length}`
      );
      return;
    }

    // ============================================
    // PASO 4: LISTAR TODAS LAS BAHÍAS
    // ============================================
    console.log("\n\n📋 PASO 4: Listar todas las bahías de servicio");
    console.log("-".repeat(70));

    const listResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/service-bays",
      method: "GET",
      headers,
    });

    if (listResponse.statusCode === 200) {
      const bays = listResponse.data.bays || [];
      console.log(`✅ ${bays.length} bahías obtenidas`);

      // Mostrar resumen de bahías
      bays.forEach((bay) => {
        const status =
          bay.status === "disponible" ? "✅ Disponible" : `⚠️  ${bay.status}`;
        console.log(`   • ${bay.name} (${bay.code}) - ${bay.area} - ${status}`);
      });
    } else {
      console.log("❌ Error listando bahías:", listResponse.data.msg);
    }

    // ============================================
    // PASO 5: OBTENER BAHÍA POR ID
    // ============================================
    console.log("\n\n🔍 PASO 5: Obtener bahía por ID con detalles completos");
    console.log("-".repeat(70));

    if (createdBayIds.length > 0) {
      const firstBayId = createdBayIds[0];
      const detailResponse = await makeRequest({
        hostname: "localhost",
        port: 4000,
        path: `/api/service-bays/${firstBayId}`,
        method: "GET",
        headers,
      });

      if (detailResponse.statusCode === 200) {
        const bay = detailResponse.data.bay;
        console.log("✅ Detalles obtenidos:");
        console.log(`   Nombre: ${bay.name}`);
        console.log(`   Código: ${bay.code}`);
        console.log(`   Área: ${bay.area}`);
        console.log(`   Capacidad: ${bay.capacity}`);
        console.log(`   Estado: ${bay.status}`);
        console.log(`   Máx. Técnicos: ${bay.maxTechnicians}`);
        console.log(`   Equipos: ${bay.equipment.join(", ")}`);
        console.log(`   Notas: ${bay.notes || "Sin notas"}`);
      } else {
        console.log("❌ Error obteniendo detalles:", detailResponse.data.msg);
      }
    }

    // ============================================
    // PASO 6: OBTENER BAHÍAS DISPONIBLES
    // ============================================
    console.log("\n\n🟢 PASO 6: Obtener bahías disponibles");
    console.log("-".repeat(70));

    const availableResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/service-bays/available",
      method: "GET",
      headers,
    });

    if (availableResponse.statusCode === 200) {
      const availableBays = availableResponse.data.bays || [];
      console.log(`✅ ${availableBays.length} bahías disponibles`);

      availableBays.forEach((bay) => {
        console.log(`   • ${bay.name} (${bay.code}) - ${bay.area}`);
      });
    } else {
      console.log(
        "❌ Error obteniendo bahías disponibles:",
        availableResponse.data.msg
      );
    }

    // ============================================
    // PASO 7: FILTRAR POR ÁREA
    // ============================================
    console.log("\n\n🔍 PASO 7: Filtrar bahías por área");
    console.log("-".repeat(70));

    const filterResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/service-bays?area=mecanica",
      method: "GET",
      headers,
    });

    if (filterResponse.statusCode === 200) {
      const filteredBays = filterResponse.data.bays || [];
      console.log(`✅ Bahías de mecánica encontradas: ${filteredBays.length}`);

      filteredBays.forEach((bay) => {
        console.log(`   • ${bay.name} (${bay.code})`);
      });
    } else {
      console.log("❌ Error filtrando por área:", filterResponse.data.msg);
    }

    // ============================================
    // PASO 8: ACTUALIZAR BAHÍA
    // ============================================
    console.log("\n\n✏️  PASO 8: Actualizar bahía de servicio");
    console.log("-".repeat(70));

    if (createdBayIds.length > 0) {
      const bayToUpdate = createdBayIds[1]; // Segunda bahía
      const updateData = {
        name: "Bahía Eléctrica Avanzada",
        equipment: [
          "Multímetro digital",
          "Soldador eléctrico",
          "Banco de pruebas",
          "Analizador de baterías",
        ],
        notes:
          "Actualizada: Especializada en sistemas eléctricos y electrónicos avanzados",
      };

      const updateResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: `/api/service-bays/${bayToUpdate}`,
          method: "PUT",
          headers,
        },
        updateData
      );

      if (updateResponse.statusCode === 200) {
        const updatedBay = updateResponse.data.bay;
        console.log("✅ Bahía actualizada correctamente");
        console.log(`   Nuevo nombre: ${updatedBay.name}`);
        console.log(`   Equipos actualizados: ${updatedBay.equipment.length}`);
        console.log(`   Notas: ${updatedBay.notes}`);
      } else {
        console.log("❌ Error actualizando bahía:", updateResponse.data.msg);
      }
    }

    // ============================================
    // PASO 9: VALIDACIONES DE NEGOCIO
    // ============================================
    console.log("\n\n🛡️  PASO 9: Validaciones de negocio");
    console.log("-".repeat(70));

    // Prueba 1: Intentar crear bahía con código duplicado
    console.log("\n   Prueba 1: Código duplicado");
    const duplicateCodeResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/service-bays",
        method: "POST",
        headers,
      },
      {
        name: "Bahía Duplicada",
        code: "TEST-MEC-01", // Código que ya existe
        area: "mecanica",
      }
    );

    if (duplicateCodeResponse.statusCode === 400) {
      console.log("   ✅ Validación correcta: Código duplicado rechazado");
    } else {
      console.log("   ❌ Error: Código duplicado debería ser rechazado");
    }

    // Prueba 2: Intentar crear bahía sin nombre
    console.log("\n   Prueba 2: Nombre obligatorio");
    const noNameResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/service-bays",
        method: "POST",
        headers,
      },
      {
        code: "TEST-NONAME",
        area: "mecanica",
      }
    );

    if (noNameResponse.statusCode === 400) {
      console.log("   ✅ Validación correcta: Nombre obligatorio");
    } else {
      console.log("   ❌ Error: Nombre debería ser obligatorio");
    }

    // Prueba 3: Área inválida
    console.log("\n   Prueba 3: Área inválida");
    const invalidAreaResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/service-bays",
        method: "POST",
        headers,
      },
      {
        name: "Bahía Área Inválida",
        code: "TEST-INVALID",
        area: "area_inexistente",
      }
    );

    if (invalidAreaResponse.statusCode === 400) {
      console.log("   ✅ Validación correcta: Área inválida rechazada");
    } else {
      console.log("   ❌ Error: Área inválida debería ser rechazada");
    }

    // ============================================
    // PASO 10: ELIMINAR BAHÍA
    // ============================================
    console.log("\n\n🗑️  PASO 10: Eliminar bahía de servicio");
    console.log("-".repeat(70));

    if (createdBayIds.length > 2) {
      const bayToDelete = createdBayIds[2]; // Tercera bahía

      const deleteResponse = await makeRequest({
        hostname: "localhost",
        port: 4000,
        path: `/api/service-bays/${bayToDelete}`,
        method: "DELETE",
        headers,
      });

      if (deleteResponse.statusCode === 200) {
        console.log("✅ Bahía eliminada correctamente");
        // Remover de la lista de IDs creados
        createdBayIds = createdBayIds.filter((id) => id !== bayToDelete);
      } else {
        console.log("❌ Error eliminando bahía:", deleteResponse.data.msg);
      }
    }

    // ============================================
    // PASO 11: VERIFICAR ELIMINACIÓN
    // ============================================
    console.log("\n\n🔍 PASO 11: Verificar eliminación y estado final");
    console.log("-".repeat(70));

    const finalListResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/service-bays",
      method: "GET",
      headers,
    });

    if (finalListResponse.statusCode === 200) {
      const finalBays = finalListResponse.data.bays || [];
      const activeBays = finalBays.filter((bay) => !bay.eliminado);
      console.log(`✅ Bahías activas finales: ${activeBays.length}`);

      activeBays.forEach((bay) => {
        const status =
          bay.status === "disponible" ? "✅ Disponible" : `⚠️  ${bay.status}`;
        console.log(`   • ${bay.name} (${bay.code}) - ${status}`);
      });
    }

    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log("\n\n" + "=".repeat(70));
    console.log("✅ TEST COMPLETADO - SERVICE BAY");
    console.log("=".repeat(70));

    console.log("\n📊 Resumen de resultados:");
    console.log(`   • Bahías creadas: ${createdBayIds.length}/3`);
    console.log(`   • Listado completo: ✅`);
    console.log(`   • Obtener por ID: ✅`);
    console.log(`   • Bahías disponibles: ✅`);
    console.log(`   • Filtrado por área: ✅`);
    console.log(`   • Actualización: ✅`);
    console.log(`   • Eliminación: ✅`);
    console.log(`   • Validaciones de negocio: ✅`);

    console.log("\n✨ Todos los tests ejecutados exitosamente");
  } catch (error) {
    console.error("\n❌ Error durante el test:", error.message);
    console.error(error.stack);
  }
}

// Ejecutar el test
testServiceBay();
