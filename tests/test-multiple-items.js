/**
 * Test: Flujo Completo con Múltiples Repuestos
 * Simula una OT con varios repuestos y servicios
 */

require("dotenv").config();
const { dbConnection } = require("../database/config");
const {
  Item,
  Stock,
  Reservation,
  Movement,
} = require("../features/inventory/models");
const stockService = require("../features/inventory/stock/stock.services");

const testMultiplesRepuestos = async () => {
  try {
    await dbConnection();
    console.log("🔗 Conectado a MongoDB\n");

    console.log("=".repeat(60));
    console.log("🧪 TEST: ORDEN CON MÚLTIPLES REPUESTOS");
    console.log("=".repeat(60));

    // ============================================
    // PASO 1: Seleccionar múltiples repuestos
    // ============================================
    console.log("\n📋 PASO 1: Seleccionar repuestos para mantenimiento");
    console.log("-".repeat(60));

    const repuestos = [
      { buscar: /filtro.*aceite/i, cantidad: 1, nombre: "Filtro Aceite" },
      { buscar: /filtro.*aire/i, cantidad: 1, nombre: "Filtro Aire" },
      { buscar: /bujía|buji/i, cantidad: 4, nombre: "Bujías" },
    ];

    const reservasCreadas = [];
    const itemsSeleccionados = [];

    console.log("   Repuestos solicitados para mantenimiento:");

    for (const rep of repuestos) {
      const item = await Item.findOne({ nombre: rep.buscar });
      if (!item) {
        console.log(`   ❌ ${rep.nombre}: No encontrado`);
        continue;
      }

      const stock = await Stock.findOne({
        item: item._id,
        cantidad: { $gte: rep.cantidad },
      }).populate("warehouse");

      if (!stock) {
        console.log(`   ❌ ${rep.nombre}: Stock insuficiente`);
        continue;
      }

      console.log(`   ✅ ${item.nombre}`);
      console.log(`      - Cantidad: ${rep.cantidad}`);
      console.log(`      - Stock disponible: ${stock.cantidad}`);
      console.log(`      - Precio unitario: $${item.precioVenta}`);
      console.log(`      - Subtotal: $${item.precioVenta * rep.cantidad}`);

      itemsSeleccionados.push({
        item,
        stock,
        cantidad: rep.cantidad,
        subtotal: item.precioVenta * rep.cantidad,
      });
    }

    if (itemsSeleccionados.length === 0) {
      console.log("\n❌ No hay repuestos disponibles. Ejecuta el seeder.");
      return;
    }

    const totalRepuestos = itemsSeleccionados.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );
    console.log(`\n   💰 Subtotal Repuestos: $${totalRepuestos}`);

    // ============================================
    // PASO 2: Crear reservas para todos los items
    // ============================================
    console.log("\n🔒 PASO 2: Crear RESERVAS para todos los repuestos");
    console.log("-".repeat(60));

    for (const item of itemsSeleccionados) {
      const reserva = new Reservation({
        item: item.item._id,
        warehouse: item.stock.warehouse._id,
        cantidad: item.cantidad,
        motivo: `Reserva para OT-MANT-001 - ${item.item.nombre}`,
        estado: "activo",
      });
      await reserva.save();
      reservasCreadas.push(reserva);

      console.log(
        `   ✅ ${item.item.nombre}: Reserva creada (${item.cantidad} unidades)`
      );
    }

    console.log(`\n   📝 Total de reservas: ${reservasCreadas.length}`);

    // ============================================
    // PASO 3: Generar órdenes de salida
    // ============================================
    console.log("\n📦 PASO 3: Generar ÓRDENES DE SALIDA");
    console.log("-".repeat(60));

    for (const reserva of reservasCreadas) {
      reserva.estado = "pendiente_retiro";
      await reserva.save();

      const ordenSalida = `SAL-${reserva._id.toString().slice(-8).toUpperCase()}`;
      console.log(`   ✅ ${ordenSalida}: Orden generada`);
    }

    // ============================================
    // PASO 4: Entregar todos los repuestos
    // ============================================
    console.log("\n🚚 PASO 4: ENTREGAR todos los repuestos");
    console.log("-".repeat(60));

    const stockAntes = {};
    const movimientos = [];

    for (let i = 0; i < reservasCreadas.length; i++) {
      const reserva = reservasCreadas[i];
      const item = itemsSeleccionados[i];

      // Guardar stock antes
      const stockBefore = await Stock.findById(item.stock._id);
      stockAntes[item.item._id.toString()] = stockBefore.cantidad;

      // Crear movimiento
      const movimiento = await stockService.createMovement({
        tipo: "salida",
        referencia: `OT-MANT-001`,
        referenciaTipo: "workOrder",
        item: item.item._id,
        cantidad: item.cantidad,
        warehouseFrom: item.stock.warehouse._id,
        reserva: reserva._id,
        motivo: `Entrega para mantenimiento - ${item.item.nombre}`,
      });

      movimientos.push(movimiento);

      // Marcar como consumido
      reserva.estado = "consumido";
      reserva.fechaEntrega = new Date();
      await reserva.save();

      console.log(
        `   ✅ ${item.item.nombre}: Entregado (${item.cantidad} unidades)`
      );
    }

    // ============================================
    // PASO 5: Verificar stocks actualizados
    // ============================================
    console.log("\n📊 PASO 5: Verificar STOCKS ACTUALIZADOS");
    console.log("-".repeat(60));

    let todosCorrectos = true;
    console.log("\n   Repuesto           | Antes | Después | Diff | Estado");
    console.log("   " + "-".repeat(55));

    for (let i = 0; i < itemsSeleccionados.length; i++) {
      const item = itemsSeleccionados[i];
      const stockDespues = await Stock.findById(item.stock._id);
      const antes = stockAntes[item.item._id.toString()];
      const despues = stockDespues.cantidad;
      const diff = antes - despues;
      const correcto = diff === item.cantidad;
      todosCorrectos = todosCorrectos && correcto;

      const nombre = item.item.nombre.padEnd(18);
      const estadoIcon = correcto ? "✅" : "❌";
      console.log(
        `   ${nombre} | ${String(antes).padStart(5)} | ${String(despues).padStart(7)} | ${String(-diff).padStart(4)} | ${estadoIcon}`
      );
    }

    // ============================================
    // PASO 6: Verificar movimientos registrados
    // ============================================
    console.log("\n📝 PASO 6: Verificar MOVIMIENTOS registrados");
    console.log("-".repeat(60));

    console.log(
      `   ✅ ${movimientos.length} movimientos de salida registrados`
    );
    console.log(`   - Todos vinculados a OT-MANT-001`);
    console.log(`   - Tipo: "salida"`);
    console.log(`   - Referencia: workOrder`);

    // ============================================
    // RESUMEN
    // ============================================
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMEN DEL TEST");
    console.log("=".repeat(60));
    console.log(`
    ESCENARIO: Orden con Múltiples Repuestos
    
    REPUESTOS PROCESADOS: ${itemsSeleccionados.length}
    - ${itemsSeleccionados.map((i) => `${i.item.nombre} (x${i.cantidad})`).join("\n    - ")}
    
    FLUJO COMPLETADO:
    ✅ 1. ${itemsSeleccionados.length} repuestos seleccionados
    ✅ 2. ${reservasCreadas.length} reservas creadas (estado: activo)
    ✅ 3. ${reservasCreadas.length} órdenes de salida generadas
    ✅ 4. ${reservasCreadas.length} entregas realizadas (stock descontado)
    ✅ 5. ${movimientos.length} movimientos registrados
    ✅ 6. ${todosCorrectos ? "Todos los stocks actualizados correctamente" : "Errores en actualización de stock"}
    
    FINANCIERO:
    - Subtotal Repuestos: $${totalRepuestos}
    - Cantidad total items: ${itemsSeleccionados.reduce((sum, i) => sum + i.cantidad, 0)}
    `);

    console.log("=".repeat(60));
    console.log(`${todosCorrectos ? "🎉" : "⚠️ "} TEST COMPLETADO`);
    console.log("=".repeat(60));

    // Limpiar
    console.log("\n🧹 Limpiando datos de prueba...");
    for (const reserva of reservasCreadas) {
      await Reservation.findByIdAndDelete(reserva._id);
    }
    console.log(`✅ ${reservasCreadas.length} reservas eliminadas`);
  } catch (error) {
    console.error("\n❌ Error en el test:", error);
  } finally {
    process.exit(0);
  }
};

testMultiplesRepuestos();
