const http = require("http");

// Helper function to make HTTP requests
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

async function testInventoryItems() {
  try {
    console.log("🔐 Iniciando sesión...");

    // Login to get token
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
    console.log("✅ Login exitoso, token obtenido");

    console.log("📦 Obteniendo items de inventario...");

    // Get inventory items
    const itemsResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/items",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (itemsResponse.statusCode !== 200) {
      console.error("❌ Error obteniendo items:", itemsResponse.data);
      return;
    }

    const { total, items } = itemsResponse.data;
    console.log(`✅ Items obtenidos: ${total}`);
    console.log("📋 Primeros 3 items:");
    items.slice(0, 3).forEach((item, index) => {
      console.log(
        `  ${index + 1}. ${item.nombre} - Precio: $${item.precio || "N/A"}`
      );
    });

    // Check if we have repuestos for testing
    const repuestos = items.filter(
      (item) =>
        item.tipo === "repuesto" ||
        item.categoria?.nombre?.toLowerCase().includes("repuesto")
    );
    console.log(`🔧 Repuestos encontrados: ${repuestos.length}`);

    if (repuestos.length === 0) {
      console.log(
        "⚠️  No hay repuestos en el inventario. Necesitamos crear algunos para las pruebas."
      );
      console.log("💡 Creando repuestos de prueba...");

      // Create some test repuestos
      const testRepuestos = [
        { nombre: "Filtro de aceite", precio: 50000, tipo: "repuesto" },
        { nombre: "Bujías", precio: 30000, tipo: "repuesto" },
        { nombre: "Pastillas de freno", precio: 80000, tipo: "repuesto" },
        { nombre: "Aceite de motor", precio: 40000, tipo: "repuesto" },
      ];

      for (const repuesto of testRepuestos) {
        const createResponse = await makeRequest(
          {
            hostname: "localhost",
            port: 4000,
            path: "/api/inventory/items",
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-token": token,
            },
          },
          repuesto
        );

        if (createResponse.statusCode === 201) {
          console.log(`✅ Creado: ${repuesto.nombre}`);
        } else {
          console.log(
            `❌ Error creando ${repuesto.nombre}:`,
            createResponse.data
          );
        }
      }

      console.log("🔄 Obteniendo items actualizados...");
      const updatedResponse = await makeRequest({
        hostname: "localhost",
        port: 4000,
        path: "/api/inventory/items",
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "x-token": token,
        },
      });

      if (updatedResponse.statusCode === 200) {
        const updatedRepuestos = updatedResponse.data.items.filter(
          (item) =>
            item.tipo === "repuesto" ||
            item.categoria?.nombre?.toLowerCase().includes("repuesto")
        );
        console.log(
          `✅ Repuestos después de creación: ${updatedRepuestos.length}`
        );
      }
    }
  } catch (error) {
    console.error("❌ Error en el test:", error.message);
  }
}

testInventoryItems();
