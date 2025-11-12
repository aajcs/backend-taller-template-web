const http = require("http");

/**
 * Test para el modelo Supplier
 * Crea 15 proveedores en la base de datos para uso del sistema
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

async function testSuppliers() {
  try {
    console.log("🏭 Iniciando test de Suppliers (Proveedores)...\n");

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
    // PASO 2: OBTENER PROVEEDORES EXISTENTES
    // ============================================
    console.log("📋 PASO 2: Verificar proveedores existentes");
    console.log("-".repeat(50));

    const getSuppliersResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/suppliers",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (getSuppliersResponse.statusCode === 200) {
      const existingSuppliers = getSuppliersResponse.data.suppliers || [];
      console.log(`📦 Proveedores existentes: ${existingSuppliers.length}`);

      if (existingSuppliers.length > 0) {
        console.log("\n📋 Primeros 5 proveedores existentes:");
        existingSuppliers.slice(0, 5).forEach((sp, index) => {
          console.log(
            `  ${index + 1}. ${sp.nombre} - ${sp.telefono || "N/A"} - ${sp.estado}`
          );
        });
      }
      console.log();
    }

    // ============================================
    // PASO 3: CREAR 15 PROVEEDORES
    // ============================================
    console.log("➕ PASO 3: Crear 15 proveedores en la base de datos");
    console.log("-".repeat(50));

    const suppliersToCreate = [
      {
        nombre: "AutoPartes del Centro",
        contacto: "Juan Pérez",
        telefono: "+58-212-555-0001",
        correo: "ventas@autopartescentro.com",
        direccion: "Av. Principal, Centro Comercial Las Mercedes, Caracas",
        condicionesPago: "30 días crédito",
        estado: "activo",
      },
      {
        nombre: "Repuestos Industriales S.A.",
        contacto: "María González",
        telefono: "+58-212-555-0002",
        correo: "info@repuestosindustriales.com",
        direccion: "Zona Industrial La Yaguara, Galpón 15",
        condicionesPago: "15 días crédito",
        estado: "activo",
      },
      {
        nombre: "Distribuidora Nacional de Filtros",
        contacto: "Carlos Rodríguez",
        telefono: "+58-212-555-0003",
        correo: "carlos@distfiltros.com",
        direccion: "Calle Comercio, Edificio Torre Azul, Piso 3",
        condicionesPago: "Contado",
        estado: "activo",
      },
      {
        nombre: "Lubricantes Premium C.A.",
        contacto: "Ana Martínez",
        telefono: "+58-212-555-0004",
        correo: "ventas@lubripremium.com",
        direccion: "Carretera Nacional, Km 25, Valencia",
        condicionesPago: "45 días crédito",
        estado: "activo",
      },
      {
        nombre: "Neumáticos del Oeste",
        contacto: "Roberto Silva",
        telefono: "+58-212-555-0005",
        correo: "neumaticos@oeste.com",
        direccion: "Av. Libertador, Centro Automotriz",
        condicionesPago: "60 días crédito",
        estado: "activo",
      },
      {
        nombre: "Sistemas de Frenos Universal",
        contacto: "Pedro Ramírez",
        telefono: "+58-212-555-0006",
        correo: "frenos@universal.com",
        direccion: "Zona Industrial Los Ruices, Nave 8",
        condicionesPago: "30 días crédito",
        estado: "activo",
      },
      {
        nombre: "Electrónica Automotriz Tech",
        contacto: "Laura Fernández",
        telefono: "+58-212-555-0007",
        correo: "tech@electroauto.com",
        direccion: "Centro Comercial Parque Central, Local 45",
        condicionesPago: "15 días crédito",
        estado: "activo",
      },
      {
        nombre: "Baterías y Acumuladores Express",
        contacto: "Miguel Torres",
        telefono: "+58-212-555-0008",
        correo: "baterias@express.com",
        direccion: "Autopista del Este, Sector Petare",
        condicionesPago: "Contado",
        estado: "activo",
      },
      {
        nombre: "Suspensiones y Amortiguadores Pro",
        contacto: "Carmen Díaz",
        telefono: "+58-212-555-0009",
        correo: "suspension@pro.com",
        direccion: "Av. Francisco de Miranda, Torre Empresarial",
        condicionesPago: "30 días crédito",
        estado: "activo",
      },
      {
        nombre: "Motores Reconstruidos Elite",
        contacto: "José Herrera",
        telefono: "+58-212-555-0010",
        correo: "motores@elite.com",
        direccion: "Carretera Panamericana, Km 18",
        condicionesPago: "90 días crédito",
        estado: "activo",
      },
      {
        nombre: "Transmisiones Automáticas Import",
        contacto: "Elena Vargas",
        telefono: "+58-212-555-0011",
        correo: "transmisiones@import.com",
        direccion: "Zona Industrial Guarenas, Galpón 22",
        condicionesPago: "45 días crédito",
        estado: "activo",
      },
      {
        nombre: "Radiadores y Climatización Total",
        contacto: "Fernando Castro",
        telefono: "+58-212-555-0012",
        correo: "radiadores@total.com",
        direccion: "Calle Principal, Los Dos Caminos",
        condicionesPago: "30 días crédito",
        estado: "activo",
      },
      {
        nombre: "Vidrios y Parabrisas Nacional",
        contacto: "Patricia Mora",
        telefono: "+58-212-555-0013",
        correo: "vidrios@nacional.com",
        direccion: "Av. Bolívar, Edificio Crystal, PB",
        condicionesPago: "15 días crédito",
        estado: "activo",
      },
      {
        nombre: "Herramientas Profesionales Mega",
        contacto: "Ricardo Soto",
        telefono: "+58-212-555-0014",
        correo: "herramientas@mega.com",
        direccion: "Centro Mayorista Las Trinitarias, Módulo 12",
        condicionesPago: "Contado",
        estado: "activo",
      },
      {
        nombre: "Productos Químicos Automotriz",
        contacto: "Sofía Ramos",
        telefono: "+58-212-555-0015",
        correo: "quimicos@automotriz.com",
        direccion: "Parque Industrial La Trinidad, Parcela 9",
        condicionesPago: "30 días crédito",
        estado: "activo",
      },
    ];

    const createdSuppliers = [];
    const errors = [];

    for (let i = 0; i < suppliersToCreate.length; i++) {
      const supplierData = suppliersToCreate[i];
      console.log(`\n📦 [${i + 1}/15] Creando: ${supplierData.nombre}`);

      const createResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: "/api/inventory/suppliers",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-token": token,
          },
        },
        supplierData
      );

      if (createResponse.statusCode === 201) {
        const supplier = createResponse.data;
        createdSuppliers.push(supplier);
        console.log(`   ✅ Proveedor creado exitosamente`);
        console.log(`   - ID: ${supplier.id || supplier._id}`);
        console.log(`   - Contacto: ${supplier.contacto}`);
        console.log(`   - Teléfono: ${supplier.telefono}`);
        console.log(`   - Condiciones: ${supplier.condicionesPago}`);
      } else {
        const errorMsg =
          createResponse.data.message ||
          createResponse.data.msg ||
          "Error desconocido";

        // Si el proveedor ya existe, es OK
        if (errorMsg.includes("duplicate") || errorMsg.includes("ya existe")) {
          console.log(`   ⚠️  Proveedor ya existe, omitiendo...`);
        } else {
          console.log(`   ❌ Error al crear: ${errorMsg}`);
          errors.push({ supplier: supplierData.nombre, error: errorMsg });
        }
      }
    }

    // ============================================
    // PASO 4: VERIFICAR PROVEEDORES CREADOS
    // ============================================
    console.log("\n\n📊 PASO 4: Verificar proveedores en la base de datos");
    console.log("-".repeat(50));

    const finalSuppliersResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/suppliers",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (finalSuppliersResponse.statusCode === 200) {
      const allSuppliers = finalSuppliersResponse.data.suppliers || [];
      console.log(
        `\n✅ Total de proveedores en la base de datos: ${allSuppliers.length}\n`
      );

      console.log("📋 Lista completa de proveedores:");
      console.log("-".repeat(80));
      console.log(
        "No. | Nombre                                    | Teléfono          | Estado"
      );
      console.log("-".repeat(80));
      allSuppliers.forEach((sp, index) => {
        const num = String(index + 1).padStart(3);
        const nombre = sp.nombre.padEnd(41);
        const telefono = (sp.telefono || "N/A").padEnd(17);
        console.log(`${num} | ${nombre} | ${telefono} | ${sp.estado}`);
      });
      console.log("-".repeat(80));
    }

    // ============================================
    // RESUMEN
    // ============================================
    console.log("\n" + "=".repeat(80));
    console.log("📊 RESUMEN DEL TEST");
    console.log("=".repeat(80));

    console.log(
      `\n✅ Proveedores nuevos creados: ${createdSuppliers.length} de 15`
    );

    if (createdSuppliers.length > 0) {
      console.log("\n📦 Proveedores registrados exitosamente:");
      createdSuppliers.forEach((sp, index) => {
        console.log(
          `  ${index + 1}. ${sp.nombre} - ${sp.contacto} (${sp.condicionesPago})`
        );
      });
    }

    if (errors.length > 0) {
      console.log(`\n⚠️  Errores encontrados: ${errors.length}`);
      errors.forEach((err, index) => {
        console.log(`  ${index + 1}. ${err.supplier}: ${err.error}`);
      });
    }

    console.log("\n🎉 TEST DE SUPPLIERS COMPLETADO");
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
  console.log("🧪 TEST: Modelo Supplier - Crear Proveedores");
  console.log("=".repeat(80));
  console.log("📍 Servidor: http://localhost:4000");
  console.log("📍 Asegúrate de que el servidor esté corriendo\n");

  testSuppliers();
}

module.exports = { testSuppliers };
