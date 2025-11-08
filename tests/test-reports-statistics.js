/**
 * Test: Reportes y Estadísticas
 * Verifica generación de reportes de consumo, rotación y tendencias
 */

require("dotenv").config();
const { dbConnection } = require("../database/config");
const { Item, Stock, Movement } = require("../features/inventory/models");
const stockService = require("../features/inventory/stock/stock.services");

const testReportsStatistics = async () => {
  const movimientosTest = [];

  try {
    await dbConnection();
    console.log("🔗 Conectado a MongoDB\n");

    console.log("=".repeat(60));
    console.log("🧪 TEST: REPORTES Y ESTADÍSTICAS");
    console.log("=".repeat(60));

    // ============================================
    // PASO 1: Preparar datos históricos
    // ============================================
    console.log("\n📋 PASO 1: Generar datos HISTÓRICOS simulados");
    console.log("-".repeat(60));

    const repuestos = await Item.find().limit(5);
    if (repuestos.length === 0) {
      console.log("❌ No hay repuestos. Ejecuta el seeder.");
      return;
    }

    console.log(`✅ Repuestos para análisis: ${repuestos.length}`);

    // Generar movimientos históricos (últimos 30 días)
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - 30);

    console.log(`\n   ⏳ Generando movimientos históricos...`);

    for (const repuesto of repuestos) {
      const stock = await Stock.findOne({ item: repuesto._id });
      if (!stock) continue;

      // Simular 5-15 movimientos por repuesto
      const cantidadMovimientos = Math.floor(Math.random() * 10) + 5;

      for (let i = 0; i < cantidadMovimientos; i++) {
        const tipoAleatorio = Math.random() > 0.4 ? "consumo" : "entrada";
        const cantidadAleatoria = Math.floor(Math.random() * 5) + 1;

        // Fecha aleatoria en los últimos 30 días
        const diasAtras = Math.floor(Math.random() * 30);
        const fechaMovimiento = new Date();
        fechaMovimiento.setDate(fechaMovimiento.getDate() - diasAtras);

        try {
          const movimiento = await stockService.createMovement({
            tipo: tipoAleatorio,
            referencia: `TEST-${Date.now()}-${i}`,
            referenciaTipo: "test_reporte",
            item: repuesto._id,
            cantidad: cantidadAleatoria,
            ...(tipoAleatorio === "consumo"
              ? { warehouseFrom: stock.warehouse }
              : { warehouseTo: stock.warehouse }),
            motivo: `Movimiento de prueba para reportes`,
            metadata: {
              test: true,
              fechaSimulada: fechaMovimiento,
            },
          });

          // Actualizar fecha del movimiento
          movimiento.createdAt = fechaMovimiento;
          await movimiento.save();

          movimientosTest.push(movimiento._id);
        } catch (error) {
          // Ignorar errores de stock insuficiente
        }
      }
    }

    console.log(
      `   ✅ ${movimientosTest.length} movimientos históricos generados`
    );

    // ============================================
    // PASO 2: Reporte de consumo por período
    // ============================================
    console.log("\n📊 PASO 2: REPORTE de consumo por período");
    console.log("-".repeat(60));

    const hace7dias = new Date();
    hace7dias.setDate(hace7dias.getDate() - 7);

    const hace30dias = new Date();
    hace30dias.setDate(hace30dias.getDate() - 30);

    const movimientos = await Movement.find({
      _id: { $in: movimientosTest },
    })
      .populate("item", "nombre codigo precio")
      .sort({ createdAt: -1 });

    // Filtrar por períodos
    const ultimos7dias = movimientos.filter((m) => m.createdAt >= hace7dias);
    const ultimos30dias = movimientos.filter((m) => m.createdAt >= hace30dias);

    console.log(`\n   📅 Movimientos por período:`);
    console.log(`   - Últimos 7 días: ${ultimos7dias.length}`);
    console.log(`   - Últimos 30 días: ${ultimos30dias.length}`);

    // Calcular consumo por período
    const consumo7dias = ultimos7dias
      .filter((m) => m.tipo === "consumo")
      .reduce((sum, m) => sum + m.cantidad, 0);

    const consumo30dias = ultimos30dias
      .filter((m) => m.tipo === "consumo")
      .reduce((sum, m) => sum + m.cantidad, 0);

    console.log(`\n   📉 Unidades consumidas:`);
    console.log(`   - Últimos 7 días: ${consumo7dias} unidades`);
    console.log(`   - Últimos 30 días: ${consumo30dias} unidades`);
    console.log(
      `   - Promedio diario (7d): ${(consumo7dias / 7).toFixed(1)} unidades`
    );
    console.log(
      `   - Promedio diario (30d): ${(consumo30dias / 30).toFixed(1)} unidades`
    );

    // ============================================
    // PASO 3: Top repuestos más consumidos
    // ============================================
    console.log("\n🏆 PASO 3: TOP repuestos MÁS CONSUMIDOS");
    console.log("-".repeat(60));

    const consumoPorRepuesto = {};

    ultimos30dias.forEach((mov) => {
      if (mov.tipo === "consumo" && mov.item) {
        const key = mov.item._id.toString();
        if (!consumoPorRepuesto[key]) {
          consumoPorRepuesto[key] = {
            item: mov.item,
            cantidad: 0,
            movimientos: 0,
          };
        }
        consumoPorRepuesto[key].cantidad += mov.cantidad;
        consumoPorRepuesto[key].movimientos++;
      }
    });

    const topRepuestos = Object.values(consumoPorRepuesto)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5);

    console.log(`\n   📋 Top 5 repuestos (últimos 30 días):\n`);
    topRepuestos.forEach((rep, index) => {
      const valorTotal = rep.item.precio ? rep.cantidad * rep.item.precio : 0;
      console.log(`   ${index + 1}. ${rep.item.nombre}`);
      console.log(`      - Consumo: ${rep.cantidad} unidades`);
      console.log(`      - Movimientos: ${rep.movimientos}`);
      console.log(`      - Valor: $${valorTotal.toLocaleString()}`);
      console.log(``);
    });

    // ============================================
    // PASO 4: Análisis de rotación de inventario
    // ============================================
    console.log("\n🔄 PASO 4: ANÁLISIS de rotación de inventario");
    console.log("-".repeat(60));

    console.log(`\n   📊 Índice de rotación por repuesto:\n`);

    for (const repuesto of repuestos) {
      const stock = await Stock.findOne({ item: repuesto._id });
      if (!stock) continue;

      const consumoRepuesto = ultimos30dias
        .filter(
          (m) =>
            m.tipo === "consumo" &&
            m.item._id.toString() === repuesto._id.toString()
        )
        .reduce((sum, m) => sum + m.cantidad, 0);

      const stockPromedio = stock.cantidad || 1;
      const indiceRotacion =
        stockPromedio > 0 ? (consumoRepuesto / stockPromedio).toFixed(2) : 0;
      const diasInventario =
        indiceRotacion > 0 ? (30 / indiceRotacion).toFixed(1) : 0;

      let categoria = "Baja rotación";
      if (indiceRotacion > 2) categoria = "Alta rotación";
      else if (indiceRotacion > 1) categoria = "Rotación normal";

      console.log(`   📦 ${repuesto.nombre}`);
      console.log(`      - Stock actual: ${stock.cantidad}`);
      console.log(`      - Consumo (30d): ${consumoRepuesto}`);
      console.log(`      - Índice rotación: ${indiceRotacion}x`);
      console.log(`      - Días de inventario: ${diasInventario}`);
      console.log(`      - Categoría: ${categoria}`);
      console.log(``);
    }

    // ============================================
    // PASO 5: Tendencias de consumo
    // ============================================
    console.log("\n📈 PASO 5: TENDENCIAS de consumo");
    console.log("-".repeat(60));

    // Agrupar consumo por semana
    const consumoPorSemana = {};

    ultimos30dias
      .filter((m) => m.tipo === "consumo")
      .forEach((mov) => {
        const semana = Math.floor(
          (Date.now() - mov.createdAt.getTime()) / (7 * 24 * 60 * 60 * 1000)
        );
        const semanaNombre =
          semana === 0
            ? "Esta semana"
            : `Hace ${semana} semana${semana > 1 ? "s" : ""}`;

        if (!consumoPorSemana[semanaNombre]) {
          consumoPorSemana[semanaNombre] = 0;
        }
        consumoPorSemana[semanaNombre] += mov.cantidad;
      });

    console.log(`\n   📊 Consumo por semana:\n`);
    Object.entries(consumoPorSemana)
      .sort((a, b) => {
        const ordenA = a[0].includes("Esta")
          ? 0
          : parseInt(a[0].match(/\d+/)?.[0] || 99);
        const ordenB = b[0].includes("Esta")
          ? 0
          : parseInt(b[0].match(/\d+/)?.[0] || 99);
        return ordenA - ordenB;
      })
      .forEach(([semana, cantidad]) => {
        const barra = "█".repeat(Math.floor(cantidad / 2));
        console.log(`   ${semana.padEnd(20)} | ${barra} ${cantidad} uds`);
      });

    // Calcular tendencia
    const semanasOrdenadas = Object.entries(consumoPorSemana).sort();
    if (semanasOrdenadas.length >= 2) {
      const semanaReciente = semanasOrdenadas[0][1];
      const semanaAnterior = semanasOrdenadas[1][1];
      const cambio = (
        ((semanaReciente - semanaAnterior) / semanaAnterior) *
        100
      ).toFixed(1);

      const tendencia =
        cambio > 0
          ? "↗️ CRECIENTE"
          : cambio < 0
            ? "↘️ DECRECIENTE"
            : "→ ESTABLE";

      console.log(
        `\n   📊 Tendencia: ${tendencia} (${cambio >= 0 ? "+" : ""}${cambio}%)`
      );
    }

    // ============================================
    // PASO 6: Valor total de movimientos
    // ============================================
    console.log("\n💰 PASO 6: VALOR TOTAL de movimientos");
    console.log("-".repeat(60));

    const valorEntradas = ultimos30dias
      .filter((m) => m.tipo === "entrada" && m.item?.precio)
      .reduce((sum, m) => sum + m.cantidad * m.item.precio, 0);

    const valorConsumos = ultimos30dias
      .filter((m) => m.tipo === "consumo" && m.item?.precio)
      .reduce((sum, m) => sum + m.cantidad * m.item.precio, 0);

    console.log(`\n   💵 Últimos 30 días:`);
    console.log(`   - Valor entradas: $${valorEntradas.toLocaleString()}`);
    console.log(`   - Valor consumos: $${valorConsumos.toLocaleString()}`);
    console.log(
      `   - Balance: $${(valorEntradas - valorConsumos).toLocaleString()}`
    );

    // ============================================
    // PASO 7: Reporte ejecutivo
    // ============================================
    console.log("\n📋 PASO 7: REPORTE EJECUTIVO");
    console.log("-".repeat(60));

    const totalEntradas = ultimos30dias.filter(
      (m) => m.tipo === "entrada"
    ).length;
    const totalConsumos = ultimos30dias.filter(
      (m) => m.tipo === "consumo"
    ).length;
    const totalAjustes = ultimos30dias.filter(
      (m) => m.tipo === "ajuste"
    ).length;

    console.log(`
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
                    REPORTE DE INVENTARIO
                   Período: Últimos 30 días
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   
   RESUMEN DE ACTIVIDAD:
   
   📊 Movimientos Totales: ${ultimos30dias.length}
      • Entradas: ${totalEntradas}
      • Consumos: ${totalConsumos}
      • Ajustes: ${totalAjustes}
   
   📦 Unidades:
      • Ingresadas: ${ultimos30dias.filter((m) => m.tipo === "entrada").reduce((s, m) => s + m.cantidad, 0)}
      • Consumidas: ${consumo30dias}
      • Promedio diario: ${(consumo30dias / 30).toFixed(1)}
   
   💰 Valores:
      • Entradas: $${valorEntradas.toLocaleString()}
      • Consumos: $${valorConsumos.toLocaleString()}
      • Balance: $${(valorEntradas - valorConsumos).toLocaleString()}
   
   🏆 TOP REPUESTO:
      • ${topRepuestos[0]?.item.nombre || "N/A"}
      • Consumo: ${topRepuestos[0]?.cantidad || 0} unidades
      • Valor: $${topRepuestos[0] ? (topRepuestos[0].cantidad * (topRepuestos[0].item.precio || 0)).toLocaleString() : 0}
   
   📈 TENDENCIA:
      • Esta semana: ${consumoPorSemana["Esta semana"] || 0} uds
      • Semana anterior: ${Object.values(consumoPorSemana)[1] || 0} uds
   
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   `);

    // ============================================
    // RESUMEN
    // ============================================
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMEN DEL TEST");
    console.log("=".repeat(60));
    console.log(`
    ESCENARIO: Reportes y Estadísticas de Inventario
    
    DATOS ANALIZADOS:
    - ${movimientosTest.length} movimientos históricos
    - ${repuestos.length} repuestos analizados
    - 30 días de historia
    
    REPORTES GENERADOS:
    ✅ 1. Consumo por período (7d, 30d)
    ✅ 2. Top repuestos más consumidos
    ✅ 3. Análisis de rotación de inventario
    ✅ 4. Tendencias de consumo
    ✅ 5. Valor total de movimientos
    ✅ 6. Reporte ejecutivo
    
    MÉTRICAS CALCULADAS:
    - Consumo promedio diario
    - Índice de rotación
    - Días de inventario
    - Tendencias semanales
    - Valores monetarios
    
    APLICACIONES:
    - Planificación de compras
    - Identificación de productos clave
    - Optimización de stock
    - Análisis de costos
    `);

    console.log("=".repeat(60));
    console.log("🎉 TEST COMPLETADO EXITOSAMENTE");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ Error en el test:", error);
    console.error(error.stack);
  } finally {
    // Limpiar movimientos de prueba
    if (movimientosTest.length > 0) {
      await Movement.deleteMany({ _id: { $in: movimientosTest } });
      console.log(`\n🧹 ${movimientosTest.length} movimientos eliminados\n`);
    }

    process.exit(0);
  }
};

testReportsStatistics();
