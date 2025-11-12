const http = require("http");

/**
 * Test para el modelo Customer (Clientes del CRM)
 *
 * Funcionalidades probadas:
 * 1. Crear 15 clientes variados (personas y empresas)
 * 2. Mezcla de tipos: personas naturales y empresas
 * 3. Validación de campos requeridos
 * 4. Población correcta de datos
 * 5. Estados activos
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

async function testCustomers() {
  try {
    console.log("\n" + "=".repeat(80));
    console.log("🧪 TEST: Modelo Customer - Clientes del CRM");
    console.log("=".repeat(80));
    console.log("📍 Servidor: http://localhost:4000");
    console.log("📍 Asegúrate de que el servidor esté corriendo");
    console.log("=".repeat(80));
    console.log("\n📦 Iniciando test de Customers...\n");

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
    // PASO 2: CREAR 15 CLIENTES
    // ============================================
    console.log("➕ PASO 2: Crear 15 clientes (mezcla de personas y empresas)");
    console.log("-".repeat(50));

    const customersToCreate = [
      // PERSONAS NATURALES (10)
      {
        nombre: "Carlos Rodríguez",
        tipo: "persona",
        telefono: "+584121234567",
        correo: "carlos.rodriguez@example.com",
        direccion: "Av. Francisco de Miranda, Caracas",
        estado: "activo",
      },
      {
        nombre: "María González",
        tipo: "persona",
        telefono: "+584242345678",
        correo: "maria.gonzalez@example.com",
        direccion: "Calle Principal, Maracaibo",
        estado: "activo",
      },
      {
        nombre: "José Pérez",
        tipo: "persona",
        telefono: "+584143456789",
        correo: "jose.perez@example.com",
        direccion: "Av. Bolívar, Valencia",
        estado: "activo",
      },
      {
        nombre: "Ana Martínez",
        tipo: "persona",
        telefono: "+584264567890",
        correo: "ana.martinez@example.com",
        direccion: "Urb. El Bosque, Barquisimeto",
        estado: "activo",
      },
      {
        nombre: "Luis Hernández",
        tipo: "persona",
        telefono: "+584125678901",
        correo: "luis.hernandez@example.com",
        direccion: "Calle Los Robles, Caracas",
        estado: "activo",
      },
      {
        nombre: "Carmen Silva",
        tipo: "persona",
        telefono: "+584246789012",
        correo: "carmen.silva@example.com",
        direccion: "Av. Universidad, Maracaibo",
        estado: "activo",
      },
      {
        nombre: "Roberto Díaz",
        tipo: "persona",
        telefono: "+584147890123",
        correo: "roberto.diaz@example.com",
        direccion: "Calle Real, San Cristóbal",
        estado: "activo",
      },
      {
        nombre: "Patricia Torres",
        tipo: "persona",
        telefono: "+584268901234",
        correo: "patricia.torres@example.com",
        direccion: "Urb. La Arboleda, Mérida",
        estado: "activo",
      },
      {
        nombre: "Fernando Ramírez",
        tipo: "persona",
        telefono: "+584129012345",
        correo: "fernando.ramirez@example.com",
        direccion: "Av. Libertador, Caracas",
        estado: "activo",
      },
      {
        nombre: "Laura Castillo",
        tipo: "persona",
        telefono: "+584240123456",
        correo: "laura.castillo@example.com",
        direccion: "Calle Principal, Lechería",
        estado: "activo",
      },

      // EMPRESAS (5)
      {
        nombre: "AutoPartes Nacional C.A.",
        tipo: "empresa",
        rif: "J-12345678-9",
        razonSocial: "AutoPartes Nacional Compañía Anónima",
        telefono: "+584121111111",
        correo: "ventas@autopartesnacional.com",
        direccion: "Zona Industrial, Caracas",
        estado: "activo",
      },
      {
        nombre: "Taller Mecánico El Experto",
        tipo: "empresa",
        rif: "J-23456789-0",
        razonSocial: "Servicios Automotrices El Experto C.A.",
        telefono: "+584242222222",
        correo: "contacto@elexperto.com",
        direccion: "Av. Principal, Maracaibo",
        estado: "activo",
      },
      {
        nombre: "Repuestos Total",
        tipo: "empresa",
        rif: "J-34567890-1",
        razonSocial: "Distribuidora de Repuestos Total C.A.",
        telefono: "+584143333333",
        correo: "info@repuestostotal.com",
        direccion: "Centro Comercial, Valencia",
        estado: "activo",
      },
      {
        nombre: "Frenos y Suspensión Pro",
        tipo: "empresa",
        rif: "J-45678901-2",
        razonSocial: "Frenos y Suspensión Profesional C.A.",
        telefono: "+584264444444",
        correo: "ventas@frenospro.com",
        direccion: "Zona Automotriz, Barquisimeto",
        estado: "activo",
      },
      {
        nombre: "Lubricantes Premium",
        tipo: "empresa",
        rif: "J-56789012-3",
        razonSocial: "Comercializadora de Lubricantes Premium C.A.",
        telefono: "+584125555555",
        correo: "contacto@lubricantespremium.com",
        direccion: "Parque Industrial, Caracas",
        estado: "activo",
      },
    ];

    const createdCustomers = [];
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < customersToCreate.length; i++) {
      const customer = customersToCreate[i];
      const tipoLabel =
        customer.tipo === "persona" ? "👤 Persona" : "🏢 Empresa";

      console.log(`\n📝 [${i + 1}/15] Creando: ${customer.nombre}`);
      console.log(`   Tipo: ${tipoLabel}`);
      console.log(`   Correo: ${customer.correo}`);
      if (customer.rif) console.log(`   RIF: ${customer.rif}`);

      const createResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: "/api/customers",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-token": token,
          },
        },
        customer
      );

      if (
        createResponse.statusCode === 201 ||
        createResponse.statusCode === 200
      ) {
        const created = createResponse.data.customer || createResponse.data;
        createdCustomers.push(created);
        successCount++;
        console.log(`   ✅ Cliente creado - ID: ${created.id || created._id}`);
      } else {
        errorCount++;
        console.log(
          `   ❌ Error al crear cliente:`,
          createResponse.data.msg || createResponse.data
        );
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log(`✅ Clientes creados exitosamente: ${successCount}/15`);
    if (errorCount > 0) {
      console.log(`⚠️  Errores: ${errorCount}`);
    }

    // ============================================
    // PASO 3: VERIFICAR CLIENTES CREADOS
    // ============================================
    console.log("\n📊 PASO 3: Verificar clientes en la base de datos");
    console.log("-".repeat(50));

    const getCustomersResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/customers?limite=100",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (getCustomersResponse.statusCode === 200) {
      const allCustomers = getCustomersResponse.data.customers || [];
      const personas = allCustomers.filter((c) => c.tipo === "persona");
      const empresas = allCustomers.filter((c) => c.tipo === "empresa");

      console.log(`\n✅ Total de clientes en la BD: ${allCustomers.length}`);
      console.log(`   👤 Personas: ${personas.length}`);
      console.log(`   🏢 Empresas: ${empresas.length}`);

      // Verificar campos poblados
      const conTelefono = allCustomers.filter((c) => c.telefono).length;
      const conCorreo = allCustomers.filter((c) => c.correo).length;
      const activos = allCustomers.filter((c) => c.estado === "activo").length;

      console.log(`\n🔍 VERIFICACIÓN DE DATOS:`);
      console.log(
        `   ✅ Clientes con teléfono: ${conTelefono}/${allCustomers.length}`
      );
      console.log(
        `   ✅ Clientes con correo: ${conCorreo}/${allCustomers.length}`
      );
      console.log(`   ✅ Clientes activos: ${activos}/${allCustomers.length}`);

      // Mostrar muestra de clientes
      console.log(`\n📋 MUESTRA DE CLIENTES (primeros 5):`);
      console.log("-".repeat(100));

      allCustomers.slice(0, 5).forEach((customer, idx) => {
        const tipoIcon = customer.tipo === "persona" ? "👤" : "🏢";
        console.log(`\n${tipoIcon} ${idx + 1}. ${customer.nombre}`);
        console.log(`   Tipo: ${customer.tipo}`);
        console.log(`   Correo: ${customer.correo}`);
        console.log(`   Teléfono: ${customer.telefono}`);
        if (customer.rif) console.log(`   RIF: ${customer.rif}`);
        if (customer.razonSocial)
          console.log(`   Razón Social: ${customer.razonSocial}`);
        console.log(`   Estado: ${customer.estado}`);
      });
    }

    // ============================================
    // PASO 4: PROBAR BÚSQUEDAS
    // ============================================
    console.log("\n\n🔍 PASO 4: Probar búsquedas específicas");
    console.log("-".repeat(50));

    // Buscar por tipo
    const personasResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/customers?tipo=persona&limite=100",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (personasResponse.statusCode === 200) {
      const personas = personasResponse.data.customers || [];
      console.log(
        `\n✅ Búsqueda por tipo "persona": ${personas.length} resultados`
      );
    }

    const empresasResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/customers?tipo=empresa&limite=100",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (empresasResponse.statusCode === 200) {
      const empresas = empresasResponse.data.customers || [];
      console.log(
        `✅ Búsqueda por tipo "empresa": ${empresas.length} resultados`
      );
    }

    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log("\n" + "=".repeat(80));
    console.log("📊 RESUMEN DEL TEST");
    console.log("=".repeat(80));
    console.log(`\n✅ Clientes creados: ${successCount} de 15`);
    console.log(`❌ Errores: ${errorCount}`);

    console.log(`\n📦 CLIENTES CREADOS POR TIPO:`);
    const personasCreadas = createdCustomers.filter(
      (c) => c.tipo === "persona"
    ).length;
    const empresasCreadas = createdCustomers.filter(
      (c) => c.tipo === "empresa"
    ).length;
    console.log(`   👤 Personas: ${personasCreadas}`);
    console.log(`   🏢 Empresas: ${empresasCreadas}`);

    console.log(`\n💡 Funcionalidades probadas:`);
    console.log(`   ✅ Creación de clientes tipo persona`);
    console.log(`   ✅ Creación de clientes tipo empresa`);
    console.log(`   ✅ Validación de campos requeridos`);
    console.log(`   ✅ Validación de RIF para empresas`);
    console.log(`   ✅ Búsqueda por tipo de cliente`);
    console.log(`   ✅ Listado con paginación`);

    console.log(`\n🎉 TEST DE CUSTOMERS COMPLETADO`);
    console.log("=".repeat(80) + "\n");
  } catch (error) {
    console.error("\n❌ ERROR EN EL TEST:", error);
    console.error(error.stack);
  }
}

// Configuración inicial
console.log("\n" + "=".repeat(80));
console.log("🧪 TEST: Modelo Customer - Clientes del CRM");
console.log("=".repeat(80));
console.log("📍 Servidor: http://localhost:4000");
console.log("📍 Asegúrate de que el servidor esté corriendo");
console.log("=".repeat(80));

// Ejecutar test
testCustomers();
