/**
 * Test: Reservas Concurrentes (Race Conditions)
 * Verifica que múltiples usuarios no puedan reservar más stock del disponible
 */

require("dotenv").config();
const { dbConnection } = require("../database/config");
const Item = require("../features/inventory/items/item.model");
const Stock = require("../features/inventory/stock/stock.model");
const Warehouse = require("../features/inventory/warehouses/warehouse.models");
const Reservation = require("../features/inventory/reservations/reservation.models");
const WorkOrder = require("../features/workshop/work-orders/models/workOrder.model");
const User = require("../features/user/user.models");
const Vehicle = require("../features/crm/vehicles/models/vehicle.model");
const {
  addWorkOrderItem,
} = require("../features/workshop/work-orders/controllers/workOrderItem.controller");

const testConcurrentReservations = async () => {
  let createdReservations = [];

  try {
    await dbConnection();
    console.log("🔗 Conectado a MongoDB\n");

    console.log("=".repeat(60));
    console.log("🧪 TEST: RESERVAS CONCURRENTES (RACE CONDITIONS)");
    console.log("=".repeat(60));

    // ============================================
    // PASO 1: Preparar escenario
    // ============================================
    console.log("\n📋 PASO 1: Preparar ESCENARIO de concurrencia");
    console.log("-".repeat(60));

    // Buscar repuesto con stock limitado
    const filtroAire = await Item.findOne({
      $or: [
        { nombre: /filtro.*aire/i },
        { codigo: "FA-001" },
        { codigo: "FLT-AIR-001" },
      ],
    });
    if (!filtroAire) {
      console.log("❌ No se encontró Filtro Aire. Ejecuta el seeder primero.");
      console.log("   Buscando items disponibles...");
      const items = await Item.find({}, "nombre codigo").limit(5);
      console.log(
        "   Items encontrados:",
        items.map((i) => `${i.nombre} (${i.codigo})`).join(", ")
      );
      return;
    }

    const stockInicial = await Stock.findOne({
      item: filtroAire._id,
    }).populate("warehouse");

    console.log(`✅ Repuesto seleccionado: ${filtroAire.nombre}`);
    console.log(`   - Stock disponible: ${stockInicial.cantidad}`);
    console.log(`   - Stock reservado: ${stockInicial.reservado}`);
    console.log(
      `   - Stock LIBRE: ${stockInicial.cantidad - stockInicial.reservado}`
    );
    console.log(`   - Almacén: ${stockInicial.warehouse.nombre}`);

    // Buscar asesor (usar campo rol en lugar de role)
    const asesor = await User.findOne({
      rol: { $in: ["admin", "superAdmin", "operador"] },
    });
    if (!asesor) {
      console.log("❌ No se encontró asesor. Ejecuta el seeder de usuarios.");
      return;
    }

    // Crear vehículos de prueba
    const vehiculosTest = [];
    for (let i = 1; i <= 5; i++) {
      const vehiculo =
        (await Vehicle.findOne({ placa: `TEST-CONC-${i}` })) ||
        (await Vehicle.create({
          placa: `TEST-CONC-${i}`,
          marca: "Toyota",
          modelo: "Corolla",
          año: 2020,
          propietario: {
            nombre: `Cliente Test ${i}`,
            telefono: `300000000${i}`,
          },
        }));
      vehiculosTest.push(vehiculo);
    }

    console.log(`\n✅ Escenario preparado:`);
    console.log(
      `   - ${vehiculosTest.length} vehículos (clientes simultáneos)`
    );
    console.log(`   - Asesor: ${asesor.nombre}`);

    // ============================================
    // PASO 2: Crear órdenes de trabajo
    // ============================================
    console.log("\n📝 PASO 2: Crear ÓRDENES DE TRABAJO");
    console.log("-".repeat(60));

    const ordenesTest = [];
    for (let i = 0; i < vehiculosTest.length; i++) {
      const orden = await WorkOrder.create({
        numeroOrden: `OT-CONC-${Date.now()}-${i}`,
        vehiculo: vehiculosTest[i]._id,
        cliente: vehiculosTest[i].propietario,
        asesor: asesor._id,
        estado: "ABIERTA",
        descripcion: `Test concurrencia ${i + 1}`,
        items: [],
      });
      ordenesTest.push(orden);
    }

    console.log(`✅ ${ordenesTest.length} órdenes de trabajo creadas`);
    ordenesTest.forEach((ot, i) => {
      console.log(`   ${i + 1}. ${ot.numeroOrden} - ${vehiculosTest[i].placa}`);
    });

    // ============================================
    // PASO 3: Simular reservas CONCURRENTES
    // ============================================
    console.log("\n⚡ PASO 3: Simular RESERVAS CONCURRENTES");
    console.log("-".repeat(60));

    const stockLibre = stockInicial.cantidad - stockInicial.reservado;
    const cantidadPorOrden = Math.ceil(stockLibre / 2); // Cada orden pide la mitad del stock libre

    console.log(`\n   📦 Stock libre: ${stockLibre} unidades`);
    console.log(
      `   📋 Cada orden intentará reservar: ${cantidadPorOrden} unidades`
    );
    console.log(
      `   ⚠️  Total solicitado: ${cantidadPorOrden * ordenesTest.length} unidades`
    );
    console.log(
      `   ❗ Exceso: ${cantidadPorOrden * ordenesTest.length - stockLibre} unidades (NO DEBERÍA PERMITIRSE)`
    );

    console.log(
      `\n   🔥 Ejecutando ${ordenesTest.length} reservas en PARALELO...`
    );

    // Ejecutar todas las reservas AL MISMO TIEMPO
    const promesasReservas = ordenesTest.map((orden, index) => {
      return new Promise(async (resolve) => {
        try {
          // Simular request HTTP
          const mockReq = {
            params: { id: orden._id.toString() },
            body: {
              item: filtroAire._id.toString(),
              cantidad: cantidadPorOrden,
              tipo: "repuesto",
            },
            usuario: { _id: asesor._id },
          };

          const mockRes = {
            status: function (code) {
              this.statusCode = code;
              return this;
            },
            json: function (data) {
              this.data = data;
              return this;
            },
          };

          await addWorkOrderItem(mockReq, mockRes);

          if (
            mockRes.statusCode === 201 &&
            mockRes.data?.workOrderItem?.reserva
          ) {
            createdReservations.push(mockRes.data.workOrderItem.reserva);
          }

          resolve({
            orden: index + 1,
            numeroOrden: orden.numeroOrden,
            success: mockRes.statusCode === 201,
            statusCode: mockRes.statusCode,
            message: mockRes.data?.msg || mockRes.data?.message || "OK",
            reservaId: mockRes.data?.workOrderItem?.reserva,
          });
        } catch (error) {
          resolve({
            orden: index + 1,
            numeroOrden: orden.numeroOrden,
            success: false,
            error: error.message,
          });
        }
      });
    });

    const resultados = await Promise.all(promesasReservas);

    // ============================================
    // PASO 4: Analizar resultados
    // ============================================
    console.log("\n📊 PASO 4: Analizar RESULTADOS");
    console.log("-".repeat(60));

    const exitosas = resultados.filter((r) => r.success);
    const fallidas = resultados.filter((r) => !r.success);

    console.log(`\n   ✅ Reservas EXITOSAS: ${exitosas.length}`);
    exitosas.forEach((r) => {
      console.log(`      - ${r.numeroOrden}: ${r.message}`);
    });

    console.log(`\n   ❌ Reservas RECHAZADAS: ${fallidas.length}`);
    fallidas.forEach((r) => {
      console.log(`      - ${r.numeroOrden}: ${r.message || r.error}`);
    });

    // ============================================
    // PASO 5: Verificar integridad del stock
    // ============================================
    console.log("\n🔍 PASO 5: Verificar INTEGRIDAD del stock");
    console.log("-".repeat(60));

    const stockFinal = await Stock.findById(stockInicial._id);
    const reservasCreadas = await Reservation.find({
      _id: { $in: createdReservations },
      estado: "activo",
    });

    const totalReservado = reservasCreadas.reduce(
      (sum, r) => sum + r.cantidad,
      0
    );

    console.log(`\n   📦 Stock Inicial: ${stockInicial.cantidad}`);
    console.log(`   📦 Stock Final: ${stockFinal.cantidad} (debe ser igual)`);
    console.log(`   🔒 Reservado Inicial: ${stockInicial.reservado}`);
    console.log(`   🔒 Reservado Final: ${stockFinal.reservado}`);
    console.log(`   ➕ Total reservado en test: ${totalReservado}`);
    console.log(
      `   📊 Stock disponible: ${stockFinal.cantidad - stockFinal.reservado}`
    );

    // Verificaciones críticas
    const checks = {
      stockNoNegativo: stockFinal.cantidad >= 0,
      reservadoNoExcedeStock: stockFinal.reservado <= stockFinal.cantidad,
      stockNoSeDedujo: stockFinal.cantidad === stockInicial.cantidad,
      reservasCoherentes: stockFinal.reservado >= stockInicial.reservado,
    };

    console.log(`\n   🔍 VERIFICACIONES:`);
    console.log(
      `   ${checks.stockNoNegativo ? "✅" : "❌"} Stock NO es negativo`
    );
    console.log(
      `   ${checks.reservadoNoExcedeStock ? "✅" : "❌"} Reservado NO excede stock disponible`
    );
    console.log(
      `   ${checks.stockNoSeDedujo ? "✅" : "❌"} Stock NO se dedujo (solo reservó)`
    );
    console.log(
      `   ${checks.reservasCoherentes ? "✅" : "❌"} Reservas son coherentes`
    );

    const testPassed = Object.values(checks).every((c) => c === true);

    // ============================================
    // PASO 6: Verificar que se rechazó el exceso
    // ============================================
    console.log("\n🛡️ PASO 6: Verificar PROTECCIÓN contra exceso");
    console.log("-".repeat(60));

    const stockDisponibleInicial =
      stockInicial.cantidad - stockInicial.reservado;
    const totalIntentado = cantidadPorOrden * ordenesTest.length;
    const deberiaRechazar = totalIntentado > stockDisponibleInicial;

    console.log(`\n   📊 Stock disponible inicial: ${stockDisponibleInicial}`);
    console.log(`   📝 Total intentado reservar: ${totalIntentado}`);
    console.log(`   ⚠️  ¿Excede disponible?: ${deberiaRechazar ? "SÍ" : "NO"}`);

    if (deberiaRechazar) {
      console.log(
        `\n   ${fallidas.length > 0 ? "✅" : "❌"} Sistema RECHAZÓ reservas excedentes`
      );
      console.log(
        `   ${totalReservado <= stockDisponibleInicial ? "✅" : "❌"} Total reservado NO excede disponible`
      );
    }

    // ============================================
    // RESUMEN
    // ============================================
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMEN DEL TEST");
    console.log("=".repeat(60));
    console.log(`
    ESCENARIO: Múltiples usuarios reservando simultáneamente
    
    REPUESTO: ${filtroAire.nombre}
    ALMACÉN: ${stockInicial.warehouse.nombre}
    
    CONCURRENCIA:
    - ${ordenesTest.length} órdenes de trabajo
    - ${ordenesTest.length} reservas SIMULTÁNEAS
    - ${cantidadPorOrden} unidades por reserva
    
    STOCK:
    - Disponible inicialmente: ${stockDisponibleInicial} unidades
    - Total intentado: ${totalIntentado} unidades
    - Total reservado: ${totalReservado} unidades
    - Exceso rechazado: ${totalIntentado - totalReservado} unidades
    
    RESULTADOS:
    ✅ Reservas exitosas: ${exitosas.length}
    ❌ Reservas rechazadas: ${fallidas.length}
    
    INTEGRIDAD:
    ${checks.stockNoNegativo ? "✅" : "❌"} Stock no negativo
    ${checks.reservadoNoExcedeStock ? "✅" : "❌"} Reservado ≤ Stock
    ${checks.stockNoSeDedujo ? "✅" : "❌"} Stock no se dedujo
    ${checks.reservasCoherentes ? "✅" : "❌"} Reservas coherentes
    
    PROTECCIÓN:
    ${deberiaRechazar && fallidas.length > 0 ? "✅" : "❌"} Sistema rechazó exceso
    ${totalReservado <= stockDisponibleInicial ? "✅" : "❌"} No se sobre-reservó
    `);

    console.log("=".repeat(60));
    console.log(testPassed ? "🎉 TEST APROBADO" : "❌ TEST FALLÓ");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ Error en el test:", error);
  } finally {
    // Limpiar reservas de prueba
    if (createdReservations.length > 0) {
      await Reservation.deleteMany({ _id: { $in: createdReservations } });
      console.log(`\n🧹 ${createdReservations.length} reservas eliminadas`);
    }

    // Limpiar órdenes de prueba
    await WorkOrder.deleteMany({ numeroOrden: /^OT-CONC-/ });
    console.log(`🧹 Órdenes de prueba eliminadas`);

    // Limpiar vehículos de prueba
    await Vehicle.deleteMany({ placa: /^TEST-CONC-/ });
    console.log(`🧹 Vehículos de prueba eliminados\n`);

    process.exit(0);
  }
};

testConcurrentReservations();
