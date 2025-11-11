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

    // Get categories first
    console.log("📂 Obteniendo categorías...");
    const categoriesResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/categories",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    let repuestosCategoryId = null;
    if (categoriesResponse.statusCode === 200) {
      const categories = categoriesResponse.data.categories;
      console.log(`📂 Categorías encontradas: ${categories.length}`);

      // Look for repuestos category
      const repuestosCategory = categories.find(
        (cat) =>
          cat.nombre.toLowerCase().includes("repuesto") ||
          cat.nombre.toLowerCase().includes("repuestos")
      );

      if (repuestosCategory) {
        repuestosCategoryId = repuestosCategory.id;
        console.log(
          `✅ Categoría de repuestos encontrada: ${repuestosCategory.nombre}`
        );
      } else {
        console.log("⚠️  No hay categoría de repuestos. Creando...");
        // Create repuestos category
        const createCategoryResponse = await makeRequest(
          {
            hostname: "localhost",
            port: 4000,
            path: "/api/inventory/categories",
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-token": token,
            },
          },
          {
            nombre: "Repuestos",
            descripcion: "Categoría para repuestos de vehículos",
          }
        );

        if (createCategoryResponse.statusCode === 201) {
          repuestosCategoryId = createCategoryResponse.data.id;
          console.log("✅ Categoría de repuestos creada");
        } else {
          console.log(
            "❌ Error creando categoría:",
            createCategoryResponse.data
          );
          return;
        }
      }
    }

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

    // Check if we have repuestos for testing
    const repuestos = items.filter(
      (item) =>
        item.categoria?.id === repuestosCategoryId ||
        item.categoria === repuestosCategoryId
    );
    console.log(`🔧 Repuestos encontrados: ${repuestos.length}`);

    if (repuestos.length < 2) {
      console.log(
        "⚠️  No hay suficientes repuestos. Creando repuestos de prueba..."
      );

      // Create some test repuestos
      const testRepuestos = [
        {
          nombre: "Filtro de aceite",
          precioVenta: 50000,
          categoria: repuestosCategoryId,
        },
        {
          nombre: "Bujías",
          precioVenta: 30000,
          categoria: repuestosCategoryId,
        },
        {
          nombre: "Pastillas de freno",
          precioVenta: 80000,
          categoria: repuestosCategoryId,
        },
        {
          nombre: "Aceite de motor",
          precioVenta: 40000,
          categoria: repuestosCategoryId,
        },
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
          console.log(
            `✅ Creado: ${repuesto.nombre} - $${repuesto.precioVenta}`
          );
        } else {
          console.log(
            `❌ Error creando ${repuesto.nombre}:`,
            createResponse.data
          );
        }
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
      const updatedItems = updatedResponse.data.items;
      console.log(`✅ Total items: ${updatedItems.length}`);

      console.log("📋 Todos los items:");
      updatedItems.forEach((item, index) => {
        console.log(
          `  ${index + 1}. ${item.nombre} - Categoría: ${item.categoria} - Precio: $${item.precioVenta}`
        );
      });

      // Check repuestos by category ID
      const repuestosById = updatedItems.filter(
        (item) =>
          item.categoria?.id === repuestosCategoryId ||
          item.categoria === repuestosCategoryId
      );
      console.log(
        `🔧 Repuestos por ID de categoría (${repuestosCategoryId}): ${repuestosById.length}`
      );

      // Check repuestos by category name if populated
      const repuestosByName = updatedItems.filter(
        (item) =>
          item.categoria?.nombre?.toLowerCase().includes("repuesto") ||
          item.categoria?.toLowerCase().includes("repuesto")
      );
      console.log(
        `� Repuestos por nombre de categoría: ${repuestosByName.length}`
      );

      // If no repuestos found, try to get one item detail to see structure
      if (updatedItems.length > 0) {
        console.log("🔍 Revisando estructura del primer item:");
        const firstItem = updatedItems[0];
        console.log(JSON.stringify(firstItem, null, 2));
      }
    }
  } catch (error) {
    console.error("❌ Error en el test:", error.message);
  }
}

testInventoryItems();
