const http = require("http");

/**
 * Test para el modelo Category
 * Crea 10 categorías de repuestos automotrices en la base de datos
 */

// Helper function para hacer peticiones HTTP
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        try {
          const response = JSON.parse(body);
          resolve({ statusCode: res.statusCode, data: response });
        } catch (e) {
          resolve({ statusCode: res.statusCode, data: body });
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testCategories() {
  try {
    console.log(
      "📂 Iniciando test de Categories (Categorías de Repuestos)...\n"
    );

    // ============================================
    // PASO 1: AUTENTICACIÓN
    // ============================================
    console.log("🔐 PASO 1: Autenticación");
    console.log("-".repeat(50));

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

    if (loginResponse.statusCode !== 200) {
      console.error("❌ Error en login:", loginResponse.data);
      return;
    }

    const token = loginResponse.data.token;
    console.log("✅ Autenticado correctamente\n");

    // ============================================
    // PASO 2: OBTENER CATEGORÍAS EXISTENTES
    // ============================================
    console.log("📋 PASO 2: Verificar categorías existentes");
    console.log("-".repeat(50));

    const getCategoriesResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/categories",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (getCategoriesResponse.statusCode === 200) {
      const existingCategories = getCategoriesResponse.data.categories || [];
      console.log(`📦 Categorías existentes: ${existingCategories.length}`);

      if (existingCategories.length > 0) {
        console.log("\n📋 Categorías existentes:");
        existingCategories.forEach((cat, index) => {
          console.log(`  ${index + 1}. ${cat.nombre} - ${cat.estado}`);
        });
      }
      console.log();
    }

    // ============================================
    // PASO 3: CREAR 10 CATEGORÍAS DE REPUESTOS
    // ============================================
    console.log("➕ PASO 3: Crear 10 categorías de repuestos automotrices");
    console.log("-".repeat(50));

    const categoriesToCreate = [
      {
        nombre: "Filtros",
        descripcion:
          "Filtros de aceite, aire, combustible y habitáculo para todo tipo de vehículos",
        estado: "activo",
      },
      {
        nombre: "Lubricantes y Aceites",
        descripcion:
          "Aceites de motor, transmisión, hidráulicos y lubricantes especiales",
        estado: "activo",
      },
      {
        nombre: "Sistema de Frenos",
        descripcion: "Pastillas, discos, tambores, bombas y líquidos de freno",
        estado: "activo",
      },
      {
        nombre: "Sistema Eléctrico",
        descripcion:
          "Baterías, alternadores, arrancadores, bujías y componentes eléctricos",
        estado: "activo",
      },
      {
        nombre: "Suspensión y Dirección",
        descripcion:
          "Amortiguadores, brazos, rótulas, terminales y componentes de dirección",
        estado: "activo",
      },
      {
        nombre: "Motor y Transmisión",
        descripcion:
          "Repuestos para motor, transmisión, embrague y sistemas de potencia",
        estado: "activo",
      },
      {
        nombre: "Sistema de Refrigeración",
        descripcion:
          "Radiadores, termostatos, bombas de agua, mangueras y refrigerantes",
        estado: "activo",
      },
      {
        nombre: "Neumáticos y Llantas",
        descripcion: "Neumáticos, llantas, válvulas y accesorios de montaje",
        estado: "activo",
      },
      {
        nombre: "Accesorios y Exterior",
        descripcion:
          "Parabrisas, espejos, luces, limpiadores y accesorios exteriores",
        estado: "activo",
      },
      {
        nombre: "Herramientas y Equipos",
        descripcion:
          "Herramientas especializadas, equipos de diagnóstico y mantenimiento",
        estado: "activo",
      },
    ];

    const createdCategories = [];
    const errors = [];

    for (let i = 0; i < categoriesToCreate.length; i++) {
      const categoryData = categoriesToCreate[i];
      console.log(`\n📂 [${i + 1}/10] Creando: ${categoryData.nombre}`);

      const createResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: "/api/inventory/categories",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-token": token,
          },
        },
        categoryData
      );

      if (createResponse.statusCode === 201) {
        const category = createResponse.data;
        createdCategories.push(category);
        console.log(`   ✅ Categoría creada exitosamente`);
        console.log(`   - ID: ${category.id || category._id}`);
        console.log(`   - Descripción: ${category.descripcion}`);
      } else {
        const errorMsg =
          createResponse.data.message ||
          createResponse.data.msg ||
          "Error desconocido";

        // Si la categoría ya existe, es OK
        if (
          errorMsg.includes("duplicate") ||
          errorMsg.includes("ya existe") ||
          errorMsg.includes("unique")
        ) {
          console.log(`   ⚠️  Categoría ya existe, omitiendo...`);
        } else {
          console.log(`   ❌ Error al crear: ${errorMsg}`);
          errors.push({ category: categoryData.nombre, error: errorMsg });
        }
      }
    }

    // ============================================
    // PASO 4: VERIFICAR CATEGORÍAS CREADAS
    // ============================================
    console.log("\n\n📊 PASO 4: Verificar categorías en la base de datos");
    console.log("-".repeat(50));

    const finalCategoriesResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/categories",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (finalCategoriesResponse.statusCode === 200) {
      const allCategories = finalCategoriesResponse.data.categories || [];
      console.log(
        `\n✅ Total de categorías en la base de datos: ${allCategories.length}\n`
      );

      console.log("📋 Lista completa de categorías:");
      console.log("-".repeat(90));
      console.log(
        "No. | Categoría                          | Estado  | Descripción"
      );
      console.log("-".repeat(90));
      allCategories.forEach((cat, index) => {
        const num = String(index + 1).padStart(3);
        const nombre = cat.nombre.padEnd(34);
        const desc = cat.descripcion
          ? cat.descripcion.length > 40
            ? cat.descripcion.substring(0, 37) + "..."
            : cat.descripcion
          : "N/A";
        console.log(`${num} | ${nombre} | ${cat.estado.padEnd(7)} | ${desc}`);
      });
      console.log("-".repeat(90));
    }

    // ============================================
    // RESUMEN
    // ============================================
    console.log("\n" + "=".repeat(80));
    console.log("📊 RESUMEN DEL TEST");
    console.log("=".repeat(80));

    console.log(
      `\n✅ Categorías nuevas creadas: ${createdCategories.length} de 10`
    );

    if (createdCategories.length > 0) {
      console.log("\n📂 Categorías registradas exitosamente:");
      createdCategories.forEach((cat, index) => {
        console.log(`  ${index + 1}. ${cat.nombre}`);
        console.log(`     ${cat.descripcion}`);
      });
    }

    if (errors.length > 0) {
      console.log(`\n⚠️  Errores encontrados: ${errors.length}`);
      errors.forEach((err, index) => {
        console.log(`  ${index + 1}. ${err.category}: ${err.error}`);
      });
    }

    console.log(
      "\n💡 Estas categorías cubren las principales áreas de repuestos automotrices:"
    );
    console.log("   • Sistema de Motor y Transmisión");
    console.log("   • Sistema de Frenos y Suspensión");
    console.log("   • Sistema Eléctrico y Refrigeración");
    console.log("   • Neumáticos y Accesorios");
    console.log("   • Herramientas y Equipos de Taller");

    console.log("\n🎉 TEST DE CATEGORIES COMPLETADO");
    console.log("=".repeat(80) + "\n");
  } catch (error) {
    console.error("\n❌ ERROR EN EL TEST:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

// Ejecutar el test
if (require.main === module) {
  console.log("\n" + "=".repeat(80));
  console.log("🧪 TEST: Modelo Category - Crear Categorías de Repuestos");
  console.log("=".repeat(80));
  console.log("📍 Servidor: http://localhost:4000");
  console.log("📍 Asegúrate de que el servidor esté corriendo\n");

  testCategories();
}

module.exports = { testCategories };
