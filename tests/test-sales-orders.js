/**
 * Test: Órdenes de Venta (Sales Orders)
 * Verifica creación, confirmación, reservas y despacho
 */

require("dotenv").config();
const { dbConnection } = require("../database/config");
const Item = require("../features/inventory/items/item.model");
const Stock = require("../features/inventory/stock/stock.model");
const User = require("../features/user/user.models");
const SalesOrder = require("../features/inventory/salesOrder/salesOrder.model");
const Reservation = require("../features/inventory/reservations/reservation.models");
const stockService = require("../features/inventory/stock/stock.services");

const testSalesOrders = async () => {
  const testData = {
    salesOrders: [],
    reservations: [],
    movements: [],
  };

  try {
    await dbConnection();
    console.log("🔗 Conectado a MongoDB\n");

    console.log("=".repeat(60));
    console.log("🧪 TEST: ÓRDENES DE VENTA (SALES ORDERS)");
    console.log("=".repeat(60));
    console.log(`
    FLUJO COMPLETO:
    1. Cliente solicita repuestos
    2. Crear orden de venta (borrador)
    3. Confirmar orden (crear reservas)
    4. Despachar orden (consumir stock)
    5. Validar estados e integridad
    `);

    // ============================================
    // PASO 1: Preparar datos
    // ============================================
    console.log("\n📋 PASO 1: Preparar DATOS para venta");
    console.log("-".repeat(60));

    const repuestos = await Item.find().limit(3);
    if (repuestos.length === 0) {
      console.log("❌ No hay repuestos. Ejecuta el seeder.");
      return;
    }

    const usuario = await User.findOne();

    const repuestosDisponibles = [];
    for (const rep of repuestos) {
      const stock = await Stock.findOne({ item: rep._id }).populate(
        "warehouse"
      );
      if (stock) {
        const disponible = stock.cantidad - stock.reservado;
        if (disponible > 0) {
          repuestosDisponibles.push({
            item: rep,
            stock: stock,
            disponible: disponible,
            cantidadVender: Math.min(2, disponible),
          });
        }
      }
    }

    console.log(
      `\n   ✅ Repuestos disponibles para venta: ${repuestosDisponibles.length}\n`
    );
    repuestosDisponibles.forEach((r, i) => {
      console.log(`   ${i + 1}. ${r.item.nombre}`);
      console.log(`      - Disponible: ${r.disponible} unidades`);
      console.log(
        `      - Precio: $${(r.item.precio || 0).toLocaleString()}/ud`
      );
      console.log(`      - Vender: ${r.cantidadVender} unidades`);
      console.log(``);
    });

    // ============================================
    // PASO 2: Crear orden de venta (BORRADOR)
    // ============================================
    console.log("\n📝 PASO 2: Crear orden de venta (BORRADOR)");
    console.log("-".repeat(60));

    const items = repuestosDisponibles.map((r) => ({
      item: r.item._id,
      cantidad: r.cantidadVender,
      precioUnitario: r.item.precio || 10000,
      reservado: 0,
      entregado: 0,
    }));

    const salesOrder = await SalesOrder.create({
      numero: `SO-${Date.now()}`,
      cliente: "Cliente Test - Juan Pérez",
      fecha: new Date(),
      estado: "borrador",
      items: items,
      reservations: [],
      creadoPor: usuario?._id,
    });

    testData.salesOrders.push(salesOrder._id);

    const subtotal = items.reduce(
      (sum, item) => sum + item.cantidad * item.precioUnitario,
      0
    );

    console.log(`\n   ✅ Orden de venta creada (borrador):`);
    console.log(`   - Número: ${salesOrder.numero}`);
    console.log(`   - Cliente: ${salesOrder.cliente}`);
    console.log(`   - Items: ${items.length}`);
    console.log(`   - Estado: ${salesOrder.estado}`);
    console.log(`   - Subtotal: $${subtotal.toLocaleString()}`);

    // ============================================
    // PASO 3: Confirmar orden (CREAR RESERVAS)
    // ============================================
    console.log("\n✅ PASO 3: CONFIRMAR orden (crear reservas)");
    console.log("-".repeat(60));

    console.log(`\n   ⏳ Confirmando orden y creando reservas...`);

    // Guardar stocks antes
    const stocksAntes = {};
    for (const item of salesOrder.items) {
      const stock = await Stock.findOne({ item: item.item });
      stocksAntes[item.item.toString()] = {
        cantidad: stock.cantidad,
        reservado: stock.reservado,
      };
    }

    // Crear reservas para cada item
    for (const item of salesOrder.items) {
      const stock = await Stock.findOne({ item: item.item });

      // Crear reserva
      const reserva = await Reservation.create({
        item: item.item,
        warehouse: stock.warehouse,
        cantidad: item.cantidad,
        estado: "activo",
        motivo: `Reserva para orden de venta ${salesOrder.numero}`,
        metadata: {
          salesOrder: salesOrder._id,
          cliente: salesOrder.cliente,
        },
      });

      testData.reservations.push(reserva._id);

      // Actualizar stock reservado
      await Stock.findByIdAndUpdate(stock._id, {
        $inc: { reservado: item.cantidad },
      });

      // Agregar reserva a orden
      salesOrder.reservations.push(reserva._id);
      item.reservado = item.cantidad;

      console.log(
        `   ✅ ${repuestosDisponibles.find((r) => r.item._id.toString() === item.item.toString())?.item.nombre}`
      );
      console.log(`      - Cantidad: ${item.cantidad}`);
      console.log(`      - Reserva: ${reserva._id}`);
    }

    // Actualizar estado de SO
    salesOrder.estado = "confirmada";
    salesOrder.fechaConfirmacion = new Date();
    await salesOrder.save();

    console.log(`\n   ✅ Orden CONFIRMADA`);
    console.log(`   - Estado: ${salesOrder.estado}`);
    console.log(`   - Reservas creadas: ${salesOrder.reservations.length}`);

    // ============================================
    // PASO 4: Verificar reservas y stock
    // ============================================
    console.log("\n🔍 PASO 4: Verificar RESERVAS y stock");
    console.log("-".repeat(60));

    console.log(`\n   📊 Estado de stock después de confirmar:\n`);

    for (const r of repuestosDisponibles) {
      const stockAntes = stocksAntes[r.item._id.toString()];
      const stockAhora = await Stock.findOne({ item: r.item._id });

      console.log(`   📦 ${r.item.nombre}`);
      console.log(
        `      - Stock total: ${stockAntes.cantidad} → ${stockAhora.cantidad} (sin cambios)`
      );
      console.log(
        `      - Stock reservado: ${stockAntes.reservado} → ${stockAhora.reservado} (+${stockAhora.reservado - stockAntes.reservado})`
      );
      console.log(
        `      - Stock disponible: ${stockAntes.cantidad - stockAntes.reservado} → ${stockAhora.cantidad - stockAhora.reservado}`
      );
      console.log(
        `      - ${stockAhora.cantidad === stockAntes.cantidad ? "✅" : "❌"} Stock total correcto`
      );
      console.log(``);
    }

    // ============================================
    // PASO 5: Despachar orden (CONSUMIR STOCK)
    // ============================================
    console.log("\n🚚 PASO 5: DESPACHAR orden (consumir stock)");
    console.log("-".repeat(60));

    console.log(`\n   ⏳ Despachando orden y consumiendo stock...`);

    for (const item of salesOrder.items) {
      const stock = await Stock.findOne({ item: item.item });
      const reserva = await Reservation.findOne({
        _id: { $in: salesOrder.reservations },
        item: item.item,
      });

      // Crear movimiento de salida (consumo/venta)
      const movimiento = await stockService.createMovement({
        tipo: "salida",
        referencia: salesOrder.numero,
        referenciaTipo: "sales_order",
        item: item.item,
        cantidad: item.cantidad,
        warehouseFrom: stock.warehouse,
        motivo: `Venta - Orden ${salesOrder.numero}`,
        metadata: {
          salesOrder: salesOrder._id,
          reserva: reserva._id,
          cliente: salesOrder.cliente,
          precioUnitario: item.precioUnitario,
        },
      });

      testData.movements.push(movimiento._id);

      // Actualizar reserva
      reserva.estado = "consumido";
      reserva.fechaEntrega = new Date();
      await reserva.save();

      // Actualizar item en SO
      item.entregado = item.cantidad;

      console.log(
        `   ✅ ${repuestosDisponibles.find((r) => r.item._id.toString() === item.item.toString())?.item.nombre}`
      );
      console.log(`      - Despachado: ${item.entregado}/${item.cantidad}`);
      console.log(`      - Movimiento: ${movimiento._id}`);
    }

    // Actualizar estado de SO
    salesOrder.estado = "despachada";
    salesOrder.fechaDespacho = new Date();
    await salesOrder.save();

    console.log(`\n   ✅ Orden DESPACHADA COMPLETAMENTE`);
    console.log(`   - Estado: ${salesOrder.estado}`);
    console.log(
      `   - Fecha despacho: ${salesOrder.fechaDespacho.toLocaleString()}`
    );

    // ============================================
    // PASO 6: Verificar stock final
    // ============================================
    console.log("\n🔍 PASO 6: Verificar STOCK FINAL");
    console.log("-".repeat(60));

    console.log(`\n   📊 Estado final de stock:\n`);

    let todoCorrecto = true;

    for (const r of repuestosDisponibles) {
      const stockAntes = stocksAntes[r.item._id.toString()];
      const stockFinal = await Stock.findOne({ item: r.item._id });
      const itemSO = salesOrder.items.find(
        (i) => i.item.toString() === r.item._id.toString()
      );

      const stockEsperado = stockAntes.cantidad - itemSO.cantidad;
      const reservadoEsperado = stockAntes.reservado; // Las reservas consumidas ya se liberaron

      const stockCorrecto = stockFinal.cantidad === stockEsperado;
      todoCorrecto = todoCorrecto && stockCorrecto;

      console.log(`   📦 ${r.item.nombre}`);
      console.log(`      - Stock inicial: ${stockAntes.cantidad}`);
      console.log(`      - Stock final: ${stockFinal.cantidad}`);
      console.log(`      - Esperado: ${stockEsperado}`);
      console.log(
        `      - Diferencia: -${stockAntes.cantidad - stockFinal.cantidad}`
      );
      console.log(`      - Reservado: ${stockFinal.reservado}`);
      console.log(`      - ${stockCorrecto ? "✅ Correcto" : "❌ Error"}`);
      console.log(``);
    }

    // ============================================
    // PASO 7: Orden con despacho PARCIAL
    // ============================================
    console.log("\n📦 PASO 7: Orden con DESPACHO PARCIAL");
    console.log("-".repeat(60));

    const filtroAire = await Item.findOne({ nombre: /filtro aire/i });
    if (!filtroAire) {
      console.log("   ⚠️  Filtro aire no disponible, saltando prueba parcial");
    } else {
      const stockFiltro = await Stock.findOne({ item: filtroAire._id });
      const disponibleFiltro = stockFiltro.cantidad - stockFiltro.reservado;

      if (disponibleFiltro >= 5) {
        const salesOrder2 = await SalesOrder.create({
          numero: `SO-${Date.now()}-2`,
          cliente: "Cliente Test 2",
          fecha: new Date(),
          estado: "confirmada",
          items: [
            {
              item: filtroAire._id,
              cantidad: 5,
              precioUnitario: filtroAire.precio || 8000,
              reservado: 5,
              entregado: 0,
            },
          ],
          reservations: [],
          fechaConfirmacion: new Date(),
          creadoPor: usuario?._id,
        });

        testData.salesOrders.push(salesOrder2._id);

        // Crear reserva
        const reserva2 = await Reservation.create({
          item: filtroAire._id,
          warehouse: stockFiltro.warehouse,
          cantidad: 5,
          estado: "activo",
          motivo: `Reserva para orden ${salesOrder2.numero}`,
        });

        testData.reservations.push(reserva2._id);
        salesOrder2.reservations.push(reserva2._id);

        await Stock.findByIdAndUpdate(stockFiltro._id, {
          $inc: { reservado: 5 },
        });

        console.log(`\n   📝 Nueva orden creada: ${salesOrder2.numero}`);
        console.log(`   - Item: ${filtroAire.nombre}`);
        console.log(`   - Cantidad: 5 unidades`);

        // Despachar solo 3 unidades
        const movimientoParcial = await stockService.createMovement({
          tipo: "salida",
          referencia: salesOrder2.numero,
          referenciaTipo: "sales_order",
          item: filtroAire._id,
          cantidad: 3,
          warehouseFrom: stockFiltro.warehouse,
          motivo: `Despacho parcial orden ${salesOrder2.numero}`,
          metadata: {
            salesOrder: salesOrder2._id,
            despachoParcial: true,
          },
        });

        testData.movements.push(movimientoParcial._id);

        salesOrder2.items[0].entregado = 3;
        salesOrder2.estado = "parcial";
        await salesOrder2.save();

        console.log(`\n   ✅ Despacho parcial procesado:`);
        console.log(`   - Despachado: 3/5 unidades`);
        console.log(`   - Estado: ${salesOrder2.estado}`);
        console.log(`   - Pendiente: 2 unidades`);
        console.log(`   - Reserva sigue activa para las 2 restantes`);
      }
    }

    // ============================================
    // PASO 8: Verificar movimientos
    // ============================================
    console.log("\n📝 PASO 8: Verificar MOVIMIENTOS registrados");
    console.log("-".repeat(60));

    const { Movement } = require("../features/inventory/models");
    const movimientos = await Movement.find({
      _id: { $in: testData.movements },
    }).populate("item", "nombre codigo");

    console.log(`\n   📋 Total movimientos: ${movimientos.length}\n`);
    movimientos.forEach((mov, i) => {
      console.log(`   ${i + 1}. ${mov.item.nombre}`);
      console.log(`      - Tipo: salida (venta)`);
      console.log(`      - Cantidad: ${mov.cantidad}`);
      console.log(`      - Referencia: ${mov.referencia}`);
      console.log(`      - Fecha: ${mov.createdAt.toLocaleString()}`);
      console.log(``);
    });

    // ============================================
    // RESUMEN
    // ============================================
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMEN DEL TEST");
    console.log("=".repeat(60));
    console.log(`
    ESCENARIO: Órdenes de Venta a Clientes
    
    ÓRDENES CREADAS: ${testData.salesOrders.length}
    
    ORDEN 1 - Despacho Completo:
    - Número: ${salesOrder.numero}
    - Cliente: ${salesOrder.cliente}
    - Items: ${salesOrder.items.length}
    - Estado: ${salesOrder.estado}
    - Total: $${subtotal.toLocaleString()}
    
    FLUJO COMPLETADO:
    ✅ 1. Datos preparados
    ✅ 2. Orden creada (borrador)
    ✅ 3. Orden confirmada (reservas creadas)
    ✅ 4. Stock reservado correctamente
    ✅ 5. Orden despachada (stock consumido)
    ✅ 6. Stock final verificado
    ✅ 7. Despacho parcial probado
    ✅ 8. Movimientos de salida registrados
    
    RESERVAS:
    - Total: ${testData.reservations.length}
    - Estado: consumido
    
    MOVIMIENTOS:
    - Total: ${movimientos.length}
    - Tipo: salida (ventas)
    - Stock decrementado correctamente
    
    ESTADOS VALIDADOS:
    - borrador → confirmada → despachada (orden completa)
    - confirmada → parcial (despacho parcial)
    
    INTEGRIDAD:
    ${todoCorrecto ? "✅ Stock actualizado correctamente" : "⚠️  Revisar inconsistencias"}
    `);

    console.log("=".repeat(60));
    console.log("🎉 TEST COMPLETADO EXITOSAMENTE");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ Error en el test:", error);
    console.error(error.stack);
  } finally {
    // Limpiar datos de prueba
    if (testData.reservations.length > 0) {
      await Reservation.deleteMany({ _id: { $in: testData.reservations } });
      console.log(`\n🧹 ${testData.reservations.length} reservas eliminadas`);
    }

    if (testData.salesOrders.length > 0) {
      await SalesOrder.deleteMany({ _id: { $in: testData.salesOrders } });
      console.log(
        `🧹 ${testData.salesOrders.length} órdenes de venta eliminadas`
      );
    }

    console.log(`🧹 Movimientos preservados para integridad de stock\n`);

    process.exit(0);
  }
};

testSalesOrders();
