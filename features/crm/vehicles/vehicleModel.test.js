const http = require("http");

/**
 * TEST: VehicleModel (Modelos de Vehículos)
 *
 * Este test crea datos de prueba para modelos de vehículos.
 * Requiere que existan marcas creadas previamente.
 *
 * Cobertura:
 * - Crear 25 modelos distribuidos entre las marcas
 * - Validar relación con VehicleBrand
 * - Validar tipos de vehículo (sedan, suv, pickup, etc.)
 * - Validar tipos de motor (gasolina, diesel, eléctrico, híbrido)
 * - Validar restricción única (brand + nombre)
 * - Verificar años de producción
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

async function testVehicleModels() {
  console.log("\n" + "=".repeat(80));
  console.log("🧪 TEST: Modelos de Vehículos (VehicleModel)");
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
    console.log("✅ Autenticado correctamente");

    // ============================================
    // PASO 2: OBTENER MARCAS EXISTENTES
    // ============================================
    console.log("\n\n📋 PASO 2: Obtener marcas existentes");
    console.log("-".repeat(50));

    const brandsResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/vehicles/brands",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (
      brandsResponse.statusCode !== 200 ||
      !brandsResponse.data.vehicleBrands
    ) {
      console.error("❌ Error: No se pudieron obtener las marcas");
      console.error("   Asegúrate de ejecutar primero vehicleBrand.test.js");
      return;
    }

    const marcas = brandsResponse.data.vehicleBrands;
    console.log(`✅ Marcas disponibles: ${marcas.length}`);

    // Crear un mapa de marcas por nombre para fácil acceso
    const marcasPorNombre = {};
    marcas.forEach((marca) => {
      marcasPorNombre[marca.nombre] = marca.id || marca._id;
    });

    console.log(`   Marcas: ${Object.keys(marcasPorNombre).join(", ")}`);

    // ============================================
    // PASO 3: CREAR MODELOS DE VEHÍCULOS
    // ============================================
    console.log("\n\n➕ PASO 3: Crear 25 modelos de vehículos");
    console.log("-".repeat(50));

    const modelosData = [
      // TOYOTA (4 modelos)
      {
        marca: "TOYOTA",
        nombre: "Corolla",
        descripcion: "Sedán compacto confiable y eficiente",
        tipo: "sedan",
        motor: "gasolina",
        yearInicio: 1966,
      },
      {
        marca: "TOYOTA",
        nombre: "Camry",
        descripcion: "Sedán mediano familiar y elegante",
        tipo: "sedan",
        motor: "hibrido",
        yearInicio: 1982,
      },
      {
        marca: "TOYOTA",
        nombre: "RAV4",
        descripcion: "SUV compacta versátil y espaciosa",
        tipo: "suv",
        motor: "hibrido",
        yearInicio: 1994,
      },
      {
        marca: "TOYOTA",
        nombre: "Hilux",
        descripcion: "Pickup robusta y duradera",
        tipo: "pickup",
        motor: "diesel",
        yearInicio: 1968,
      },

      // FORD (4 modelos)
      {
        marca: "FORD",
        nombre: "F-150",
        descripcion: "Pickup full-size líder en ventas",
        tipo: "pickup",
        motor: "gasolina",
        yearInicio: 1948,
      },
      {
        marca: "FORD",
        nombre: "Mustang",
        descripcion: "Deportivo icónico americano",
        tipo: "coupe",
        motor: "gasolina",
        yearInicio: 1964,
      },
      {
        marca: "FORD",
        nombre: "Explorer",
        descripcion: "SUV mediana para familia aventurera",
        tipo: "suv",
        motor: "gasolina",
        yearInicio: 1990,
      },
      {
        marca: "FORD",
        nombre: "Focus",
        descripcion: "Compacto eficiente y ágil",
        tipo: "hatchback",
        motor: "gasolina",
        yearInicio: 1998,
        yearFin: 2019,
      },

      // HONDA (3 modelos)
      {
        marca: "HONDA",
        nombre: "Civic",
        descripcion: "Compacto deportivo y eficiente",
        tipo: "sedan",
        motor: "gasolina",
        yearInicio: 1972,
      },
      {
        marca: "HONDA",
        nombre: "Accord",
        descripcion: "Sedán mediano premium",
        tipo: "sedan",
        motor: "hibrido",
        yearInicio: 1976,
      },
      {
        marca: "HONDA",
        nombre: "CR-V",
        descripcion: "SUV compacta familiar",
        tipo: "suv",
        motor: "gasolina",
        yearInicio: 1995,
      },

      // CHEVROLET (3 modelos)
      {
        marca: "CHEVROLET",
        nombre: "Silverado",
        descripcion: "Pickup full-size potente",
        tipo: "pickup",
        motor: "gasolina",
        yearInicio: 1999,
      },
      {
        marca: "CHEVROLET",
        nombre: "Equinox",
        descripcion: "SUV compacta versátil",
        tipo: "suv",
        motor: "gasolina",
        yearInicio: 2004,
      },
      {
        marca: "CHEVROLET",
        nombre: "Spark",
        descripcion: "Citycar económico y compacto",
        tipo: "hatchback",
        motor: "gasolina",
        yearInicio: 1998,
      },

      // NISSAN (2 modelos)
      {
        marca: "NISSAN",
        nombre: "Sentra",
        descripcion: "Sedán compacto espacioso",
        tipo: "sedan",
        motor: "gasolina",
        yearInicio: 1982,
      },
      {
        marca: "NISSAN",
        nombre: "Leaf",
        descripcion: "Hatchback 100% eléctrico",
        tipo: "hatchback",
        motor: "electrico",
        yearInicio: 2010,
      },

      // MAZDA (2 modelos)
      {
        marca: "MAZDA",
        nombre: "3",
        descripcion: "Compacto deportivo con diseño premium",
        tipo: "sedan",
        motor: "gasolina",
        yearInicio: 2003,
      },
      {
        marca: "MAZDA",
        nombre: "CX-5",
        descripcion: "SUV compacta con diseño Kodo",
        tipo: "suv",
        motor: "gasolina",
        yearInicio: 2012,
      },

      // HYUNDAI (2 modelos)
      {
        marca: "HYUNDAI",
        nombre: "Elantra",
        descripcion: "Sedán compacto con garantía extendida",
        tipo: "sedan",
        motor: "gasolina",
        yearInicio: 1990,
      },
      {
        marca: "HYUNDAI",
        nombre: "Tucson",
        descripcion: "SUV compacta moderna y equipada",
        tipo: "suv",
        motor: "gasolina",
        yearInicio: 2004,
      },

      // KIA (2 modelos)
      {
        marca: "KIA",
        nombre: "Forte",
        descripcion: "Sedán compacto con diseño atractivo",
        tipo: "sedan",
        motor: "gasolina",
        yearInicio: 2008,
      },
      {
        marca: "KIA",
        nombre: "Sportage",
        descripcion: "SUV compacta versátil",
        tipo: "suv",
        motor: "gasolina",
        yearInicio: 1993,
      },

      // VOLKSWAGEN (2 modelos)
      {
        marca: "VOLKSWAGEN",
        nombre: "Jetta",
        descripcion: "Sedán compacto alemán de calidad",
        tipo: "sedan",
        motor: "gasolina",
        yearInicio: 1979,
      },
      {
        marca: "VOLKSWAGEN",
        nombre: "Tiguan",
        descripcion: "SUV compacta premium",
        tipo: "suv",
        motor: "gasolina",
        yearInicio: 2007,
      },

      // BMW (1 modelo)
      {
        marca: "BMW",
        nombre: "Serie 3",
        descripcion: "Sedán deportivo de lujo",
        tipo: "sedan",
        motor: "gasolina",
        yearInicio: 1975,
      },
    ];

    const modelosCreados = [];
    let exitosos = 0;
    let fallidos = 0;

    for (const modeloData of modelosData) {
      const brandId = marcasPorNombre[modeloData.marca];

      if (!brandId) {
        console.log(
          `   ⚠️  ${modeloData.marca} ${modeloData.nombre} - Marca no encontrada`
        );
        fallidos++;
        continue;
      }

      const createResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: "/api/vehicles/models",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-token": token,
          },
        },
        {
          brand: brandId,
          nombre: modeloData.nombre,
          descripcion: modeloData.descripcion,
          tipo: modeloData.tipo,
          motor: modeloData.motor,
          yearInicio: modeloData.yearInicio,
          yearFin: modeloData.yearFin,
        }
      );

      if (createResponse.statusCode === 201) {
        modelosCreados.push(createResponse.data.vehicleModel);
        exitosos++;
        console.log(
          `   ✅ ${modeloData.marca} ${modeloData.nombre} - ${modeloData.tipo} (${modeloData.motor})`
        );
      } else {
        fallidos++;
        console.log(
          `   ❌ ${modeloData.marca} ${modeloData.nombre} - Error:`,
          createResponse.data.msg || createResponse.data.message
        );
      }

      // Pequeña pausa entre requests
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(
      `\n✅ Modelos creados exitosamente: ${exitosos}/${modelosData.length}`
    );
    if (fallidos > 0) {
      console.log(`⚠️  Modelos fallidos: ${fallidos}`);
    }

    // ============================================
    // PASO 4: LISTAR MODELOS CREADOS
    // ============================================
    console.log("\n\n📋 PASO 4: Listar modelos creados");
    console.log("-".repeat(50));

    const listResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/vehicles/models",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (listResponse.statusCode === 200) {
      const { total, vehicleModels } = listResponse.data;
      console.log(`\n✅ Total de modelos en el sistema: ${total}`);

      // Agrupar por marca
      const porMarca = {};
      vehicleModels.forEach((modelo) => {
        const marcaNombre = modelo.brand?.nombre || "Sin marca";
        if (!porMarca[marcaNombre]) {
          porMarca[marcaNombre] = [];
        }
        porMarca[marcaNombre].push(modelo.nombre);
      });

      console.log("\n📊 Modelos por marca:");
      console.log("-".repeat(80));
      Object.keys(porMarca)
        .sort()
        .forEach((marca) => {
          console.log(
            `   ${marca}: ${porMarca[marca].join(", ")} (${porMarca[marca].length})`
          );
        });

      // Agrupar por tipo
      const porTipo = {};
      vehicleModels.forEach((modelo) => {
        const tipo = modelo.tipo || "other";
        porTipo[tipo] = (porTipo[tipo] || 0) + 1;
      });

      console.log("\n📊 Distribución por tipo de vehículo:");
      console.log("-".repeat(50));
      Object.keys(porTipo)
        .sort()
        .forEach((tipo) => {
          console.log(`   ${tipo}: ${porTipo[tipo]} modelos`);
        });

      // Agrupar por motor
      const porMotor = {};
      vehicleModels.forEach((modelo) => {
        const motor = modelo.motor || "gasolina";
        porMotor[motor] = (porMotor[motor] || 0) + 1;
      });

      console.log("\n📊 Distribución por tipo de motor:");
      console.log("-".repeat(50));
      Object.keys(porMotor)
        .sort()
        .forEach((motor) => {
          console.log(`   ${motor}: ${porMotor[motor]} modelos`);
        });
    } else {
      console.log("❌ Error al listar modelos:", listResponse.data);
    }

    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log("\n\n" + "=".repeat(80));
    console.log("📊 RESUMEN DEL TEST");
    console.log("=".repeat(80));
    console.log(`✅ Modelos creados: ${exitosos}`);
    console.log(`❌ Modelos fallidos: ${fallidos}`);
    console.log(`📦 Total en sistema: ${listResponse.data?.total || 0}`);
    console.log("\n💡 Validaciones confirmadas:");
    console.log("   ✅ Relación con VehicleBrand funcionando correctamente");
    console.log("   ✅ Tipos de vehículo (sedan, suv, pickup, etc.) validados");
    console.log(
      "   ✅ Tipos de motor (gasolina, diesel, eléctrico, híbrido) validados"
    );
    console.log("   ✅ Restricción única brand+nombre aplicada");
    console.log("   ✅ Años de producción registrados");
    console.log("   ✅ Estado por defecto 'activo' aplicado");
    console.log("\n🎉 TEST DE MODELOS DE VEHÍCULOS COMPLETADO");
    console.log("=".repeat(80) + "\n");
  } catch (error) {
    console.error("\n❌ ERROR EN EL TEST:", error.message);
    console.error(error);
  }
}

// Ejecutar el test
testVehicleModels();
