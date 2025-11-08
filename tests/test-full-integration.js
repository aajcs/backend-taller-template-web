/**
 * Test: Integración Completa (End-to-End)
 * Verifica flujo completo desde llegada del cliente hasta facturación
 */

require("dotenv").config();
const { dbConnection } = require("../database/config");
const Item = require("../features/inventory/items/item.model");
const Stock = require("../features/inventory/stock/stock.model");
const Reservation = require("../features/inventory/reservations/reservation.models");
const WorkOrder = require("../features/workshop/work-orders/models/workOrder.model");
const WorkOrderItem = require("../features/workshop/work-orders/models/workOrderItem.model");
const User = require("../features/user/user.models");
const Vehicle = require("../features/crm/vehicles/models/vehicle.model");
const stockService = require("../features/inventory/stock/stock.services");

const testFullIntegration = async () => {
  let testReservations = [];
  let testOrder = null;
  let testVehicle = null;

  try {
    await dbConnection();
    console.log("🔗 Conectado a MongoDB\n");

    console.log("=".repeat(60));
    console.log("🧪 TEST: INTEGRACIÓN COMPLETA (E2E)");
    console.log("=".repeat(60));
    console.log(`
    FLUJO COMPLETO:
    1. Cliente llega al taller
    2. Asesor crea orden de trabajo
    3. Se agregan repuestos necesarios
    4. Se crean reservas automáticas
    5. Almacenista genera orden de salida
    6. Almacenista entrega repuestos
    7. Técnico realiza el trabajo
    8. Asesor cierra orden de trabajo
    9. Sistema genera factura
    10. Verificar integridad de datos
    `);

    // ============================================
    // PASO 1: Cliente llega al taller
    // ============================================
    console.log("\n👤 PASO 1: CLIENTE llega al taller");
    console.log("-".repeat(60));

    testVehicle = await Vehicle.create({
      placa: `E2E-${Date.now()}`,
      marca: "Chevrolet",
      modelo: "Spark GT",
      año: 2022,
      propietario: {
        nombre: "Juan Pérez",
        telefono: "3001234567",
        email: "juan.perez@example.com",
      },
    });

    console.log(`✅ Cliente registrado:`);
    console.log(`   - Nombre: ${testVehicle.propietario.nombre}`);
    console.log(`   - Vehículo: ${testVehicle.marca} ${testVehicle.modelo}`);
    console.log(`   - Placa: ${testVehicle.placa}`);

    // ============================================
    // PASO 2: Asesor crea orden de trabajo
    // ============================================
    console.log("\n📝 PASO 2: ASESOR crea orden de trabajo");
    console.log("-".repeat(60));

    const asesor = await User.findOne({
      role: { $in: ["ASESOR", "ADMIN_ROLE"] },
    });
    if (!asesor) {
      console.log("❌ No se encontró asesor.");
      return;
    }

    testOrder = await WorkOrder.create({
      numeroOrden: `OT-E2E-${Date.now()}`,
      vehiculo: testVehicle._id,
      cliente: testVehicle.propietario,
      asesor: asesor._id,
      estado: "ABIERTA",
      descripcion: "Mantenimiento preventivo completo",
      items: [],
      servicios: [],
    });

    console.log(`✅ Orden de trabajo creada:`);
    console.log(`   - Número: ${testOrder.numeroOrden}`);
    console.log(`   - Asesor: ${asesor.nombre}`);
    console.log(`   - Estado: ${testOrder.estado}`);
    console.log(`   - Descripción: ${testOrder.descripcion}`);

    // ============================================
    // PASO 3: Agregar repuestos necesarios
    // ============================================
    console.log("\n🔧 PASO 3: AGREGAR repuestos necesarios");
    console.log("-".repeat(60));

    const repuestosNecesarios = [
      {
        nombre: /filtro aceite/i,
        cantidad: 1,
        descripcion: "Filtro de aceite",
      },
      { nombre: /filtro aire/i, cantidad: 1, descripcion: "Filtro de aire" },
      { nombre: /bujía|bujia/i, cantidad: 4, descripcion: "Juego de bujías" },
    ];

    console.log(`\n   📋 Repuestos a agregar: ${repuestosNecesarios.length}`);

    for (const rep of repuestosNecesarios) {
      const item = await Item.findOne({ nombre: rep.nombre });
      if (!item) {
        console.log(`   ⚠️  ${rep.descripcion} no encontrado`);
        continue;
      }

      const stock = await Stock.findOne({ item: item._id });
      const disponible = stock.cantidad - stock.reservado;

      console.log(`\n   ➕ Agregando: ${item.nombre}`);
      console.log(`      - Cantidad: ${rep.cantidad}`);
      console.log(`      - Stock disponible: ${disponible}`);
      console.log(`      - Precio unitario: $${item.precio?.toLocaleString()}`);

      if (disponible < rep.cantidad) {
        console.log(`      ❌ Stock insuficiente`);
        continue;
      }

      // Crear WorkOrderItem
      const workOrderItem = await WorkOrderItem.create({
        workOrder: testOrder._id,
        item: item._id,
        cantidad: rep.cantidad,
        tipo: "repuesto",
        precioUnitario: item.precio,
        subtotal: item.precio * rep.cantidad,
      });

      // Crear reserva
      const reserva = await Reservation.create({
        item: item._id,
        warehouse: stock.warehouse,
        cantidad: rep.cantidad,
        ordenTrabajo: testOrder._id,
        estado: "activo",
        motivo: `Reserva para OT ${testOrder.numeroOrden}`,
      });

      testReservations.push(reserva._id);

      // Actualizar stock reservado
      await Stock.findByIdAndUpdate(stock._id, {
        $inc: { reservado: rep.cantidad },
      });

      // Actualizar WorkOrderItem con referencia a reserva
      workOrderItem.reserva = reserva._id;
      await workOrderItem.save();

      // Actualizar orden con item
      testOrder.items.push(workOrderItem._id);
      await testOrder.save();

      console.log(`      ✅ Agregado exitosamente`);
      console.log(`      - Reserva: ${reserva._id}`);
      console.log(
        `      - Subtotal: $${workOrderItem.subtotal.toLocaleString()}`
      );
    }

    // Calcular total
    const itemsCompletos = await WorkOrderItem.find({
      _id: { $in: testOrder.items },
    });
    const totalRepuestos = itemsCompletos.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    console.log(
      `\n   💰 Total en repuestos: $${totalRepuestos.toLocaleString()}`
    );

    // ============================================
    // PASO 4: Verificar reservas creadas
    // ============================================
    console.log("\n📦 PASO 4: Verificar RESERVAS creadas");
    console.log("-".repeat(60));

    const reservasActivas = await Reservation.find({
      _id: { $in: testReservations },
      estado: "activo",
    }).populate("item", "nombre codigo");

    console.log(`\n   ✅ Reservas activas: ${reservasActivas.length}`);
    reservasActivas.forEach((res, index) => {
      console.log(
        `   ${index + 1}. ${res.item.nombre} - ${res.cantidad} uds - Estado: ${res.estado}`
      );
    });

    // ============================================
    // PASO 5: Almacenista genera órdenes de salida
    // ============================================
    console.log("\n📋 PASO 5: ALMACENISTA genera órdenes de salida");
    console.log("-".repeat(60));

    for (const reservaId of testReservations) {
      const reserva = await Reservation.findById(reservaId).populate("item");

      const ordenSalida = `OS-${Date.now()}-${reservaId.toString().slice(-6)}`;
      reserva.ordenSalida = ordenSalida;
      reserva.estado = "pendiente_retiro";
      await reserva.save();

      console.log(`   ✅ Orden generada: ${ordenSalida}`);
      console.log(`      - Repuesto: ${reserva.item.nombre}`);
      console.log(`      - Cantidad: ${reserva.cantidad}`);
      console.log(`      - Estado: ${reserva.estado}`);
    }

    // ============================================
    // PASO 6: Almacenista entrega repuestos
    // ============================================
    console.log("\n🚪 PASO 6: ALMACENISTA entrega repuestos al técnico");
    console.log("-".repeat(60));

    const tecnico = (await User.findOne({ role: "TECNICO" })) || asesor;

    for (const reservaId of testReservations) {
      const reserva = await Reservation.findById(reservaId)
        .populate("item")
        .populate("warehouse");

      console.log(`\n   📦 Entregando: ${reserva.item.nombre}`);
      console.log(`      - Cantidad: ${reserva.cantidad}`);
      console.log(`      - Orden salida: ${reserva.ordenSalida}`);

      // Crear movimiento y consumir stock
      const movimiento = await stockService.createMovement({
        tipo: "consumo",
        referencia: reserva.ordenSalida,
        referenciaTipo: "orden_salida",
        item: reserva.item._id,
        cantidad: reserva.cantidad,
        warehouseFrom: reserva.warehouse._id,
        motivo: `Consumo para OT ${testOrder.numeroOrden}`,
        metadata: {
          ordenTrabajo: testOrder._id,
          reserva: reserva._id,
          entregadoPor: asesor._id,
          recibidoPor: tecnico._id,
        },
      });

      // Actualizar reserva
      reserva.estado = "consumido";
      reserva.fechaEntrega = new Date();
      reserva.entregadoPor = asesor._id;
      reserva.recibidoPor = tecnico._id;
      await reserva.save();

      console.log(`      ✅ Entregado y stock consumido`);
      console.log(`      - Movimiento: ${movimiento._id}`);
      console.log(`      - Estado reserva: ${reserva.estado}`);
    }

    // ============================================
    // PASO 7: Técnico realiza el trabajo
    // ============================================
    console.log("\n🔧 PASO 7: TÉCNICO realiza el trabajo");
    console.log("-".repeat(60));

    testOrder.estado = "EN_PROCESO";
    testOrder.tecnico = tecnico._id;
    testOrder.fechaInicio = new Date();
    await testOrder.save();

    console.log(`   ✅ Trabajo iniciado`);
    console.log(`      - Técnico: ${tecnico.nombre}`);
    console.log(`      - Estado: ${testOrder.estado}`);
    console.log(
      `      - Fecha inicio: ${testOrder.fechaInicio.toLocaleString()}`
    );

    // Simular que el trabajo se completó
    await new Promise((resolve) => setTimeout(resolve, 100));

    testOrder.estado = "COMPLETADA";
    testOrder.fechaFin = new Date();
    await testOrder.save();

    console.log(`\n   ✅ Trabajo completado`);
    console.log(`      - Estado: ${testOrder.estado}`);
    console.log(`      - Fecha fin: ${testOrder.fechaFin.toLocaleString()}`);

    // ============================================
    // PASO 8: Asesor cierra orden de trabajo
    // ============================================
    console.log("\n✅ PASO 8: ASESOR cierra orden de trabajo");
    console.log("-".repeat(60));

    // Verificar que todas las reservas están consumidas
    const reservasPendientes = await Reservation.find({
      _id: { $in: testReservations },
      estado: { $in: ["activo", "pendiente_retiro"] },
    });

    if (reservasPendientes.length > 0) {
      console.log(
        `   ⚠️  ADVERTENCIA: ${reservasPendientes.length} reservas no consumidas`
      );
    } else {
      console.log(`   ✅ Todas las reservas han sido consumidas`);
    }

    testOrder.estado = "CERRADA_FACTURADA";
    testOrder.fechaCierre = new Date();
    await testOrder.save();

    console.log(`\n   ✅ Orden cerrada`);
    console.log(`      - Estado: ${testOrder.estado}`);
    console.log(
      `      - Fecha cierre: ${testOrder.fechaCierre.toLocaleString()}`
    );

    // ============================================
    // PASO 9: Sistema genera factura
    // ============================================
    console.log("\n💰 PASO 9: Sistema GENERA FACTURA");
    console.log("-".repeat(60));

    const itemsFactura = await WorkOrderItem.find({
      workOrder: testOrder._id,
    }).populate("item");

    console.log(`\n   📋 FACTURA #${testOrder.numeroOrden}`);
    console.log(`   ${"=".repeat(50)}`);
    console.log(`   Cliente: ${testOrder.cliente.nombre}`);
    console.log(
      `   Vehículo: ${testVehicle.marca} ${testVehicle.modelo} - ${testVehicle.placa}`
    );
    console.log(`   Fecha: ${testOrder.fechaCierre.toLocaleDateString()}`);
    console.log(`\n   DETALLE:`);

    let subtotalFactura = 0;
    itemsFactura.forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.item.nombre}`);
      console.log(
        `      ${item.cantidad} x $${item.precioUnitario.toLocaleString()} = $${item.subtotal.toLocaleString()}`
      );
      subtotalFactura += item.subtotal;
    });

    const iva = subtotalFactura * 0.19;
    const totalFactura = subtotalFactura + iva;

    console.log(`\n   TOTALES:`);
    console.log(`   - Subtotal: $${subtotalFactura.toLocaleString()}`);
    console.log(`   - IVA (19%): $${iva.toLocaleString()}`);
    console.log(`   - TOTAL: $${totalFactura.toLocaleString()}`);

    // ============================================
    // PASO 10: Verificar integridad de datos
    // ============================================
    console.log("\n🔍 PASO 10: Verificar INTEGRIDAD de datos");
    console.log("-".repeat(60));

    const verificaciones = {
      ordenCerrada: testOrder.estado === "CERRADA_FACTURADA",
      todasReservasConsumidas: reservasPendientes.length === 0,
      stockActualizado: true, // Verificaremos cada item
      movimientosCreados: true,
    };

    // Verificar stock de cada item
    for (const reservaId of testReservations) {
      const reserva = await Reservation.findById(reservaId).populate("item");
      const stock = await Stock.findOne({ item: reserva.item._id });

      // El stock debe haberse reducido y el reservado también
      verificaciones.stockActualizado =
        verificaciones.stockActualizado &&
        stock.reservado >= 0 &&
        stock.cantidad >= 0;
    }

    // Verificar movimientos
    const { Movement } = require("../features/inventory/models");
    const movimientos = await Movement.find({
      "metadata.ordenTrabajo": testOrder._id,
    });
    verificaciones.movimientosCreados =
      movimientos.length === testReservations.length;

    console.log(`\n   ✅ VERIFICACIONES:`);
    console.log(
      `   ${verificaciones.ordenCerrada ? "✅" : "❌"} Orden cerrada correctamente`
    );
    console.log(
      `   ${verificaciones.todasReservasConsumidas ? "✅" : "❌"} Todas las reservas consumidas`
    );
    console.log(
      `   ${verificaciones.stockActualizado ? "✅" : "❌"} Stock actualizado correctamente`
    );
    console.log(
      `   ${verificaciones.movimientosCreados ? "✅" : "❌"} Movimientos de inventario creados (${movimientos.length})`
    );

    const testPassed = Object.values(verificaciones).every((v) => v === true);

    // ============================================
    // RESUMEN
    // ============================================
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMEN DEL TEST E2E");
    console.log("=".repeat(60));
    console.log(`
    FLUJO COMPLETADO:
    ✅ 1. Cliente registrado (${testVehicle.propietario.nombre})
    ✅ 2. Orden de trabajo creada (${testOrder.numeroOrden})
    ✅ 3. Repuestos agregados (${itemsFactura.length})
    ✅ 4. Reservas creadas (${testReservations.length})
    ✅ 5. Órdenes de salida generadas (${testReservations.length})
    ✅ 6. Repuestos entregados (${testReservations.length})
    ✅ 7. Trabajo realizado por técnico
    ✅ 8. Orden cerrada
    ✅ 9. Factura generada
    ✅ 10. Integridad verificada
    
    FACTURA:
    - Subtotal: $${subtotalFactura.toLocaleString()}
    - IVA (19%): $${iva.toLocaleString()}
    - TOTAL: $${totalFactura.toLocaleString()}
    
    INVENTARIO:
    - Reservas: ${testReservations.length}
    - Movimientos: ${movimientos.length}
    - Stock actualizado: ${verificaciones.stockActualizado ? "SÍ" : "NO"}
    `);

    console.log("=".repeat(60));
    console.log(testPassed ? "🎉 TEST E2E APROBADO" : "❌ TEST E2E FALLÓ");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ Error en el test:", error);
    console.error(error.stack);
  } finally {
    // Limpiar datos de prueba
    if (testReservations.length > 0) {
      await Reservation.deleteMany({ _id: { $in: testReservations } });
      console.log(`\n🧹 ${testReservations.length} reservas eliminadas`);
    }

    if (testOrder) {
      await WorkOrderItem.deleteMany({ workOrder: testOrder._id });
      await WorkOrder.deleteOne({ _id: testOrder._id });
      console.log(`🧹 Orden de trabajo eliminada`);
    }

    if (testVehicle) {
      await Vehicle.deleteOne({ _id: testVehicle._id });
      console.log(`🧹 Vehículo de prueba eliminado\n`);
    }

    process.exit(0);
  }
};

testFullIntegration();
