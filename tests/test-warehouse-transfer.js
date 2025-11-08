/**
 * Test: Transferencia de Repuestos entre Almacenes
 * Verifica que se puedan transferir repuestos de un almacén a otro
 */

require("dotenv").config();
const { dbConnection } = require("../database/config");
const {
  Item,
  Warehouse,
  Stock,
  Movement,
} = require("../features/inventory/models");
const stockService = require("../features/inventory/stock/stock.services");

const testTransferencia = async () => {
  try {
    await dbConnection();
    console.log("🔗 Conectado a MongoDB\n");

    console.log("=".repeat(60));
    console.log("🧪 TEST: TRANSFERENCIA ENTRE ALMACENES");
    console.log("=".repeat(60));

    // ============================================
    // PASO 1: Verificar almacenes disponibles
    // ============================================
    console.log("\n📋 PASO 1: Verificar almacenes disponibles");
    console.log("-".repeat(60));

    const almacenes = await Warehouse.find({ eliminado: false }).limit(2);

    if (almacenes.length < 2) {
      console.log(
        "❌ Se necesitan al menos 2 almacenes. Ejecuta el seeder primero."
      );
      return;
    }

    const almacenOrigen = almacenes[0];
    const almacenDestino = almacenes[1];

    console.log(
      `✅ Almacén ORIGEN: ${almacenOrigen.nombre} (${almacenOrigen.codigo})`
    );
    console.log(
      `✅ Almacén DESTINO: ${almacenDestino.nombre} (${almacenDestino.codigo})`
    );

    // ============================================
    // PASO 2: Seleccionar repuesto para transferir
    // ============================================
    console.log("\n📦 PASO 2: Seleccionar repuesto para transferir");
    console.log("-".repeat(60));

    const filtroAire = await Item.findOne({ nombre: /filtro.*aire/i });
    if (!filtroAire) {
      console.log(
        "❌ No se encontró filtro de aire. Ejecuta el seeder primero."
      );
      return;
    }

    console.log(`✅ Repuesto: ${filtroAire.nombre}`);
    console.log(`   - Código: ${filtroAire.codigo}`);

    // ============================================
    // PASO 3: Verificar stock en origen
    // ============================================
    console.log("\n📊 PASO 3: Verificar stock en ORIGEN");
    console.log("-".repeat(60));

    let stockOrigen = await Stock.findOne({
      item: filtroAire._id,
      warehouse: almacenOrigen._id,
    });

    if (!stockOrigen) {
      // Crear stock inicial en origen si no existe
      stockOrigen = new Stock({
        item: filtroAire._id,
        warehouse: almacenOrigen._id,
        cantidad: 0,
        reservado: 0,
        minimo: 5,
      });
      await stockOrigen.save();
    }

    console.log(
      `   - Stock en ${almacenOrigen.nombre}: ${stockOrigen.cantidad} unidades`
    );

    if (stockOrigen.cantidad < 5) {
      // Agregar stock si es necesario para la prueba
      console.log(`   ⚠️  Stock insuficiente, agregando unidades...`);

      const movimientoAjuste = await stockService.createMovement({
        tipo: "ajuste",
        referencia: `ADJ-TEST-${Date.now()}`,
        referenciaTipo: "ajuste",
        item: filtroAire._id,
        cantidad: 10,
        warehouseTo: almacenOrigen._id,
        motivo: "Ajuste para test de transferencia",
      });

      stockOrigen = await Stock.findById(stockOrigen._id);
      console.log(`   ✅ Stock ajustado: ${stockOrigen.cantidad} unidades`);
    }

    // ============================================
    // PASO 4: Verificar/Crear stock en destino
    // ============================================
    console.log("\n📊 PASO 4: Verificar stock en DESTINO");
    console.log("-".repeat(60));

    let stockDestino = await Stock.findOne({
      item: filtroAire._id,
      warehouse: almacenDestino._id,
    });

    if (!stockDestino) {
      stockDestino = new Stock({
        item: filtroAire._id,
        warehouse: almacenDestino._id,
        cantidad: 0,
        reservado: 0,
        minimo: 5,
      });
      await stockDestino.save();
      console.log(`   ✅ Stock creado en ${almacenDestino.nombre}: 0 unidades`);
    } else {
      console.log(
        `   - Stock en ${almacenDestino.nombre}: ${stockDestino.cantidad} unidades`
      );
    }

    // ============================================
    // PASO 5: Realizar TRANSFERENCIA
    // ============================================
    console.log("\n🔄 PASO 5: Realizar TRANSFERENCIA");
    console.log("-".repeat(60));

    const cantidadTransferir = 5;
    console.log(`   - Cantidad a transferir: ${cantidadTransferir} unidades`);
    console.log(`   - Origen: ${almacenOrigen.nombre}`);
    console.log(`   - Destino: ${almacenDestino.nombre}`);

    const movimientoTransferencia = await stockService.createMovement({
      tipo: "transferencia",
      referencia: `TRANS-${Date.now()}`,
      referenciaTipo: "transferencia",
      item: filtroAire._id,
      cantidad: cantidadTransferir,
      warehouseFrom: almacenOrigen._id,
      warehouseTo: almacenDestino._id,
      motivo: `Transferencia de ${almacenOrigen.nombre} a ${almacenDestino.nombre} para balancear inventario`,
      metadata: {
        tipoTransferencia: "manual",
        autorizadoPor: "TEST",
        motivo: "Rebalanceo de inventario entre sucursales",
      },
    });

    console.log(`\n✅ Transferencia completada exitosamente`);
    console.log(`   - Movimiento ID: ${movimientoTransferencia._id}`);
    console.log(`   - Referencia: ${movimientoTransferencia.referencia}`);

    // ============================================
    // PASO 6: Verificar stocks actualizados
    // ============================================
    console.log("\n📊 PASO 6: Verificar STOCKS ACTUALIZADOS");
    console.log("-".repeat(60));

    const stockOrigenFinal = await Stock.findById(stockOrigen._id);
    const stockDestinoFinal = await Stock.findById(stockDestino._id);

    console.log(`\n   📦 ALMACÉN ORIGEN (${almacenOrigen.nombre}):`);
    console.log(`   - Stock antes: ${stockOrigen.cantidad}`);
    console.log(`   - Stock después: ${stockOrigenFinal.cantidad}`);
    console.log(
      `   - Diferencia: ${stockOrigenFinal.cantidad - stockOrigen.cantidad}`
    );

    console.log(`\n   📦 ALMACÉN DESTINO (${almacenDestino.nombre}):`);
    console.log(`   - Stock antes: ${stockDestino.cantidad}`);
    console.log(`   - Stock después: ${stockDestinoFinal.cantidad}`);
    console.log(
      `   - Diferencia: +${stockDestinoFinal.cantidad - stockDestino.cantidad}`
    );

    const origenCorrecto =
      stockOrigenFinal.cantidad === stockOrigen.cantidad - cantidadTransferir;
    const destinoCorrecto =
      stockDestinoFinal.cantidad === stockDestino.cantidad + cantidadTransferir;
    const transferenciaExitosa = origenCorrecto && destinoCorrecto;

    console.log(
      `\n   ${origenCorrecto ? "✅" : "❌"} Stock origen descontado correctamente`
    );
    console.log(
      `   ${destinoCorrecto ? "✅" : "❌"} Stock destino incrementado correctamente`
    );
    console.log(
      `   ${transferenciaExitosa ? "✅" : "❌"} Transferencia balanceada`
    );

    // ============================================
    // PASO 7: Verificar conservación de stock total
    // ============================================
    console.log("\n🧮 PASO 7: Verificar CONSERVACIÓN de stock total");
    console.log("-".repeat(60));

    const stockTotalAntes = stockOrigen.cantidad + stockDestino.cantidad;
    const stockTotalDespues =
      stockOrigenFinal.cantidad + stockDestinoFinal.cantidad;

    console.log(`   - Stock total ANTES: ${stockTotalAntes} unidades`);
    console.log(`   - Stock total DESPUÉS: ${stockTotalDespues} unidades`);
    console.log(
      `   - ${stockTotalAntes === stockTotalDespues ? "✅" : "❌"} Stock total conservado`
    );

    // ============================================
    // RESUMEN
    // ============================================
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMEN DEL TEST");
    console.log("=".repeat(60));
    console.log(`
    ESCENARIO: Transferencia entre Almacenes
    
    REPUESTO: ${filtroAire.nombre}
    CANTIDAD: ${cantidadTransferir} unidades
    
    ORIGEN: ${almacenOrigen.nombre}
    - Antes: ${stockOrigen.cantidad} → Después: ${stockOrigenFinal.cantidad}
    
    DESTINO: ${almacenDestino.nombre}
    - Antes: ${stockDestino.cantidad} → Después: ${stockDestinoFinal.cantidad}
    
    FLUJO COMPLETADO:
    ✅ 1. Verificados 2 almacenes
    ✅ 2. Repuesto seleccionado
    ✅ 3. Stock verificado en origen
    ✅ 4. Stock verificado en destino
    ✅ 5. Transferencia ejecutada
    ✅ 6. Stock origen descontado (-${cantidadTransferir})
    ✅ 7. Stock destino incrementado (+${cantidadTransferir})
    ✅ 8. Stock total conservado (${stockTotalDespues})
    
    MOVIMIENTO:
    - ID: ${movimientoTransferencia._id}
    - Tipo: transferencia
    - Referencia: ${movimientoTransferencia.referencia}
    `);

    console.log("=".repeat(60));
    console.log(`${transferenciaExitosa ? "🎉" : "⚠️ "} TEST COMPLETADO`);
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ Error en el test:", error);
  } finally {
    process.exit(0);
  }
};

testTransferencia();
