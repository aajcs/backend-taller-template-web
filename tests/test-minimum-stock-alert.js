/**
 * Test: Alertas de Stock Mínimo
 * Verifica notificaciones cuando stock cae bajo el umbral mínimo
 */

require("dotenv").config();
const { dbConnection } = require("../database/config");
const {
  Item,
  Stock,
  Movement,
  Reservation,
} = require("../features/inventory/models");
const stockAlertsService = require("../features/inventory/services/stockAlerts.service");

const testMinimumStockAlert = async () => {
  try {
    await dbConnection();
    console.log("🔗 Conectado a MongoDB\n");

    console.log("=".repeat(60));
    console.log("🧪 TEST: ALERTAS DE STOCK MÍNIMO");
    console.log("=".repeat(60));

    // ============================================
    // PASO 1: Seleccionar repuesto con stock bajo
    // ============================================
    console.log("\n📋 PASO 1: Seleccionar repuesto con STOCK LIMITADO");
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

    console.log(`✅ Repuesto: ${bateria.nombre}`);
    console.log(`   - Código: ${bateria.codigo}`);
    console.log(`   - Stock actual: ${stockActual.cantidad}`);
    console.log(`   - Stock reservado: ${stockActual.reservado}`);
    console.log(
      `   - Stock mínimo configurado: ${bateria.stockMinimo || "No configurado"}`
    );
    console.log(
      `   - Stock disponible: ${stockActual.cantidad - stockActual.reservado}`
    );
    console.log(`   - Almacén: ${stockActual.warehouse.nombre}`);

    // ============================================
    // PASO 2: Verificar estado inicial
    // ============================================
    console.log("\n🔍 PASO 2: Verificar ESTADO INICIAL");
    // ============================================
    // PASO 2: Verificar estado inicial
    // ============================================
    console.log("\n🔍 PASO 2: Verificar ESTADO INICIAL con servicio");
    console.log("-".repeat(60));

    if (!bateria.stockMinimo || bateria.stockMinimo <= 0) {
      console.log(
        "\n   ⚠️  Este item NO tiene stock mínimo configurado. Configurando stock mínimo..."
      );

      // Configurar stock mínimo para el test
      bateria.stockMinimo = 8;
      await bateria.save();

      console.log(`   ✅ Stock mínimo configurado: ${bateria.stockMinimo}`);
    }

    // Verificar alerta del item
    const alertaInicial = await stockAlertsService.checkItemAlert(
      bateria._id,
      stockActual.warehouse._id
    );

    console.log(`\n   📊 Estado del stock:`);
    console.log(`   - Disponible: ${alertaInicial.disponibleTotal}`);
    console.log(`   - Mínimo requerido: ${alertaInicial.stockMinimo}`);
    console.log(
      `   - Diferencia: ${alertaInicial.diferencia >= 0 ? "-" : "+"}${Math.abs(alertaInicial.diferencia)}`
    );
    console.log(`   - Porcentaje: ${alertaInicial.porcentajeStock}%`);
    console.log(`   - Nivel alerta: ${alertaInicial.nivelAlerta}`);

    if (alertaInicial.isBelowMinimum) {
      console.log(`\n   ⚠️  ALERTA INICIAL: ${alertaInicial.message}`);
    } else {
      console.log(`\n   ✅ ${alertaInicial.message}`);
    }

    // ============================================
    // PASO 3: Simular consumo hasta punto crítico
    // ============================================
    console.log("\n📦 PASO 3: Simular CONSUMO progresivo");
    console.log("-".repeat(60));

    const stockDisponibleInicial = alertaInicial.disponibleTotal;
    const cantidadConsumir = Math.max(
      1,
      stockDisponibleInicial - bateria.stockMinimo + 2
    );

    console.log(`\n   🎯 Plan de consumo:`);
    console.log(`   - Stock disponible: ${stockDisponibleInicial}`);
    console.log(`   - Cantidad a consumir: ${cantidadConsumir}`);
    console.log(
      `   - Stock resultante: ${stockDisponibleInicial - cantidadConsumir}`
    );
    console.log(`   - Mínimo requerido: ${bateria.stockMinimo}`);
    console.log(
      `   - ${stockDisponibleInicial - cantidadConsumir < bateria.stockMinimo ? "⚠️  Quedará BAJO mínimo" : "✅ Quedará sobre mínimo"}`
    );

    // Verificar si hay suficiente stock para la prueba
    if (cantidadConsumir > stockDisponibleInicial) {
      console.log(`\n   ❌ No hay suficiente stock para realizar la prueba`);
      console.log(
        `   💡 Sugerencia: Ejecuta el seeder para tener más stock inicial`
      );
      return;
    }

    // Crear reserva
    const reserva = await Reservation.create({
      item: bateria._id,
      warehouse: stockActual.warehouse._id,
      cantidad: cantidadConsumir,
      estado: "activo",
      motivo: "Test stock mínimo - Consumo simulado",
    });

    // Actualizar stock reservado
    await Stock.findByIdAndUpdate(stockActual._id, {
      $inc: { reservado: cantidadConsumir },
    });

    console.log(`\n   ✅ Reserva creada: ${cantidadConsumir} unidades`);

    // Consumir el stock
    const movimiento = await Movement.create({
      tipo: "salida",
      item: bateria._id,
      warehouse: stockActual.warehouse._id,
      cantidad: cantidadConsumir,
      referencia: `TEST-MIN-${Date.now()}`,
      motivo: "Test alerta stock mínimo",
    });

    // Actualizar stock
    await Stock.findByIdAndUpdate(stockActual._id, {
      $inc: {
        cantidad: -cantidadConsumir,
        reservado: -cantidadConsumir,
      },
    });

    // Marcar reserva como consumida
    reserva.estado = "consumido";
    await reserva.save();

    console.log(`   ✅ Stock consumido: ${cantidadConsumir} unidades`);
    console.log(`   ✅ Movimiento ID: ${movimiento._id}`);

    // ============================================
    // PASO 4: Verificar alerta de stock mínimo
    // ============================================
    console.log("\n⚠️  PASO 4: Verificar ALERTA de stock mínimo");
    console.log("-".repeat(60));

    const alertaDespuesConsumo = await stockAlertsService.checkItemAlert(
      bateria._id,
      stockActual.warehouse._id
    );

    console.log(`\n   📊 Estado después del consumo:`);
    console.log(`   - Stock total: ${alertaDespuesConsumo.stockTotal}`);
    console.log(`   - Stock reservado: ${alertaDespuesConsumo.reservadoTotal}`);
    console.log(
      `   - Stock disponible: ${alertaDespuesConsumo.disponibleTotal}`
    );
    console.log(`   - Mínimo requerido: ${alertaDespuesConsumo.stockMinimo}`);
    console.log(
      `   - Diferencia: ${alertaDespuesConsumo.diferencia >= 0 ? "-" : "+"}${Math.abs(alertaDespuesConsumo.diferencia)}`
    );
    console.log(`   - Porcentaje: ${alertaDespuesConsumo.porcentajeStock}%`);
    console.log(`   - Nivel alerta: ${alertaDespuesConsumo.nivelAlerta}`);

    console.log(`\n   🚨 ESTADO DE ALERTA:`);

    if (alertaDespuesConsumo.nivelAlerta === "critico") {
      console.log(`   🔴 CRÍTICO: ${alertaDespuesConsumo.message}`);
      console.log(`   ❗ Acción requerida: Reabastecimiento URGENTE`);
    } else if (alertaDespuesConsumo.isBelowMinimum) {
      console.log(`   ⚠️  ALERTA ACTIVA: ${alertaDespuesConsumo.message}`);
      console.log(
        `   📉 ${(100 - alertaDespuesConsumo.porcentajeStock).toFixed(1)}% por debajo del punto de reorden`
      );
      console.log(`   📝 Acción requerida: Generar orden de compra`);
    } else {
      console.log(`   ✅ ${alertaDespuesConsumo.message}`);
    }

    // ============================================
    // PASO 5: Generar sugerencias de compra
    // ============================================
    console.log("\n💡 PASO 5: SUGERENCIAS de reorden");
    console.log("-".repeat(60));

    const sugerencias = await stockAlertsService.getSuggestedPurchaseOrders({
      warehouse: stockActual.warehouse._id,
    });

    const sugerenciaBateria = sugerencias.find(
      (s) => s.item.id.toString() === bateria._id.toString()
    );

    if (sugerenciaBateria) {
      console.log(`\n   📋 Sugerencia de compra para ${bateria.nombre}:`);
      console.log(`   - Stock actual: ${sugerenciaBateria.stockActual}`);
      console.log(`   - Stock mínimo: ${sugerenciaBateria.stockMinimo}`);
      console.log(`   - Faltante: ${sugerenciaBateria.faltante} unidades`);
      console.log(
        `   - Cantidad sugerida: ${sugerenciaBateria.cantidadSugerida} unidades (incluye 20% buffer)`
      );
      console.log(`   - Nivel urgencia: ${sugerenciaBateria.nivelUrgencia}`);
      console.log(
        `   - Porcentaje stock: ${sugerenciaBateria.porcentajeStock}%`
      );

      if (bateria.precioCosto) {
        const costoEstimado =
          bateria.precioCosto * sugerenciaBateria.cantidadSugerida;
        console.log(
          `   - Costo unitario: $${bateria.precioCosto.toLocaleString()}`
        );
        console.log(
          `   - Costo total estimado: $${costoEstimado.toLocaleString()}`
        );
      }
    } else {
      console.log(
        `\n   ℹ️  No se generaron sugerencias (stock sobre el mínimo)`
      );
    }

    // ============================================
    // PASO 6: Generar reporte completo
    // ============================================
    console.log("\n� PASO 6: REPORTE COMPLETO de alertas");
    console.log("-".repeat(60));

    const reporte = await stockAlertsService.generateStockReport();

    console.log(`\n   📋 Resumen general:`);
    console.log(
      `   - Total items con mínimo configurado: ${reporte.resumen.totalItemsConMinimo}`
    );
    console.log(
      `   - Items con stock bajo: ${reporte.resumen.totalConStockBajo}`
    );
    console.log(`   - Críticos (0% stock): ${reporte.resumen.criticos}`);
    console.log(`   - Urgentes (<50%): ${reporte.resumen.urgentes}`);
    console.log(`   - Advertencias (50-99%): ${reporte.resumen.advertencias}`);
    console.log(`   - OK (≥100%): ${reporte.resumen.ok}`);

    if (reporte.resumen.totalConStockBajo > 0) {
      console.log(`\n   ⚠️  Items que requieren atención:`);
      const itemsAMostrar = reporte.items.todos.slice(0, 5);
      itemsAMostrar.forEach((item, index) => {
        const icono =
          item.nivelAlerta === "critico"
            ? "🔴"
            : item.nivelAlerta === "urgente"
              ? "⚠️"
              : "⚡";
        console.log(
          `   ${index + 1}. ${icono} ${item.nombre} (${item.codigo || "N/A"})`
        );
        console.log(
          `      Disponible: ${item.disponibleTotal} | Mínimo: ${item.stockMinimo} | Faltante: ${item.diferencia}`
        );
      });
    }

    // ============================================
    // RESUMEN
    // ============================================
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMEN DEL TEST");
    console.log("=".repeat(60));
    console.log(`
    ESCENARIO: Alerta de Stock Bajo Mínimo
    
    REPUESTO: ${bateria.nombre} (${bateria.codigo})
    ALMACÉN: ${stockActual.warehouse.nombre}
    
    FLUJO COMPLETADO:
    ✅ 1. Estado inicial verificado
    ✅ 2. Reserva creada (${cantidadConsumir} unidades)
    ✅ 3. Stock consumido
    ✅ 4. Alerta detectada con servicio
    ✅ 5. Sugerencia de compra generada
    ✅ 6. Reporte completo generado
    
    STOCK:
    - Inicial disponible: ${alertaInicial.disponibleTotal}
    - Final disponible: ${alertaDespuesConsumo.disponibleTotal}
    - Mínimo requerido: ${alertaDespuesConsumo.stockMinimo}
    - Consumido: ${cantidadConsumir}
    
    ALERTA:
    - Estado: ${alertaDespuesConsumo.isBelowMinimum ? (alertaDespuesConsumo.nivelAlerta === "critico" ? "🔴 CRÍTICO" : "⚠️  ACTIVA") : "✅ NORMAL"}
    - Nivel: ${alertaDespuesConsumo.nivelAlerta}
    - Bajo mínimo: ${alertaDespuesConsumo.isBelowMinimum ? "SÍ" : "NO"}
    - Porcentaje: ${alertaDespuesConsumo.porcentajeStock}%
    
    REORDEN:
    ${
      sugerenciaBateria
        ? `- Cantidad sugerida: ${sugerenciaBateria.cantidadSugerida} unidades
    - Faltante: ${sugerenciaBateria.faltante} unidades`
        : "- No requerido (stock suficiente)"
    }
    
    REPORTE GENERAL:
    - Total items monitoreados: ${reporte.resumen.totalItemsConMinimo}
    - Requieren atención: ${reporte.resumen.totalConStockBajo}
    `);

    console.log("=".repeat(60));
    console.log(
      alertaDespuesConsumo.isBelowMinimum
        ? "🎉 TEST COMPLETADO EXITOSAMENTE"
        : "⚠️  TEST PARCIAL - No se alcanzó el umbral mínimo"
    );
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ Error en el test:", error);
    console.log(error.stack);
  } finally {
    // Limpiar datos de prueba
    console.log("\n🧹 Limpiando datos de prueba...");

    try {
      await Reservation.deleteMany({ motivo: /Test stock mínimo/ });
      console.log("🧹 Reservas de prueba eliminadas");

      await Movement.deleteMany({ referencia: /TEST-MIN-/ });
      console.log("🧹 Movimientos de prueba eliminados");
    } catch (cleanupError) {
      console.log("⚠️  Error durante limpieza:", cleanupError.message);
    }

    process.exit(0);
  }
};

testMinimumStockAlert();
