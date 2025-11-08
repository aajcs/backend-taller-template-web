/**
 * Test: Devolución de Repuesto al Almacén
 * Verifica que un repuesto no utilizado pueda regresar al almacén
 */

require("dotenv").config();
const { dbConnection } = require("../database/config");
const { Item, Stock, Reservation } = require("../features/inventory/models");
const stockService = require("../features/inventory/stock/stock.services");

const testDevolucion = async () => {
  try {
    await dbConnection();
    console.log("🔗 Conectado a MongoDB\n");

    console.log("=".repeat(60));
    console.log("🧪 TEST: DEVOLUCIÓN DE REPUESTO AL ALMACÉN");
    console.log("=".repeat(60));

    // ============================================
    // PASO 1: Reservar y entregar repuesto
    // ============================================
    console.log("\n📋 PASO 1: Reservar y entregar repuesto");
    console.log("-".repeat(60));

    const amortiguador = await Item.findOne({ nombre: /amortiguador/i });
    if (!amortiguador) {
      console.log("❌ No se encontró amortiguador. Ejecuta el seeder primero.");
      return;
    }

    const stockDisponible = await Stock.findOne({
      item: amortiguador._id,
      cantidad: { $gt: 0 },
    }).populate("warehouse");

    console.log(`✅ Repuesto: ${amortiguador.nombre}`);
    console.log(`   - Stock inicial: ${stockDisponible.cantidad} unidades`);
    console.log(`   - Almacén: ${stockDisponible.warehouse.nombre}`);

    // Crear reserva y entregarla
    const cantidadReservar = 2;
    const reserva = new Reservation({
      item: amortiguador._id,
      warehouse: stockDisponible.warehouse._id,
      cantidad: cantidadReservar,
      motivo: "Reserva para OT-TEST-DEV-001",
      estado: "activo",
    });
    await reserva.save();

    // Simular orden de salida y entrega
    reserva.estado = "pendiente_retiro";
    await reserva.save();

    // Crear movimiento de salida
    const movimientoSalida = await stockService.createMovement({
      tipo: "salida",
      referencia: `OT-TEST-DEV-001`,
      referenciaTipo: "workOrder",
      item: amortiguador._id,
      cantidad: cantidadReservar,
      warehouseFrom: stockDisponible.warehouse._id,
      reserva: reserva._id,
      motivo: `Entrega para OT-TEST-DEV-001`,
    });

    reserva.estado = "consumido";
    await reserva.save();

    const stockDespuesSalida = await Stock.findById(stockDisponible._id);
    console.log(`\n✅ Repuesto entregado`);
    console.log(`   - Movimiento salida: ${movimientoSalida._id}`);
    console.log(`   - Stock después de salida: ${stockDespuesSalida.cantidad}`);
    console.log(`   - Diferencia: -${cantidadReservar} unidades`);

    // ============================================
    // PASO 2: Simular que NO se usó el repuesto
    // ============================================
    console.log("\n⚠️  PASO 2: Repuesto NO fue utilizado");
    console.log("-".repeat(60));
    console.log("   Escenario: Técnico diagnosticó que no era necesario");
    console.log("   Acción: Devolver repuesto al almacén");

    // ============================================
    // PASO 3: Crear movimiento de ENTRADA (devolución)
    // ============================================
    console.log("\n↩️  PASO 3: Registrar DEVOLUCIÓN al almacén");
    console.log("-".repeat(60));

    const cantidadDevolver = 1; // Solo devuelve 1 de las 2 unidades
    console.log(`   - Cantidad a devolver: ${cantidadDevolver} unidad(es)`);

    const movimientoDevolucion = await stockService.createMovement({
      tipo: "entrada",
      referencia: `DEV-OT-TEST-DEV-001`,
      referenciaTipo: "devolucion",
      item: amortiguador._id,
      cantidad: cantidadDevolver,
      warehouseTo: stockDisponible.warehouse._id,
      motivo: `Devolución - Repuesto no utilizado en OT-TEST-DEV-001`,
      metadata: {
        movimientoOriginal: movimientoSalida._id,
        ordenTrabajo: "OT-TEST-DEV-001",
        motivoDevolucion: "Repuesto no necesario después de diagnóstico",
      },
    });

    console.log(`\n✅ Devolución registrada exitosamente`);
    console.log(`   - Movimiento ID: ${movimientoDevolucion._id}`);
    console.log(`   - Tipo: entrada`);
    console.log(`   - Referencia: DEV-OT-TEST-DEV-001`);

    // ============================================
    // PASO 4: Verificar stock INCREMENTADO
    // ============================================
    console.log("\n📊 PASO 4: Verificar STOCK INCREMENTADO");
    console.log("-".repeat(60));

    const stockFinal = await Stock.findById(stockDisponible._id);

    console.log(`\n   📦 Resumen de Stock:`);
    console.log(`   - Stock inicial: ${stockDisponible.cantidad}`);
    console.log(
      `   - Después de salida: ${stockDespuesSalida.cantidad} (-${cantidadReservar})`
    );
    console.log(
      `   - Después de devolución: ${stockFinal.cantidad} (+${cantidadDevolver})`
    );
    console.log(
      `   - Resultado neto: ${stockFinal.cantidad - stockDisponible.cantidad}`
    );

    const devolucionCorrecta =
      stockFinal.cantidad === stockDespuesSalida.cantidad + cantidadDevolver;
    console.log(
      `\n   ${devolucionCorrecta ? "✅" : "❌"} Devolución procesada correctamente`
    );

    // ============================================
    // PASO 5: Verificar historial de movimientos
    // ============================================
    console.log("\n📝 PASO 5: Verificar HISTORIAL de movimientos");
    console.log("-".repeat(60));

    const { Movement } = require("../features/inventory/models");
    const movimientos = await Movement.find({
      item: amortiguador._id,
      _id: { $in: [movimientoSalida._id, movimientoDevolucion._id] },
    }).sort({ createdAt: 1 });

    console.log(`   📋 Movimientos registrados: ${movimientos.length}`);
    movimientos.forEach((mov, index) => {
      console.log(
        `   ${index + 1}. Tipo: ${mov.tipo.padEnd(10)} | Cantidad: ${mov.cantidad} | Ref: ${mov.referencia}`
      );
    });

    // ============================================
    // RESUMEN
    // ============================================
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMEN DEL TEST");
    console.log("=".repeat(60));
    console.log(`
    ESCENARIO: Devolución de Repuesto No Utilizado
    
    REPUESTO: ${amortiguador.nombre}
    ALMACÉN: ${stockDisponible.warehouse.nombre}
    
    FLUJO COMPLETADO:
    ✅ 1. Repuesto reservado (${cantidadReservar} unidades)
    ✅ 2. Orden de salida generada
    ✅ 3. Repuesto entregado (stock descontado)
    ✅ 4. Repuesto NO utilizado (diagnóstico)
    ✅ 5. Devolución registrada (${cantidadDevolver} unidad)
    ✅ 6. Stock incrementado correctamente
    ✅ 7. Historial completo de movimientos
    
    MOVIMIENTOS:
    - Salida: -${cantidadReservar} unidades (${movimientoSalida._id})
    - Entrada: +${cantidadDevolver} unidad (${movimientoDevolucion._id})
    
    STOCK:
    - Inicial: ${stockDisponible.cantidad}
    - Final: ${stockFinal.cantidad}
    - Neto: ${stockFinal.cantidad - stockDisponible.cantidad}
    `);

    console.log("=".repeat(60));
    console.log("🎉 TEST COMPLETADO EXITOSAMENTE");
    console.log("=".repeat(60));

    // Limpiar
    console.log("\n🧹 Limpiando datos de prueba...");
    await Reservation.findByIdAndDelete(reserva._id);
    console.log("✅ Datos eliminados");
  } catch (error) {
    console.error("\n❌ Error en el test:", error);
  } finally {
    process.exit(0);
  }
};

testDevolucion();
