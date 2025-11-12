const http = require("http");

/**
 * Test para el modelo Unit
 * Crea unidades de medida necesarias para un taller de repuestos automotrices
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

async function testUnits() {
  try {
    console.log("📏 Iniciando test de Units (Unidades de Medida)...\n");

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
    // PASO 2: OBTENER UNIDADES EXISTENTES
    // ============================================
    console.log("📋 PASO 2: Verificar unidades existentes");
    console.log("-".repeat(50));

    const getUnitsResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/units",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (getUnitsResponse.statusCode === 200) {
      const existingUnits = getUnitsResponse.data.units || [];
      console.log(`📏 Unidades existentes: ${existingUnits.length}`);

      if (existingUnits.length > 0) {
        console.log("\n📋 Unidades existentes:");
        existingUnits.forEach((unit, index) => {
          console.log(`  ${index + 1}. ${unit.nombre} - ${unit.estado}`);
        });
      }
      console.log();
    }

    // ============================================
    // PASO 3: CREAR UNIDADES DE MEDIDA
    // ============================================
    console.log("➕ PASO 3: Crear unidades de medida para taller automotriz");
    console.log("-".repeat(50));

    const unitsToCreate = [
      // Unidades de cantidad
      {
        nombre: "Unidad",
        descripcion:
          "Unidad individual - para piezas, repuestos y componentes individuales",
        estado: "activo",
      },
      {
        nombre: "Par",
        descripcion:
          "Par de unidades - usado para pastillas de freno, amortiguadores, etc.",
        estado: "activo",
      },
      {
        nombre: "Juego",
        descripcion:
          "Juego o set completo - para kits de reparación, herramientas, etc.",
        estado: "activo",
      },
      {
        nombre: "Kit",
        descripcion:
          "Kit de componentes - conjunto de piezas que se venden juntas",
        estado: "activo",
      },
      {
        nombre: "Caja",
        descripcion: "Caja con múltiples unidades - empaque de fábrica",
        estado: "activo",
      },
      {
        nombre: "Paquete",
        descripcion: "Paquete con múltiples unidades - presentación comercial",
        estado: "activo",
      },

      // Unidades de volumen
      {
        nombre: "Litro",
        descripcion:
          "Litro (L) - para aceites, líquidos de freno, refrigerantes, etc.",
        estado: "activo",
      },
      {
        nombre: "Galón",
        descripcion:
          "Galón - para aceites y líquidos en presentación industrial",
        estado: "activo",
      },
      {
        nombre: "Mililitro",
        descripcion:
          "Mililitro (mL) - para productos químicos y aditivos pequeños",
        estado: "activo",
      },

      // Unidades de peso
      {
        nombre: "Kilogramo",
        descripcion:
          "Kilogramo (kg) - para grasa, selladores y productos a granel",
        estado: "activo",
      },
      {
        nombre: "Gramo",
        descripcion:
          "Gramo (g) - para pequeñas cantidades de productos químicos",
        estado: "activo",
      },
      {
        nombre: "Libra",
        descripcion:
          "Libra (lb) - unidad de peso alternativa para ciertos productos",
        estado: "activo",
      },

      // Unidades de longitud
      {
        nombre: "Metro",
        descripcion: "Metro (m) - para cables, mangueras, tubos, etc.",
        estado: "activo",
      },
      {
        nombre: "Centímetro",
        descripcion:
          "Centímetro (cm) - para medidas pequeñas de cables y mangueras",
        estado: "activo",
      },
      {
        nombre: "Rollo",
        descripcion: "Rollo - para cables, mangueras y materiales en rollo",
        estado: "activo",
      },

      // Unidades especiales para taller
      {
        nombre: "Botella",
        descripcion:
          "Botella - para aceites, refrigerantes y líquidos en botella",
        estado: "activo",
      },
      {
        nombre: "Bidón",
        descripcion:
          "Bidón - para aceites y líquidos en presentación de 5-25 litros",
        estado: "activo",
      },
      {
        nombre: "Lata",
        descripcion: "Lata - para sprays, lubricantes y productos en aerosol",
        estado: "activo",
      },
      {
        nombre: "Tubo",
        descripcion: "Tubo - para selladores, siliconas y adhesivos en tubo",
        estado: "activo",
      },
      {
        nombre: "Cartucho",
        descripcion:
          "Cartucho - para grasas y selladores en presentación de cartucho",
        estado: "activo",
      },
    ];

    const createdUnits = [];
    const errors = [];

    for (let i = 0; i < unitsToCreate.length; i++) {
      const unitData = unitsToCreate[i];
      console.log(
        `\n📏 [${i + 1}/${unitsToCreate.length}] Creando: ${unitData.nombre}`
      );

      const createResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: "/api/inventory/units",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-token": token,
          },
        },
        unitData
      );

      if (createResponse.statusCode === 201) {
        const unit = createResponse.data;
        createdUnits.push(unit);
        console.log(`   ✅ Unidad creada exitosamente`);
        console.log(`   - ID: ${unit.id || unit._id}`);
      } else {
        const errorMsg =
          createResponse.data.message ||
          createResponse.data.msg ||
          "Error desconocido";

        // Si la unidad ya existe, es OK
        if (
          errorMsg.includes("duplicate") ||
          errorMsg.includes("ya existe") ||
          errorMsg.includes("unique")
        ) {
          console.log(`   ⚠️  Unidad ya existe, omitiendo...`);
        } else {
          console.log(`   ❌ Error al crear: ${errorMsg}`);
          errors.push({ unit: unitData.nombre, error: errorMsg });
        }
      }
    }

    // ============================================
    // PASO 4: VERIFICAR UNIDADES CREADAS
    // ============================================
    console.log("\n\n📊 PASO 4: Verificar unidades en la base de datos");
    console.log("-".repeat(50));

    const finalUnitsResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/units",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (finalUnitsResponse.statusCode === 200) {
      const allUnits = finalUnitsResponse.data.units || [];
      console.log(
        `\n✅ Total de unidades en la base de datos: ${allUnits.length}\n`
      );

      console.log("📋 Lista completa de unidades:");
      console.log("-".repeat(100));
      console.log("No. | Unidad              | Estado  | Descripción");
      console.log("-".repeat(100));
      allUnits.forEach((unit, index) => {
        const num = String(index + 1).padStart(3);
        const nombre = unit.nombre.padEnd(19);
        const desc = unit.descripcion
          ? unit.descripcion.length > 55
            ? unit.descripcion.substring(0, 52) + "..."
            : unit.descripcion
          : "N/A";
        console.log(`${num} | ${nombre} | ${unit.estado.padEnd(7)} | ${desc}`);
      });
      console.log("-".repeat(100));
    }

    // ============================================
    // RESUMEN
    // ============================================
    console.log("\n" + "=".repeat(80));
    console.log("📊 RESUMEN DEL TEST");
    console.log("=".repeat(80));

    console.log(
      `\n✅ Unidades nuevas creadas: ${createdUnits.length} de ${unitsToCreate.length}`
    );

    if (createdUnits.length > 0) {
      console.log("\n📏 Unidades registradas exitosamente:");

      // Agrupar por categoría
      console.log("\n  📦 UNIDADES DE CANTIDAD:");
      ["Unidad", "Par", "Juego", "Kit", "Caja", "Paquete"].forEach((name) => {
        if (unitsToCreate.find((u) => u.nombre === name)) {
          console.log(`     • ${name}`);
        }
      });

      console.log("\n  💧 UNIDADES DE VOLUMEN:");
      ["Litro", "Galón", "Mililitro"].forEach((name) => {
        if (unitsToCreate.find((u) => u.nombre === name)) {
          console.log(`     • ${name}`);
        }
      });

      console.log("\n  ⚖️  UNIDADES DE PESO:");
      ["Kilogramo", "Gramo", "Libra"].forEach((name) => {
        if (unitsToCreate.find((u) => u.nombre === name)) {
          console.log(`     • ${name}`);
        }
      });

      console.log("\n  📐 UNIDADES DE LONGITUD:");
      ["Metro", "Centímetro", "Rollo"].forEach((name) => {
        if (unitsToCreate.find((u) => u.nombre === name)) {
          console.log(`     • ${name}`);
        }
      });

      console.log("\n  🛢️  UNIDADES ESPECIALES:");
      ["Botella", "Bidón", "Lata", "Tubo", "Cartucho"].forEach((name) => {
        if (unitsToCreate.find((u) => u.nombre === name)) {
          console.log(`     • ${name}`);
        }
      });
    }

    if (errors.length > 0) {
      console.log(`\n⚠️  Errores encontrados: ${errors.length}`);
      errors.forEach((err, index) => {
        console.log(`  ${index + 1}. ${err.unit}: ${err.error}`);
      });
    }

    console.log(
      "\n💡 Estas unidades cubren todas las necesidades de un taller:"
    );
    console.log("   • Piezas individuales y kits completos");
    console.log("   • Líquidos (aceites, refrigerantes, frenos)");
    console.log("   • Productos químicos y lubricantes");
    console.log("   • Cables, mangueras y materiales lineales");
    console.log("   • Diferentes presentaciones comerciales");

    console.log("\n🎉 TEST DE UNITS COMPLETADO");
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
  console.log("🧪 TEST: Modelo Unit - Crear Unidades de Medida");
  console.log("=".repeat(80));
  console.log("📍 Servidor: http://localhost:4000");
  console.log("📍 Asegúrate de que el servidor esté corriendo\n");

  testUnits();
}

module.exports = { testUnits };
