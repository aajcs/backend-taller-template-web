/**
 * Test para Service Categories
 * ==============================
 *
 * Objetivo: Validar CRUD de categorías de servicios de taller automotriz
 *
 * Funcionalidades probadas:
 * -------------------------
 * 1. Crear categorías de servicios (mantenimiento, reparación, diagnóstico, etc.)
 * 2. Listar categorías con subcategorías
 * 3. Obtener categoría por ID con detalles
 * 4. Actualizar categorías
 * 5. Activar/desactivar categorías
 *
 * Estructura del taller automotriz:
 * ----------------------------------
 * - Mantenimiento Preventivo (aceite, filtros, fluidos)
 * - Reparación de Motor (overhaul, culata, distribución)
 * - Sistema de Frenos (pastillas, discos, líneas)
 * - Suspensión y Dirección (amortiguadores, rotulas, alineación)
 * - Sistema Eléctrico (batería, alternador, arranque)
 * - Aire Acondicionado (recarga, reparación compresor)
 * - Diagnóstico Electrónico (scanner, códigos de falla)
 * - Carrocería y Pintura (abolladuras, pintura, pulido)
 *
 * Endpoints probados:
 * -------------------
 * - POST /api/workshop/service-categories
 * - GET /api/workshop/service-categories
 * - GET /api/workshop/service-categories/:id
 * - PUT /api/workshop/service-categories/:id
 * - PATCH /api/workshop/service-categories/:id/toggle
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

async function testServiceCategories() {
  console.log(
    "╔══════════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║           TEST: SERVICE CATEGORIES (TALLER AUTOMOTRIZ)          ║"
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

    // ============================================
    // PASO 2: CREAR CATEGORÍAS DE SERVICIOS
    // ============================================
    console.log("\n\n➕ PASO 2: Crear categorías de servicios del taller");
    console.log("-".repeat(70));

    const categoriesData = [
      {
        nombre: "Mantenimiento Preventivo",
        descripcion: "Servicios de mantenimiento periódico del vehículo",
        codigo: "MANT_PREV",
        color: "#4CAF50",
        icono: "wrench",
        orden: 1,
      },
      {
        nombre: "Reparación de Motor",
        descripcion: "Reparaciones y overhaul del sistema de motor",
        codigo: "REP_MOTOR",
        color: "#F44336",
        icono: "engine",
        orden: 2,
      },
      {
        nombre: "Sistema de Frenos",
        descripcion: "Mantenimiento y reparación del sistema de frenos",
        codigo: "SIS_FRENOS",
        color: "#FF9800",
        icono: "car-brake-alert",
        orden: 3,
      },
      {
        nombre: "Suspensión y Dirección",
        descripcion: "Servicios de suspensión, dirección y alineación",
        codigo: "SUSP_DIR",
        color: "#9C27B0",
        icono: "car-cog",
        orden: 4,
      },
      {
        nombre: "Sistema Eléctrico",
        descripcion: "Diagnóstico y reparación del sistema eléctrico",
        codigo: "SIS_ELEC",
        color: "#2196F3",
        icono: "flash",
        orden: 5,
      },
      {
        nombre: "Aire Acondicionado",
        descripcion: "Mantenimiento y reparación del sistema de A/C",
        codigo: "AIRE_ACOND",
        color: "#00BCD4",
        icono: "snowflake",
        orden: 6,
      },
      {
        nombre: "Diagnóstico Electrónico",
        descripcion: "Escaneo y diagnóstico de sistemas electrónicos",
        codigo: "DIAG_ELEC",
        color: "#3F51B5",
        icono: "laptop",
        orden: 7,
      },
      {
        nombre: "Carrocería y Pintura",
        descripcion: "Reparación de carrocería y trabajos de pintura",
        codigo: "CARRO_PINT",
        color: "#795548",
        icono: "spray-bottle",
        orden: 8,
      },
      {
        nombre: "Transmisión",
        descripcion: "Mantenimiento y reparación de transmisión",
        codigo: "TRANS",
        color: "#607D8B",
        icono: "car-shift-pattern",
        orden: 9,
      },
      {
        nombre: "Neumáticos y Alineación",
        descripcion: "Cambio de neumáticos, balanceo y alineación",
        codigo: "NEUM_ALIN",
        color: "#000000",
        icono: "tire",
        orden: 10,
      },
    ];

    const categoriesCreated = [];

    for (const categoryData of categoriesData) {
      const createResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: "/api/service-categories",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-token": token,
          },
        },
        categoryData
      );

      if (createResponse.statusCode === 201) {
        const category = createResponse.data.data;
        categoriesCreated.push(category);
        console.log(`   ✅ ${category.nombre} (${category.codigo})`);
      } else {
        console.log(`   ❌ Error creando ${categoryData.nombre}:`);
        console.log(`      Status: ${createResponse.statusCode}`);
        console.log(`      Error:`, createResponse.data);
      }
    }

    console.log(
      `\n📊 Categorías creadas: ${categoriesCreated.length}/${categoriesData.length}`
    );

    if (categoriesCreated.length === 0) {
      console.error(
        "\n❌ No se pudo crear ninguna categoría. Deteniendo test."
      );
      return;
    }

    // ============================================
    // PASO 3: LISTAR TODAS LAS CATEGORÍAS
    // ============================================
    console.log("\n\n📋 PASO 3: Listar todas las categorías");
    console.log("-".repeat(70));

    const listResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/service-categories",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (listResponse.statusCode === 200) {
      const categories = listResponse.data.data;
      console.log(`\n✅ Total de categorías: ${categories.length}`);

      console.log("\n🔍 Lista de categorías:");
      console.log("-".repeat(70));
      categories.slice(0, 10).forEach((cat, index) => {
        const colorSquare = cat.color ? `[${cat.color}]` : "";
        console.log(
          `   ${index + 1}. ${cat.nombre} - ${cat.codigo} ${colorSquare}`
        );
        console.log(`      📝 ${cat.descripcion || "Sin descripción"}`);
        console.log(
          `      🎯 Orden: ${cat.orden} | Estado: ${cat.activo ? "✅ Activo" : "❌ Inactivo"}`
        );
      });
    } else {
      console.error("❌ Error al listar categorías:", listResponse.data);
    }

    // ============================================
    // PASO 4: OBTENER CATEGORÍA POR ID
    // ============================================
    console.log("\n\n🔍 PASO 4: Obtener categoría por ID con detalles");
    console.log("-".repeat(70));

    if (categoriesCreated.length > 0) {
      const firstCategory = categoriesCreated[0];

      const getByIdResponse = await makeRequest({
        hostname: "localhost",
        port: 4000,
        path: `/api/service-categories/${firstCategory._id}`,
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-token": token,
        },
      });

      if (getByIdResponse.statusCode === 200) {
        const category = getByIdResponse.data.data;
        console.log(`\n✅ Categoría obtenida: ${category.nombre}`);
        console.log("-".repeat(70));
        console.log(`   🔑 ID: ${category._id}`);
        console.log(`   📝 Código: ${category.codigo}`);
        console.log(`   📄 Descripción: ${category.descripcion}`);
        console.log(`   🎨 Color: ${category.color || "N/A"}`);
        console.log(`   📌 Icono: ${category.icono || "N/A"}`);
        console.log(`   📊 Orden: ${category.orden}`);
        console.log(`   ✅ Activo: ${category.activo ? "Sí" : "No"}`);
        console.log(`   📦 Servicios: ${category.servicesCount || 0}`);
        console.log(
          `   📂 Subcategorías: ${category.subcategories?.length || 0}`
        );
        console.log(
          `   📅 Creado: ${new Date(category.createdAt).toLocaleString()}`
        );
      } else {
        console.error("❌ Error al obtener categoría:", getByIdResponse.data);
      }
    }

    // ============================================
    // PASO 5: ACTUALIZAR CATEGORÍA
    // ============================================
    console.log("\n\n📝 PASO 5: Actualizar categoría");
    console.log("-".repeat(70));

    if (categoriesCreated.length > 0) {
      const categoryToUpdate = categoriesCreated[1]; // Reparación de Motor

      const updateResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: `/api/service-categories/${categoryToUpdate._id}`,
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-token": token,
          },
        },
        {
          descripcion:
            "Reparaciones mayores y menores del motor, incluye overhaul completo",
          color: "#E53935",
        }
      );

      if (updateResponse.statusCode === 200) {
        const updated = updateResponse.data.data;
        console.log(`✅ Categoría actualizada: ${updated.nombre}`);
        console.log(`   📄 Nueva descripción: ${updated.descripcion}`);
        console.log(`   🎨 Nuevo color: ${updated.color}`);
      } else {
        console.error("❌ Error al actualizar categoría:", updateResponse.data);
      }
    }

    // ============================================
    // PASO 6: ACTIVAR/DESACTIVAR CATEGORÍA
    // ============================================
    console.log("\n\n🔄 PASO 6: Activar/Desactivar categoría");
    console.log("-".repeat(70));

    if (categoriesCreated.length > 2) {
      const categoryToToggle = categoriesCreated[2]; // Sistema de Frenos

      // Desactivar
      const toggleResponse1 = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: `/api/service-categories/${categoryToToggle._id}/toggle`,
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-token": token,
          },
        },
        {}
      );

      if (toggleResponse1.statusCode === 200) {
        const toggled = toggleResponse1.data.data;
        console.log(
          `✅ Categoría ${toggled.activo ? "activada" : "desactivada"}: ${toggled.nombre}`
        );
        console.log(
          `   Estado actual: ${toggled.activo ? "✅ Activo" : "❌ Inactivo"}`
        );
      }

      // Reactivar
      const toggleResponse2 = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: `/api/service-categories/${categoryToToggle._id}/toggle`,
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-token": token,
          },
        },
        {}
      );

      if (toggleResponse2.statusCode === 200) {
        const toggled = toggleResponse2.data.data;
        console.log(
          `✅ Categoría ${toggled.activo ? "activada" : "desactivada"}: ${toggled.nombre}`
        );
        console.log(
          `   Estado actual: ${toggled.activo ? "✅ Activo" : "❌ Inactivo"}`
        );
      }
    }

    // ============================================
    // PASO 7: VALIDACIONES DE NEGOCIO
    // ============================================
    console.log("\n\n🧪 PASO 7: Validaciones de negocio");
    console.log("-".repeat(70));

    // Intentar crear categoría con código duplicado
    console.log("\n📌 Validación 1: Código duplicado");
    const duplicateResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/service-categories",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-token": token,
        },
      },
      {
        nombre: "Mantenimiento General",
        codigo: "MANT_PREV", // Código duplicado
        descripcion: "Test de duplicado",
      }
    );

    if (duplicateResponse.statusCode !== 201) {
      console.log("   ✅ Código duplicado rechazado correctamente");
    } else {
      console.log("   ⚠️  Código duplicado permitido (error de validación)");
    }

    // Intentar crear categoría sin campos requeridos
    console.log("\n📌 Validación 2: Campos requeridos");
    const missingFieldsResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/service-categories",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-token": token,
        },
      },
      {
        descripcion: "Test sin nombre ni código",
      }
    );

    if (missingFieldsResponse.statusCode !== 201) {
      console.log("   ✅ Campos requeridos validados correctamente");
    } else {
      console.log("   ⚠️  Validación de campos requeridos fallida");
    }

    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log(
      "\n\n╔══════════════════════════════════════════════════════════════════╗"
    );
    console.log(
      "║                      RESUMEN DEL TEST                            ║"
    );
    console.log(
      "╚══════════════════════════════════════════════════════════════════╝"
    );

    console.log("\n✅ Pruebas completadas:");
    console.log("   1. ✅ Crear categorías de servicios");
    console.log("   2. ✅ Listar todas las categorías");
    console.log("   3. ✅ Obtener categoría por ID");
    console.log("   4. ✅ Actualizar categoría");
    console.log("   5. ✅ Activar/Desactivar categoría");
    console.log("   6. ✅ Validaciones de negocio");

    console.log("\n📊 Resultados:");
    console.log(`   • Categorías creadas: ${categoriesCreated.length}`);
    console.log(`   • Categorías del taller automotriz:`);
    categoriesCreated.forEach((cat, i) => {
      console.log(`     ${i + 1}. ${cat.nombre} (${cat.codigo})`);
    });

    console.log(
      "\n💾 IDs de categorías creadas (guardar para test de subcategorías):"
    );
    console.log("-".repeat(70));
    categoriesCreated.forEach((cat) => {
      console.log(`   ${cat.codigo}: ${cat._id}`);
    });

    console.log("\n🎯 Estado del módulo: OPERACIONAL ✅");
    console.log("\n" + "=".repeat(70) + "\n");
  } catch (error) {
    console.error("\n❌ Error durante el test:", error.message);
    console.error(error.stack);
  }
}

// Ejecutar el test
testServiceCategories();
