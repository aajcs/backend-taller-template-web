/**
 * Test: Verificar fix del endpoint /confirm
 * Prueba específicamente el endpoint problemático después del fix
 */

require("dotenv").config();
const http = require("http");

// Configuración
const API_HOST = "localhost";
const API_PORT = 4000;
const API_BASE = "/api";

let authToken = "";

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
      timeout: 15000,
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
          resolve({
            statusCode: res.statusCode,
            data: { raw: body },
          });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

const testConfirmFix = async () => {
  try {
    console.log("=".repeat(60));
    console.log("🔧 TEST: Verificar FIX del endpoint /confirm");
    console.log("=".repeat(60));

    // Autenticación
    console.log("\n🔐 Autenticación...");
    const loginResponse = await makeRequest("POST", "/auth/login", {
      correo: "superadmin@taller.com",
      password: "SuperAdmin123!",
    });

    if (loginResponse.statusCode !== 200) {
      throw new Error(`Error en login: ${JSON.stringify(loginResponse.data)}`);
    }

    authToken = loginResponse.data.token;
    console.log(`✅ Autenticado como: ${loginResponse.data.usuario.nombre}`);

    // Obtener stock disponible
    console.log("\n� Obteniendo stock disponible...");
    const stockResponse = await makeRequest(
      "GET",
      "/inventory/stock",
      null,
      authToken
    );

    const allStocks =
      stockResponse.data.stock || stockResponse.data.stocks || [];
    if (allStocks.length === 0) {
      throw new Error("No hay stock disponible");
    }

    // Encontrar un stock con cantidad disponible
    const stockConDisponible = allStocks.find((s) => {
      const disponible = (s.cantidad || 0) - (s.reservado || 0);
      return disponible > 0;
    });

    if (!stockConDisponible) {
      throw new Error("No hay stock con unidades disponibles");
    }

    const itemId =
      stockConDisponible.item?.id ||
      stockConDisponible.item?._id ||
      stockConDisponible.item;
    const warehouseId =
      stockConDisponible.warehouse?.id ||
      stockConDisponible.warehouse?._id ||
      stockConDisponible.warehouse;
    const disponible =
      stockConDisponible.cantidad - (stockConDisponible.reservado || 0);

    console.log(`✅ Stock encontrado:`);
    console.log(`   - Item: ${stockConDisponible.item?.nombre || itemId}`);
    console.log(
      `   - Almacén: ${stockConDisponible.warehouse?.nombre || warehouseId}`
    );
    console.log(`   - Disponible: ${disponible} unidades`);

    // Crear orden de venta
    console.log("\n📝 Creando orden de venta...");
    const salesOrderData = {
      numero: `SO-FIX-TEST-${Date.now()}`,
      cliente: "Cliente Test - Fix Confirm",
      fecha: new Date().toISOString(),
      estado: "borrador",
      items: [
        {
          item: itemId,
          cantidad: 1,
          precioUnitario: 10000,
        },
      ],
    };

    const createResponse = await makeRequest(
      "POST",
      "/inventory/salesOrder",
      salesOrderData,
      authToken
    );

    if (
      createResponse.statusCode !== 201 &&
      createResponse.statusCode !== 200
    ) {
      throw new Error(
        `Error creando orden: ${JSON.stringify(createResponse.data)}`
      );
    }

    const salesOrder = createResponse.data;
    const salesOrderId = salesOrder.id || salesOrder._id;

    console.log(`✅ Orden creada: ${salesOrder.numero}`);
    console.log(`   - ID: ${salesOrderId}`);
    console.log(`   - Estado: ${salesOrder.estado}`);

    // PRUEBA DEL FIX: Confirmar orden
    console.log("\n🔧 PROBANDO FIX: Confirmando orden...");
    console.log(`   - Usando warehouse: ${warehouseId}`);

    const confirmData = {
      warehouse: warehouseId,
    };

    try {
      const confirmResponse = await makeRequest(
        "POST",
        `/inventory/salesOrder/${salesOrderId}/confirm`,
        confirmData,
        authToken
      );

      console.log(`   - Status Code: ${confirmResponse.statusCode}`);

      if (confirmResponse.statusCode === 200) {
        const ordenConfirmada = confirmResponse.data;
        console.log(`\n✅ ¡FIX FUNCIONA! Orden confirmada exitosamente:`);
        console.log(`   - Estado: ${ordenConfirmada.estado}`);
        console.log(
          `   - Reservas creadas: ${ordenConfirmada.reservations?.length || 0}`
        );
        console.log(
          `   - Fecha confirmación: ${ordenConfirmada.fechaConfirmacion || "N/A"}`
        );

        if (
          ordenConfirmada.reservations &&
          ordenConfirmada.reservations.length > 0
        ) {
          console.log(`\n   📦 Detalles de reservas:`);
          ordenConfirmada.reservations.forEach((res, i) => {
            console.log(`      ${i + 1}. Cantidad: ${res.cantidad}`);
            console.log(`         Estado: ${res.estado}`);
            console.log(
              `         Item: ${res.item?.nombre || res.item || "N/A"}`
            );
          });
        }

        console.log("\n" + "=".repeat(60));
        console.log("✅ TEST EXITOSO - FIX VERIFICADO");
        console.log("=".repeat(60));
        console.log(`
El endpoint /confirm ahora funciona correctamente.
El fix permite que el código funcione sin transacciones
cuando MongoDB no está configurado como replica set.
        `);

        process.exit(0);
      } else if (confirmResponse.statusCode === 400) {
        console.log(`\n⚠️  Error de validación (esperado):`);
        console.log(
          `   - Mensaje: ${confirmResponse.data.message || confirmResponse.data.msg || "Error desconocido"}`
        );
        console.log(`\n   Esto puede ser normal si no hay stock disponible`);
        process.exit(1);
      } else {
        throw new Error(
          `Error inesperado: ${JSON.stringify(confirmResponse.data)}`
        );
      }
    } catch (error) {
      if (error.message.includes("socket hang up")) {
        console.log(`\n❌ FIX NO FUNCIONA - Aún hay socket hang up`);
        console.log(`   ${error.message}`);
        process.exit(1);
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ ERROR EN EL TEST");
    console.error("=".repeat(60));
    console.error(error.message);
    console.error(error.stack);
    process.exit(1);
  }
};

testConfirmFix();
