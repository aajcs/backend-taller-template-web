/**
 * Test: AutoSys (Talleres/Refinerías) - API
 * Prueba los endpoints reales del API para operaciones CRUD y validaciones
 */

require("dotenv").config();
const http = require("http");

// Configuración
const API_HOST = "localhost";
const API_PORT = 4000;
const API_BASE = "/api";

// Variables globales
let authToken = "";
let testData = {
  talleres: [],
};

/**
 * Función helper para hacer requests HTTP
 */
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: `${API_BASE}${path}`,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (token) {
      options.headers["x-token"] = token;
    }

    const req = http.request(options, (res) => {
      let body = "";

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        try {
          const parsedBody = JSON.parse(body);
          resolve({
            statusCode: res.statusCode,
            data: parsedBody,
          });
        } catch (error) {
          reject(new Error(`Error parsing response: ${body}`));
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Test principal
 */
const testAutoSysAPI = async () => {
  try {
    console.log("=".repeat(60));
    console.log("🧪 TEST: AUTOSYS (TALLERES) - API");
    console.log("=".repeat(60));

    // ============================================
    // PASO 0: Autenticación
    // ============================================
    console.log("\n🔐 PASO 0: AUTENTICACIÓN");
    console.log("-".repeat(60));

    const loginResponse = await makeRequest("POST", "/auth/login", {
      correo: "superadmin@taller.com",
      password: "SuperAdmin123!",
    });

    if (loginResponse.statusCode !== 200) {
      throw new Error(`Error en login: ${JSON.stringify(loginResponse.data)}`);
    }

    authToken = loginResponse.data.token;
    console.log(`✅ Autenticado como superAdmin`);
    console.log(`   - Usuario: ${loginResponse.data.usuario.nombre}`);
    console.log(`   - Rol: ${loginResponse.data.usuario.role}`);

    // ============================================
    // PASO 1: Crear Taller
    // ============================================
    console.log("\n📝 PASO 1: CREAR taller vía POST /api/autoSys");
    console.log("-".repeat(60));

    const timestamp = Date.now();
    const nuevoTallerData = {
      nombre: `Taller Test API ${timestamp}`,
      rif: `J-TEST${timestamp.toString().slice(-8)}`,
      ubicacion: "Av. Test API, Zona Industrial Test, Local 99",
      telefono: "+58-212-9999999",
      procesamientoDia: 30,
      legal: "Admin Test System API",
      estado: "activo",
      img: "https://example.com/logo-test.png",
    };

    const createResponse = await makeRequest(
      "POST",
      "/autoSys",
      nuevoTallerData,
      authToken
    );

    if (
      createResponse.statusCode !== 201 &&
      createResponse.statusCode !== 200
    ) {
      throw new Error(
        `Error creando taller: ${JSON.stringify(createResponse.data)}`
      );
    }

    const nuevoTaller = createResponse.data.autoSys || createResponse.data;
    testData.talleres.push(nuevoTaller);

    console.log(`✅ Taller creado exitosamente:`);
    console.log(`   - ID: ${nuevoTaller._id}`);
    console.log(`   - Nombre: ${nuevoTaller.nombre}`);
    console.log(`   - RIF: ${nuevoTaller.rif}`);
    console.log(`   - Ubicación: ${nuevoTaller.ubicacion}`);
    console.log(`   - Teléfono: ${nuevoTaller.telefono}`);
    console.log(`   - Capacidad: ${nuevoTaller.procesamientoDia} veh/día`);
    console.log(`   - Legal: ${nuevoTaller.legal}`);
    console.log(`   - Estado: ${nuevoTaller.estado}`);

    // ============================================
    // PASO 2: Leer Taller por ID
    // ============================================
    console.log("\n🔍 PASO 2: LEER taller vía GET /api/autoSys/:id");
    console.log("-".repeat(60));

    const getByIdResponse = await makeRequest(
      "GET",
      `/autoSys/${nuevoTaller._id}`,
      null,
      authToken
    );

    if (getByIdResponse.statusCode !== 200) {
      throw new Error(
        `Error leyendo taller: ${JSON.stringify(getByIdResponse.data)}`
      );
    }

    const tallerLeido = getByIdResponse.data.autoSys || getByIdResponse.data;

    console.log(`✅ Taller leído exitosamente:`);
    console.log(`   - ID: ${tallerLeido._id}`);
    console.log(`   - Nombre: ${tallerLeido.nombre}`);
    console.log(`   - RIF: ${tallerLeido.rif}`);
    console.log(`   - Estado: ${tallerLeido.estado}`);

    if (tallerLeido._id !== nuevoTaller._id) {
      throw new Error("El ID del taller leído no coincide con el creado");
    }

    // ============================================
    // PASO 3: Listar Talleres
    // ============================================
    console.log("\n📋 PASO 3: LISTAR talleres vía GET /api/autoSys");
    console.log("-".repeat(60));

    const listResponse = await makeRequest("GET", "/autoSys", null, authToken);

    if (listResponse.statusCode !== 200) {
      throw new Error(
        `Error listando talleres: ${JSON.stringify(listResponse.data)}`
      );
    }

    const talleres = listResponse.data.autoSys || listResponse.data;

    console.log(`✅ Talleres listados exitosamente:`);
    console.log(`   - Total: ${talleres.length} talleres`);

    const tallerEnLista = talleres.find(
      (t) => t._id.toString() === nuevoTaller._id.toString()
    );

    if (!tallerEnLista) {
      throw new Error("El taller creado no aparece en la lista");
    }

    console.log(`   - ✓ Taller creado encontrado en la lista`);

    // ============================================
    // PASO 4: Actualizar Taller
    // ============================================
    console.log("\n✏️  PASO 4: ACTUALIZAR taller vía PUT /api/autoSys/:id");
    console.log("-".repeat(60));

    const datosActualizacion = {
      telefono: "+58-212-8888888",
      procesamientoDia: 35,
      ubicacion: "Av. Nueva Dirección API, Zona Industrial Actualizada",
    };

    const updateResponse = await makeRequest(
      "PUT",
      `/autoSys/${nuevoTaller._id}`,
      datosActualizacion,
      authToken
    );

    if (updateResponse.statusCode !== 200) {
      throw new Error(
        `Error actualizando taller: ${JSON.stringify(updateResponse.data)}`
      );
    }

    const tallerActualizado =
      updateResponse.data.autoSys || updateResponse.data;

    console.log(`✅ Taller actualizado:`);
    console.log(`\n   📞 Teléfono:`);
    console.log(`      Antes: ${nuevoTaller.telefono}`);
    console.log(`      Ahora: ${tallerActualizado.telefono}`);
    console.log(`\n   🔧 Capacidad:`);
    console.log(`      Antes: ${nuevoTaller.procesamientoDia} veh/día`);
    console.log(`      Ahora: ${tallerActualizado.procesamientoDia} veh/día`);
    console.log(`\n   📍 Ubicación:`);
    console.log(`      Antes: ${nuevoTaller.ubicacion}`);
    console.log(`      Ahora: ${tallerActualizado.ubicacion}`);

    if (tallerActualizado.telefono !== datosActualizacion.telefono) {
      throw new Error("El teléfono no se actualizó correctamente");
    }

    if (
      tallerActualizado.procesamientoDia !== datosActualizacion.procesamientoDia
    ) {
      throw new Error("La capacidad no se actualizó correctamente");
    }

    // ============================================
    // PASO 5: Cambiar Estado (Activo/Inactivo)
    // ============================================
    console.log("\n🔄 PASO 5: CAMBIAR estado del taller vía PUT");
    console.log("-".repeat(60));

    const cambiarEstadoResponse = await makeRequest(
      "PUT",
      `/autoSys/${nuevoTaller._id}`,
      { estado: "inactivo" },
      authToken
    );

    if (cambiarEstadoResponse.statusCode !== 200) {
      throw new Error(
        `Error cambiando estado: ${JSON.stringify(cambiarEstadoResponse.data)}`
      );
    }

    const tallerInactivo =
      cambiarEstadoResponse.data.autoSys || cambiarEstadoResponse.data;

    console.log(`✅ Estado cambiado:`);
    console.log(`   - Antes: 🟢 Activo`);
    console.log(
      `   - Ahora: ${tallerInactivo.estado === "activo" ? "🟢 Activo" : "🔴 Inactivo"}`
    );

    if (tallerInactivo.estado !== "inactivo") {
      throw new Error("El estado no se cambió correctamente a inactivo");
    }

    // Reactivar
    const reactivarResponse = await makeRequest(
      "PUT",
      `/autoSys/${nuevoTaller._id}`,
      { estado: "activo" },
      authToken
    );

    if (reactivarResponse.statusCode !== 200) {
      throw new Error(
        `Error reactivando: ${JSON.stringify(reactivarResponse.data)}`
      );
    }

    console.log(`   - Reactivado: 🟢 Activo`);

    // ============================================
    // PASO 6: Validación de RIF Duplicado
    // ============================================
    console.log("\n🔒 PASO 6: VALIDAR RIF duplicado");
    console.log("-".repeat(60));

    const rifDuplicadoResponse = await makeRequest(
      "POST",
      "/autoSys",
      {
        nombre: "Taller Otro Nombre",
        rif: nuevoTaller.rif, // RIF duplicado
        ubicacion: "Otra ubicación",
        telefono: "+58-212-7777777",
        procesamientoDia: 10,
        legal: "Otro representante",
        img: "https://example.com/logo-otro.png",
      },
      authToken
    );

    if (
      rifDuplicadoResponse.statusCode === 201 ||
      rifDuplicadoResponse.statusCode === 200
    ) {
      throw new Error("El API permitió crear un taller con RIF duplicado");
    }

    console.log(`✅ Validación de RIF único funcionando correctamente`);
    console.log(`   - Status Code: ${rifDuplicadoResponse.statusCode}`);
    console.log(
      `   - Error esperado: ${JSON.stringify(rifDuplicadoResponse.data.msg || rifDuplicadoResponse.data.error || rifDuplicadoResponse.data)}`
    );

    // ============================================
    // PASO 7: Validación de Campos Requeridos
    // ============================================
    console.log("\n✔️  PASO 7: VALIDAR campos requeridos");
    console.log("-".repeat(60));

    // Intentar crear sin nombre
    const sinNombreResponse = await makeRequest(
      "POST",
      "/autoSys",
      {
        rif: "J-SIN-NOMBRE-123",
        ubicacion: "Ubicación válida",
        telefono: "+58-212-5555555",
        procesamientoDia: 10,
        img: "https://example.com/logo.png",
      },
      authToken
    );

    if (
      sinNombreResponse.statusCode === 201 ||
      sinNombreResponse.statusCode === 200
    ) {
      throw new Error("El API permitió crear un taller sin nombre");
    }

    console.log(`✅ Validación de campo 'nombre' requerido`);
    console.log(`   - Status Code: ${sinNombreResponse.statusCode}`);

    // Intentar crear sin RIF
    const sinRifResponse = await makeRequest(
      "POST",
      "/autoSys",
      {
        nombre: "Taller Sin RIF",
        ubicacion: "Ubicación válida",
        telefono: "+58-212-4444444",
        procesamientoDia: 10,
        img: "https://example.com/logo.png",
      },
      authToken
    );

    if (
      sinRifResponse.statusCode === 201 ||
      sinRifResponse.statusCode === 200
    ) {
      throw new Error("El API permitió crear un taller sin RIF");
    }

    console.log(`✅ Validación de campo 'rif' requerido`);
    console.log(`   - Status Code: ${sinRifResponse.statusCode}`);

    // Intentar crear sin ubicación
    const sinUbicacionResponse = await makeRequest(
      "POST",
      "/autoSys",
      {
        nombre: "Taller Sin Ubicación",
        rif: "J-SIN-UBICACION-123",
        telefono: "+58-212-3333333",
        procesamientoDia: 10,
        img: "https://example.com/logo.png",
      },
      authToken
    );

    if (
      sinUbicacionResponse.statusCode === 201 ||
      sinUbicacionResponse.statusCode === 200
    ) {
      throw new Error("El API permitió crear un taller sin ubicación");
    }

    console.log(`✅ Validación de campo 'ubicacion' requerido`);
    console.log(`   - Status Code: ${sinUbicacionResponse.statusCode}`);

    // ============================================
    // PASO 8: Eliminar Taller (lógicamente)
    // ============================================
    console.log("\n🗑️  PASO 8: ELIMINAR taller vía DELETE /api/autoSys/:id");
    console.log("-".repeat(60));

    const deleteResponse = await makeRequest(
      "DELETE",
      `/autoSys/${nuevoTaller._id}`,
      null,
      authToken
    );

    if (deleteResponse.statusCode !== 200) {
      throw new Error(
        `Error eliminando taller: ${JSON.stringify(deleteResponse.data)}`
      );
    }

    console.log(`✅ Taller eliminado (lógicamente):`);
    console.log(`   - ID: ${nuevoTaller._id}`);
    console.log(`   - Nombre: ${nuevoTaller.nombre}`);

    // Verificar que no aparece en la lista
    const listaDespuesDeleteResponse = await makeRequest(
      "GET",
      "/autoSys",
      null,
      authToken
    );

    const talleresDespuesDelete =
      listaDespuesDeleteResponse.data.autoSys ||
      listaDespuesDeleteResponse.data;
    const tallerEliminadoEnLista = talleresDespuesDelete.find(
      (t) => t._id.toString() === nuevoTaller._id.toString()
    );

    if (tallerEliminadoEnLista) {
      throw new Error(
        "El taller eliminado aún aparece en la lista (no se eliminó lógicamente)"
      );
    }

    console.log(`   - ✓ Taller eliminado no aparece en la lista`);

    // ============================================
    // LIMPIEZA
    // ============================================
    console.log("\n🧹 LIMPIEZA: Eliminando datos de prueba");
    console.log("-".repeat(60));

    // Ya eliminamos el taller en el paso anterior
    console.log(`✅ Datos de prueba eliminados`);

    // ============================================
    // RESUMEN
    // ============================================
    console.log("\n" + "=".repeat(60));
    console.log("✅ TODOS LOS TESTS PASARON");
    console.log("=".repeat(60));
    console.log("\nTests ejecutados:");
    console.log("  ✓ Autenticación");
    console.log("  ✓ Crear taller (POST)");
    console.log("  ✓ Leer taller por ID (GET)");
    console.log("  ✓ Listar talleres (GET)");
    console.log("  ✓ Actualizar taller (PUT)");
    console.log("  ✓ Cambiar estado");
    console.log("  ✓ Validar RIF duplicado");
    console.log("  ✓ Validar campos requeridos");
    console.log("  ✓ Eliminar taller (DELETE)");
    console.log("=".repeat(60));

    process.exit(0);
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ ERROR EN EL TEST");
    console.error("=".repeat(60));
    console.error(error.message);
    console.error(error.stack);

    // Intentar limpiar datos de prueba en caso de error
    if (testData.talleres.length > 0 && authToken) {
      console.log("\n🧹 Intentando limpiar datos de prueba...");
      for (const taller of testData.talleres) {
        try {
          await makeRequest(
            "DELETE",
            `/autoSys/${taller._id}`,
            null,
            authToken
          );
          console.log(`   - ✓ Taller ${taller._id} eliminado`);
        } catch (cleanupError) {
          console.log(
            `   - ✗ Error eliminando taller ${taller._id}: ${cleanupError.message}`
          );
        }
      }
    }

    process.exit(1);
  }
};

// Ejecutar test
testAutoSysAPI();
