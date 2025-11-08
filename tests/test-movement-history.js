/**
 * Test: Historial y Consultas de Movimientos
 * Verifica consultas, filtros y reportes de movimientos de inventario
 */

require("dotenv").config();
const { dbConnection } = require("../database/config");
const { Item, Stock, Movement } = require("../features/inventory/models");
const stockService = require("../features/inventory/stock/stock.services");

const testMovementHistory = async () => {
  const movimientosTest = [];

  try {
    await dbConnection();
    console.log("🔗 Conectado a MongoDB\n");

    console.log("=".repeat(60));
    console.log("🧪 TEST: HISTORIAL Y CONSULTAS DE MOVIMIENTOS");
    console.log("=".repeat(60));

    // ============================================
    // PASO 1: Preparar datos de prueba
    // ============================================
    console.log("\n📋 PASO 1: Preparar DATOS de prueba");
    console.log("-".repeat(60));

    const filtroAceite = await Item.findOne({ nombre: /filtro aceite/i });
    if (!filtroAceite) {
      console.log(
        "❌ No se encontró Filtro Aceite. Ejecuta el seeder primero."
      );
      return;
    }

    const stockItem = await Stock.findOne({
      item: filtroAceite._id,
    }).populate("warehouse");

    console.log(`✅ Repuesto: ${filtroAceite.nombre}`);
    console.log(`   - Código: ${filtroAceite.codigo}`);
    console.log(`   - Almacén: ${stockItem.warehouse.nombre}`);
    console.log(`   - Stock inicial: ${stockItem.cantidad}`);

    // ============================================
    // PASO 2: Generar movimientos de prueba
    // ============================================
    console.log("\n📦 PASO 2: Generar MOVIMIENTOS diversos");
    console.log("-".repeat(60));

    const tiposMovimiento = [
      {
        tipo: "entrada",
        cantidad: 20,
        referencia: "COMP-001",
        motivo: "Compra a proveedor X",
      },
      {
        tipo: "salida",
        cantidad: 5,
        referencia: "VTA-001",
        motivo: "Venta mostrador",
      },
      {
        tipo: "consumo",
        cantidad: 3,
        referencia: "OT-001",
        motivo: "Consumo orden trabajo",
      },
      {
        tipo: "entrada",
        cantidad: 10,
        referencia: "COMP-002",
        motivo: "Compra urgente",
      },
      {
        tipo: "ajuste",
        cantidad: 2,
        referencia: "ADJ-001",
        motivo: "Ajuste por merma",
      },
      {
        tipo: "consumo",
        cantidad: 4,
        referencia: "OT-002",
        motivo: "Consumo orden trabajo",
      },
    ];

    console.log(`\n   🔄 Creando ${tiposMovimiento.length} movimientos...`);

    for (const mov of tiposMovimiento) {
      const movimiento = await stockService.createMovement({
        tipo: mov.tipo,
        referencia: mov.referencia,
        referenciaTipo: "test",
        item: filtroAceite._id,
        cantidad: mov.cantidad,
        ...(["salida", "consumo"].includes(mov.tipo) ||
        (mov.tipo === "ajuste" && mov.cantidad < 0)
          ? { warehouseFrom: stockItem.warehouse._id }
          : { warehouseTo: stockItem.warehouse._id }),
        motivo: mov.motivo,
        metadata: {
          test: true,
          fecha: new Date(),
          generadoPor: "test-script",
        },
      });

      movimientosTest.push(movimiento._id);
      console.log(
        `   ✅ ${mov.tipo.toUpperCase().padEnd(10)} | ${mov.cantidad.toString().padStart(3)} uds | ${mov.referencia}`
      );
    }

    // Esperar un momento para asegurar diferentes timestamps
    await new Promise((resolve) => setTimeout(resolve, 100));

    // ============================================
    // PASO 3: Consultar todos los movimientos
    // ============================================
    console.log("\n📊 PASO 3: Consultar TODOS los movimientos del item");
    console.log("-".repeat(60));

    const todosMovimientos = await Movement.find({
      _id: { $in: movimientosTest },
    })
      .populate("item", "codigo nombre")
      .populate("warehouseFrom", "nombre")
      .populate("warehouseTo", "nombre")
      .sort({ createdAt: 1 });

    console.log(`\n   📋 Total movimientos: ${todosMovimientos.length}`);

    console.log(`\n   Detalle:`);
    todosMovimientos.forEach((mov, index) => {
      const direccion = mov.warehouseFrom
        ? `🔴 Salida de ${mov.warehouseFrom.nombre}`
        : `🟢 Entrada a ${mov.warehouseTo.nombre}`;
      console.log(
        `   ${index + 1}. ${mov.tipo.toUpperCase().padEnd(10)} | ${mov.cantidad.toString().padStart(3)} uds | ${mov.referencia.padEnd(10)} | ${direccion}`
      );
    });

    // ============================================
    // PASO 4: Filtrar por tipo de movimiento
    // ============================================
    console.log("\n🔍 PASO 4: Filtrar por TIPO de movimiento");
    console.log("-".repeat(60));

    const tiposUnicos = [...new Set(todosMovimientos.map((m) => m.tipo))];

    for (const tipo of tiposUnicos) {
      const movimientosTipo = todosMovimientos.filter((m) => m.tipo === tipo);
      const totalCantidad = movimientosTipo.reduce(
        (sum, m) => sum + m.cantidad,
        0
      );

      console.log(`\n   📌 Tipo: ${tipo.toUpperCase()}`);
      console.log(`   - Movimientos: ${movimientosTipo.length}`);
      console.log(`   - Total unidades: ${totalCantidad}`);
      movimientosTipo.forEach((m) => {
        console.log(`     • ${m.referencia}: ${m.cantidad} uds - ${m.motivo}`);
      });
    }

    // ============================================
    // PASO 5: Filtrar por rango de fechas
    // ============================================
    console.log("\n📅 PASO 5: Filtrar por RANGO DE FECHAS");
    console.log("-".repeat(60));

    const ahora = new Date();
    const hace30dias = new Date(ahora.getTime() - 30 * 24 * 60 * 60 * 1000);

    const movimientosRecientes = todosMovimientos.filter((m) => {
      return m.createdAt >= hace30dias;
    });

    console.log(`\n   📆 Rango: Últimos 30 días`);
    console.log(`   - Desde: ${hace30dias.toLocaleDateString()}`);
    console.log(`   - Hasta: ${ahora.toLocaleDateString()}`);
    console.log(`   - Movimientos en rango: ${movimientosRecientes.length}`);

    // ============================================
    // PASO 6: Calcular estadísticas
    // ============================================
    console.log("\n📈 PASO 6: Calcular ESTADÍSTICAS");
    console.log("-".repeat(60));

    const entradas = todosMovimientos.filter((m) => m.tipo === "entrada");
    const salidas = todosMovimientos.filter((m) =>
      ["salida", "consumo"].includes(m.tipo)
    );
    const ajustes = todosMovimientos.filter((m) => m.tipo === "ajuste");

    const totalEntradas = entradas.reduce((sum, m) => sum + m.cantidad, 0);
    const totalSalidas = salidas.reduce((sum, m) => sum + m.cantidad, 0);
    const totalAjustes = ajustes.reduce((sum, m) => sum + m.cantidad, 0);

    console.log(`\n   📊 Resumen de movimientos:`);
    console.log(`   
    ENTRADAS:
    - Movimientos: ${entradas.length}
    - Total unidades: ${totalEntradas}
    - Promedio por movimiento: ${entradas.length > 0 ? (totalEntradas / entradas.length).toFixed(1) : 0}
    
    SALIDAS (incluye consumos):
    - Movimientos: ${salidas.length}
    - Total unidades: ${totalSalidas}
    - Promedio por movimiento: ${salidas.length > 0 ? (totalSalidas / salidas.length).toFixed(1) : 0}
    
    AJUSTES:
    - Movimientos: ${ajustes.length}
    - Total unidades: ${totalAjustes}
    
    BALANCE NETO:
    - Entradas - Salidas: ${totalEntradas - totalSalidas}
    `);

    // ============================================
    // PASO 7: Generar reporte por período
    // ============================================
    console.log("\n📋 PASO 7: Generar REPORTE resumido");
    console.log("-".repeat(60));

    const stockFinal = await Stock.findById(stockItem._id);

    console.log(`\n   REPORTE DE MOVIMIENTOS`);
    console.log(`   ${"=".repeat(50)}`);
    console.log(`   Repuesto: ${filtroAceite.nombre}`);
    console.log(`   Código: ${filtroAceite.codigo}`);
    console.log(
      `   Período: ${hace30dias.toLocaleDateString()} - ${ahora.toLocaleDateString()}`
    );
    console.log(`   
   MOVIMIENTOS:
   - Total operaciones: ${todosMovimientos.length}
   - Entradas: ${entradas.length} (${totalEntradas} uds)
   - Salidas: ${salidas.length} (${totalSalidas} uds)
   - Ajustes: ${ajustes.length} (${totalAjustes} uds)
   
   STOCK:
   - Stock inicial (antes test): ${stockItem.cantidad}
   - Movimiento neto: ${totalEntradas - totalSalidas}
   - Stock final (después test): ${stockFinal.cantidad}
   - Reservado: ${stockFinal.reservado}
   - Disponible: ${stockFinal.cantidad - stockFinal.reservado}
   `);

    // ============================================
    // PASO 8: Consulta con paginación
    // ============================================
    console.log("\n📄 PASO 8: Simular PAGINACIÓN");
    console.log("-".repeat(60));

    const pageSize = 3;
    const totalPages = Math.ceil(todosMovimientos.length / pageSize);

    console.log(`\n   📖 Configuración:`);
    console.log(`   - Total registros: ${todosMovimientos.length}`);
    console.log(`   - Registros por página: ${pageSize}`);
    console.log(`   - Total páginas: ${totalPages}`);

    for (let page = 1; page <= totalPages; page++) {
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const pageMovements = todosMovimientos.slice(startIndex, endIndex);

      console.log(`\n   📄 Página ${page} de ${totalPages}:`);
      pageMovements.forEach((mov, index) => {
        console.log(
          `      ${startIndex + index + 1}. ${mov.tipo.padEnd(10)} | ${mov.cantidad} uds | ${mov.referencia}`
        );
      });
    }

    // ============================================
    // PASO 9: Búsqueda por referencia
    // ============================================
    console.log("\n🔎 PASO 9: Búsqueda por REFERENCIA");
    console.log("-".repeat(60));

    const referenciaBuscar = "OT-";
    const movimientosOT = todosMovimientos.filter((m) =>
      m.referencia.includes(referenciaBuscar)
    );

    console.log(`\n   🔍 Buscar: "${referenciaBuscar}"`);
    console.log(`   📋 Resultados: ${movimientosOT.length}`);

    movimientosOT.forEach((mov, index) => {
      console.log(
        `   ${index + 1}. ${mov.referencia} | ${mov.tipo} | ${mov.cantidad} uds | ${mov.motivo}`
      );
    });

    // ============================================
    // RESUMEN
    // ============================================
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMEN DEL TEST");
    console.log("=".repeat(60));
    console.log(`
    ESCENARIO: Historial y Consultas de Movimientos
    
    REPUESTO: ${filtroAceite.nombre}
    CÓDIGO: ${filtroAceite.codigo}
    
    MOVIMIENTOS GENERADOS: ${todosMovimientos.length}
    
    CONSULTAS REALIZADAS:
    ✅ 1. Listar todos los movimientos
    ✅ 2. Filtrar por tipo de movimiento
    ✅ 3. Filtrar por rango de fechas
    ✅ 4. Calcular estadísticas
    ✅ 5. Generar reporte resumido
    ✅ 6. Paginación (${totalPages} páginas)
    ✅ 7. Búsqueda por referencia
    
    TIPOS DE MOVIMIENTO:
    - Entradas: ${entradas.length} (${totalEntradas} uds)
    - Salidas/Consumos: ${salidas.length} (${totalSalidas} uds)
    - Ajustes: ${ajustes.length} (${totalAjustes} uds)
    
    BALANCE:
    - Movimiento neto: ${totalEntradas - totalSalidas} unidades
    - Stock final: ${stockFinal.cantidad}
    `);

    console.log("=".repeat(60));
    console.log("🎉 TEST COMPLETADO EXITOSAMENTE");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ Error en el test:", error);
  } finally {
    // Limpiar movimientos de prueba
    if (movimientosTest.length > 0) {
      await Movement.deleteMany({ _id: { $in: movimientosTest } });
      console.log(`\n🧹 ${movimientosTest.length} movimientos eliminados\n`);
    }

    process.exit(0);
  }
};

testMovementHistory();
