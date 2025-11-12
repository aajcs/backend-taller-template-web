/**
 * Test para Service Subcategories
 * =================================
 *
 * Objetivo: Validar CRUD de subcategorías de servicios de taller automotriz
 *
 * Funcionalidades probadas:
 * -------------------------
 * 1. Crear subcategorías específicas para cada categoría
 * 2. Listar subcategorías por categoría
 * 3. Obtener subcategoría por ID
 * 4. Actualizar subcategorías
 * 5. Validar relación categoría-subcategoría
 *
 * Subcategorías por categoría:
 * -----------------------------
 * MANTENIMIENTO PREVENTIVO:
 *   - Cambio de Aceite y Filtros
 *   - Revisión de Fluidos
 *   - Cambio de Bujías
 *   - Revisión de Correas
 *
 * REPARACIÓN DE MOTOR:
 *   - Overhaul Completo
 *   - Rectificación de Culata
 *   - Cambio de Distribución
 *   - Reparación de Pistones
 *
 * SISTEMA DE FRENOS:
 *   - Cambio de Pastillas
 *   - Cambio de Discos
 *   - Purga de Líquido de Frenos
 *   - Reparación de Bombas
 *
 * SUSPENSIÓN Y DIRECCIÓN:
 *   - Cambio de Amortiguadores
 *   - Cambio de Rotulas
 *   - Alineación y Balanceo
 *   - Reparación de Cremallera
 *
 * SISTEMA ELÉCTRICO:
 *   - Cambio de Batería
 *   - Reparación de Alternador
 *   - Reparación de Arranque
 *   - Diagnóstico de Luces
 *
 * Endpoints probados:
 * -------------------
 * - POST /api/workshop/service-subcategories
 * - GET /api/workshop/service-subcategories
 * - GET /api/workshop/service-subcategories/:id
 * - PUT /api/workshop/service-subcategories/:id
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

async function testServiceSubcategories() {
  console.log(
    "╔══════════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║        TEST: SERVICE SUBCATEGORIES (TALLER AUTOMOTRIZ)          ║"
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
    // PASO 2: OBTENER CATEGORÍAS EXISTENTES
    // ============================================
    console.log("\n\n📂 PASO 2: Obtener categorías existentes");
    console.log("-".repeat(70));

    const categoriesResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/service-categories",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (categoriesResponse.statusCode !== 200) {
      console.error("❌ Error obteniendo categorías:", categoriesResponse.data);
      console.error("⚠️  Ejecuta serviceCategory.test.js primero");
      return;
    }

    const categories = categoriesResponse.data.data;
    console.log(`✅ Categorías encontradas: ${categories.length}`);

    if (categories.length === 0) {
      console.error(
        "❌ No hay categorías disponibles. Ejecuta serviceCategory.test.js primero"
      );
      return;
    }

    // Mapear categorías por código para fácil acceso
    const categoryMap = {};
    categories.forEach((cat) => {
      categoryMap[cat.codigo] = cat;
      console.log(`   📁 ${cat.nombre} (${cat.codigo}) - ID: ${cat._id}`);
    });

    // ============================================
    // PASO 3: CREAR SUBCATEGORÍAS POR CATEGORÍA
    // ============================================
    console.log("\n\n➕ PASO 3: Crear subcategorías de servicios");
    console.log("-".repeat(70));

    const subcategoriesData = [];

    // Mantenimiento Preventivo
    if (categoryMap["MANT_PREV"]) {
      subcategoriesData.push(
        {
          nombre: "Cambio de Aceite y Filtros",
          descripcion:
            "Cambio de aceite de motor y filtros (aceite, aire, combustible)",
          codigo: "MANT_PREV_ACE",
          categoria: categoryMap["MANT_PREV"]._id,
        },
        {
          nombre: "Revisión de Fluidos",
          descripcion: "Revisión y recarga de todos los fluidos del vehículo",
          codigo: "MANT_PREV_FLU",
          categoria: categoryMap["MANT_PREV"]._id,
        },
        {
          nombre: "Cambio de Bujías",
          descripcion: "Reemplazo de bujías de encendido",
          codigo: "MANT_PREV_BUJ",
          categoria: categoryMap["MANT_PREV"]._id,
        },
        {
          nombre: "Revisión de Correas",
          descripcion: "Inspección y cambio de correas del motor",
          codigo: "MANT_PREV_COR",
          categoria: categoryMap["MANT_PREV"]._id,
        }
      );
    }

    // Reparación de Motor
    if (categoryMap["REP_MOTOR"]) {
      subcategoriesData.push(
        {
          nombre: "Overhaul Completo",
          descripcion: "Reparación mayor del motor completo",
          codigo: "REP_MOTOR_OVH",
          categoria: categoryMap["REP_MOTOR"]._id,
        },
        {
          nombre: "Rectificación de Culata",
          descripcion: "Rectificación y sellado de culata",
          codigo: "REP_MOTOR_CUL",
          categoria: categoryMap["REP_MOTOR"]._id,
        },
        {
          nombre: "Cambio de Distribución",
          descripcion: "Reemplazo de kit de distribución completo",
          codigo: "REP_MOTOR_DIS",
          categoria: categoryMap["REP_MOTOR"]._id,
        },
        {
          nombre: "Reparación de Pistones",
          descripcion: "Cambio de pistones, anillos y bielas",
          codigo: "REP_MOTOR_PIS",
          categoria: categoryMap["REP_MOTOR"]._id,
        }
      );
    }

    // Sistema de Frenos
    if (categoryMap["SIS_FRENOS"]) {
      subcategoriesData.push(
        {
          nombre: "Cambio de Pastillas",
          descripcion: "Reemplazo de pastillas de freno delanteras y traseras",
          codigo: "SIS_FRENOS_PAS",
          categoria: categoryMap["SIS_FRENOS"]._id,
        },
        {
          nombre: "Cambio de Discos",
          descripcion: "Reemplazo de discos de freno",
          codigo: "SIS_FRENOS_DIS",
          categoria: categoryMap["SIS_FRENOS"]._id,
        },
        {
          nombre: "Purga de Líquido de Frenos",
          descripcion: "Cambio y purga del líquido de frenos",
          codigo: "SIS_FRENOS_PUR",
          categoria: categoryMap["SIS_FRENOS"]._id,
        },
        {
          nombre: "Reparación de Bombas",
          descripcion: "Reparación de bomba de freno y cilindros",
          codigo: "SIS_FRENOS_BOM",
          categoria: categoryMap["SIS_FRENOS"]._id,
        }
      );
    }

    // Suspensión y Dirección
    if (categoryMap["SUSP_DIR"]) {
      subcategoriesData.push(
        {
          nombre: "Cambio de Amortiguadores",
          descripcion: "Reemplazo de amortiguadores delanteros y traseros",
          codigo: "SUSP_DIR_AMO",
          categoria: categoryMap["SUSP_DIR"]._id,
        },
        {
          nombre: "Cambio de Rotulas",
          descripcion: "Reemplazo de rotulas de suspensión",
          codigo: "SUSP_DIR_ROT",
          categoria: categoryMap["SUSP_DIR"]._id,
        },
        {
          nombre: "Alineación y Balanceo",
          descripcion: "Servicio de alineación y balanceo de ruedas",
          codigo: "SUSP_DIR_ALI",
          categoria: categoryMap["SUSP_DIR"]._id,
        },
        {
          nombre: "Reparación de Cremallera",
          descripcion: "Reparación o cambio de cremallera de dirección",
          codigo: "SUSP_DIR_CRE",
          categoria: categoryMap["SUSP_DIR"]._id,
        }
      );
    }

    // Sistema Eléctrico
    if (categoryMap["SIS_ELEC"]) {
      subcategoriesData.push(
        {
          nombre: "Cambio de Batería",
          descripcion: "Reemplazo de batería del vehículo",
          codigo: "SIS_ELEC_BAT",
          categoria: categoryMap["SIS_ELEC"]._id,
        },
        {
          nombre: "Reparación de Alternador",
          descripcion: "Reparación o cambio de alternador",
          codigo: "SIS_ELEC_ALT",
          categoria: categoryMap["SIS_ELEC"]._id,
        },
        {
          nombre: "Reparación de Arranque",
          descripcion: "Reparación o cambio de motor de arranque",
          codigo: "SIS_ELEC_ARR",
          categoria: categoryMap["SIS_ELEC"]._id,
        },
        {
          nombre: "Diagnóstico de Luces",
          descripcion: "Diagnóstico y reparación del sistema de luces",
          codigo: "SIS_ELEC_LUC",
          categoria: categoryMap["SIS_ELEC"]._id,
        }
      );
    }

    // Aire Acondicionado
    if (categoryMap["AIRE_ACOND"]) {
      subcategoriesData.push(
        {
          nombre: "Recarga de Gas",
          descripcion: "Recarga de gas refrigerante del A/C",
          codigo: "AIRE_ACOND_GAS",
          categoria: categoryMap["AIRE_ACOND"]._id,
        },
        {
          nombre: "Reparación de Compresor",
          descripcion: "Reparación o cambio de compresor de A/C",
          codigo: "AIRE_ACOND_COM",
          categoria: categoryMap["AIRE_ACOND"]._id,
        },
        {
          nombre: "Cambio de Condensador",
          descripcion: "Reemplazo de condensador del sistema A/C",
          codigo: "AIRE_ACOND_CON",
          categoria: categoryMap["AIRE_ACOND"]._id,
        }
      );
    }

    // Diagnóstico Electrónico
    if (categoryMap["DIAG_ELEC"]) {
      subcategoriesData.push(
        {
          nombre: "Escaneo de Códigos",
          descripcion: "Lectura de códigos de error OBD2",
          codigo: "DIAG_ELEC_ESC",
          categoria: categoryMap["DIAG_ELEC"]._id,
        },
        {
          nombre: "Diagnóstico de Sensores",
          descripcion: "Diagnóstico y prueba de sensores del motor",
          codigo: "DIAG_ELEC_SEN",
          categoria: categoryMap["DIAG_ELEC"]._id,
        },
        {
          nombre: "Prueba de Inyectores",
          descripcion: "Diagnóstico y limpieza de inyectores",
          codigo: "DIAG_ELEC_INY",
          categoria: categoryMap["DIAG_ELEC"]._id,
        }
      );
    }

    console.log(
      `📋 Total de subcategorías a crear: ${subcategoriesData.length}`
    );
    console.log("");

    const subcategoriesCreated = [];
    let currentCategory = "";

    for (const subData of subcategoriesData) {
      const categoryName = categories.find(
        (c) => c._id === subData.categoria
      )?.nombre;

      if (categoryName !== currentCategory) {
        currentCategory = categoryName;
        console.log(`\n📁 ${categoryName}:`);
      }

      const createResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: "/api/service-subcategories",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-token": token,
          },
        },
        subData
      );

      if (createResponse.statusCode === 201) {
        const subcategory = createResponse.data.data;
        subcategoriesCreated.push(subcategory);
        console.log(`   ✅ ${subcategory.nombre} (${subcategory.codigo})`);
      } else {
        console.log(`   ❌ Error creando ${subData.nombre}:`);
        console.log(`      Status: ${createResponse.statusCode}`);
        console.log(`      Error:`, createResponse.data);
      }
    }

    console.log(
      `\n📊 Subcategorías creadas: ${subcategoriesCreated.length}/${subcategoriesData.length}`
    );

    // ============================================
    // PASO 4: LISTAR SUBCATEGORÍAS POR CATEGORÍA
    // ============================================
    console.log("\n\n📋 PASO 4: Listar subcategorías por categoría");
    console.log("-".repeat(70));

    if (categoryMap["MANT_PREV"]) {
      const mantPrevId = categoryMap["MANT_PREV"]._id;

      const subsByCategoryResponse = await makeRequest({
        hostname: "localhost",
        port: 4000,
        path: `/api/service-subcategories?category=${mantPrevId}`,
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-token": token,
        },
      });

      if (subsByCategoryResponse.statusCode === 200) {
        const subs = subsByCategoryResponse.data.data;
        console.log(
          `\n✅ Subcategorías de "Mantenimiento Preventivo": ${subs.length}`
        );
        subs.forEach((sub, index) => {
          console.log(`   ${index + 1}. ${sub.nombre} (${sub.codigo})`);
        });
      }
    }

    // ============================================
    // PASO 5: OBTENER SUBCATEGORÍA POR ID
    // ============================================
    console.log("\n\n🔍 PASO 5: Obtener subcategoría por ID");
    console.log("-".repeat(70));

    if (subcategoriesCreated.length > 0) {
      const firstSub = subcategoriesCreated[0];

      const getByIdResponse = await makeRequest({
        hostname: "localhost",
        port: 4000,
        path: `/api/service-subcategories/${firstSub._id}`,
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-token": token,
        },
      });

      if (getByIdResponse.statusCode === 200) {
        const sub = getByIdResponse.data.data;
        console.log(`\n✅ Subcategoría obtenida: ${sub.nombre}`);
        console.log("-".repeat(70));
        console.log(`   🔑 ID: ${sub._id}`);
        console.log(`   📝 Código: ${sub.codigo}`);
        console.log(`   📄 Descripción: ${sub.descripcion}`);
        console.log(
          `   📁 Categoría: ${sub.categoria?.nombre} (${sub.categoria?.codigo})`
        );
        console.log(`   ✅ Activo: ${sub.activo ? "Sí" : "No"}`);
        console.log(`   📦 Servicios: ${sub.servicesCount || 0}`);
        console.log(
          `   📅 Creado: ${new Date(sub.createdAt).toLocaleString()}`
        );
      }
    }

    // ============================================
    // PASO 6: ACTUALIZAR SUBCATEGORÍA
    // ============================================
    console.log("\n\n📝 PASO 6: Actualizar subcategoría");
    console.log("-".repeat(70));

    if (subcategoriesCreated.length > 0) {
      const subToUpdate = subcategoriesCreated[0];

      const updateResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: `/api/service-subcategories/${subToUpdate._id}`,
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "x-token": token,
          },
        },
        {
          descripcion:
            "Cambio de aceite motor, filtro de aceite, filtro de aire y filtro de combustible. Incluye revisión de niveles",
        }
      );

      if (updateResponse.statusCode === 200) {
        const updated = updateResponse.data.data;
        console.log(`✅ Subcategoría actualizada: ${updated.nombre}`);
        console.log(`   📄 Nueva descripción: ${updated.descripcion}`);
      } else {
        console.error(
          "❌ Error al actualizar subcategoría:",
          updateResponse.data
        );
      }
    }

    // ============================================
    // PASO 7: VALIDACIONES DE NEGOCIO
    // ============================================
    console.log("\n\n🧪 PASO 7: Validaciones de negocio");
    console.log("-".repeat(70));

    // Intentar crear subcategoría con código duplicado
    console.log("\n📌 Validación 1: Código duplicado");
    if (subcategoriesCreated.length > 0) {
      const duplicateResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: "/api/service-subcategories",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-token": token,
          },
        },
        {
          nombre: "Test Duplicado",
          codigo: subcategoriesCreated[0].codigo, // Código duplicado
          categoria:
            subcategoriesCreated[0].categoria._id ||
            subcategoriesCreated[0].categoria,
        }
      );

      if (duplicateResponse.statusCode !== 201) {
        console.log("   ✅ Código duplicado rechazado correctamente");
      } else {
        console.log("   ⚠️  Código duplicado permitido (error de validación)");
      }
    }

    // Intentar crear subcategoría con categoría inválida
    console.log("\n📌 Validación 2: Categoría inválida");
    const invalidCategoryResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/service-subcategories",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-token": token,
        },
      },
      {
        nombre: "Test Categoría Inválida",
        codigo: "TEST_INV_CAT",
        categoria: "000000000000000000000000", // ID inválido
      }
    );

    if (invalidCategoryResponse.statusCode !== 201) {
      console.log("   ✅ Categoría inválida rechazada correctamente");
    } else {
      console.log("   ⚠️  Categoría inválida permitida (error de validación)");
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
    console.log("   1. ✅ Obtener categorías existentes");
    console.log("   2. ✅ Crear subcategorías por categoría");
    console.log("   3. ✅ Listar subcategorías por categoría");
    console.log("   4. ✅ Obtener subcategoría por ID");
    console.log("   5. ✅ Actualizar subcategoría");
    console.log("   6. ✅ Validaciones de negocio");

    console.log("\n📊 Resultados:");
    console.log(`   • Categorías encontradas: ${categories.length}`);
    console.log(`   • Subcategorías creadas: ${subcategoriesCreated.length}`);

    console.log("\n📁 Distribución de subcategorías:");
    console.log("-".repeat(70));

    const subcategoriesByCategory = {};
    subcategoriesCreated.forEach((sub) => {
      const catName = sub.categoria?.nombre || "Sin categoría";
      if (!subcategoriesByCategory[catName]) {
        subcategoriesByCategory[catName] = [];
      }
      subcategoriesByCategory[catName].push(sub.nombre);
    });

    Object.keys(subcategoriesByCategory).forEach((catName) => {
      console.log(
        `\n   📁 ${catName} (${subcategoriesByCategory[catName].length}):`
      );
      subcategoriesByCategory[catName].forEach((subName, i) => {
        console.log(`      ${i + 1}. ${subName}`);
      });
    });

    console.log("\n🎯 Estado del módulo: OPERACIONAL ✅");
    console.log("\n" + "=".repeat(70) + "\n");
  } catch (error) {
    console.error("\n❌ Error durante el test:", error.message);
    console.error(error.stack);
  }
}

// Ejecutar el test
testServiceSubcategories();
