/**
 * Test: Performance y Estrés
 * Verifica el sistema bajo carga con múltiples operaciones simultáneas
 */

require("dotenv").config();
const { dbConnection } = require("../database/config");
const Item = require("../features/inventory/items/item.model");
const Stock = require("../features/inventory/stock/stock.model");
const Reservation = require("../features/inventory/reservations/reservation.models");
const WorkOrder = require("../features/workshop/work-orders/models/workOrder.model");
const User = require("../features/user/user.models");
const Vehicle = require("../features/crm/vehicles/models/vehicle.model");
const {
  addWorkOrderItem,
} = require("../features/workshop/work-orders/controllers/workOrderItem.controller");

const testPerformanceStress = async () => {
  const testData = {
    reservations: [],
    orders: [],
    vehicles: [],
  };

  try {
    await dbConnection();
    console.log("🔗 Conectado a MongoDB\n");

    console.log("=".repeat(60));
    console.log("🧪 TEST: PERFORMANCE Y ESTRÉS");
    console.log("=".repeat(60));
    console.log(`
    ESCENARIO: Sistema bajo ALTA CARGA
    - 50 órdenes de trabajo simultáneas
    - 150 reservas de repuestos
    - Validar tiempos de respuesta
    - Verificar integridad de datos
    `);

    // ============================================
    // PASO 1: Preparar datos
    // ============================================
    console.log("\n📋 PASO 1: Preparar datos para CARGA MASIVA");
    console.log("-".repeat(60));

    const asesor = await User.findOne({
      role: { $in: ["ASESOR", "ADMIN_ROLE"] },
    });
    if (!asesor) {
      console.log("❌ No se encontró asesor.");
      return;
    }

    const repuestos = await Item.find().limit(5);
    if (repuestos.length === 0) {
      console.log("❌ No hay repuestos disponibles. Ejecuta el seeder.");
      return;
    }

    console.log(`✅ Datos preparados:`);
    console.log(`   - Asesor: ${asesor.nombre}`);
    console.log(`   - Repuestos disponibles: ${repuestos.length}`);

    // ============================================
    // PASO 2: Crear vehículos y órdenes masivas
    // ============================================
    console.log("\n🚗 PASO 2: Crear VEHÍCULOS y ÓRDENES masivamente");
    console.log("-".repeat(60));

    const cantidadOrdenes = 50;
    const tiempoInicio = Date.now();

    console.log(`\n   ⏳ Creando ${cantidadOrdenes} órdenes de trabajo...`);

    const promesasCreacion = [];

    for (let i = 0; i < cantidadOrdenes; i++) {
      promesasCreacion.push(
        (async () => {
          const vehiculo = await Vehicle.create({
            placa: `PERF-${Date.now()}-${i}`,
            marca: "Toyota",
            modelo: "Corolla",
            año: 2020,
            propietario: {
              nombre: `Cliente Test ${i}`,
              telefono: `300000${i.toString().padStart(4, "0")}`,
            },
          });

          const orden = await WorkOrder.create({
            numeroOrden: `OT-PERF-${Date.now()}-${i}`,
            vehiculo: vehiculo._id,
            cliente: vehiculo.propietario,
            asesor: asesor._id,
            estado: "ABIERTA",
            descripcion: `Test performance ${i}`,
            items: [],
          });

          return { vehiculo, orden };
        })()
      );
    }

    const resultados = await Promise.all(promesasCreacion);

    resultados.forEach((r) => {
      testData.vehicles.push(r.vehiculo._id);
      testData.orders.push(r.orden._id);
    });

    const tiempoCreacion = Date.now() - tiempoInicio;

    console.log(
      `   ✅ ${cantidadOrdenes} órdenes creadas en ${tiempoCreacion}ms`
    );
    console.log(
      `   - Promedio: ${(tiempoCreacion / cantidadOrdenes).toFixed(2)}ms por orden`
    );

    // ============================================
    // PASO 3: Agregar repuestos masivamente
    // ============================================
    console.log("\n📦 PASO 3: Agregar REPUESTOS masivamente");
    console.log("-".repeat(60));

    const tiempoInicioReservas = Date.now();

    console.log(
      `\n   ⏳ Agregando 3 repuestos a cada orden (${cantidadOrdenes * 3} operaciones)...`
    );

    const promesasReservas = [];

    for (const ordenId of testData.orders) {
      // Agregar 3 repuestos aleatorios a cada orden
      for (let j = 0; j < 3; j++) {
        const repuestoAleatorio =
          repuestos[Math.floor(Math.random() * repuestos.length)];

        promesasReservas.push(
          (async () => {
            try {
              const mockReq = {
                params: { id: ordenId.toString() },
                body: {
                  item: repuestoAleatorio._id.toString(),
                  cantidad: 1,
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
                return {
                  success: true,
                  reservaId: mockRes.data.workOrderItem.reserva,
                };
              }

              return { success: false };
            } catch (error) {
              return { success: false, error: error.message };
            }
          })()
        );
      }
    }

    const resultadosReservas = await Promise.all(promesasReservas);

    const reservasExitosas = resultadosReservas.filter((r) => r.success);
    const reservasFallidas = resultadosReservas.filter((r) => !r.success);

    reservasExitosas.forEach((r) => {
      if (r.reservaId) testData.reservations.push(r.reservaId);
    });

    const tiempoReservas = Date.now() - tiempoInicioReservas;

    console.log(`   ✅ Operaciones completadas en ${tiempoReservas}ms`);
    console.log(`   - Exitosas: ${reservasExitosas.length}`);
    console.log(`   - Fallidas: ${reservasFallidas.length}`);
    console.log(
      `   - Promedio: ${(tiempoReservas / promesasReservas.length).toFixed(2)}ms por operación`
    );

    // ============================================
    // PASO 4: Verificar integridad de stock
    // ============================================
    console.log("\n🔍 PASO 4: Verificar INTEGRIDAD del stock");
    console.log("-".repeat(60));

    const verificaciones = [];

    for (const repuesto of repuestos) {
      const stock = await Stock.findOne({ item: repuesto._id });
      const reservas = await Reservation.countDocuments({
        item: repuesto._id,
        estado: "activo",
        _id: { $in: testData.reservations },
      });

      const check = {
        repuesto: repuesto.nombre,
        stockTotal: stock.cantidad,
        stockReservado: stock.reservado,
        reservasActivas: reservas,
        disponible: stock.cantidad - stock.reservado,
        integro:
          stock.cantidad >= 0 &&
          stock.reservado >= 0 &&
          stock.reservado <= stock.cantidad,
      };

      verificaciones.push(check);

      const icono = check.integro ? "✅" : "❌";
      console.log(`\n   ${icono} ${check.repuesto}`);
      console.log(
        `      - Stock: ${check.stockTotal} | Reservado: ${check.stockReservado} | Disponible: ${check.disponible}`
      );
      console.log(`      - Reservas activas: ${check.reservasActivas}`);
    }

    const todosIntegros = verificaciones.every((v) => v.integro);

    // ============================================
    // PASO 5: Consultar reservas masivamente
    // ============================================
    console.log("\n📊 PASO 5: Consultar RESERVAS masivamente");
    console.log("-".repeat(60));

    const tiempoInicioConsulta = Date.now();

    const reservasCreadas = await Reservation.find({
      _id: { $in: testData.reservations },
    })
      .populate("item", "nombre codigo")
      .populate("warehouse", "nombre");

    const tiempoConsulta = Date.now() - tiempoInicioConsulta;

    console.log(
      `\n   ✅ ${reservasCreadas.length} reservas consultadas en ${tiempoConsulta}ms`
    );
    console.log(
      `   - Promedio: ${(tiempoConsulta / reservasCreadas.length).toFixed(2)}ms por reserva`
    );

    // Agrupar por estado
    const porEstado = reservasCreadas.reduce((acc, r) => {
      acc[r.estado] = (acc[r.estado] || 0) + 1;
      return acc;
    }, {});

    console.log(`\n   📋 Reservas por estado:`);
    Object.entries(porEstado).forEach(([estado, cantidad]) => {
      console.log(`      - ${estado}: ${cantidad}`);
    });

    // ============================================
    // PASO 6: Métricas de performance
    // ============================================
    console.log("\n⚡ PASO 6: MÉTRICAS de performance");
    console.log("-".repeat(60));

    const tiempoTotal = Date.now() - tiempoInicio;

    const metricas = {
      ordenesCreadas: cantidadOrdenes,
      tiempoCreacionOrdenes: tiempoCreacion,
      promedioCreacionOrden: (tiempoCreacion / cantidadOrdenes).toFixed(2),
      operacionesReserva: promesasReservas.length,
      reservasExitosas: reservasExitosas.length,
      reservasFallidas: reservasFallidas.length,
      tiempoReservas: tiempoReservas,
      promedioReserva: (tiempoReservas / promesasReservas.length).toFixed(2),
      tiempoConsulta: tiempoConsulta,
      promedioConsulta: (tiempoConsulta / reservasCreadas.length).toFixed(2),
      tiempoTotal: tiempoTotal,
      operacionesSegundo: (
        (cantidadOrdenes + promesasReservas.length) /
        (tiempoTotal / 1000)
      ).toFixed(2),
    };

    console.log(`\n   📊 Resumen de performance:`);
    console.log(`   
   CREACIÓN DE ÓRDENES:
   - Total: ${metricas.ordenesCreadas} órdenes
   - Tiempo: ${metricas.tiempoCreacionOrdenes}ms
   - Promedio: ${metricas.promedioCreacionOrden}ms/orden
   
   RESERVAS:
   - Total operaciones: ${metricas.operacionesReserva}
   - Exitosas: ${metricas.reservasExitosas}
   - Fallidas: ${metricas.reservasFallidas}
   - Tiempo: ${metricas.tiempoReservas}ms
   - Promedio: ${metricas.promedioReserva}ms/reserva
   
   CONSULTAS:
   - Total: ${reservasCreadas.length} reservas
   - Tiempo: ${metricas.tiempoConsulta}ms
   - Promedio: ${metricas.promedioConsulta}ms/consulta
   
   RENDIMIENTO GENERAL:
   - Tiempo total: ${metricas.tiempoTotal}ms (${(metricas.tiempoTotal / 1000).toFixed(2)}s)
   - Operaciones/segundo: ${metricas.operacionesSegundo}
   - Integridad de datos: ${todosIntegros ? "✅ OK" : "❌ ERROR"}
   `);

    // ============================================
    // PASO 7: Evaluación de performance
    // ============================================
    console.log("\n📈 PASO 7: EVALUACIÓN de performance");
    console.log("-".repeat(60));

    const evaluacion = {
      creacionRapida: parseFloat(metricas.promedioCreacionOrden) < 100, // < 100ms por orden
      reservasRapidas: parseFloat(metricas.promedioReserva) < 200, // < 200ms por reserva
      consultasRapidas: parseFloat(metricas.promedioConsulta) < 50, // < 50ms por consulta
      tasaExito: reservasExitosas.length / promesasReservas.length > 0.8, // > 80% éxito
      integridadOK: todosIntegros,
    };

    console.log(`\n   📊 Criterios de evaluación:`);
    console.log(
      `   ${evaluacion.creacionRapida ? "✅" : "⚠️ "} Creación de órdenes < 100ms (${metricas.promedioCreacionOrden}ms)`
    );
    console.log(
      `   ${evaluacion.reservasRapidas ? "✅" : "⚠️ "} Reservas < 200ms (${metricas.promedioReserva}ms)`
    );
    console.log(
      `   ${evaluacion.consultasRapidas ? "✅" : "⚠️ "} Consultas < 50ms (${metricas.promedioConsulta}ms)`
    );
    console.log(
      `   ${evaluacion.tasaExito ? "✅" : "⚠️ "} Tasa de éxito > 80% (${((reservasExitosas.length / promesasReservas.length) * 100).toFixed(1)}%)`
    );
    console.log(
      `   ${evaluacion.integridadOK ? "✅" : "❌"} Integridad de datos`
    );

    const testPassed = Object.values(evaluacion).every((v) => v === true);

    // ============================================
    // RESUMEN
    // ============================================
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMEN DEL TEST");
    console.log("=".repeat(60));
    console.log(`
    ESCENARIO: Sistema bajo Alta Carga
    
    CARGA APLICADA:
    - ${metricas.ordenesCreadas} órdenes de trabajo
    - ${metricas.operacionesReserva} operaciones de reserva
    - ${reservasCreadas.length} consultas de datos
    
    RESULTADOS:
    - Operaciones exitosas: ${metricas.reservasExitosas}
    - Operaciones fallidas: ${metricas.reservasFallidas}
    - Tasa de éxito: ${((metricas.reservasExitosas / metricas.operacionesReserva) * 100).toFixed(1)}%
    
    PERFORMANCE:
    - Tiempo total: ${(metricas.tiempoTotal / 1000).toFixed(2)}s
    - Operaciones/segundo: ${metricas.operacionesSegundo}
    - Integridad de datos: ${todosIntegros ? "PRESERVADA" : "COMPROMETIDA"}
    
    EVALUACIÓN:
    ${testPassed ? "✅ Sistema rinde adecuadamente bajo carga" : "⚠️  Sistema requiere optimización"}
    `);

    console.log("=".repeat(60));
    console.log(testPassed ? "🎉 TEST APROBADO" : "⚠️  TEST REQUIERE ATENCIÓN");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ Error en el test:", error);
    console.error(error.stack);
  } finally {
    // Limpiar datos de prueba
    console.log(`\n🧹 Limpiando datos de prueba...`);

    if (testData.reservations.length > 0) {
      await Reservation.deleteMany({ _id: { $in: testData.reservations } });
      console.log(`   ✅ ${testData.reservations.length} reservas eliminadas`);
    }

    if (testData.orders.length > 0) {
      const {
        WorkOrderItem,
      } = require("../features/workshop/work-orders/models");
      await WorkOrderItem.deleteMany({ workOrder: { $in: testData.orders } });
      await WorkOrder.deleteMany({ _id: { $in: testData.orders } });
      console.log(`   ✅ ${testData.orders.length} órdenes eliminadas`);
    }

    if (testData.vehicles.length > 0) {
      await Vehicle.deleteMany({ _id: { $in: testData.vehicles } });
      console.log(`   ✅ ${testData.vehicles.length} vehículos eliminados\n`);
    }

    process.exit(0);
  }
};

testPerformanceStress();
