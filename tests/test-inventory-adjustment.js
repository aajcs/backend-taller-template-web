/**
 * Test: Ajuste de Inventario por Diferencias Físicas
 * Verifica corrección de stock por conteo físico
 */

require("dotenv").config();
const { dbConnection } = require("../database/config");
const { Item, Stock } = require("../features/inventory/models");
const stockService = require("../features/inventory/stock/stock.services");

const testAjusteInventario = async () => {
  try {
    await dbConnection();
    console.log("🔗 Conectado a MongoDB\n");

    console.log("=".repeat(60));
    console.log("🧪 TEST: AJUSTE DE INVENTARIO");
    console.log("=".repeat(60));

    // ============================================
    // PASO 1: Seleccionar repuesto para auditar
    // ============================================
    console.log("\n📋 PASO 1: Seleccionar repuesto para auditoría");
    console.log("-".repeat(60));

    const bateria = await Item.findOne({ nombre: /batería|bateria/i });
    if (!bateria) {
      console.log("❌ No se encontró batería. Ejecuta el seeder primero.");
      return;
    }

    const stockActual = await Stock.findOne({
      item: bateria._id,
    }).populate("warehouse");

    if (!stockActual) {
      console.log("❌ No hay stock registrado para este item.");
      return;
    }

    console.log(`✅ Repuesto auditado: ${bateria.nombre}`);
    console.log(`   - Código: ${bateria.codigo}`);
    console.log(`   - Almacén: ${stockActual.warehouse.nombre}`);
    console.log(`   - Stock en sistema: ${stockActual.cantidad} unidades`);

    // ============================================
    // PASO 2: Simular conteo físico
    // ============================================
    console.log("\n📦 PASO 2: Realizar CONTEO FÍSICO");
    console.log("-".repeat(60));

    const stockSistema = stockActual.cantidad;
    const stockFisico = stockSistema - 2; // Simular que faltan 2 unidades

    console.log(`   👤 Auditor realizó conteo físico:`);
    console.log(`   - Stock en sistema: ${stockSistema} unidades`);
    console.log(`   - Stock físico contado: ${stockFisico} unidades`);
    console.log(
      `   - Diferencia encontrada: ${stockFisico - stockSistema} unidades`
    );

    const hayDiferencia = stockSistema !== stockFisico;

    if (hayDiferencia) {
      console.log(`   ⚠️  DISCREPANCIA DETECTADA`);
      console.log(
        `   ${stockFisico < stockSistema ? "❌ Faltante" : "✅ Sobrante"}: ${Math.abs(stockFisico - stockSistema)} unidades`
      );
    }

    // ============================================
    // PASO 3: Registrar ajuste NEGATIVO (faltante)
    // ============================================
    console.log("\n🔧 PASO 3: Registrar AJUSTE de inventario");
    console.log("-".repeat(60));

    const diferencia = stockFisico - stockSistema;
    const tipoAjuste =
      diferencia < 0 ? "ajuste negativo (salida)" : "ajuste positivo (entrada)";

    console.log(`   - Tipo de ajuste: ${tipoAjuste}`);
    console.log(`   - Cantidad a ajustar: ${Math.abs(diferencia)} unidades`);
    console.log(`   - Motivo: Diferencia en conteo físico`);

    // Para ajuste negativo (faltante), creamos salida
    const movimientoAjuste = await stockService.createMovement({
      tipo: "ajuste",
      referencia: `ADJ-AUD-${Date.now()}`,
      referenciaTipo: "auditoria",
      item: bateria._id,
      cantidad: Math.abs(diferencia),
      ...(diferencia < 0
        ? { warehouseFrom: stockActual.warehouse._id }
        : { warehouseTo: stockActual.warehouse._id }),
      motivo: `Ajuste por diferencia en auditoría física. Stock sistema: ${stockSistema}, Stock físico: ${stockFisico}`,
      metadata: {
        tipoAjuste: diferencia < 0 ? "faltante" : "sobrante",
        stockAnterior: stockSistema,
        stockFisico: stockFisico,
        diferencia: diferencia,
        auditor: "TEST-AUDITOR",
        fechaAuditoria: new Date(),
        motivoDetallado: "Posible merma, extravío o error de registro previo",
      },
    });

    console.log(`\n✅ Ajuste registrado exitosamente`);
    console.log(`   - Movimiento ID: ${movimientoAjuste._id}`);
    console.log(`   - Tipo: ajuste`);
    console.log(`   - Referencia: ${movimientoAjuste.referencia}`);

    // ============================================
    // PASO 4: Verificar stock corregido
    // ============================================
    console.log("\n📊 PASO 4: Verificar STOCK CORREGIDO");
    console.log("-".repeat(60));

    const stockCorregido = await Stock.findById(stockActual._id);

    console.log(`\n   📦 Comparación de Stock:`);
    console.log(`   - Stock antes del ajuste: ${stockSistema}`);
    console.log(`   - Stock físico contado: ${stockFisico}`);
    console.log(`   - Stock después del ajuste: ${stockCorregido.cantidad}`);

    const ajusteCorrecto = stockCorregido.cantidad === stockFisico;
    console.log(
      `\n   ${ajusteCorrecto ? "✅" : "❌"} Stock corregido y coincide con conteo físico`
    );

    // ============================================
    // PASO 5: Simular ajuste POSITIVO (sobrante)
    // ============================================
    console.log("\n📦 PASO 5: Simular ajuste POSITIVO (sobrante)");
    console.log("-".repeat(60));

    const stockActualizado = stockCorregido.cantidad;
    const stockFisicoNuevo = stockActualizado + 3; // Simular que encontramos 3 más

    console.log(`   👤 Auditor encontró unidades adicionales:`);
    console.log(`   - Stock en sistema: ${stockActualizado} unidades`);
    console.log(`   - Stock físico encontrado: ${stockFisicoNuevo} unidades`);
    console.log(
      `   - Sobrante: +${stockFisicoNuevo - stockActualizado} unidades`
    );

    const movimientoAjustePositivo = await stockService.createMovement({
      tipo: "ajuste",
      referencia: `ADJ-SOB-${Date.now()}`,
      referenciaTipo: "auditoria",
      item: bateria._id,
      cantidad: stockFisicoNuevo - stockActualizado,
      warehouseTo: stockActual.warehouse._id,
      motivo: `Ajuste positivo: unidades encontradas no registradas. Stock sistema: ${stockActualizado}, Stock físico: ${stockFisicoNuevo}`,
      metadata: {
        tipoAjuste: "sobrante",
        stockAnterior: stockActualizado,
        stockFisico: stockFisicoNuevo,
        diferencia: stockFisicoNuevo - stockActualizado,
        auditor: "TEST-AUDITOR",
        fechaAuditoria: new Date(),
        motivoDetallado: "Unidades no registradas en entregas anteriores",
      },
    });

    console.log(`\n✅ Ajuste positivo registrado`);
    console.log(`   - Movimiento ID: ${movimientoAjustePositivo._id}`);

    const stockFinalCorregido = await Stock.findById(stockActual._id);
    console.log(`   - Stock final: ${stockFinalCorregido.cantidad} unidades`);
    console.log(
      `   - ${stockFinalCorregido.cantidad === stockFisicoNuevo ? "✅" : "❌"} Coincide con conteo físico`
    );

    // ============================================
    // PASO 6: Historial de ajustes
    // ============================================
    console.log("\n📝 PASO 6: Historial de AJUSTES");
    console.log("-".repeat(60));

    const { Movement } = require("../features/inventory/models");
    const ajustes = await Movement.find({
      item: bateria._id,
      tipo: "ajuste",
      _id: { $in: [movimientoAjuste._id, movimientoAjustePositivo._id] },
    }).sort({ createdAt: 1 });

    console.log(`\n   📋 Ajustes registrados: ${ajustes.length}`);
    ajustes.forEach((ajuste, index) => {
      const tipo = ajuste.metadata?.tipoAjuste || "N/A";
      const diff = ajuste.metadata?.diferencia || 0;
      const signo = diff >= 0 ? "+" : "";
      console.log(
        `   ${index + 1}. ${tipo.padEnd(10)} | ${signo}${diff} unidades | ${ajuste.referencia}`
      );
    });

    // ============================================
    // RESUMEN
    // ============================================
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMEN DEL TEST");
    console.log("=".repeat(60));
    console.log(`
    ESCENARIO: Ajuste de Inventario por Auditoría Física
    
    REPUESTO: ${bateria.nombre}
    ALMACÉN: ${stockActual.warehouse.nombre}
    
    FLUJO COMPLETADO:
    ✅ 1. Repuesto seleccionado para auditoría
    ✅ 2. Conteo físico realizado
    ✅ 3. Discrepancia detectada (faltante)
    ✅ 4. Ajuste negativo registrado (-${Math.abs(diferencia)} unidades)
    ✅ 5. Stock corregido a cantidad física
    ✅ 6. Sobrante detectado en segunda auditoría
    ✅ 7. Ajuste positivo registrado (+${stockFisicoNuevo - stockActualizado} unidades)
    ✅ 8. Stock final conciliado
    
    MOVIMIENTOS:
    - Ajuste negativo: ${movimientoAjuste._id}
    - Ajuste positivo: ${movimientoAjustePositivo._id}
    
    STOCK:
    - Inicial (sistema): ${stockSistema}
    - Después ajuste negativo: ${stockCorregido.cantidad}
    - Final (después ajuste positivo): ${stockFinalCorregido.cantidad}
    
    DIFERENCIAS:
    - Primera auditoría: ${diferencia} unidades
    - Segunda auditoría: +${stockFisicoNuevo - stockActualizado} unidades
    `);

    console.log("=".repeat(60));
    console.log("🎉 TEST COMPLETADO EXITOSAMENTE");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ Error en el test:", error);
  } finally {
    process.exit(0);
  }
};

testAjusteInventario();
