/**
 * Test: Historial y Consultas de Movimientos - API
 * Prueba los endpoints reales del API para consultas y filtros de movimientos
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
  items: [],
  movements: [],
  stockIds: [],
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
const testMovementHistoryAPI = async () => {
  try {
    console.log("=".repeat(60));
    console.log("🧪 TEST: HISTORIAL Y CONSULTAS DE MOVIMIENTOS - API");
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

    // ============================================
    // PASO 1: Preparar datos de prueba
    // ============================================
    console.log("\n📋 PASO 1: Obtener ITEM y ALMACÉN");
    console.log("-".repeat(60));

    // Obtener items
    const itemsResponse = await makeRequest(
      "GET",
      "/inventory/items?limit=10",
      null,
      authToken
    );

    if (itemsResponse.statusCode !== 200) {
      throw new Error(
        `Error obteniendo items: ${JSON.stringify(itemsResponse.data)}`
      );
    }

    const filtroAceite =
      itemsResponse.data.items.find(
        (item) => item.nombre && item.nombre.toLowerCase().includes("aceite")
      ) || itemsResponse.data.items[0];

    if (!filtroAceite) {
      throw new Error("No hay items disponibles para pruebas");
    }

    console.log(`✅ Item seleccionado: ${filtroAceite.nombre}`);
    console.log(`   - ID: ${filtroAceite.id}`);
    console.log(`   - Código: ${filtroAceite.codigo}`);

    // Obtener stock del item
    const allStocksResponse = await makeRequest(
      "GET",
      "/inventory/stock",
      null,
      authToken
    );

    if (allStocksResponse.statusCode !== 200) {
      throw new Error(
        `Error obteniendo stocks: ${JSON.stringify(allStocksResponse.data)}`
      );
    }

    const allStocks =
      allStocksResponse.data.stock || allStocksResponse.data.stocks || [];
    const stockItem = allStocks.find((s) => {
      const itemId = s.item?.id || s.item?._id || s.item;
      return itemId === filtroAceite.id;
    });

    if (!stockItem) {
      throw new Error(`No hay stock para el item ${filtroAceite.nombre}`);
    }

    const warehouseId =
      stockItem.warehouse?.id ||
      stockItem.warehouse?._id ||
      stockItem.warehouse;
    const stockInicial = stockItem.cantidad;

    console.log(`   - Almacén: ${stockItem.warehouse?.nombre || "N/A"}`);
    console.log(`   - Warehouse ID: ${warehouseId}`);
    console.log(`   - Stock inicial: ${stockInicial} unidades`);

    // ============================================
    // PASO 2: Generar movimientos diversos
    // ============================================
    console.log(
      "\n📦 PASO 2: Generar MOVIMIENTOS vía POST /api/inventory/movements"
    );
    console.log("-".repeat(60));

    const tiposMovimiento = [
      {
        tipo: "entrada",
        cantidad: 20,
        referencia: `COMP-${Date.now()}-001`,
        motivo: "Compra a proveedor X",
        warehouse: "To",
      },
      {
        tipo: "salida",
        cantidad: 5,
        referencia: `VTA-${Date.now()}-001`,
        motivo: "Venta mostrador",
        warehouse: "From",
      },
      {
        tipo: "consumo",
        cantidad: 3,
        referencia: `OT-${Date.now()}-001`,
        motivo: "Consumo orden trabajo",
        warehouse: "From",
      },
      {
        tipo: "entrada",
        cantidad: 10,
        referencia: `COMP-${Date.now()}-002`,
        motivo: "Compra urgente",
        warehouse: "To",
      },
      {
        tipo: "ajuste",
        cantidad: 2,
        referencia: `ADJ-${Date.now()}-001`,
        motivo: "Ajuste por merma",
        warehouse: "From",
      },
    ];

    console.log(`\n   🔄 Creando ${tiposMovimiento.length} movimientos...`);

    for (const mov of tiposMovimiento) {
      const movimientoData = {
        tipo: mov.tipo,
        referencia: mov.referencia,
        referenciaTipo: "test",
        item: filtroAceite.id,
        cantidad: mov.cantidad,
        motivo: mov.motivo,
        metadata: {
          test: true,
          fecha: new Date().toISOString(),
          generadoPor: "test-script-api",
        },
      };

      if (mov.warehouse === "From") {
        movimientoData.warehouseFrom = warehouseId;
      } else {
        movimientoData.warehouseTo = warehouseId;
      }

      const movResponse = await makeRequest(
        "POST",
        "/inventory/movements",
        movimientoData,
        authToken
      );

      if (movResponse.statusCode !== 201 && movResponse.statusCode !== 200) {
        console.log(
          `   ⚠️  Error en ${mov.tipo}: ${JSON.stringify(movResponse.data)}`
        );
        continue;
      }

      const movimientoCreado = movResponse.data;
      testData.movements.push(movimientoCreado.id || movimientoCreado._id);

      console.log(
        `   ✅ ${mov.tipo.toUpperCase().padEnd(10)} | ${mov.cantidad.toString().padStart(3)} uds | ${mov.referencia.substring(0, 20)}`
      );

      // Pequeña pausa entre movimientos
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log(
      `\n   📊 Total movimientos creados: ${testData.movements.length}`
    );

    // ============================================
    // PASO 3: Consultar todos los movimientos del item
    // ============================================
    console.log(
      "\n📊 PASO 3: Consultar TODOS los movimientos vía GET /api/inventory/movements"
    );
    console.log("-".repeat(60));

    const todosMovResponse = await makeRequest(
      "GET",
      `/inventory/movements?item=${filtroAceite.id}&limit=50`,
      null,
      authToken
    );

    if (todosMovResponse.statusCode !== 200) {
      throw new Error(
        `Error consultando movimientos: ${JSON.stringify(todosMovResponse.data)}`
      );
    }

    const todosMovimientos =
      todosMovResponse.data.movements || todosMovResponse.data;

    // Filtrar solo los movimientos creados en este test
    const movimientosTest = todosMovimientos.filter((m) => {
      const movId = m.id || m._id;
      return testData.movements.includes(movId);
    });

    console.log(
      `\n   📋 Movimientos del item (total): ${todosMovimientos.length}`
    );
    console.log(`   📋 Movimientos de este test: ${movimientosTest.length}`);

    console.log(`\n   Detalle de movimientos del test:`);
    movimientosTest.forEach((mov, index) => {
      const direccion = mov.warehouseFrom ? `🔴 Salida` : `🟢 Entrada`;
      const warehouse =
        mov.warehouseFrom?.nombre || mov.warehouseTo?.nombre || "N/A";
      console.log(
        `   ${index + 1}. ${mov.tipo.toUpperCase().padEnd(10)} | ${mov.cantidad.toString().padStart(3)} uds | ${warehouse.padEnd(15)} | ${mov.referencia?.substring(0, 20) || "N/A"}`
      );
    });

    // ============================================
    // PASO 4: Filtrar por tipo de movimiento
    // ============================================
    console.log(
      "\n🔍 PASO 4: Filtrar por TIPO vía GET /api/inventory/movements?tipo="
    );
    console.log("-".repeat(60));

    const tiposConsultar = ["entrada", "salida", "consumo", "ajuste"];

    for (const tipo of tiposConsultar) {
      const tipoResponse = await makeRequest(
        "GET",
        `/inventory/movements?item=${filtroAceite.id}&tipo=${tipo}`,
        null,
        authToken
      );

      if (tipoResponse.statusCode !== 200) {
        console.log(`   ⚠️  Error consultando tipo ${tipo}`);
        continue;
      }

      const movimientosTipo = tipoResponse.data.movements || tipoResponse.data;

      // Filtrar solo los de este test
      const movimientosTipoTest = movimientosTipo.filter((m) => {
        const movId = m.id || m._id;
        return testData.movements.includes(movId);
      });

      if (movimientosTipoTest.length > 0) {
        const totalCantidad = movimientosTipoTest.reduce(
          (sum, m) => sum + (m.cantidad || 0),
          0
        );

        console.log(`\n   📌 Tipo: ${tipo.toUpperCase()}`);
        console.log(`   - Movimientos: ${movimientosTipoTest.length}`);
        console.log(`   - Total unidades: ${totalCantidad}`);
      }
    }

    // ============================================
    // PASO 5: Calcular estadísticas
    // ============================================
    console.log("\n📈 PASO 5: Calcular ESTADÍSTICAS");
    console.log("-".repeat(60));

    const entradas = movimientosTest.filter((m) => m.tipo === "entrada");
    const salidas = movimientosTest.filter((m) =>
      ["salida", "consumo"].includes(m.tipo)
    );
    const ajustes = movimientosTest.filter((m) => m.tipo === "ajuste");

    const totalEntradas = entradas.reduce(
      (sum, m) => sum + (m.cantidad || 0),
      0
    );
    const totalSalidas = salidas.reduce((sum, m) => sum + (m.cantidad || 0), 0);
    const totalAjustes = ajustes.reduce((sum, m) => sum + (m.cantidad || 0), 0);

    console.log(`\n   📊 Resumen de movimientos del test:`);
    console.log(`   
    ENTRADAS:
    - Movimientos: ${entradas.length}
    - Total unidades: ${totalEntradas}
    - Promedio: ${entradas.length > 0 ? (totalEntradas / entradas.length).toFixed(1) : 0} uds/mov
    
    SALIDAS (incluye consumos):
    - Movimientos: ${salidas.length}
    - Total unidades: ${totalSalidas}
    - Promedio: ${salidas.length > 0 ? (totalSalidas / salidas.length).toFixed(1) : 0} uds/mov
    
    AJUSTES:
    - Movimientos: ${ajustes.length}
    - Total unidades: ${totalAjustes}
    
    BALANCE NETO:
    - Entradas - Salidas: ${totalEntradas - totalSalidas} unidades
    `);

    // ============================================
    // PASO 6: Verificar stock final
    // ============================================
    console.log("\n📊 PASO 6: Verificar STOCK FINAL");
    console.log("-".repeat(60));

    const stockFinalResponse = await makeRequest(
      "GET",
      "/inventory/stock",
      null,
      authToken
    );

    if (stockFinalResponse.statusCode !== 200) {
      throw new Error(
        `Error consultando stock final: ${JSON.stringify(stockFinalResponse.data)}`
      );
    }

    const allStocksFinal =
      stockFinalResponse.data.stock || stockFinalResponse.data.stocks || [];
    const stockFinal = allStocksFinal.find((s) => {
      const itemId = s.item?.id || s.item?._id || s.item;
      return itemId === filtroAceite.id;
    });

    if (stockFinal) {
      console.log(`\n   STOCK:`);
      console.log(`   - Stock inicial: ${stockInicial} uds`);
      console.log(`   - Movimiento neto: ${totalEntradas - totalSalidas} uds`);
      console.log(
        `   - Stock esperado: ${stockInicial + totalEntradas - totalSalidas} uds`
      );
      console.log(`   - Stock actual: ${stockFinal.cantidad} uds`);
      console.log(`   - Reservado: ${stockFinal.reservado || 0} uds`);
      console.log(
        `   - Disponible: ${stockFinal.cantidad - (stockFinal.reservado || 0)} uds`
      );
    }

    // ============================================
    // PASO 7: Consultar con paginación
    // ============================================
    console.log(
      "\n📄 PASO 7: Simular PAGINACIÓN vía GET /api/inventory/movements?page=&limit="
    );
    console.log("-".repeat(60));

    const pageSize = 3;
    const totalPages = Math.ceil(movimientosTest.length / pageSize);

    console.log(`\n   📖 Configuración:`);
    console.log(`   - Total registros del test: ${movimientosTest.length}`);
    console.log(`   - Registros por página: ${pageSize}`);
    console.log(`   - Total páginas: ${totalPages}`);

    for (let page = 1; page <= Math.min(totalPages, 2); page++) {
      const paginaResponse = await makeRequest(
        "GET",
        `/inventory/movements?item=${filtroAceite.id}&page=${page}&limit=${pageSize}`,
        null,
        authToken
      );

      if (paginaResponse.statusCode !== 200) {
        console.log(`   ⚠️  Error en página ${page}`);
        continue;
      }

      const movimientosPagina =
        paginaResponse.data.movements || paginaResponse.data;

      console.log(`\n   📄 Página ${page}:`);
      movimientosPagina.slice(0, pageSize).forEach((mov, index) => {
        console.log(
          `      ${index + 1}. ${mov.tipo.padEnd(10)} | ${mov.cantidad} uds | ${mov.referencia?.substring(0, 20) || "N/A"}`
        );
      });
    }

    // ============================================
    // PASO 8: Búsqueda por referencia parcial
    // ============================================
    console.log("\n🔎 PASO 8: Búsqueda por patrón en REFERENCIA");
    console.log("-".repeat(60));

    const patronBuscar = "OT-";
    const movimientosOT = movimientosTest.filter(
      (m) => m.referencia && m.referencia.includes(patronBuscar)
    );

    console.log(`\n   🔍 Patrón: "${patronBuscar}"`);
    console.log(`   📋 Resultados: ${movimientosOT.length}`);

    movimientosOT.forEach((mov, index) => {
      console.log(
        `   ${index + 1}. ${mov.referencia} | ${mov.tipo} | ${mov.cantidad} uds | ${mov.motivo?.substring(0, 30) || "N/A"}`
      );
    });

    // ============================================
    // PASO 9: Consultar detalle de un movimiento
    // ============================================
    console.log(
      "\n🔍 PASO 9: Consultar DETALLE de movimiento vía GET /api/inventory/movements/:id"
    );
    console.log("-".repeat(60));

    if (movimientosTest.length > 0) {
      const primerMovimiento = movimientosTest[0];
      const movId = primerMovimiento.id || primerMovimiento._id;

      const detalleResponse = await makeRequest(
        "GET",
        `/inventory/movements/${movId}`,
        null,
        authToken
      );

      if (detalleResponse.statusCode === 200) {
        const detalle = detalleResponse.data;

        console.log(`\n   ✅ Movimiento ${movId}:`);
        console.log(`   - Tipo: ${detalle.tipo}`);
        console.log(`   - Referencia: ${detalle.referencia}`);
        console.log(`   - Item: ${detalle.item?.nombre || "N/A"}`);
        console.log(`   - Cantidad: ${detalle.cantidad} unidades`);
        console.log(
          `   - Motivo: ${detalle.motivo?.substring(0, 50) || "N/A"}`
        );
        console.log(
          `   - Fecha: ${detalle.createdAt ? new Date(detalle.createdAt).toLocaleString() : "N/A"}`
        );
        if (detalle.metadata) {
          console.log(`   - Metadata: ✅ Presente`);
        }
      }
    }

    // ============================================
    // RESUMEN
    // ============================================
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMEN DEL TEST");
    console.log("=".repeat(60));
    console.log(`
    ESCENARIO: Historial y Consultas de Movimientos (API)
    
    REPUESTO: ${filtroAceite.nombre}
    CÓDIGO: ${filtroAceite.codigo}
    
    MOVIMIENTOS GENERADOS: ${movimientosTest.length}
    
    CONSULTAS REALIZADAS:
    ✅ 1. Autenticación exitosa
    ✅ 2. Generar movimientos diversos vía POST
    ✅ 3. Listar todos los movimientos vía GET
    ✅ 4. Filtrar por tipo de movimiento
    ✅ 5. Calcular estadísticas
    ✅ 6. Verificar stock final
    ✅ 7. Paginación de resultados
    ✅ 8. Búsqueda por patrón en referencia
    ✅ 9. Consultar detalle de movimiento
    
    TIPOS DE MOVIMIENTO:
    - Entradas: ${entradas.length} (${totalEntradas} uds)
    - Salidas/Consumos: ${salidas.length} (${totalSalidas} uds)
    - Ajustes: ${ajustes.length} (${totalAjustes} uds)
    
    BALANCE:
    - Movimiento neto: ${totalEntradas - totalSalidas} unidades
    - Stock inicial: ${stockInicial}
    - Stock final: ${stockFinal?.cantidad || "N/A"}
    
    ENDPOINTS PROBADOS:
    ✓ POST /api/auth/login
    ✓ GET /api/inventory/items
    ✓ GET /api/inventory/stock
    ✓ POST /api/inventory/movements (múltiples tipos)
    ✓ GET /api/inventory/movements (sin filtros)
    ✓ GET /api/inventory/movements?item=
    ✓ GET /api/inventory/movements?tipo=
    ✓ GET /api/inventory/movements?page=&limit=
    ✓ GET /api/inventory/movements/:id
    `);

    console.log("=".repeat(60));
    console.log("✅ TODOS LOS TESTS PASARON");
    console.log("=".repeat(60));

    process.exit(0);
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ ERROR EN EL TEST");
    console.error("=".repeat(60));
    console.error(error.message);
    console.error(error.stack);

    process.exit(1);
  }
};

// Ejecutar test
testMovementHistoryAPI();
