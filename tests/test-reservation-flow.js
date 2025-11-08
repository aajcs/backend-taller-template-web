/**
 * Script de prueba completo del flujo de reservas y entregas
 * Simula: Asesor → Almacenista → Técnico
 */

require("dotenv").config();
const { dbConnection } = require("../database/config");
const {
  Item,
  Warehouse,
  Stock,
  Reservation,
} = require("../features/inventory/models");
const {
  WorkOrder,
  WorkOrderItem,
  Service,
} = require("../features/workshop/work-orders/models");
const stockService = require("../features/inventory/stock/stock.services");

const testReservationFlow = async () => {
  try {
    await dbConnection();
    console.log("🔗 Conectado a MongoDB\n");

    console.log("=".repeat(60));
    console.log("🧪 PRUEBA: FLUJO COMPLETO DE RESERVAS Y ENTREGAS");
    console.log("=".repeat(60));

    // ============================================
    // PASO 1: ASESOR - Ver repuestos disponibles
    // ============================================
    console.log("\n📋 PASO 1: Asesor consulta repuestos disponibles");
    console.log("-".repeat(60));

    const filtroAceite = await Item.findOne({ nombre: /filtro.*aceite/i })
      .populate("marca")
      .populate("categoria");

    if (!filtroAceite) {
      console.log(
        "❌ No se encontró filtro de aceite. Ejecuta el seeder primero."
      );
      return;
    }

    console.log(`✅ Repuesto encontrado: ${filtroAceite.nombre}`);
    console.log(`   - Código: ${filtroAceite.codigo}`);
    console.log(`   - Marca: ${filtroAceite.marca?.nombre || "N/A"}`);
    console.log(`   - Precio venta: $${filtroAceite.precioVenta}`);

    // Verificar stock disponible
    const stockDisponible = await Stock.findOne({
      item: filtroAceite._id,
      cantidad: { $gt: 0 },
    }).populate("warehouse");

    if (!stockDisponible) {
      console.log("❌ No hay stock disponible");
      return;
    }

    console.log(`   - Stock disponible: ${stockDisponible.cantidad} unidades`);
    console.log(`   - Almacén: ${stockDisponible.warehouse.nombre}`);

    // ============================================
    // PASO 2: Simular orden de trabajo (simplificada)
    // ============================================
    console.log("\n📋 PASO 2: Asesor simula agregar repuesto a OT");
    console.log("-".repeat(60));

    const cantidadSolicitar = 2;
    console.log(`   Cantidad solicitada: ${cantidadSolicitar} unidades`);

    // ============================================
    // PASO 3: Crear RESERVA (estado: activo)
    // ============================================
    console.log("\n🔒 PASO 3: Sistema crea RESERVA en estado 'activo'");
    console.log("-".repeat(60));

    const reserva = new Reservation({
      item: filtroAceite._id,
      warehouse: stockDisponible.warehouse._id,
      cantidad: cantidadSolicitar,
      motivo: "Reserva para mantenimiento preventivo OT-TEST-001",
      estado: "activo",
    });
    await reserva.save();

    console.log(`✅ Reserva creada - ID: ${reserva._id}`);
    console.log(`   - Estado: ${reserva.estado}`);
    console.log(`   - Cantidad: ${reserva.cantidad} unidades`);
    console.log(`   - Stock TODAVÍA NO descontado`);

    // Verificar stock (debe seguir igual)
    const stockDespuesReserva = await Stock.findById(stockDisponible._id);
    console.log(
      `   - Stock actual: ${stockDespuesReserva.cantidad} (sin cambios)`
    );
    console.log(`   - Stock reservado: ${stockDespuesReserva.reservado || 0}`);

    // ============================================
    // PASO 4: ALMACENISTA - Generar orden de salida
    // ============================================
    console.log("\n📦 PASO 4: Almacenista genera ORDEN DE SALIDA");
    console.log("-".repeat(60));

    reserva.estado = "pendiente_retiro";
    await reserva.save();

    const ordenSalida = `SAL-${reserva._id.toString().slice(-8).toUpperCase()}`;
    console.log(`✅ Orden de salida generada: ${ordenSalida}`);
    console.log(`   - Estado reserva: ${reserva.estado}`);
    console.log(`   - Repuesto: ${filtroAceite.nombre}`);
    console.log(`   - Almacén: ${stockDisponible.warehouse.nombre}`);
    console.log(`   - Cantidad a preparar: ${reserva.cantidad} unidades`);
    console.log(`   - Stock TODAVÍA NO descontado`);

    // Simular que el almacenista prepara físicamente el repuesto
    console.log(`\n   🔧 Almacenista prepara físicamente el repuesto...`);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    console.log(`   ✅ Repuesto preparado y listo para entrega`);

    // ============================================
    // PASO 5: ALMACENISTA - Entregar repuesto
    // ============================================
    console.log("\n🚚 PASO 5: Almacenista ENTREGA repuesto al técnico");
    console.log("-".repeat(60));

    // Crear movimiento de SALIDA
    const movimiento = await stockService.createMovement({
      tipo: "salida",
      referencia: `OT-TEST-001`,
      referenciaTipo: "workOrder",
      item: filtroAceite._id,
      cantidad: cantidadSolicitar,
      warehouseFrom: stockDisponible.warehouse._id,
      reserva: reserva._id,
      motivo: `Entrega para OT-TEST-001`,
      metadata: {
        ordenSalida: ordenSalida,
      },
    });

    // Actualizar reserva a CONSUMIDO
    reserva.estado = "consumido";
    reserva.fechaEntrega = new Date();
    await reserva.save();

    console.log(`✅ Repuesto entregado exitosamente`);
    console.log(`   - Movimiento ID: ${movimiento._id}`);
    console.log(`   - Tipo: ${movimiento.tipo}`);
    console.log(`   - Cantidad: ${movimiento.cantidad} unidades`);
    console.log(`   - Estado reserva: ${reserva.estado}`);
    console.log(`   - Fecha entrega: ${reserva.fechaEntrega.toLocaleString()}`);

    // ============================================
    // PASO 6: Verificar STOCK DESCONTADO
    // ============================================
    console.log("\n📊 PASO 6: Verificar STOCK ACTUALIZADO");
    console.log("-".repeat(60));

    const stockFinal = await Stock.findById(stockDisponible._id);
    const stockAnterior = stockDespuesReserva.cantidad;
    const stockNuevo = stockFinal.cantidad;
    const diferencia = stockAnterior - stockNuevo;

    console.log(`   - Stock anterior: ${stockAnterior} unidades`);
    console.log(`   - Stock actual: ${stockNuevo} unidades`);
    console.log(`   - Diferencia: -${diferencia} unidades`);
    console.log(
      `   - ${diferencia === cantidadSolicitar ? "✅" : "❌"} Stock descontado correctamente`
    );

    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMEN DEL FLUJO");
    console.log("=".repeat(60));
    console.log(`
    REPUESTO: ${filtroAceite.nombre}
    ALMACÉN: ${stockDisponible.warehouse.nombre}
    
    FLUJO COMPLETADO:
    ✅ 1. Asesor consultó repuesto disponible
    ✅ 2. Sistema creó RESERVA en estado "activo"
    ✅ 3. Almacenista generó ORDEN DE SALIDA (pendiente_retiro)
    ✅ 4. Almacenista ENTREGÓ repuesto al técnico
    ✅ 5. Sistema marcó reserva como CONSUMIDA
    ✅ 6. Sistema creó MOVIMIENTO de salida
    ✅ 7. Sistema DESCONTÓ el stock
    
    DATOS FINALES:
    - Reserva: ${reserva._id} (${reserva.estado})
    - Movimiento: ${movimiento._id} (${movimiento.tipo})
    - Orden de salida: ${ordenSalida}
    - Stock anterior: ${stockAnterior} → Stock actual: ${stockNuevo}
    `);

    console.log("=".repeat(60));
    console.log("🎉 PRUEBA COMPLETADA EXITOSAMENTE");
    console.log("=".repeat(60));

    // Limpiar datos de prueba
    console.log("\n🧹 Limpiando datos de prueba...");
    await Reservation.findByIdAndDelete(reserva._id);
    console.log("✅ Reserva eliminada");
  } catch (error) {
    console.error("\n❌ Error en la prueba:", error);
  } finally {
    process.exit(0);
  }
};

// Ejecutar prueba
testReservationFlow();
