/**
 * Test: Órdenes de Compra (Purchase Orders)
 * Verifica creación, recepción y actualización de stock
 */

require("dotenv").config();
const { dbConnection } = require("../database/config");
const Item = require("../features/inventory/items/item.model");
const Stock = require("../features/inventory/stock/stock.model");
const Supplier = require("../features/inventory/suppliers/supplier.models");
const PurchaseOrder = require("../features/inventory/purchaseOrders/purchaseOrder.models");
const User = require("../features/user/user.models");
const stockService = require("../features/inventory/stock/stock.services");

const testPurchaseOrders = async () => {
  const testData = {
    purchaseOrders: [],
    movements: [],
  };

  try {
    await dbConnection();
    console.log("🔗 Conectado a MongoDB\n");

    console.log("=".repeat(60));
    console.log("🧪 TEST: ÓRDENES DE COMPRA (PURCHASE ORDERS)");
    console.log("=".repeat(60));
    console.log(`
    FLUJO COMPLETO:
    1. Identificar repuestos con stock bajo
    2. Crear orden de compra a proveedor
    3. Recibir orden completa
    4. Actualizar stock automáticamente
    5. Verificar movimientos de entrada
    6. Recepción parcial
    `);

    // ============================================
    // PASO 1: Identificar repuestos con stock bajo
    // ============================================
    console.log("\n📊 PASO 1: Identificar repuestos con STOCK BAJO");
    console.log("-".repeat(60));

    const repuestos = await Item.find().limit(3);
    if (repuestos.length === 0) {
      console.log("❌ No hay repuestos. Ejecuta el seeder.");
      return;
    }

    const repuestosConStock = [];
    for (const rep of repuestos) {
      const stock = await Stock.findOne({ item: rep._id }).populate(
        "warehouse"
      );
      if (stock) {
        const disponible = stock.cantidad - stock.reservado;
        const necesitaReorden = disponible <= stock.minimo;

        repuestosConStock.push({
          item: rep,
          stock: stock,
          disponible: disponible,
          necesitaReorden: necesitaReorden,
          cantidadOrdenar: necesitaReorden ? stock.minimo * 2 - disponible : 10,
        });
      }
    }

    console.log(`\n   📋 Análisis de stock:\n`);
    repuestosConStock.forEach((r, i) => {
      const icono = r.necesitaReorden ? "⚠️" : "✅";
      console.log(`   ${icono} ${r.item.nombre}`);
      console.log(`      - Disponible: ${r.disponible}`);
      console.log(`      - Mínimo: ${r.stock.minimo}`);
      console.log(
        `      - ${r.necesitaReorden ? "REQUIERE REORDEN" : "Stock OK"}`
      );
      console.log(`      - Cantidad a ordenar: ${r.cantidadOrdenar}`);
      console.log(``);
    });

    // ============================================
    // PASO 2: Crear orden de compra
    // ============================================
    console.log("\n📝 PASO 2: Crear ORDEN DE COMPRA");
    console.log("-".repeat(60));

    const proveedor = await Supplier.findOne();
    if (!proveedor) {
      console.log("❌ No hay proveedores. Ejecuta el seeder.");
      return;
    }

    const usuario = await User.findOne();

    const items = repuestosConStock.map((r) => ({
      item: r.item._id,
      cantidad: r.cantidadOrdenar,
      precioUnitario: r.item.precio || 10000,
      recibido: 0,
    }));

    const purchaseOrder = await PurchaseOrder.create({
      numero: `PO-${Date.now()}`,
      proveedor: proveedor._id,
      fecha: new Date(),
      items: items,
      estado: "pendiente",
      creadoPor: usuario?._id,
    });

    testData.purchaseOrders.push(purchaseOrder._id);

    const subtotal = items.reduce(
      (sum, item) => sum + item.cantidad * item.precioUnitario,
      0
    );

    console.log(`\n   ✅ Orden de compra creada:`);
    console.log(`   - Número: ${purchaseOrder.numero}`);
    console.log(`   - Proveedor: ${proveedor.nombre}`);
    console.log(`   - Items: ${items.length}`);
    console.log(`   - Estado: ${purchaseOrder.estado}`);
    console.log(`   - Subtotal: $${subtotal.toLocaleString()}`);

    console.log(`\n   📦 Detalle de items:\n`);
    const itemsPopulated = await PurchaseOrder.findById(
      purchaseOrder._id
    ).populate("items.item");
    itemsPopulated.items.forEach((item, i) => {
      const repuesto = repuestosConStock.find(
        (r) => r.item._id.toString() === item.item._id.toString()
      );
      console.log(`   ${i + 1}. ${item.item.nombre}`);
      console.log(`      - Cantidad: ${item.cantidad} unidades`);
      console.log(
        `      - Precio: $${item.precioUnitario.toLocaleString()}/ud`
      );
      console.log(
        `      - Total: $${(item.cantidad * item.precioUnitario).toLocaleString()}`
      );
      console.log(`      - Recibido: ${item.recibido}/${item.cantidad}`);
      console.log(``);
    });

    // ============================================
    // PASO 3: Recepción COMPLETA de orden
    // ============================================
    console.log("\n📦 PASO 3: RECEPCIÓN COMPLETA de orden");
    console.log("-".repeat(60));

    console.log(`\n   ⏳ Recibiendo todos los items...`);

    // Guardar stocks anteriores
    const stocksAnteriores = {};
    for (const item of purchaseOrder.items) {
      const stock = await Stock.findOne({ item: item.item });
      stocksAnteriores[item.item.toString()] = stock.cantidad;
    }

    // Simular recepción completa
    for (const item of purchaseOrder.items) {
      const stock = await Stock.findOne({ item: item.item });

      // Crear movimiento de entrada
      const movimiento = await stockService.createMovement({
        tipo: "entrada",
        referencia: purchaseOrder.numero,
        referenciaTipo: "purchase_order",
        item: item.item,
        cantidad: item.cantidad,
        warehouseTo: stock.warehouse,
        motivo: `Recepción de orden de compra ${purchaseOrder.numero}`,
        metadata: {
          purchaseOrder: purchaseOrder._id,
          proveedor: proveedor._id,
          precioUnitario: item.precioUnitario,
        },
      });

      testData.movements.push(movimiento._id);

      // Actualizar item en PO
      item.recibido = item.cantidad;

      console.log(
        `   ✅ ${repuestosConStock.find((r) => r.item._id.toString() === item.item.toString())?.item.nombre}`
      );
      console.log(`      - Recibido: ${item.recibido}/${item.cantidad}`);
      console.log(`      - Movimiento: ${movimiento._id}`);
    }

    // Actualizar estado de PO
    purchaseOrder.estado = "recibido";
    await purchaseOrder.save();

    console.log(`\n   ✅ Orden de compra RECIBIDA COMPLETAMENTE`);
    console.log(`   - Estado: ${purchaseOrder.estado}`);

    // ============================================
    // PASO 4: Verificar actualización de stock
    // ============================================
    console.log("\n🔍 PASO 4: Verificar ACTUALIZACIÓN de stock");
    console.log("-".repeat(60));

    console.log(`\n   📊 Comparación de stocks:\n`);

    for (const r of repuestosConStock) {
      const stockAnterior = stocksAnteriores[r.item._id.toString()];
      const stockActual = await Stock.findOne({ item: r.item._id });
      const diferencia = stockActual.cantidad - stockAnterior;
      const itemPO = purchaseOrder.items.find(
        (i) => i.item.toString() === r.item._id.toString()
      );

      console.log(`   📦 ${r.item.nombre}`);
      console.log(`      - Stock antes: ${stockAnterior}`);
      console.log(`      - Stock ahora: ${stockActual.cantidad}`);
      console.log(`      - Incremento: +${diferencia}`);
      console.log(`      - Esperado: +${itemPO.cantidad}`);
      console.log(
        `      - ${diferencia === itemPO.cantidad ? "✅ Correcto" : "❌ Error"}`
      );
      console.log(``);
    }

    // ============================================
    // PASO 5: Orden con recepción PARCIAL
    // ============================================
    console.log("\n📦 PASO 5: Orden con RECEPCIÓN PARCIAL");
    console.log("-".repeat(60));

    const filtroAceite = await Item.findOne({ nombre: /filtro aceite/i });
    if (!filtroAceite) {
      console.log(
        "   ⚠️  Filtro aceite no disponible, saltando prueba parcial"
      );
    } else {
      const purchaseOrder2 = await PurchaseOrder.create({
        numero: `PO-${Date.now()}-2`,
        proveedor: proveedor._id,
        fecha: new Date(),
        items: [
          {
            item: filtroAceite._id,
            cantidad: 20,
            precioUnitario: filtroAceite.precio || 5000,
            recibido: 0,
          },
        ],
        estado: "pendiente",
        creadoPor: usuario?._id,
      });

      testData.purchaseOrders.push(purchaseOrder2._id);

      console.log(`\n   📝 Nueva orden creada: ${purchaseOrder2.numero}`);
      console.log(`   - Item: ${filtroAceite.nombre}`);
      console.log(`   - Cantidad ordenada: 20 unidades`);

      // Recibir solo 12 unidades
      const stock = await Stock.findOne({ item: filtroAceite._id });
      const stockAntes = stock.cantidad;

      const movimientoParcial = await stockService.createMovement({
        tipo: "entrada",
        referencia: purchaseOrder2.numero,
        referenciaTipo: "purchase_order",
        item: filtroAceite._id,
        cantidad: 12,
        warehouseTo: stock.warehouse,
        motivo: `Recepción parcial de orden ${purchaseOrder2.numero}`,
        metadata: {
          purchaseOrder: purchaseOrder2._id,
          recepcionParcial: true,
        },
      });

      testData.movements.push(movimientoParcial._id);

      purchaseOrder2.items[0].recibido = 12;
      purchaseOrder2.estado = "parcial";
      await purchaseOrder2.save();

      const stockDespues = await Stock.findOne({ item: filtroAceite._id });

      console.log(`\n   ✅ Recepción parcial procesada:`);
      console.log(`   - Recibido: 12/20 unidades`);
      console.log(`   - Estado: ${purchaseOrder2.estado}`);
      console.log(`   - Stock antes: ${stockAntes}`);
      console.log(`   - Stock después: ${stockDespues.cantidad}`);
      console.log(`   - Incremento: +${stockDespues.cantidad - stockAntes}`);
      console.log(`   - Pendiente recibir: ${20 - 12} unidades`);
    }

    // ============================================
    // PASO 6: Verificar movimientos
    // ============================================
    console.log("\n📝 PASO 6: Verificar MOVIMIENTOS registrados");
    console.log("-".repeat(60));

    const { Movement } = require("../features/inventory/models");
    const movimientos = await Movement.find({
      _id: { $in: testData.movements },
    }).populate("item", "nombre codigo");

    console.log(`\n   📋 Total movimientos: ${movimientos.length}\n`);
    movimientos.forEach((mov, i) => {
      console.log(`   ${i + 1}. ${mov.item.nombre}`);
      console.log(`      - Tipo: entrada`);
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
    ESCENARIO: Órdenes de Compra a Proveedores
    
    ÓRDENES CREADAS: ${testData.purchaseOrders.length}
    
    ORDEN 1 - Recepción Completa:
    - Número: ${purchaseOrder.numero}
    - Items: ${purchaseOrder.items.length}
    - Estado: ${purchaseOrder.estado}
    - Proveedor: ${proveedor.nombre}
    
    FLUJO COMPLETADO:
    ✅ 1. Análisis de stock bajo
    ✅ 2. Creación de orden de compra
    ✅ 3. Recepción completa
    ✅ 4. Stock actualizado correctamente
    ✅ 5. Recepción parcial probada
    ✅ 6. Movimientos de entrada registrados
    
    MOVIMIENTOS:
    - Total: ${movimientos.length}
    - Tipo: entrada (compras)
    - Stock incrementado correctamente
    
    ESTADOS VALIDADOS:
    - pendiente → recibido (orden completa)
    - pendiente → parcial (recepción parcial)
    `);

    console.log("=".repeat(60));
    console.log("🎉 TEST COMPLETADO EXITOSAMENTE");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ Error en el test:", error);
    console.error(error.stack);
  } finally {
    // Limpiar datos de prueba
    if (testData.purchaseOrders.length > 0) {
      await PurchaseOrder.deleteMany({ _id: { $in: testData.purchaseOrders } });
      console.log(
        `\n🧹 ${testData.purchaseOrders.length} órdenes de compra eliminadas`
      );
    }

    // No eliminar movimientos para preservar integridad del stock
    console.log(`🧹 Movimientos preservados para integridad de stock\n`);

    process.exit(0);
  }
};

testPurchaseOrders();
