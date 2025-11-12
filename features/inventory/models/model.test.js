const http = require("http");

/**
 * Test para el modelo ItemModel (Models)
 * Crea 15 modelos de repuestos automotrices vinculados a marcas existentes
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

async function testModels() {
  try {
    console.log("🔧 Iniciando test de Models (Modelos de Repuestos)...\n");

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
    // PASO 2: OBTENER MARCAS EXISTENTES
    // ============================================
    console.log("📋 PASO 2: Obtener marcas existentes para vincular");
    console.log("-".repeat(50));

    const getBrandsResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/brands",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    let brands = {};
    if (getBrandsResponse.statusCode === 200) {
      const allBrands = getBrandsResponse.data.brands || [];
      console.log(`🏷️  Marcas disponibles: ${allBrands.length}`);

      if (allBrands.length === 0) {
        console.log(
          "\n⚠️  No hay marcas en la base de datos. Por favor ejecuta brand.test.js primero."
        );
        return;
      }

      // Crear un mapa de marcas por nombre
      allBrands.forEach((brand) => {
        brands[brand.nombre] = brand.id || brand._id;
      });

      console.log("\n📋 Marcas encontradas:");
      Object.keys(brands).forEach((name, index) => {
        console.log(`  ${index + 1}. ${name}`);
      });
      console.log();
    } else {
      console.log("❌ No se pudieron obtener las marcas");
      return;
    }

    // ============================================
    // PASO 3: OBTENER MODELOS EXISTENTES
    // ============================================
    console.log("📋 PASO 3: Verificar modelos existentes");
    console.log("-".repeat(50));

    const getModelsResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/models",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (getModelsResponse.statusCode === 200) {
      const existingModels = getModelsResponse.data.models || [];
      console.log(`🔧 Modelos existentes: ${existingModels.length}`);

      if (existingModels.length > 0) {
        console.log("\n📋 Modelos existentes:");
        existingModels.forEach((model, index) => {
          console.log(`  ${index + 1}. ${model.nombre} - ${model.estado}`);
        });
      }
      console.log();
    }

    // ============================================
    // PASO 4: CREAR 15 MODELOS DE REPUESTOS
    // ============================================
    console.log("➕ PASO 4: Crear 15 modelos de repuestos automotrices");
    console.log("-".repeat(50));

    const modelsToCreate = [
      {
        nombre: "Pastillas de Freno Cerámicas",
        descripcion:
          "Pastillas de freno cerámicas de alto rendimiento con baja generación de polvo",
        marca: brands["Bosch"] || null,
        estado: "activo",
      },
      {
        nombre: "Filtro de Aceite Premium",
        descripcion:
          "Filtro de aceite con tecnología de filtración avanzada para máxima protección del motor",
        marca: brands["Mann Filter"] || null,
        estado: "activo",
      },
      {
        nombre: "Bujías de Iridio",
        descripcion:
          "Bujías de iridio de larga duración con mejor rendimiento y economía de combustible",
        marca: brands["NGK"] || null,
        estado: "activo",
      },
      {
        nombre: "Aceite Sintético 5W-30",
        descripcion:
          "Aceite de motor 100% sintético para máxima protección en condiciones extremas",
        marca: brands["Mobil"] || null,
        estado: "activo",
      },
      {
        nombre: "Amortiguadores Gas Magnum",
        descripcion:
          "Amortiguadores de gas de alta presión para mejor control y confort de manejo",
        marca: brands["Monroe"] || null,
        estado: "activo",
      },
      {
        nombre: "Disco de Freno Ventilado",
        descripcion:
          "Disco de freno ventilado con diseño anti-vibración y mejor disipación térmica",
        marca: brands["Bosch"] || null,
        estado: "activo",
      },
      {
        nombre: "Filtro de Aire de Alto Flujo",
        descripcion:
          "Filtro de aire de alto flujo para mejor respiración del motor y mayor potencia",
        marca: brands["Mann Filter"] || null,
        estado: "activo",
      },
      {
        nombre: "Cables de Bujía Premium",
        descripcion:
          "Cables de bujía de alta resistencia con núcleo de carbono para mejor conducción",
        marca: brands["NGK"] || null,
        estado: "activo",
      },
      {
        nombre: "Aceite de Transmisión ATF",
        descripcion:
          "Aceite sintético para transmisiones automáticas con tecnología de fricción modificada",
        marca: brands["Mobil"] || null,
        estado: "activo",
      },
      {
        nombre: "Kit de Suspensión Completo",
        descripcion:
          "Kit completo de suspensión con amortiguadores, resortes y accesorios de montaje",
        marca: brands["Monroe"] || null,
        estado: "activo",
      },
      {
        nombre: "Sensor de Oxígeno Lambda",
        descripcion:
          "Sensor de oxígeno de alta precisión para control óptimo de emisiones y combustible",
        marca: brands["Bosch"] || null,
        estado: "activo",
      },
      {
        nombre: "Filtro de Combustible",
        descripcion:
          "Filtro de combustible con separación de agua para protección del sistema de inyección",
        marca: brands["Mann Filter"] || null,
        estado: "activo",
      },
      {
        nombre: "Bujías de Platino",
        descripcion:
          "Bujías de platino con electrodo fino para arranque rápido y combustión eficiente",
        marca: brands["NGK"] || null,
        estado: "activo",
      },
      {
        nombre: "Aceite Hidráulico de Dirección",
        descripcion:
          "Fluido hidráulico sintético para sistemas de dirección asistida con aditivos anti-desgaste",
        marca: brands["Mobil"] || null,
        estado: "activo",
      },
      {
        nombre: "Struts Delanteros Quick-Strut",
        descripcion:
          "Conjunto completo de strut con resorte y montaje superior pre-ensamblado",
        marca: brands["Monroe"] || null,
        estado: "activo",
      },
    ];

    const createdModels = [];
    const errors = [];

    for (let i = 0; i < modelsToCreate.length; i++) {
      const modelData = modelsToCreate[i];
      console.log(`\n🔧 [${i + 1}/15] Creando: ${modelData.nombre}`);

      if (!modelData.marca) {
        console.log(
          `   ⚠️  Advertencia: No se encontró la marca para este modelo`
        );
      }

      const createResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: "/api/inventory/models",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-token": token,
          },
        },
        modelData
      );

      if (createResponse.statusCode === 201) {
        const model = createResponse.data;
        createdModels.push(model);
        console.log(`   ✅ Modelo creado exitosamente`);
        console.log(`   - ID: ${model.id || model._id}`);
        console.log(
          `   - Marca: ${modelData.marca ? "Vinculada" : "Sin marca"}`
        );
      } else {
        const errorMsg =
          createResponse.data.message ||
          createResponse.data.msg ||
          "Error desconocido";

        console.log(`   ❌ Error al crear: ${errorMsg}`);
        errors.push({ model: modelData.nombre, error: errorMsg });
      }
    }

    // ============================================
    // PASO 5: VERIFICAR MODELOS CREADOS
    // ============================================
    console.log("\n\n📊 PASO 5: Verificar modelos en la base de datos");
    console.log("-".repeat(50));

    const finalModelsResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/models",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (finalModelsResponse.statusCode === 200) {
      const allModels = finalModelsResponse.data.models || [];
      console.log(
        `\n✅ Total de modelos en la base de datos: ${allModels.length}\n`
      );

      console.log("📋 Lista completa de modelos:");
      console.log("-".repeat(100));
      console.log(
        "No. | Modelo                                  | Estado  | Marca"
      );
      console.log("-".repeat(100));
      allModels.forEach((model, index) => {
        const num = String(index + 1).padStart(3);
        const nombre = model.nombre.padEnd(39);
        const marcaNombre = model.marca?.nombre || "Sin marca";
        console.log(
          `${num} | ${nombre} | ${model.estado.padEnd(7)} | ${marcaNombre}`
        );
      });
      console.log("-".repeat(100));
    }

    // ============================================
    // RESUMEN
    // ============================================
    console.log("\n" + "=".repeat(80));
    console.log("📊 RESUMEN DEL TEST");
    console.log("=".repeat(80));

    console.log(`\n✅ Modelos nuevos creados: ${createdModels.length} de 15`);

    if (createdModels.length > 0) {
      console.log("\n🔧 Modelos registrados exitosamente:");

      // Agrupar por marca
      const modelsByBrand = {};
      modelsToCreate.forEach((model, index) => {
        if (index < createdModels.length) {
          const brandName =
            Object.keys(brands).find((key) => brands[key] === model.marca) ||
            "Sin marca";

          if (!modelsByBrand[brandName]) {
            modelsByBrand[brandName] = [];
          }
          modelsByBrand[brandName].push(model.nombre);
        }
      });

      Object.keys(modelsByBrand).forEach((brandName) => {
        console.log(`\n  🏷️  ${brandName}:`);
        modelsByBrand[brandName].forEach((modelName) => {
          console.log(`     • ${modelName}`);
        });
      });
    }

    if (errors.length > 0) {
      console.log(`\n⚠️  Errores encontrados: ${errors.length}`);
      errors.forEach((err, index) => {
        console.log(`  ${index + 1}. ${err.model}: ${err.error}`);
      });
    }

    console.log(
      "\n💡 Estos modelos cubren las principales categorías de repuestos:"
    );
    console.log("   • Sistema de Frenos (pastillas, discos)");
    console.log("   • Filtración (aceite, aire, combustible)");
    console.log("   • Sistema de Encendido (bujías, cables, sensores)");
    console.log("   • Lubricantes (aceites de motor, transmisión, dirección)");
    console.log("   • Suspensión (amortiguadores, struts, kits completos)");

    console.log("\n🎉 TEST DE MODELS COMPLETADO");
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
  console.log("🧪 TEST: Modelo ItemModel - Crear Modelos de Repuestos");
  console.log("=".repeat(80));
  console.log("📍 Servidor: http://localhost:4000");
  console.log("📍 Asegúrate de que el servidor esté corriendo\n");
  console.log(
    "⚠️  IMPORTANTE: Ejecuta brand.test.js primero para crear las marcas"
  );
  console.log("=".repeat(80) + "\n");

  testModels();
}

module.exports = { testModels };
