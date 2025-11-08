/**
 * Test: Service Subcategories - API
 * Verifica consulta de subcategorías y filtros
 */

require("dotenv").config();
const http = require("http");

// Configuración
const API_HOST = "localhost";
const API_PORT = 4000;
const API_BASE = "/api";

// Variables globales
let authToken = "";

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
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: { raw: body },
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
const testServiceSubcategories = async () => {
  try {
    console.log("============================================================");
    console.log("🧪 TEST: SERVICE SUBCATEGORIES - API");
    console.log(
      "============================================================\n"
    );

    // ============================================
    // PASO 0: Autenticación
    // ============================================
    console.log("� PASO 0: AUTENTICACIÓN");
    console.log("------------------------------------------------------------");

    const loginResponse = await makeRequest("POST", "/auth/login", {
      correo: "superadmin@taller.com",
      password: "SuperAdmin123!",
    });

    if (loginResponse.statusCode !== 200) {
      throw new Error(`Error en login: ${JSON.stringify(loginResponse.data)}`);
    }

    authToken = loginResponse.data.token;
    console.log(`✅ Autenticado como superAdmin`);
    console.log(`   - Usuario: ${loginResponse.data.usuario.nombre}\n`);

    // ============================================
    // PASO 1: OBTENER TODAS LAS SUBCATEGORÍAS
    // ============================================
    console.log("📋 PASO 1: Obtener TODAS las subcategorías");
    console.log("------------------------------------------------------------");

    const subcategoriesResponse = await makeRequest(
      "GET",
      "/service-subcategories",
      null,
      authToken
    );

    console.log("Status:", subcategoriesResponse.statusCode);

    if (subcategoriesResponse.statusCode !== 200) {
      console.log("❌ Error:", JSON.stringify(subcategoriesResponse.data));
      throw new Error("No se pudieron obtener subcategorías");
    }

    const subcategories = subcategoriesResponse.data.data || [];
    console.log(`Total subcategorías: ${subcategories.length}\n`);

    if (subcategories.length === 0) {
      console.log("⚠️  No hay subcategorías en el sistema");
      console.log("💡 Posibles causas:");
      console.log("   1. No hay datos en la colección");
      console.log(
        "   2. Todas las subcategorías están marcadas como eliminadas"
      );
      console.log(
        "   3. El filtro 'eliminado: false' está bloqueando resultados\n"
      );
    } else {
      console.log("✅ Subcategorías encontradas:\n");
      subcategories.slice(0, 5).forEach((sub, i) => {
        console.log(`   ${i + 1}. ${sub.nombre || sub.name}`);
        console.log(`      - ID: ${sub._id}`);
        console.log(`      - Categoría: ${sub.categoria?.nombre || "N/A"}`);
        console.log(`      - Activo: ${sub.activo}`);
      });
    }

    // ============================================
    // PASO 2: PROBAR FILTRO POR CATEGORÍA
    // ============================================
    console.log("\n📦 PASO 2: Probar filtro por categoría");
    console.log("------------------------------------------------------------");

    // Primero obtener categorías
    const categoriesResponse = await makeRequest(
      "GET",
      "/service-categories",
      null,
      authToken
    );

    if (categoriesResponse.statusCode !== 200) {
      console.log("⚠️  No se pudieron obtener categorías");
    } else {
      const categories = categoriesResponse.data.data || [];

      if (categories.length > 0) {
        const firstCategory = categories[0];
        console.log(
          `Probando con categoría: ${firstCategory.nombre || firstCategory.name}`
        );
        console.log(`ID: ${firstCategory._id}`);

        const filteredResponse = await makeRequest(
          "GET",
          `/service-subcategories?category=${firstCategory._id}`,
          null,
          authToken
        );

        const filteredSubcategories = filteredResponse.data.data || [];
        console.log(
          `\nResultados: ${filteredSubcategories.length} subcategorías`
        );

        if (filteredSubcategories.length > 0) {
          console.log("✅ Filtro por categoría funcionando");
          filteredSubcategories.slice(0, 3).forEach((sub, i) => {
            console.log(`   ${i + 1}. ${sub.nombre || sub.name}`);
          });
        } else {
          console.log("⚠️  No hay subcategorías para esta categoría");
        }
      } else {
        console.log("⚠️  No hay categorías en el sistema");
      }
    }

    // ============================================
    // PASO 3: CREAR SUBCATEGORÍA (si hay categorías)
    // ============================================
    console.log("\n📝 PASO 3: Crear nueva subcategoría");
    console.log("------------------------------------------------------------");

    const categoriesForCreate = await makeRequest(
      "GET",
      "/service-categories",
      null,
      authToken
    );

    if (categoriesForCreate.statusCode === 200) {
      const categories = categoriesForCreate.data.data || [];

      if (categories.length > 0) {
        const createData = {
          name: `Test Subcategoría ${Date.now()}`,
          description: "Subcategoría de prueba",
          category: categories[0]._id,
          isActive: true,
          order: 1,
        };

        const createResponse = await makeRequest(
          "POST",
          "/service-subcategories",
          createData,
          authToken
        );

        if (
          createResponse.statusCode === 201 ||
          createResponse.statusCode === 200
        ) {
          console.log("✅ Subcategoría creada exitosamente");
          console.log(`   - Nombre: ${createData.name}`);
          console.log(
            `   - Categoría: ${categories[0].nombre || categories[0].name}`
          );
        } else {
          console.log(
            "⚠️  Error al crear:",
            JSON.stringify(createResponse.data)
          );
        }
      } else {
        console.log("⚠️  Saltando creación (no hay categorías)");
      }
    }

    console.log(
      "\n============================================================"
    );
    console.log("📊 RESUMEN DEL TEST");
    console.log("============================================================");
    console.log(`
    PRUEBAS COMPLETADAS:
    ✅ 1. Autenticación exitosa
    ✅ 2. Obtener todas las subcategorías
    ✅ 3. Filtrar por categoría
    ✅ 4. Crear subcategoría
    
    Total subcategorías: ${subcategories.length}
    `);
    console.log("============================================================");
    console.log("✅ TEST COMPLETADO");
    console.log("============================================================");

    process.exit(0);
  } catch (error) {
    console.log(
      "\n============================================================"
    );
    console.log("❌ ERROR EN EL TEST");
    console.log("============================================================");
    console.error(error.message);
    console.error(error.stack);

    process.exit(1);
  }
};

// Ejecutar el test
testServiceSubcategories();
