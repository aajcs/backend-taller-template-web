const http = require("http");

/**
 * Test para el modelo Item
 * Crea 50 items de repuestos automotrices con referencias a:
 * - Marcas (brands)
 * - Modelos (models)
 * - Categorías (categories)
 * - Unidades (units)
 *
 * Verifica la población correcta de todas las referencias
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

async function testItems() {
  try {
    console.log("🔧 Iniciando test de Items (Artículos de Inventario)...\n");

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
    // PASO 2: OBTENER DATOS DE REFERENCIA
    // ============================================
    console.log("📋 PASO 2: Obtener datos de referencia existentes");
    console.log("-".repeat(50));

    // Obtener Marcas
    const getBrandsResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/brands",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    const brands = {};
    if (getBrandsResponse.statusCode === 200) {
      const allBrands = getBrandsResponse.data.brands || [];
      allBrands.forEach((brand) => {
        brands[brand.nombre] = brand.id || brand._id;
      });
      console.log(`✅ Marcas disponibles: ${Object.keys(brands).length}`);
    }

    // Obtener Modelos
    const getModelsResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/models",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    const models = {};
    if (getModelsResponse.statusCode === 200) {
      const allModels = getModelsResponse.data.models || [];
      allModels.forEach((model) => {
        models[model.nombre] = model.id || model._id;
      });
      console.log(`✅ Modelos disponibles: ${Object.keys(models).length}`);
    }

    // Obtener Categorías
    const getCategoriesResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/categories",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    const categories = {};
    if (getCategoriesResponse.statusCode === 200) {
      const allCategories = getCategoriesResponse.data.categories || [];
      allCategories.forEach((cat) => {
        categories[cat.nombre] = cat.id || cat._id;
      });
      console.log(
        `✅ Categorías disponibles: ${Object.keys(categories).length}`
      );
    }

    // Obtener Unidades
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

    const units = {};
    if (getUnitsResponse.statusCode === 200) {
      const allUnits = getUnitsResponse.data.units || [];
      allUnits.forEach((unit) => {
        units[unit.nombre] = unit.id || unit._id;
      });
      console.log(`✅ Unidades disponibles: ${Object.keys(units).length}`);
    }

    // Verificar que tenemos todos los datos necesarios
    if (
      Object.keys(brands).length === 0 ||
      Object.keys(models).length === 0 ||
      Object.keys(categories).length === 0 ||
      Object.keys(units).length === 0
    ) {
      console.log("\n⚠️  ADVERTENCIA: Faltan datos de referencia.");
      console.log("Por favor ejecuta primero:");
      console.log("  - brand.test.js (Marcas)");
      console.log("  - model.test.js (Modelos)");
      console.log("  - category.test.js (Categorías)");
      console.log("  - unit.test.js (Unidades)");
      return;
    }

    console.log("\n✅ Todos los datos de referencia están disponibles\n");

    // ============================================
    // PASO 3: VERIFICAR ITEMS EXISTENTES
    // ============================================
    console.log("📋 PASO 3: Verificar items existentes");
    console.log("-".repeat(50));

    const getItemsResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/items",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (getItemsResponse.statusCode === 200) {
      const existingItems = getItemsResponse.data.items || [];
      console.log(`🔧 Items existentes: ${existingItems.length}\n`);
    }

    // ============================================
    // PASO 4: CREAR 50 ITEMS DE REPUESTOS
    // ============================================
    console.log("➕ PASO 4: Crear 50 items de repuestos automotrices");
    console.log("-".repeat(50));

    const itemsToCreate = [
      // SISTEMA DE FRENOS - Bosch (5 items)
      {
        sku: "BOS-PFC-001",
        codigo: "PFC-CER-001",
        nombre: "Pastillas Cerámicas Toyota Corolla",
        descripcion:
          "Pastillas de freno cerámicas delanteras para Toyota Corolla 2015-2023",
        marca: brands["Bosch"],
        modelo: models["Pastillas de Freno Cerámicas"],
        categoria: categories["Sistema de Frenos"],
        unidad: units["Juego"],
        precioCosto: 45.0,
        precioVenta: 75.0,
        stockMinimo: 5,
        stockMaximo: 30,
        estado: "activo",
      },
      {
        sku: "BOS-DFV-002",
        codigo: "DFV-001",
        nombre: "Disco Freno Ventilado Honda Civic",
        descripcion: "Disco de freno ventilado delantero Honda Civic 2016-2023",
        marca: brands["Bosch"],
        modelo: models["Disco de Freno Ventilado"],
        categoria: categories["Sistema de Frenos"],
        unidad: units["Unidad"],
        precioCosto: 65.0,
        precioVenta: 110.0,
        stockMinimo: 4,
        stockMaximo: 20,
        estado: "activo",
      },
      {
        sku: "BOS-PFC-003",
        codigo: "PFC-CER-002",
        nombre: "Pastillas Cerámicas Mazda 3",
        descripcion:
          "Pastillas de freno cerámicas delanteras Mazda 3 2014-2022",
        marca: brands["Bosch"],
        modelo: models["Pastillas de Freno Cerámicas"],
        categoria: categories["Sistema de Frenos"],
        unidad: units["Juego"],
        precioCosto: 42.0,
        precioVenta: 70.0,
        stockMinimo: 5,
        stockMaximo: 25,
        estado: "activo",
      },
      {
        sku: "BOS-SOL-004",
        codigo: "SOL-LAM-001",
        nombre: "Sensor Oxígeno Lambda Universal",
        descripcion: "Sensor de oxígeno lambda universal 4 cables",
        marca: brands["Bosch"],
        modelo: models["Sensor de Oxígeno Lambda"],
        categoria: categories["Sistema Eléctrico"],
        unidad: units["Unidad"],
        precioCosto: 35.0,
        precioVenta: 60.0,
        stockMinimo: 8,
        stockMaximo: 40,
        estado: "activo",
      },
      {
        sku: "BOS-DFV-005",
        codigo: "DFV-002",
        nombre: "Disco Freno Ventilado Nissan Sentra",
        descripcion:
          "Disco de freno ventilado delantero Nissan Sentra 2013-2020",
        marca: brands["Bosch"],
        modelo: models["Disco de Freno Ventilado"],
        categoria: categories["Sistema de Frenos"],
        unidad: units["Unidad"],
        precioCosto: 58.0,
        precioVenta: 95.0,
        stockMinimo: 4,
        stockMaximo: 20,
        estado: "activo",
      },

      // FILTROS - Mann Filter (10 items)
      {
        sku: "MAN-FAC-006",
        codigo: "FAC-PRE-001",
        nombre: "Filtro Aceite Toyota 4 Cilindros",
        descripcion: "Filtro de aceite premium para motores Toyota 4 cilindros",
        marca: brands["Mann Filter"],
        modelo: models["Filtro de Aceite Premium"],
        categoria: categories["Filtros"],
        unidad: units["Unidad"],
        precioCosto: 8.5,
        precioVenta: 15.0,
        stockMinimo: 20,
        stockMaximo: 100,
        estado: "activo",
      },
      {
        sku: "MAN-FAI-007",
        codigo: "FAI-ALT-001",
        nombre: "Filtro Aire Alto Flujo Honda",
        descripcion: "Filtro de aire de alto flujo para Honda Civic/Accord",
        marca: brands["Mann Filter"],
        modelo: models["Filtro de Aire de Alto Flujo"],
        categoria: categories["Filtros"],
        unidad: units["Unidad"],
        precioCosto: 18.0,
        precioVenta: 32.0,
        stockMinimo: 15,
        stockMaximo: 60,
        estado: "activo",
      },
      {
        sku: "MAN-FCO-008",
        codigo: "FCO-001",
        nombre: "Filtro Combustible Diesel",
        descripcion:
          "Filtro de combustible con separador de agua para motores diesel",
        marca: brands["Mann Filter"],
        modelo: models["Filtro de Combustible"],
        categoria: categories["Filtros"],
        unidad: units["Unidad"],
        precioCosto: 22.0,
        precioVenta: 38.0,
        stockMinimo: 10,
        stockMaximo: 50,
        estado: "activo",
      },
      {
        sku: "MAN-FAC-009",
        codigo: "FAC-PRE-002",
        nombre: "Filtro Aceite Nissan V6",
        descripcion: "Filtro de aceite premium para motores Nissan V6",
        marca: brands["Mann Filter"],
        modelo: models["Filtro de Aceite Premium"],
        categoria: categories["Filtros"],
        unidad: units["Unidad"],
        precioCosto: 12.0,
        precioVenta: 20.0,
        stockMinimo: 15,
        stockMaximo: 80,
        estado: "activo",
      },
      {
        sku: "MAN-FAI-010",
        codigo: "FAI-ALT-002",
        nombre: "Filtro Aire Alto Flujo Mazda",
        descripcion: "Filtro de aire de alto flujo para Mazda 3/6",
        marca: brands["Mann Filter"],
        modelo: models["Filtro de Aire de Alto Flujo"],
        categoria: categories["Filtros"],
        unidad: units["Unidad"],
        precioCosto: 16.5,
        precioVenta: 29.0,
        stockMinimo: 15,
        stockMaximo: 60,
        estado: "activo",
      },
      {
        sku: "MAN-FAC-011",
        codigo: "FAC-PRE-003",
        nombre: "Filtro Aceite Honda 4 Cilindros",
        descripcion: "Filtro de aceite premium para motores Honda 4 cilindros",
        marca: brands["Mann Filter"],
        modelo: models["Filtro de Aceite Premium"],
        categoria: categories["Filtros"],
        unidad: units["Unidad"],
        precioCosto: 9.0,
        precioVenta: 16.0,
        stockMinimo: 20,
        stockMaximo: 100,
        estado: "activo",
      },
      {
        sku: "MAN-FCO-012",
        codigo: "FCO-002",
        nombre: "Filtro Combustible Gasolina",
        descripcion: "Filtro de combustible para motores gasolina inyección",
        marca: brands["Mann Filter"],
        modelo: models["Filtro de Combustible"],
        categoria: categories["Filtros"],
        unidad: units["Unidad"],
        precioCosto: 15.0,
        precioVenta: 26.0,
        stockMinimo: 12,
        stockMaximo: 60,
        estado: "activo",
      },
      {
        sku: "MAN-FAI-013",
        codigo: "FAI-ALT-003",
        nombre: "Filtro Aire Alto Flujo Toyota",
        descripcion: "Filtro de aire de alto flujo para Toyota Corolla/Camry",
        marca: brands["Mann Filter"],
        modelo: models["Filtro de Aire de Alto Flujo"],
        categoria: categories["Filtros"],
        unidad: units["Unidad"],
        precioCosto: 17.0,
        precioVenta: 30.0,
        stockMinimo: 15,
        stockMaximo: 70,
        estado: "activo",
      },
      {
        sku: "MAN-FAC-014",
        codigo: "FAC-PRE-004",
        nombre: "Filtro Aceite Mazda SkyActiv",
        descripcion: "Filtro de aceite premium para motores Mazda SkyActiv",
        marca: brands["Mann Filter"],
        modelo: models["Filtro de Aceite Premium"],
        categoria: categories["Filtros"],
        unidad: units["Unidad"],
        precioCosto: 10.5,
        precioVenta: 18.0,
        stockMinimo: 18,
        stockMaximo: 90,
        estado: "activo",
      },
      {
        sku: "MAN-FAI-015",
        codigo: "FAI-ALT-004",
        nombre: "Filtro Aire Alto Flujo Nissan",
        descripcion: "Filtro de aire de alto flujo para Nissan Sentra/Altima",
        marca: brands["Mann Filter"],
        modelo: models["Filtro de Aire de Alto Flujo"],
        categoria: categories["Filtros"],
        unidad: units["Unidad"],
        precioCosto: 16.0,
        precioVenta: 28.0,
        stockMinimo: 15,
        stockMaximo: 65,
        estado: "activo",
      },

      // BUJÍAS Y CABLES - NGK (10 items)
      {
        sku: "NGK-BIR-016",
        codigo: "BIR-001",
        nombre: "Bujías Iridio Toyota 4 Cil",
        descripcion: "Juego 4 bujías de iridio Toyota Corolla/Yaris 1.8L",
        marca: brands["NGK"],
        modelo: models["Bujías de Iridio"],
        categoria: categories["Sistema Eléctrico"],
        unidad: units["Juego"],
        precioCosto: 48.0,
        precioVenta: 80.0,
        stockMinimo: 10,
        stockMaximo: 50,
        estado: "activo",
      },
      {
        sku: "NGK-CBU-017",
        codigo: "CBU-PRE-001",
        nombre: "Cables Bujía Honda Civic",
        descripcion: "Juego cables de bujía premium Honda Civic 1.8L",
        marca: brands["NGK"],
        modelo: models["Cables de Bujía Premium"],
        categoria: categories["Sistema Eléctrico"],
        unidad: units["Juego"],
        precioCosto: 35.0,
        precioVenta: 60.0,
        stockMinimo: 8,
        stockMaximo: 40,
        estado: "activo",
      },
      {
        sku: "NGK-BPL-018",
        codigo: "BPL-001",
        nombre: "Bujías Platino Mazda 4 Cil",
        descripcion: "Juego 4 bujías de platino Mazda 3/6 2.0L",
        marca: brands["NGK"],
        modelo: models["Bujías de Platino"],
        categoria: categories["Sistema Eléctrico"],
        unidad: units["Juego"],
        precioCosto: 32.0,
        precioVenta: 55.0,
        stockMinimo: 10,
        stockMaximo: 50,
        estado: "activo",
      },
      {
        sku: "NGK-BIR-019",
        codigo: "BIR-002",
        nombre: "Bujías Iridio Honda 4 Cil",
        descripcion: "Juego 4 bujías de iridio Honda Civic/Accord 2.0L",
        marca: brands["NGK"],
        modelo: models["Bujías de Iridio"],
        categoria: categories["Sistema Eléctrico"],
        unidad: units["Juego"],
        precioCosto: 52.0,
        precioVenta: 85.0,
        stockMinimo: 10,
        stockMaximo: 50,
        estado: "activo",
      },
      {
        sku: "NGK-CBU-020",
        codigo: "CBU-PRE-002",
        nombre: "Cables Bujía Toyota Corolla",
        descripcion: "Juego cables de bujía premium Toyota Corolla 1.8L",
        marca: brands["NGK"],
        modelo: models["Cables de Bujía Premium"],
        categoria: categories["Sistema Eléctrico"],
        unidad: units["Juego"],
        precioCosto: 32.0,
        precioVenta: 55.0,
        stockMinimo: 8,
        stockMaximo: 40,
        estado: "activo",
      },
      {
        sku: "NGK-BPL-021",
        codigo: "BPL-002",
        nombre: "Bujías Platino Nissan 4 Cil",
        descripcion: "Juego 4 bujías de platino Nissan Sentra 1.8L",
        marca: brands["NGK"],
        modelo: models["Bujías de Platino"],
        categoria: categories["Sistema Eléctrico"],
        unidad: units["Juego"],
        precioCosto: 30.0,
        precioVenta: 52.0,
        stockMinimo: 10,
        stockMaximo: 50,
        estado: "activo",
      },
      {
        sku: "NGK-BIR-022",
        codigo: "BIR-003",
        nombre: "Bujías Iridio Nissan V6",
        descripcion: "Juego 6 bujías de iridio Nissan Altima/Maxima V6",
        marca: brands["NGK"],
        modelo: models["Bujías de Iridio"],
        categoria: categories["Sistema Eléctrico"],
        unidad: units["Juego"],
        precioCosto: 68.0,
        precioVenta: 115.0,
        stockMinimo: 8,
        stockMaximo: 40,
        estado: "activo",
      },
      {
        sku: "NGK-CBU-023",
        codigo: "CBU-PRE-003",
        nombre: "Cables Bujía Mazda 3",
        descripcion: "Juego cables de bujía premium Mazda 3 2.0L",
        marca: brands["NGK"],
        modelo: models["Cables de Bujía Premium"],
        categoria: categories["Sistema Eléctrico"],
        unidad: units["Juego"],
        precioCosto: 33.0,
        precioVenta: 57.0,
        stockMinimo: 8,
        stockMaximo: 40,
        estado: "activo",
      },
      {
        sku: "NGK-BPL-024",
        codigo: "BPL-003",
        nombre: "Bujías Platino Honda V6",
        descripcion: "Juego 6 bujías de platino Honda Accord/Pilot V6",
        marca: brands["NGK"],
        modelo: models["Bujías de Platino"],
        categoria: categories["Sistema Eléctrico"],
        unidad: units["Juego"],
        precioCosto: 42.0,
        precioVenta: 72.0,
        stockMinimo: 8,
        stockMaximo: 40,
        estado: "activo",
      },
      {
        sku: "NGK-BIR-025",
        codigo: "BIR-004",
        nombre: "Bujías Iridio Mazda SkyActiv",
        descripcion: "Juego 4 bujías de iridio Mazda SkyActiv 2.0L/2.5L",
        marca: brands["NGK"],
        modelo: models["Bujías de Iridio"],
        categoria: categories["Sistema Eléctrico"],
        unidad: units["Juego"],
        precioCosto: 55.0,
        precioVenta: 90.0,
        stockMinimo: 10,
        stockMaximo: 50,
        estado: "activo",
      },

      // ACEITES Y LUBRICANTES - Mobil (15 items)
      {
        sku: "MOB-AS5-026",
        codigo: "AS5-30-001",
        nombre: "Aceite Mobil 1 5W-30 Sintético 1L",
        descripcion: "Aceite de motor 100% sintético Mobil 1 5W-30, 1 litro",
        marca: brands["Mobil"],
        modelo: models["Aceite Sintético 5W-30"],
        categoria: categories["Lubricantes y Aceites"],
        unidad: units["Litro"],
        precioCosto: 12.0,
        precioVenta: 20.0,
        stockMinimo: 30,
        stockMaximo: 150,
        estado: "activo",
      },
      {
        sku: "MOB-AS5-027",
        codigo: "AS5-30-002",
        nombre: "Aceite Mobil 1 5W-30 Sintético 4L",
        descripcion:
          "Aceite de motor 100% sintético Mobil 1 5W-30, garrafa 4 litros",
        marca: brands["Mobil"],
        modelo: models["Aceite Sintético 5W-30"],
        categoria: categories["Lubricantes y Aceites"],
        unidad: units["Galón"],
        precioCosto: 42.0,
        precioVenta: 70.0,
        stockMinimo: 20,
        stockMaximo: 80,
        estado: "activo",
      },
      {
        sku: "MOB-ATF-028",
        codigo: "ATF-001",
        nombre: "Aceite Transmisión ATF Dexron VI 1L",
        descripcion:
          "Aceite sintético para transmisiones automáticas Dexron VI, 1 litro",
        marca: brands["Mobil"],
        modelo: models["Aceite de Transmisión ATF"],
        categoria: categories["Lubricantes y Aceites"],
        unidad: units["Litro"],
        precioCosto: 9.5,
        precioVenta: 16.0,
        stockMinimo: 25,
        stockMaximo: 120,
        estado: "activo",
      },
      {
        sku: "MOB-AHD-029",
        codigo: "AHD-001",
        nombre: "Aceite Hidráulico Dirección 1L",
        descripcion:
          "Fluido hidráulico sintético para sistemas de dirección asistida, 1 litro",
        marca: brands["Mobil"],
        modelo: models["Aceite Hidráulico de Dirección"],
        categoria: categories["Lubricantes y Aceites"],
        unidad: units["Litro"],
        precioCosto: 7.0,
        precioVenta: 12.0,
        stockMinimo: 20,
        stockMaximo: 100,
        estado: "activo",
      },
      {
        sku: "MOB-AS5-030",
        codigo: "AS5-30-003",
        nombre: "Aceite Mobil Super 5W-30 Semi-Sint 1L",
        descripcion:
          "Aceite de motor semi-sintético Mobil Super 5W-30, 1 litro",
        marca: brands["Mobil"],
        modelo: models["Aceite Sintético 5W-30"],
        categoria: categories["Lubricantes y Aceites"],
        unidad: units["Litro"],
        precioCosto: 8.0,
        precioVenta: 14.0,
        stockMinimo: 35,
        stockMaximo: 180,
        estado: "activo",
      },
      {
        sku: "MOB-AS5-031",
        codigo: "AS5-30-004",
        nombre: "Aceite Mobil 1 0W-20 Sintético 1L",
        descripcion: "Aceite de motor 100% sintético Mobil 1 0W-20, 1 litro",
        marca: brands["Mobil"],
        modelo: models["Aceite Sintético 5W-30"],
        categoria: categories["Lubricantes y Aceites"],
        unidad: units["Litro"],
        precioCosto: 13.5,
        precioVenta: 22.0,
        stockMinimo: 25,
        stockMaximo: 120,
        estado: "activo",
      },
      {
        sku: "MOB-ATF-032",
        codigo: "ATF-002",
        nombre: "Aceite Transmisión ATF Mercon V 1L",
        descripcion:
          "Aceite sintético para transmisiones automáticas Ford Mercon V, 1 litro",
        marca: brands["Mobil"],
        modelo: models["Aceite de Transmisión ATF"],
        categoria: categories["Lubricantes y Aceites"],
        unidad: units["Litro"],
        precioCosto: 10.0,
        precioVenta: 17.0,
        stockMinimo: 20,
        stockMaximo: 100,
        estado: "activo",
      },
      {
        sku: "MOB-AS5-033",
        codigo: "AS5-40-001",
        nombre: "Aceite Mobil 1 5W-40 Sintético 1L",
        descripcion: "Aceite de motor 100% sintético Mobil 1 5W-40, 1 litro",
        marca: brands["Mobil"],
        modelo: models["Aceite Sintético 5W-30"],
        categoria: categories["Lubricantes y Aceites"],
        unidad: units["Litro"],
        precioCosto: 12.5,
        precioVenta: 21.0,
        stockMinimo: 25,
        stockMaximo: 130,
        estado: "activo",
      },
      {
        sku: "MOB-AS5-034",
        codigo: "AS5-30-005",
        nombre: "Aceite Mobil 1 5W-30 ESP Sintético 1L",
        descripcion:
          "Aceite de motor 100% sintético Mobil 1 ESP 5W-30 para motores diesel, 1 litro",
        marca: brands["Mobil"],
        modelo: models["Aceite Sintético 5W-30"],
        categoria: categories["Lubricantes y Aceites"],
        unidad: units["Litro"],
        precioCosto: 14.0,
        precioVenta: 23.0,
        stockMinimo: 20,
        stockMaximo: 100,
        estado: "activo",
      },
      {
        sku: "MOB-AHD-035",
        codigo: "AHD-002",
        nombre: "Aceite Hidráulico Dirección 500ml",
        descripcion:
          "Fluido hidráulico sintético para sistemas de dirección asistida, 500ml",
        marca: brands["Mobil"],
        modelo: models["Aceite Hidráulico de Dirección"],
        categoria: categories["Lubricantes y Aceites"],
        unidad: units["Botella"],
        precioCosto: 4.5,
        precioVenta: 8.0,
        stockMinimo: 30,
        stockMaximo: 150,
        estado: "activo",
      },
      {
        sku: "MOB-AS5-036",
        codigo: "AS10-30-001",
        nombre: "Aceite Mobil Super 10W-30 Mineral 1L",
        descripcion: "Aceite de motor mineral Mobil Super 10W-30, 1 litro",
        marca: brands["Mobil"],
        modelo: models["Aceite Sintético 5W-30"],
        categoria: categories["Lubricantes y Aceites"],
        unidad: units["Litro"],
        precioCosto: 5.5,
        precioVenta: 10.0,
        stockMinimo: 40,
        stockMaximo: 200,
        estado: "activo",
      },
      {
        sku: "MOB-ATF-037",
        codigo: "ATF-003",
        nombre: "Aceite Transmisión CVT NS-2 1L",
        descripcion:
          "Aceite sintético para transmisiones CVT Nissan NS-2, 1 litro",
        marca: brands["Mobil"],
        modelo: models["Aceite de Transmisión ATF"],
        categoria: categories["Lubricantes y Aceites"],
        unidad: units["Litro"],
        precioCosto: 11.0,
        precioVenta: 18.5,
        stockMinimo: 15,
        stockMaximo: 80,
        estado: "activo",
      },
      {
        sku: "MOB-AS5-038",
        codigo: "AS5-30-006",
        nombre: "Aceite Mobil 1 5W-30 Sintético 5L",
        descripcion:
          "Aceite de motor 100% sintético Mobil 1 5W-30, bidón 5 litros",
        marca: brands["Mobil"],
        modelo: models["Aceite Sintético 5W-30"],
        categoria: categories["Lubricantes y Aceites"],
        unidad: units["Bidón"],
        precioCosto: 55.0,
        precioVenta: 92.0,
        stockMinimo: 15,
        stockMaximo: 60,
        estado: "activo",
      },
      {
        sku: "MOB-ATF-039",
        codigo: "ATF-004",
        nombre: "Aceite Transmisión ATF Toyota WS 1L",
        descripcion:
          "Aceite sintético para transmisiones automáticas Toyota WS, 1 litro",
        marca: brands["Mobil"],
        modelo: models["Aceite de Transmisión ATF"],
        categoria: categories["Lubricantes y Aceites"],
        unidad: units["Litro"],
        precioCosto: 10.5,
        precioVenta: 17.5,
        stockMinimo: 18,
        stockMaximo: 90,
        estado: "activo",
      },
      {
        sku: "MOB-AS5-040",
        codigo: "AS0-20-001",
        nombre: "Aceite Mobil 1 0W-20 Sintético 4L",
        descripcion:
          "Aceite de motor 100% sintético Mobil 1 0W-20, garrafa 4 litros",
        marca: brands["Mobil"],
        modelo: models["Aceite Sintético 5W-30"],
        categoria: categories["Lubricantes y Aceites"],
        unidad: units["Galón"],
        precioCosto: 48.0,
        precioVenta: 80.0,
        stockMinimo: 15,
        stockMaximo: 70,
        estado: "activo",
      },

      // SUSPENSIÓN - Monroe (10 items)
      {
        sku: "MON-AGM-041",
        codigo: "AGM-001",
        nombre: "Amortiguador Gas Magnum Toyota Corolla Del",
        descripcion:
          "Amortiguador delantero gas magnum Toyota Corolla 2009-2019",
        marca: brands["Monroe"],
        modelo: models["Amortiguadores Gas Magnum"],
        categoria: categories["Suspensión y Dirección"],
        unidad: units["Unidad"],
        precioCosto: 45.0,
        precioVenta: 75.0,
        stockMinimo: 8,
        stockMaximo: 40,
        estado: "activo",
      },
      {
        sku: "MON-KSC-042",
        codigo: "KSC-001",
        nombre: "Kit Suspensión Completo Honda Civic",
        descripcion:
          "Kit completo de suspensión Honda Civic 2012-2021 (4 amortiguadores + accesorios)",
        marca: brands["Monroe"],
        modelo: models["Kit de Suspensión Completo"],
        categoria: categories["Suspensión y Dirección"],
        unidad: units["Kit"],
        precioCosto: 280.0,
        precioVenta: 450.0,
        stockMinimo: 2,
        stockMaximo: 10,
        estado: "activo",
      },
      {
        sku: "MON-SDQ-043",
        codigo: "SDQ-001",
        nombre: "Struts Delanteros Quick-Strut Mazda 3",
        descripcion:
          "Par de struts delanteros pre-ensamblados Mazda 3 2010-2018",
        marca: brands["Monroe"],
        modelo: models["Struts Delanteros Quick-Strut"],
        categoria: categories["Suspensión y Dirección"],
        unidad: units["Par"],
        precioCosto: 180.0,
        precioVenta: 300.0,
        stockMinimo: 4,
        stockMaximo: 20,
        estado: "activo",
      },
      {
        sku: "MON-AGM-044",
        codigo: "AGM-002",
        nombre: "Amortiguador Gas Magnum Nissan Sentra Tra",
        descripcion: "Amortiguador trasero gas magnum Nissan Sentra 2013-2020",
        marca: brands["Monroe"],
        modelo: models["Amortiguadores Gas Magnum"],
        categoria: categories["Suspensión y Dirección"],
        unidad: units["Unidad"],
        precioCosto: 38.0,
        precioVenta: 65.0,
        stockMinimo: 8,
        stockMaximo: 40,
        estado: "activo",
      },
      {
        sku: "MON-AGM-045",
        codigo: "AGM-003",
        nombre: "Amortiguador Gas Magnum Honda Accord Del",
        descripcion: "Amortiguador delantero gas magnum Honda Accord 2013-2022",
        marca: brands["Monroe"],
        modelo: models["Amortiguadores Gas Magnum"],
        categoria: categories["Suspensión y Dirección"],
        unidad: units["Unidad"],
        precioCosto: 52.0,
        precioVenta: 88.0,
        stockMinimo: 8,
        stockMaximo: 35,
        estado: "activo",
      },
      {
        sku: "MON-SDQ-046",
        codigo: "SDQ-002",
        nombre: "Struts Delanteros Quick-Strut Toyota Corolla",
        descripcion:
          "Par de struts delanteros pre-ensamblados Toyota Corolla 2009-2019",
        marca: brands["Monroe"],
        modelo: models["Struts Delanteros Quick-Strut"],
        categoria: categories["Suspensión y Dirección"],
        unidad: units["Par"],
        precioCosto: 175.0,
        precioVenta: 290.0,
        stockMinimo: 4,
        stockMaximo: 20,
        estado: "activo",
      },
      {
        sku: "MON-KSC-047",
        codigo: "KSC-002",
        nombre: "Kit Suspensión Completo Nissan Sentra",
        descripcion:
          "Kit completo de suspensión Nissan Sentra 2013-2019 (4 amortiguadores + accesorios)",
        marca: brands["Monroe"],
        modelo: models["Kit de Suspensión Completo"],
        categoria: categories["Suspensión y Dirección"],
        unidad: units["Kit"],
        precioCosto: 260.0,
        precioVenta: 430.0,
        stockMinimo: 2,
        stockMaximo: 10,
        estado: "activo",
      },
      {
        sku: "MON-AGM-048",
        codigo: "AGM-004",
        nombre: "Amortiguador Gas Magnum Mazda 3 Del",
        descripcion: "Amortiguador delantero gas magnum Mazda 3 2010-2018",
        marca: brands["Monroe"],
        modelo: models["Amortiguadores Gas Magnum"],
        categoria: categories["Suspensión y Dirección"],
        unidad: units["Unidad"],
        precioCosto: 47.0,
        precioVenta: 78.0,
        stockMinimo: 8,
        stockMaximo: 40,
        estado: "activo",
      },
      {
        sku: "MON-SDQ-049",
        codigo: "SDQ-003",
        nombre: "Struts Delanteros Quick-Strut Honda Accord",
        descripcion:
          "Par de struts delanteros pre-ensamblados Honda Accord 2013-2017",
        marca: brands["Monroe"],
        modelo: models["Struts Delanteros Quick-Strut"],
        categoria: categories["Suspensión y Dirección"],
        unidad: units["Par"],
        precioCosto: 195.0,
        precioVenta: 320.0,
        stockMinimo: 4,
        stockMaximo: 18,
        estado: "activo",
      },
      {
        sku: "MON-KSC-050",
        codigo: "KSC-003",
        nombre: "Kit Suspensión Completo Mazda 6",
        descripcion:
          "Kit completo de suspensión Mazda 6 2014-2021 (4 amortiguadores + accesorios)",
        marca: brands["Monroe"],
        modelo: models["Kit de Suspensión Completo"],
        categoria: categories["Suspensión y Dirección"],
        unidad: units["Kit"],
        precioCosto: 290.0,
        precioVenta: 475.0,
        stockMinimo: 2,
        stockMaximo: 8,
        estado: "activo",
      },
    ];

    const createdItems = [];
    const errors = [];
    let skipped = 0;

    console.log(`\n📦 Creando ${itemsToCreate.length} items...\n`);

    for (let i = 0; i < itemsToCreate.length; i++) {
      const itemData = itemsToCreate[i];

      // Mostrar progreso cada 5 items
      if ((i + 1) % 5 === 0 || i === 0) {
        console.log(
          `\n🔧 Progreso: ${i + 1}/${itemsToCreate.length} - ${itemData.nombre.substring(0, 40)}...`
        );
      }

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
        itemData
      );

      if (createResponse.statusCode === 201) {
        const item = createResponse.data;
        createdItems.push(item);
        console.log(`   ✅ Item creado - SKU: ${itemData.sku}`);
      } else {
        const errorMsg =
          createResponse.data.message ||
          createResponse.data.msg ||
          "Error desconocido";

        if (
          errorMsg.includes("duplicate") ||
          errorMsg.includes("ya existe") ||
          errorMsg.includes("unique")
        ) {
          console.log(`   ⚠️  Item ya existe - SKU: ${itemData.sku}`);
          skipped++;
        } else {
          console.log(`   ❌ Error - SKU: ${itemData.sku}: ${errorMsg}`);
          errors.push({ item: itemData.sku, error: errorMsg });
        }
      }
    }

    // ============================================
    // PASO 5: VERIFICAR ITEMS CON POBLACIÓN
    // ============================================
    console.log("\n\n📊 PASO 5: Verificar items con población de referencias");
    console.log("-".repeat(50));

    const finalItemsResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/items",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (finalItemsResponse.statusCode === 200) {
      const allItems = finalItemsResponse.data.items || [];
      console.log(
        `\n✅ Total de items en la base de datos: ${allItems.length}\n`
      );

      // Verificar población de referencias
      console.log("🔍 VERIFICACIÓN DE POBLACIÓN DE REFERENCIAS:");
      console.log("-".repeat(80));

      let itemsWithBrand = 0;
      let itemsWithModel = 0;
      let itemsWithCategory = 0;
      let itemsWithUnit = 0;

      allItems.forEach((item) => {
        if (item.marca && typeof item.marca === "object" && item.marca.nombre)
          itemsWithBrand++;
        if (
          item.modelo &&
          typeof item.modelo === "object" &&
          item.modelo.nombre
        )
          itemsWithModel++;
        if (
          item.categoria &&
          typeof item.categoria === "object" &&
          item.categoria.nombre
        )
          itemsWithCategory++;
        if (
          item.unidad &&
          typeof item.unidad === "object" &&
          item.unidad.nombre
        )
          itemsWithUnit++;
      });

      console.log(
        `✅ Items con Marca poblada:     ${itemsWithBrand}/${allItems.length}`
      );
      console.log(
        `✅ Items con Modelo poblado:    ${itemsWithModel}/${allItems.length}`
      );
      console.log(
        `✅ Items con Categoría poblada: ${itemsWithCategory}/${allItems.length}`
      );
      console.log(
        `✅ Items con Unidad poblada:    ${itemsWithUnit}/${allItems.length}`
      );

      // Mostrar muestra de items con referencias pobladas
      console.log(
        "\n📋 MUESTRA DE ITEMS CON REFERENCIAS POBLADAS (primeros 5):"
      );
      console.log("-".repeat(120));
      console.log(
        "SKU           | Nombre                          | Marca        | Modelo                  | Categoría           | Unidad"
      );
      console.log("-".repeat(120));

      allItems.slice(0, 5).forEach((item) => {
        const sku = (item.sku || "N/A").padEnd(13);
        const nombre = (item.nombre || "N/A").substring(0, 30).padEnd(31);
        const marca = (item.marca?.nombre || "N/A").substring(0, 11).padEnd(12);
        const modelo = (item.modelo?.nombre || "N/A")
          .substring(0, 22)
          .padEnd(23);
        const categoria = (item.categoria?.nombre || "N/A")
          .substring(0, 18)
          .padEnd(19);
        const unidad = (item.unidad?.nombre || "N/A").padEnd(10);

        console.log(
          `${sku} | ${nombre} | ${marca} | ${modelo} | ${categoria} | ${unidad}`
        );
      });
      console.log("-".repeat(120));
    }

    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log("\n" + "=".repeat(80));
    console.log("📊 RESUMEN DEL TEST");
    console.log("=".repeat(80));

    console.log(
      `\n✅ Items nuevos creados: ${createdItems.length} de ${itemsToCreate.length}`
    );
    console.log(`⚠️  Items omitidos (ya existen): ${skipped}`);
    console.log(`❌ Errores: ${errors.length}`);

    if (createdItems.length > 0) {
      console.log("\n📦 DISTRIBUCIÓN POR CATEGORÍA:");

      const itemsByCategory = {};
      itemsToCreate.slice(0, createdItems.length).forEach((item) => {
        const catName =
          Object.keys(categories).find(
            (key) => categories[key] === item.categoria
          ) || "Sin categoría";
        if (!itemsByCategory[catName]) itemsByCategory[catName] = 0;
        itemsByCategory[catName]++;
      });

      Object.keys(itemsByCategory)
        .sort()
        .forEach((catName) => {
          console.log(
            `  • ${catName.padEnd(30)}: ${itemsByCategory[catName]} items`
          );
        });

      console.log("\n🏷️  DISTRIBUCIÓN POR MARCA:");

      const itemsByBrand = {};
      itemsToCreate.slice(0, createdItems.length).forEach((item) => {
        const brandName =
          Object.keys(brands).find((key) => brands[key] === item.marca) ||
          "Sin marca";
        if (!itemsByBrand[brandName]) itemsByBrand[brandName] = 0;
        itemsByBrand[brandName]++;
      });

      Object.keys(itemsByBrand)
        .sort()
        .forEach((brandName) => {
          console.log(
            `  • ${brandName.padEnd(20)}: ${itemsByBrand[brandName]} items`
          );
        });
    }

    if (errors.length > 0) {
      console.log(`\n⚠️  ERRORES ENCONTRADOS:`);
      errors.forEach((err, index) => {
        console.log(`  ${index + 1}. ${err.item}: ${err.error}`);
      });
    }

    console.log("\n💡 Items creados con éxito:");
    console.log("   • SKU único para cada producto");
    console.log("   • Código interno para identificación rápida");
    console.log("   • Referencias pobladas (marca, modelo, categoría, unidad)");
    console.log("   • Precios de costo y venta configurados");
    console.log("   • Stock mínimo y máximo definidos");

    console.log("\n🎉 TEST DE ITEMS COMPLETADO");
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
  console.log(
    "🧪 TEST: Modelo Item - Crear Items de Inventario con Referencias"
  );
  console.log("=".repeat(80));
  console.log("📍 Servidor: http://localhost:4000");
  console.log("📍 Asegúrate de que el servidor esté corriendo\n");
  console.log("⚠️  IMPORTANTE: Este test requiere datos previos:");
  console.log("   - Marcas (brand.test.js)");
  console.log("   - Modelos (model.test.js)");
  console.log("   - Categorías (category.test.js)");
  console.log("   - Unidades (unit.test.js)");
  console.log("=".repeat(80) + "\n");

  testItems();
}

module.exports = { testItems };
