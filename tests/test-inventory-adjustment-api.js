/**
 * Test: Ajuste de Inventario - API
 * Prueba los endpoints reales del API para ajustes de stock y movimientos
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
  warehouses: [],
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
const testInventoryAdjustmentAPI = async () => {
  try {
    console.log("=".repeat(60));
    console.log("🧪 TEST: AJUSTE DE INVENTARIO - API");
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
    // PASO 1: Obtener un repuesto existente
    // ============================================
    console.log("\n📋 PASO 1: Obtener repuesto para auditoría");
    console.log("-".repeat(60));

    const itemsResponse = await makeRequest(
      "GET",
      "/inventory/items?limit=5",
      null,
      authToken
    );

    if (
      itemsResponse.statusCode !== 200 ||
      !itemsResponse.data.items ||
      itemsResponse.data.items.length === 0
    ) {
      throw new Error("No hay items disponibles. Ejecuta el seeder primero.");
    }

    // Buscar item que comience con "Batería 12V 60Ah" que sí tiene stock
    let bateria = itemsResponse.data.items.find(
      (item) => item.nombre && item.nombre.includes("Batería 12V 60Ah")
    );

    // Si no, buscar cualquier batería
    if (!bateria) {
      bateria = itemsResponse.data.items.find(
        (item) => item.nombre && item.nombre.toLowerCase().includes("bater")
      );
    }

    // Si no, usar el primero
    if (!bateria) {
      bateria = itemsResponse.data.items[0];
    }

    if (!bateria || !bateria.id) {
      throw new Error(`Item no tiene ID válido: ${JSON.stringify(bateria)}`);
    }

    console.log(`✅ Repuesto seleccionado: ${bateria.nombre}`);
    console.log(`   - ID: ${bateria.id}`);
    console.log(`   - Código: ${bateria.codigo}`);

    // ============================================
    // PASO 2: Obtener stock actual del item
    // ============================================
    console.log("\n📦 PASO 2: Consultar STOCK actual");
    console.log("-".repeat(60));

    // Primero obtener TODOS los stocks para ver cuál corresponde al item
    const allStocksResponse = await makeRequest(
      "GET",
      `/inventory/stock`,
      null,
      authToken
    );

    if (allStocksResponse.statusCode !== 200) {
      throw new Error(
        `Error consultando stocks: ${JSON.stringify(allStocksResponse.data)}`
      );
    }

    const allStocks =
      allStocksResponse.data.stock ||
      allStocksResponse.data.stocks ||
      allStocksResponse.data;

    // Buscar stock que corresponda al item seleccionado
    const stockActual = allStocks.find((s) => {
      const itemId = s.item?.id || s.item?._id || s.item;
      return itemId === bateria.id;
    });

    if (!stockActual) {
      throw new Error(
        `No hay stock registrado para el item ${bateria.nombre} (${bateria.id})`
      );
    }
    const stockSistema = stockActual.cantidad;
    const warehouseId =
      stockActual.warehouse?.id ||
      stockActual.warehouse?._id ||
      stockActual.warehouse;
    const stockId = stockActual.id || stockActual._id;

    console.log(`✅ Stock consultado:`);
    console.log(`   - ID Stock: ${stockId}`);
    console.log(
      `   - Almacén: ${stockActual.warehouse?.nombre || warehouseId}`
    );
    console.log(`   - Warehouse ID: ${warehouseId}`);
    console.log(`   - Stock en sistema: ${stockSistema} unidades`);

    testData.stockIds.push(stockId);

    // ============================================
    // PASO 3: Simular conteo físico
    // ============================================
    console.log("\n🔍 PASO 3: Simular CONTEO FÍSICO");
    console.log("-".repeat(60));

    const stockFisico = stockSistema - 2; // Simular faltante de 2 unidades
    const diferencia = stockFisico - stockSistema;

    console.log(`   👤 Auditor realizó conteo:`);
    console.log(`   - Stock en sistema: ${stockSistema} unidades`);
    console.log(`   - Stock físico contado: ${stockFisico} unidades`);
    console.log(`   - Diferencia: ${diferencia} unidades`);
    console.log(`   - Tipo: ${diferencia < 0 ? "❌ FALTANTE" : "✅ SOBRANTE"}`);

    // ============================================
    // PASO 4: Registrar ajuste NEGATIVO (faltante)
    // ============================================
    console.log(
      "\n🔧 PASO 4: Registrar AJUSTE NEGATIVO vía POST /api/inventory/movements"
    );
    console.log("-".repeat(60));

    const movimientoAjusteData = {
      tipo: "ajuste",
      referencia: `ADJ-AUD-${Date.now()}`,
      referenciaTipo: "auditoria",
      item: bateria.id,
      cantidad: Math.abs(diferencia),
      warehouseFrom: warehouseId,
      motivo: `Ajuste por diferencia en auditoría física. Stock sistema: ${stockSistema}, Stock físico: ${stockFisico}`,
      metadata: {
        tipoAjuste: "faltante",
        stockAnterior: stockSistema,
        stockFisico: stockFisico,
        diferencia: diferencia,
        auditor: "TEST-AUDITOR",
        fechaAuditoria: new Date().toISOString(),
        motivoDetallado: "Posible merma, extravío o error de registro previo",
      },
    };

    const ajusteResponse = await makeRequest(
      "POST",
      "/inventory/movements",
      movimientoAjusteData,
      authToken
    );

    if (
      ajusteResponse.statusCode !== 201 &&
      ajusteResponse.statusCode !== 200
    ) {
      throw new Error(
        `Error registrando ajuste: ${JSON.stringify(ajusteResponse.data)}`
      );
    }

    const movimientoAjuste = ajusteResponse.data;
    testData.movements.push(movimientoAjuste);

    console.log(`✅ Ajuste negativo registrado:`);
    console.log(
      `   - Movimiento ID: ${movimientoAjuste._id || movimientoAjuste.id}`
    );
    console.log(`   - Tipo: ${movimientoAjuste.tipo}`);
    console.log(`   - Referencia: ${movimientoAjuste.referencia}`);
    console.log(`   - Cantidad ajustada: -${Math.abs(diferencia)} unidades`);
    console.log(
      `   - Resultado stock: ${JSON.stringify(movimientoAjuste.resultadoStock || "N/A")}`
    );

    // Pausa para asegurar que el stock se actualice
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // ============================================
    // PASO 5: Verificar stock corregido
    // ============================================
    console.log(
      "\n📊 PASO 5: Verificar STOCK CORREGIDO vía GET /api/inventory/stock/:id"
    );
    console.log("-".repeat(60));

    // Consultar stock directamente por ID
    const stockCorregidoResponse = await makeRequest(
      "GET",
      `/inventory/stock/${stockId}`,
      null,
      authToken
    );

    if (stockCorregidoResponse.statusCode !== 200) {
      throw new Error(
        `Error consultando stock corregido: ${JSON.stringify(stockCorregidoResponse.data)}`
      );
    }

    const stockCorregido = stockCorregidoResponse.data;

    console.log(`\n   📦 Comparación de Stock:`);
    console.log(`   - Stock antes del ajuste: ${stockSistema}`);
    console.log(`   - Stock físico contado: ${stockFisico}`);
    console.log(`   - Stock después del ajuste: ${stockCorregido.cantidad}`);

    const ajusteCorrecto = stockCorregido.cantidad === stockFisico;
    if (!ajusteCorrecto) {
      throw new Error(
        `Stock no coincide. Esperado: ${stockFisico}, Actual: ${stockCorregido.cantidad}`
      );
    }

    console.log(`\n   ✅ Stock corregido y coincide con conteo físico`);

    // ============================================
    // PASO 6: Simular ajuste POSITIVO (sobrante)
    // ============================================
    console.log("\n📦 PASO 6: Simular AJUSTE POSITIVO (sobrante)");
    console.log("-".repeat(60));

    const stockActualizado = stockCorregido.cantidad;
    const stockFisicoNuevo = stockActualizado + 3; // Encontrar 3 unidades más
    const diferenciaPositiva = stockFisicoNuevo - stockActualizado;

    console.log(`   👤 Auditor encontró unidades adicionales:`);
    console.log(`   - Stock en sistema: ${stockActualizado} unidades`);
    console.log(`   - Stock físico encontrado: ${stockFisicoNuevo} unidades`);
    console.log(`   - Sobrante: +${diferenciaPositiva} unidades`);

    const ajustePositivoData = {
      tipo: "ajuste",
      referencia: `ADJ-SOB-${Date.now()}`,
      referenciaTipo: "auditoria",
      item: bateria.id,
      cantidad: diferenciaPositiva,
      warehouseTo: warehouseId,
      motivo: `Ajuste positivo: unidades encontradas no registradas. Stock sistema: ${stockActualizado}, Stock físico: ${stockFisicoNuevo}`,
      metadata: {
        tipoAjuste: "sobrante",
        stockAnterior: stockActualizado,
        stockFisico: stockFisicoNuevo,
        diferencia: diferenciaPositiva,
        auditor: "TEST-AUDITOR",
        fechaAuditoria: new Date().toISOString(),
        motivoDetallado: "Unidades no registradas en entregas anteriores",
      },
    };

    const ajustePositivoResponse = await makeRequest(
      "POST",
      "/inventory/movements",
      ajustePositivoData,
      authToken
    );

    if (
      ajustePositivoResponse.statusCode !== 201 &&
      ajustePositivoResponse.statusCode !== 200
    ) {
      throw new Error(
        `Error registrando ajuste positivo: ${JSON.stringify(ajustePositivoResponse.data)}`
      );
    }

    const movimientoAjustePositivo = ajustePositivoResponse.data;
    testData.movements.push(movimientoAjustePositivo);

    console.log(`\n✅ Ajuste positivo registrado:`);
    console.log(`   - Movimiento ID: ${movimientoAjustePositivo._id}`);
    console.log(`   - Cantidad ajustada: +${diferenciaPositiva} unidades`);

    // ============================================
    // PASO 7: Verificar stock final
    // ============================================
    console.log("\n✔️  PASO 7: Verificar STOCK FINAL");
    console.log("-".repeat(60));

    const stockFinalResponse = await makeRequest(
      "GET",
      `/inventory/stock/${stockId}`,
      null,
      authToken
    );

    if (stockFinalResponse.statusCode !== 200) {
      throw new Error(
        `Error consultando stock final: ${JSON.stringify(stockFinalResponse.data)}`
      );
    }

    const stockFinal = stockFinalResponse.data;

    console.log(`   - Stock final: ${stockFinal.cantidad} unidades`);

    const stockFinalCorrecto = stockFinal.cantidad === stockFisicoNuevo;
    if (!stockFinalCorrecto) {
      throw new Error(
        `Stock final no coincide. Esperado: ${stockFisicoNuevo}, Actual: ${stockFinal.cantidad}`
      );
    }

    console.log(`   ✅ Stock final coincide con último conteo físico`);

    // ============================================
    // PASO 8: Historial de ajustes
    // ============================================
    console.log(
      "\n📝 PASO 8: Consultar HISTORIAL de ajustes vía GET /api/inventory/movements"
    );
    console.log("-".repeat(60));

    const historialResponse = await makeRequest(
      "GET",
      `/inventory/movements?item=${bateria.id}&tipo=ajuste`,
      null,
      authToken
    );

    if (historialResponse.statusCode !== 200) {
      throw new Error(
        `Error consultando historial: ${JSON.stringify(historialResponse.data)}`
      );
    }

    const ajustes = historialResponse.data.movements || historialResponse.data;

    // Filtrar solo los ajustes creados en este test
    const ajustesTest = ajustes.filter((ajuste) => {
      const ajusteId = ajuste._id || ajuste.id;
      return testData.movements.some((m) => (m._id || m.id) === ajusteId);
    });

    console.log(
      `\n   📋 Ajustes registrados en este test: ${ajustesTest.length}`
    );
    ajustesTest.forEach((ajuste, index) => {
      const tipo = ajuste.metadata?.tipoAjuste || "N/A";
      const diff = ajuste.metadata?.diferencia || 0;
      const signo = diff >= 0 ? "+" : "";
      console.log(
        `   ${index + 1}. ${tipo.padEnd(10)} | ${signo}${diff} unidades | ${ajuste.referencia}`
      );
    });

    // ============================================
    // PASO 9: Validar datos del movimiento
    // ============================================
    console.log(
      "\n🔍 PASO 9: Validar datos del movimiento vía GET /api/inventory/movements/:id"
    );
    console.log("-".repeat(60));

    const movimientoId = movimientoAjuste._id || movimientoAjuste.id;
    const movimientoDetalleResponse = await makeRequest(
      "GET",
      `/inventory/movements/${movimientoId}`,
      null,
      authToken
    );

    if (movimientoDetalleResponse.statusCode !== 200) {
      throw new Error(
        `Error consultando detalle: ${JSON.stringify(movimientoDetalleResponse.data)}`
      );
    }

    const movimientoDetalle = movimientoDetalleResponse.data;

    console.log(`✅ Movimiento consultado:`);
    console.log(`   - ID: ${movimientoDetalle._id}`);
    console.log(`   - Tipo: ${movimientoDetalle.tipo}`);
    console.log(`   - Referencia: ${movimientoDetalle.referencia}`);
    console.log(
      `   - Item: ${movimientoDetalle.item?.nombre || movimientoDetalle.item}`
    );
    console.log(`   - Cantidad: ${movimientoDetalle.cantidad}`);
    console.log(
      `   - Motivo: ${movimientoDetalle.motivo?.substring(0, 50)}...`
    );

    if (movimientoDetalle.metadata) {
      console.log(`   - Metadata presente: ✅`);
      console.log(
        `     • Tipo ajuste: ${movimientoDetalle.metadata.tipoAjuste}`
      );
      console.log(`     • Auditor: ${movimientoDetalle.metadata.auditor}`);
    }

    // ============================================
    // RESUMEN
    // ============================================
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMEN DEL TEST");
    console.log("=".repeat(60));
    console.log(`
    ESCENARIO: Ajuste de Inventario por Auditoría Física (API)
    
    REPUESTO: ${bateria.nombre}
    CÓDIGO: ${bateria.codigo}
    
    FLUJO COMPLETADO:
    ✅ 1. Autenticación exitosa
    ✅ 2. Repuesto seleccionado para auditoría
    ✅ 3. Stock actual consultado vía API
    ✅ 4. Conteo físico simulado
    ✅ 5. Discrepancia detectada (faltante)
    ✅ 6. Ajuste negativo registrado vía POST
    ✅ 7. Stock corregido vía API
    ✅ 8. Sobrante detectado en segunda auditoría
    ✅ 9. Ajuste positivo registrado vía POST
    ✅ 10. Stock final verificado vía API
    ✅ 11. Historial consultado vía API
    ✅ 12. Detalle del movimiento verificado
    
    MOVIMIENTOS:
    - Ajuste negativo: ${movimientoAjuste._id}
    - Ajuste positivo: ${movimientoAjustePositivo._id}
    
    STOCK:
    - Inicial (sistema): ${stockSistema}
    - Después ajuste negativo: ${stockCorregido.cantidad}
    - Final (después ajuste positivo): ${stockFinal.cantidad}
    
    DIFERENCIAS:
    - Primera auditoría: ${diferencia} unidades
    - Segunda auditoría: +${diferenciaPositiva} unidades
    
    ENDPOINTS PROBADOS:
    ✓ POST /api/auth/login
    ✓ GET /api/inventory/items
    ✓ GET /api/inventory/stock (con filtro item)
    ✓ GET /api/inventory/stock/:id
    ✓ POST /api/inventory/movements (ajuste negativo)
    ✓ POST /api/inventory/movements (ajuste positivo)
    ✓ GET /api/inventory/movements (con filtros)
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
testInventoryAdjustmentAPI();
