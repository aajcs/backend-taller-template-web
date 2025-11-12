const http = require("http");

/**
 * Test para el modelo Brand
 * Crea 5 marcas reconocidas de repuestos automotrices en la base de datos
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

async function testBrands() {
  try {
    console.log("🏷️  Iniciando test de Brands (Marcas de Repuestos)...\n");

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
    console.log("📋 PASO 2: Verificar marcas existentes");
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

    if (getBrandsResponse.statusCode === 200) {
      const existingBrands = getBrandsResponse.data.brands || [];
      console.log(`🏷️  Marcas existentes: ${existingBrands.length}`);

      if (existingBrands.length > 0) {
        console.log("\n📋 Marcas existentes:");
        existingBrands.forEach((brand, index) => {
          console.log(`  ${index + 1}. ${brand.nombre} - ${brand.estado}`);
        });
      }
      console.log();
    }

    // ============================================
    // PASO 3: CREAR 5 MARCAS DE REPUESTOS
    // ============================================
    console.log(
      "➕ PASO 3: Crear 5 marcas reconocidas de repuestos automotrices"
    );
    console.log("-".repeat(50));

    const brandsToCreate = [
      {
        nombre: "Bosch",
        descripcion:
          "Líder mundial en tecnología automotriz, especializada en sistemas de frenos, inyección, baterías y componentes eléctricos",
        estado: "activo",
      },
      {
        nombre: "NGK",
        descripcion:
          "Fabricante japonés especializado en bujías, cables de bujía y sensores de oxígeno de alta calidad",
        estado: "activo",
      },
      {
        nombre: "Mann Filter",
        descripcion:
          "Marca alemana premium especializada en filtros de aceite, aire, combustible y habitáculo para todo tipo de vehículos",
        estado: "activo",
      },
      {
        nombre: "Mobil",
        descripcion:
          "Marca líder en lubricantes sintéticos y aceites de motor de alta performance, reconocida mundialmente",
        estado: "activo",
      },
      {
        nombre: "Monroe",
        descripcion:
          "Especialista en sistemas de suspensión, amortiguadores, struts y componentes de dirección",
        estado: "activo",
      },
    ];

    const createdBrands = [];
    const errors = [];

    for (let i = 0; i < brandsToCreate.length; i++) {
      const brandData = brandsToCreate[i];
      console.log(`\n🏷️  [${i + 1}/5] Creando: ${brandData.nombre}`);

      const createResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: "/api/inventory/brands",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-token": token,
          },
        },
        brandData
      );

      if (createResponse.statusCode === 201) {
        const brand = createResponse.data;
        createdBrands.push(brand);
        console.log(`   ✅ Marca creada exitosamente`);
        console.log(`   - ID: ${brand.id || brand._id}`);
        console.log(`   - Descripción: ${brandData.descripcion}`);
      } else {
        const errorMsg =
          createResponse.data.message ||
          createResponse.data.msg ||
          "Error desconocido";

        // Si la marca ya existe, es OK
        if (
          errorMsg.includes("duplicate") ||
          errorMsg.includes("ya existe") ||
          errorMsg.includes("unique")
        ) {
          console.log(`   ⚠️  Marca ya existe, omitiendo...`);
        } else {
          console.log(`   ❌ Error al crear: ${errorMsg}`);
          errors.push({ brand: brandData.nombre, error: errorMsg });
        }
      }
    }

    // ============================================
    // PASO 4: VERIFICAR MARCAS CREADAS
    // ============================================
    console.log("\n\n📊 PASO 4: Verificar marcas en la base de datos");
    console.log("-".repeat(50));

    const finalBrandsResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/brands",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (finalBrandsResponse.statusCode === 200) {
      const allBrands = finalBrandsResponse.data.brands || [];
      console.log(
        `\n✅ Total de marcas en la base de datos: ${allBrands.length}\n`
      );

      console.log("📋 Lista completa de marcas:");
      console.log("-".repeat(90));
      console.log("No. | Marca                  | Estado  | Descripción");
      console.log("-".repeat(90));
      allBrands.forEach((brand, index) => {
        const num = String(index + 1).padStart(3);
        const nombre = brand.nombre.padEnd(22);
        const desc = brand.descripcion
          ? brand.descripcion.length > 50
            ? brand.descripcion.substring(0, 47) + "..."
            : brand.descripcion
          : "N/A";
        console.log(`${num} | ${nombre} | ${brand.estado.padEnd(7)} | ${desc}`);
      });
      console.log("-".repeat(90));
    }

    // ============================================
    // RESUMEN
    // ============================================
    console.log("\n" + "=".repeat(80));
    console.log("📊 RESUMEN DEL TEST");
    console.log("=".repeat(80));

    console.log(`\n✅ Marcas nuevas creadas: ${createdBrands.length} de 5`);

    if (createdBrands.length > 0) {
      console.log("\n🏷️  Marcas registradas exitosamente:");
      createdBrands.forEach((brand, index) => {
        console.log(`  ${index + 1}. ${brand.nombre}`);
      });
    }

    if (errors.length > 0) {
      console.log(`\n⚠️  Errores encontrados: ${errors.length}`);
      errors.forEach((err, index) => {
        console.log(`  ${index + 1}. ${err.brand}: ${err.error}`);
      });
    }

    console.log(
      "\n💡 Estas marcas son líderes reconocidos en la industria automotriz:"
    );
    console.log("   • Bosch: Tecnología automotriz alemana");
    console.log("   • NGK: Bujías y sensores japoneses");
    console.log("   • Mann Filter: Filtración premium");
    console.log("   • Mobil: Lubricantes de alta performance");
    console.log("   • Monroe: Sistemas de suspensión");

    console.log("\n🎉 TEST DE BRANDS COMPLETADO");
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
  console.log("🧪 TEST: Modelo Brand - Crear Marcas de Repuestos");
  console.log("=".repeat(80));
  console.log("📍 Servidor: http://localhost:4000");
  console.log("📍 Asegúrate de que el servidor esté corriendo\n");

  testBrands();
}

module.exports = { testBrands };
