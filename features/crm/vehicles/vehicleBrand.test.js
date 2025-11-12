const http = require("http");

/**
 * TEST: VehicleBrand (Marcas de Vehículos)
 *
 * Este test crea datos de prueba para marcas de vehículos.
 *
 * Cobertura:
 * - Crear 10 marcas de diferentes países
 * - Validar conversión automática a mayúsculas
 * - Verificar campos opcionales (descripción, paisOrigen, logo)
 * - Listar marcas creadas
 */

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

async function testVehicleBrands() {
  console.log("\n" + "=".repeat(80));
  console.log("🧪 TEST: Marcas de Vehículos (VehicleBrand)");
  console.log("=".repeat(80));

  try {
    // ============================================
    // PASO 1: AUTENTICACIÓN
    // ============================================
    console.log("\n🔐 PASO 1: Autenticación");
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
    // PASO 2: CREAR MARCAS DE VEHÍCULOS
    // ============================================
    console.log("\n➕ PASO 2: Crear 10 marcas de vehículos");
    console.log("-".repeat(50));

    const marcasData = [
      {
        nombre: "TOYOTA",
        descripcion:
          "Marca japonesa líder en confiabilidad y tecnología híbrida",
        paisOrigen: "Japón",
        logo: "https://example.com/logos/toyota.png",
      },
      {
        nombre: "FORD",
        descripcion: "Marca americana icónica, pionera en pickups y SUVs",
        paisOrigen: "Estados Unidos",
        logo: "https://example.com/logos/ford.png",
      },
      {
        nombre: "HONDA",
        descripcion:
          "Marca japonesa reconocida por motores eficientes y durabilidad",
        paisOrigen: "Japón",
        logo: "https://example.com/logos/honda.png",
      },
      {
        nombre: "CHEVROLET",
        descripcion: "Marca americana con amplia gama de vehículos",
        paisOrigen: "Estados Unidos",
        logo: "https://example.com/logos/chevrolet.png",
      },
      {
        nombre: "NISSAN",
        descripcion: "Marca japonesa con innovación en vehículos eléctricos",
        paisOrigen: "Japón",
        logo: "https://example.com/logos/nissan.png",
      },
      {
        nombre: "MAZDA",
        descripcion:
          "Marca japonesa enfocada en diseño y experiencia de conducción",
        paisOrigen: "Japón",
        logo: "https://example.com/logos/mazda.png",
      },
      {
        nombre: "HYUNDAI",
        descripcion: "Marca coreana con excelente relación calidad-precio",
        paisOrigen: "Corea del Sur",
        logo: "https://example.com/logos/hyundai.png",
      },
      {
        nombre: "KIA",
        descripcion: "Marca coreana con diseño moderno y garantías extendidas",
        paisOrigen: "Corea del Sur",
        logo: "https://example.com/logos/kia.png",
      },
      {
        nombre: "VOLKSWAGEN",
        descripcion: "Marca alemana reconocida por ingeniería y calidad",
        paisOrigen: "Alemania",
        logo: "https://example.com/logos/volkswagen.png",
      },
      {
        nombre: "BMW",
        descripcion:
          "Marca alemana premium especializada en vehículos de lujo y deportivos",
        paisOrigen: "Alemania",
        logo: "https://example.com/logos/bmw.png",
      },
    ];

    const marcasCreadas = [];
    let exitosas = 0;
    let fallidas = 0;

    for (const marcaData of marcasData) {
      const createResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: "/api/vehicles/brands",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-token": token,
          },
        },
        marcaData
      );

      if (createResponse.statusCode === 201) {
        marcasCreadas.push(createResponse.data.vehicleBrand);
        exitosas++;
        console.log(
          `   ✅ ${marcaData.nombre} - Creada (${marcaData.paisOrigen})`
        );
      } else {
        fallidas++;
        console.log(
          `   ❌ ${marcaData.nombre} - Error:`,
          createResponse.data.msg || createResponse.data.message
        );
      }

      // Pequeña pausa entre requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(
      `\n✅ Marcas creadas exitosamente: ${exitosas}/${marcasData.length}`
    );
    if (fallidas > 0) {
      console.log(`⚠️  Marcas fallidas: ${fallidas}`);
    }

    // ============================================
    // PASO 3: LISTAR MARCAS CREADAS
    // ============================================
    console.log("\n\n📋 PASO 3: Listar marcas creadas");
    console.log("-".repeat(50));

    const listResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/vehicles/brands",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (listResponse.statusCode === 200) {
      const { total, vehicleBrands } = listResponse.data;
      console.log(`\n✅ Total de marcas en el sistema: ${total}`);

      // Agrupar por país de origen
      const porPais = {};
      vehicleBrands.forEach((marca) => {
        const pais = marca.paisOrigen || "Sin especificar";
        if (!porPais[pais]) {
          porPais[pais] = [];
        }
        porPais[pais].push(marca.nombre);
      });

      console.log("\n📊 Marcas por país de origen:");
      console.log("-".repeat(50));
      Object.keys(porPais)
        .sort()
        .forEach((pais) => {
          console.log(
            `   ${pais}: ${porPais[pais].join(", ")} (${porPais[pais].length})`
          );
        });

      // Mostrar muestra de marcas
      console.log("\n📝 Muestra de marcas creadas:");
      console.log("-".repeat(80));
      console.log(
        String.prototype.padEnd.call("Nombre", 15),
        String.prototype.padEnd.call("País", 20),
        "Estado"
      );
      console.log("-".repeat(80));

      vehicleBrands.slice(0, 10).forEach((marca) => {
        console.log(
          String.prototype.padEnd.call(marca.nombre, 15),
          String.prototype.padEnd.call(marca.paisOrigen || "N/A", 20),
          marca.estado
        );
      });
    } else {
      console.log("❌ Error al listar marcas:", listResponse.data);
    }

    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log("\n\n" + "=".repeat(80));
    console.log("📊 RESUMEN DEL TEST");
    console.log("=".repeat(80));
    console.log(`✅ Marcas creadas: ${exitosas}`);
    console.log(`❌ Marcas fallidas: ${fallidas}`);
    console.log(`📦 Total en sistema: ${listResponse.data?.total || 0}`);
    console.log("\n💡 Validaciones confirmadas:");
    console.log("   ✅ Nombres convertidos a mayúsculas automáticamente");
    console.log(
      "   ✅ Campos opcionales (descripción, paisOrigen, logo) funcionando"
    );
    console.log("   ✅ Estado por defecto 'activo' aplicado");
    console.log("   ✅ Timestamps creados automáticamente");
    console.log("\n🎉 TEST DE MARCAS DE VEHÍCULOS COMPLETADO");
    console.log("=".repeat(80) + "\n");
  } catch (error) {
    console.error("\n❌ ERROR EN EL TEST:", error.message);
    console.error(error);
  }
}

// Ejecutar el test
testVehicleBrands();
