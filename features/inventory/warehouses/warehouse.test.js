const http = require("http");

/**
 * Test para el modelo Warehouse
 * Crea 3 almacenes en la base de datos para uso del sistema
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

async function testWarehouses() {
  try {
    console.log("🏢 Iniciando test de Warehouses (Almacenes)...\n");

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
    // PASO 2: OBTENER ALMACENES EXISTENTES
    // ============================================
    console.log("📋 PASO 2: Verificar almacenes existentes");
    console.log("-".repeat(50));

    const getWarehousesResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/warehouses",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (getWarehousesResponse.statusCode === 200) {
      const existingWarehouses = getWarehousesResponse.data.warehouses || [];
      console.log(`📦 Almacenes existentes: ${existingWarehouses.length}`);

      if (existingWarehouses.length > 0) {
        console.log("\n📋 Lista de almacenes existentes:");
        existingWarehouses.forEach((wh, index) => {
          console.log(
            `  ${index + 1}. ${wh.nombre} (${wh.codigo}) - ${wh.tipo} - ${wh.estado}`
          );
        });
      }
      console.log();
    }

    // ============================================
    // PASO 3: CREAR 3 ALMACENES
    // ============================================
    console.log("➕ PASO 3: Crear 3 almacenes en la base de datos");
    console.log("-".repeat(50));

    const warehousesToCreate = [
      {
        nombre: "Almacén Principal",
        codigo: "ALM-MAIN",
        tipo: "almacen",
        ubicacion: "Calle Principal 123, Zona Industrial, Ciudad Capital",
        capacidad: 1000,
        estado: "activo",
      },
      {
        nombre: "Bodega de Repuestos",
        codigo: "BOD-REP",
        tipo: "bodega",
        ubicacion: "Avenida Los Pinos 456, Sector Norte",
        capacidad: 500,
        estado: "activo",
      },
      {
        nombre: "Almacén de Taller",
        codigo: "ALM-TALL",
        tipo: "taller",
        ubicacion: "Calle del Mecánico 789, Zona de Talleres",
        capacidad: 300,
        estado: "activo",
      },
    ];

    const createdWarehouses = [];
    const errors = [];

    for (const warehouseData of warehousesToCreate) {
      console.log(
        `\n📦 Creando: ${warehouseData.nombre} (${warehouseData.codigo})`
      );

      const createResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: "/api/inventory/warehouses",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-token": token,
          },
        },
        warehouseData
      );

      if (createResponse.statusCode === 201) {
        const warehouse = createResponse.data;
        createdWarehouses.push(warehouse);
        console.log(`✅ Almacén creado exitosamente`);
        console.log(`   - ID: ${warehouse.id || warehouse._id}`);
        console.log(`   - Nombre: ${warehouse.nombre}`);
        console.log(`   - Código: ${warehouse.codigo}`);
        console.log(`   - Tipo: ${warehouse.tipo}`);
        console.log(`   - Ubicación: ${warehouse.ubicacion}`);
        console.log(`   - Capacidad: ${warehouse.capacidad} unidades`);
        console.log(`   - Estado: ${warehouse.estado}`);
      } else {
        const errorMsg =
          createResponse.data.message ||
          createResponse.data.msg ||
          "Error desconocido";

        // Si el almacén ya existe, es OK
        if (errorMsg.includes("duplicate") || errorMsg.includes("ya existe")) {
          console.log(`⚠️  Almacén ya existe, omitiendo...`);
        } else {
          console.log(`❌ Error al crear: ${errorMsg}`);
          errors.push({ warehouse: warehouseData.nombre, error: errorMsg });
        }
      }
    }

    // ============================================
    // PASO 4: VERIFICAR ALMACENES CREADOS
    // ============================================
    console.log("\n\n📊 PASO 4: Verificar almacenes en la base de datos");
    console.log("-".repeat(50));

    const finalWarehousesResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/warehouses",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (finalWarehousesResponse.statusCode === 200) {
      const allWarehouses = finalWarehousesResponse.data.warehouses || [];
      console.log(
        `\n✅ Total de almacenes en la base de datos: ${allWarehouses.length}\n`
      );

      console.log("📋 Lista completa de almacenes:");
      allWarehouses.forEach((wh, index) => {
        console.log(
          `  ${index + 1}. ${wh.nombre.padEnd(25)} | ${wh.codigo.padEnd(10)} | ${wh.tipo.padEnd(10)} | ${wh.estado}`
        );
      });
    }

    // ============================================
    // RESUMEN
    // ============================================
    console.log("\n\n" + "=".repeat(80));
    console.log("📊 RESUMEN DEL TEST");
    console.log("=".repeat(80));

    console.log(`\n✅ Almacenes nuevos creados: ${createdWarehouses.length}`);

    if (createdWarehouses.length > 0) {
      console.log("\n📦 Almacenes registrados:");
      createdWarehouses.forEach((wh, index) => {
        console.log(`  ${index + 1}. ${wh.nombre} (${wh.codigo})`);
      });
    }

    if (errors.length > 0) {
      console.log(`\n⚠️  Errores encontrados: ${errors.length}`);
      errors.forEach((err, index) => {
        console.log(`  ${index + 1}. ${err.warehouse}: ${err.error}`);
      });
    }

    console.log("\n🎉 TEST DE WAREHOUSES COMPLETADO");
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
  console.log("🧪 TEST: Modelo Warehouse - Crear Almacenes");
  console.log("=".repeat(80));
  console.log("📍 Servidor: http://localhost:4000");
  console.log("📍 Asegúrate de que el servidor esté corriendo\n");

  testWarehouses();
}

module.exports = { testWarehouses };
