/**
 * Test Completo: Órdenes de Trabajo para Todos los Estados
 * ===============================================================
 *
 * Objetivo: Crear órdenes de trabajo completas para todos los estados disponibles,
 * cada una con servicios y repuestos, dejando cada orden en su estado correspondiente
 *
 * Flujo:
 * 1. Obtener todos los estados disponibles
 * 2. Para cada estado:
 *    - Crear orden de trabajo con servicios y repuestos
 *    - Llevar la orden al estado correspondiente
 *    - Verificar que se complete correctamente
 */

const https = require("https");
const http = require("http");

function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === "https:" ? https : http;
    const req = protocol.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: JSON.parse(data),
          });
        } catch {
          resolve({ statusCode: res.statusCode, headers: res.headers, data });
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function testWorkOrdersForAllStates() {
  console.log(
    "╔══════════════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║    TEST COMPLETO: ÓRDENES PARA TODOS LOS ESTADOS                   ║"
  );
  console.log(
    "╚══════════════════════════════════════════════════════════════════════╝"
  );

  try {
    // ============================================
    // PASO 1: AUTENTICACIÓN
    // ============================================
    console.log("\n\n🔐 PASO 1: Autenticación");
    console.log("-".repeat(70));

    const loginResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        correo: "castilloitsystems@gmail.com",
        password: "1234abcd",
      }
    );

    if (loginResponse.statusCode !== 200) {
      console.error("❌ Error en login:", loginResponse.data);
      return;
    }

    const { token, usuario: loggedUser } = loginResponse.data;
    console.log("✅ Autenticado correctamente");
    console.log(
      `   Usuario: ${loggedUser.nombre} ${loggedUser.apellido || ""}`
    );

    const headers = {
      "Content-Type": "application/json",
      "x-token": token,
    };

    // ============================================
    // PASO 2: OBTENER DATOS NECESARIOS
    // ============================================
    console.log("\n\n📋 PASO 2: Obtener datos necesarios");
    console.log("-".repeat(70));

    // Obtener estados
    const statusesResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/work-order-statuses",
      method: "GET",
      headers,
    });

    const allStatuses = statusesResponse.data.data || [];
    console.log(`✅ ${allStatuses.length} estados disponibles`);

    if (allStatuses.length === 0) {
      console.error("❌ No hay estados disponibles");
      return;
    }

    // Usar todos los estados disponibles (no solo finales)
    const targetStatuses = allStatuses;
    console.log(`🎯 ${targetStatuses.length} estados para crear órdenes:`);
    targetStatuses.forEach((status, index) => {
      console.log(
        `   ${index + 1}. ${status.nombre} (${status.codigo}) - Tipo: ${status.tipo}`
      );
    });

    // Obtener clientes
    const customersResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/customers?limite=10",
      method: "GET",
      headers,
    });

    const customers =
      customersResponse.data.customers || customersResponse.data.data || [];
    console.log(`✅ ${customers.length} clientes disponibles`);

    if (customers.length === 0) {
      console.error("❌ No hay clientes disponibles");
      return;
    }

    // Obtener vehículos
    const vehiclesResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/vehicles",
      method: "GET",
      headers,
    });

    const vehicles =
      vehiclesResponse.data.vehicles || vehiclesResponse.data.data || [];
    console.log(`✅ ${vehicles.length} vehículos disponibles`);

    if (vehicles.length === 0) {
      console.error("❌ No hay vehículos disponibles");
      return;
    }

    // Obtener usuarios/técnicos
    const usersResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/user",
      method: "GET",
      headers,
    });

    const users =
      usersResponse.data.usuarios ||
      usersResponse.data.data ||
      usersResponse.data.users ||
      [];
    console.log(`✅ ${users.length} usuarios/técnicos disponibles`);

    if (users.length === 0) {
      console.error("❌ No hay usuarios disponibles");
      return;
    }

    // Obtener servicios
    const servicesResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/services?limite=10",
      method: "GET",
      headers,
    });

    const services =
      servicesResponse.data.services || servicesResponse.data.data || [];
    console.log(`✅ ${services.length} servicios disponibles`);

    if (services.length === 0) {
      console.error("❌ No hay servicios disponibles");
      return;
    }

    // Obtener repuestos/items disponibles
    const repuestosResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/items?limite=10",
      method: "GET",
      headers,
    });

    const repuestos =
      repuestosResponse.data.items || repuestosResponse.data.data || [];
    console.log(`✅ ${repuestos.length} repuestos disponibles`);

    if (repuestos.length === 0) {
      console.error("❌ No hay repuestos disponibles");
      return;
    }

    // ============================================
    // PASO 3: CREAR ÓRDENES PARA CADA ESTADO
    // ============================================
    console.log("\n\n📝 PASO 3: Crear órdenes para cada estado");
    console.log("-".repeat(70));

    const resultados = [];

    for (let i = 0; i < targetStatuses.length; i++) {
      const estadoTarget = targetStatuses[i];
      const customerIndex = i % customers.length;
      const vehicleIndex = i % vehicles.length;

      console.log(
        `\n🏭 Creando orden ${i + 1}/${targetStatuses.length} para estado: ${estadoTarget.nombre} (${estadoTarget.codigo})`
      );

      // Crear orden de trabajo con servicios y repuestos
      const workOrderData = {
        customer: customers[customerIndex]._id,
        vehicle: vehicles[vehicleIndex]._id,
        motivo: `Prueba completa para estado ${estadoTarget.nombre} - Mantenimiento integral del vehículo`,
        kilometraje: 30000 + i * 10000, // Kilometrajes diferentes
        tecnicoAsignado: users[0]._id,
        prioridad: ["baja", "normal", "alta"][i % 3],
        descripcionProblema: `Cliente solicita servicio completo que debe terminar en estado ${estadoTarget.nombre}. Vehículo requiere atención integral.`,
        fechaEstimadaEntrega: new Date(
          Date.now() + (2 + i) * 24 * 60 * 60 * 1000
        ).toISOString(), // Fechas diferentes
        items: [
          // Servicio
          {
            tipo: "servicio",
            servicio: services[i % services.length]._id,
            nombre: services[i % services.length].nombre || `Servicio ${i + 1}`,
            descripcion: `Servicio completo para finalizar en ${estadoTarget.nombre}`,
            cantidad: 1,
            precioUnitario: 200 + i * 50, // Precios variables
            precioFinal: 200 + i * 50,
          },
          // Repuesto 1
          {
            tipo: "repuesto",
            repuesto: repuestos[i % repuestos.length]._id,
            nombre:
              repuestos[i % repuestos.length].nombre || `Repuesto ${i + 1}A`,
            descripcion: `Repuesto necesario para ${estadoTarget.nombre}`,
            cantidad: 1 + (i % 3), // Cantidades variables
            precioUnitario: 50 + i * 20,
            precioFinal: (1 + (i % 3)) * (50 + i * 20),
          },
          // Repuesto 2 (para asegurar que todas tengan múltiples repuestos)
          {
            tipo: "repuesto",
            repuesto: repuestos[(i + 1) % repuestos.length]._id,
            nombre:
              repuestos[(i + 1) % repuestos.length].nombre ||
              `Repuesto ${i + 1}B`,
            descripcion: `Repuesto adicional para ${estadoTarget.nombre}`,
            cantidad: 2,
            precioUnitario: 30 + i * 10,
            precioFinal: 2 * (30 + i * 10),
          },
        ],
      };

      const createResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: "/api/work-orders",
          method: "POST",
          headers,
        },
        workOrderData
      );

      if (createResponse.statusCode !== 201) {
        console.error(
          `❌ Error creando orden para ${estadoTarget.nombre}:`,
          createResponse.data
        );
        continue;
      }

      const workOrder = createResponse.data.workOrder;
      console.log(`   ✅ Orden creada: ${workOrder.numeroOrden}`);
      console.log(`      Cliente: ${customers[customerIndex].nombre}`);
      console.log(
        `      Vehículo: ${vehicles[vehicleIndex].placa || vehicles[vehicleIndex].marca}`
      );
      console.log(
        `      Items: ${workOrderData.items.length} (1 servicio + 2 repuestos)`
      );

      // Verificar items agregados
      const itemsResponse = await makeRequest({
        hostname: "localhost",
        port: 4000,
        path: `/api/work-orders/${workOrder._id}/items`,
        method: "GET",
        headers,
      });

      let totalCost = 0;
      if (itemsResponse.statusCode === 200) {
        const items = itemsResponse.data.data || [];
        console.log(`   📦 Items verificados: ${items.length}`);
        items.forEach((item, index) => {
          console.log(
            `      ${index + 1}. ${item.nombre} (${item.tipo}) - Cant: ${item.cantidad}, Precio: $${item.precioUnitario}`
          );
          totalCost += item.precioFinal || item.cantidad * item.precioUnitario;
        });
        console.log(`   💰 Costo total: $${totalCost}`);
      }

      // ============================================
      // PASO 4: LLEVAR ORDEN AL ESTADO CORRESPONDIENTE
      // ============================================
      console.log(`\n   🚀 Llevando orden a estado: ${estadoTarget.nombre}`);

      // Determinar el flujo de estados para llegar al estado target
      const flujoEstados = determinarFlujoEstados(allStatuses, estadoTarget);

      for (const estadoCodigo of flujoEstados) {
        console.log(`      ➡️  Cambiando a: ${estadoCodigo}`);

        const changeResponse = await makeRequest(
          {
            hostname: "localhost",
            port: 4000,
            path: `/api/work-orders/${workOrder._id}/change-status`,
            method: "POST",
            headers,
          },
          {
            newStatus: estadoCodigo,
            notes: `Paso automático hacia estado ${estadoTarget.nombre}`,
          }
        );

        if (changeResponse.statusCode !== 200) {
          console.error(
            `❌ Error cambiando a ${estadoCodigo}:`,
            changeResponse.data
          );
          break;
        }

        console.log(`         ✅ Estado cambiado a ${estadoCodigo}`);

        // Si es FACTURADO, completar items y verificar factura
        if (estadoCodigo === "FACTURADO") {
          console.log(`         🔍 Completando items para facturación...`);

          // Completar todos los items
          const itemsResp = await makeRequest({
            hostname: "localhost",
            port: 4000,
            path: `/api/work-orders/${workOrder._id}/items`,
            method: "GET",
            headers,
          });

          if (itemsResp.statusCode === 200) {
            const items = itemsResp.data.data || [];
            for (const item of items) {
              const completeResp = await makeRequest({
                hostname: "localhost",
                port: 4000,
                path: `/api/work-orders/${workOrder._id}/items/item/${item._id}/complete`,
                method: "PATCH",
                headers,
              });

              if (completeResp.statusCode === 200) {
                console.log(`            ✅ Item completado: ${item.nombre}`);
              } else {
                console.error(
                  `❌ Error completando item ${item.nombre}:`,
                  completeResp.data
                );
              }
            }
          }

          // Verificar generación automática de factura
          console.log(
            `         🔍 Verificando generación automática de factura...`
          );
          await new Promise((resolve) => setTimeout(resolve, 1000)); // Esperar un poco

          const invoiceCheckResponse = await makeRequest({
            hostname: "localhost",
            port: 4000,
            path: `/api/invoices?workOrder=${workOrder._id}`,
            method: "GET",
            headers,
          });

          if (invoiceCheckResponse.statusCode === 200) {
            const invoices = invoiceCheckResponse.data.data || [];
            if (invoices.length > 0) {
              console.log(
                `         ✅ Factura generada automáticamente: ${invoices[0].invoiceNumber}`
              );
            } else {
              console.log(`         ❌ No se generó factura automáticamente`);
            }
          }
        }
      }

      // Verificar estado final
      const finalCheckResponse = await makeRequest({
        hostname: "localhost",
        port: 4000,
        path: `/api/work-orders/${workOrder._id}`,
        method: "GET",
        headers,
      });

      if (finalCheckResponse.statusCode === 200) {
        const finalWorkOrder =
          finalCheckResponse.data.workOrder || finalCheckResponse.data;
        console.log(
          `   🎯 Estado final alcanzado: ${finalWorkOrder.estado?.nombre} (${finalWorkOrder.estado?.codigo})`
        );

        resultados.push({
          numeroOrden: workOrder.numeroOrden,
          estadoFinal: estadoTarget.nombre,
          estadoAlcanzado: finalWorkOrder.estado?.nombre,
          exito: finalWorkOrder.estado?.codigo === estadoTarget.codigo,
          costoTotal: totalCost,
          itemsCount: workOrderData.items.length,
        });
      }
    }

    // ============================================
    // PASO 5: RESUMEN FINAL
    // ============================================
    console.log("\n\n📊 PASO 5: Resumen final");
    console.log("-".repeat(70));

    console.log(`✅ Órdenes creadas: ${resultados.length}`);
    console.log(`📋 Estados probados: ${targetStatuses.length}`);

    let exitos = 0;
    resultados.forEach((resultado, index) => {
      const status = resultado.exito ? "✅" : "❌";
      console.log(
        `${status} Orden ${resultado.numeroOrden}: ${resultado.estadoFinal} - Costo: $${resultado.costoTotal} (${resultado.itemsCount} items)`
      );
      if (resultado.exito) exitos++;
    });

    console.log(
      `\n🏆 Resultado: ${exitos}/${resultados.length} órdenes completadas exitosamente`
    );

    if (exitos === resultados.length) {
      console.log(
        "\n🎉 TEST COMPLETADO EXITOSAMENTE - TODOS LOS ESTADOS CUBIERTOS"
      );
    } else {
      console.log(
        `\n⚠️ TEST COMPLETADO CON ${resultados.length - exitos} ERRORES`
      );
    }
  } catch (error) {
    console.error("❌ Error en el test:", error);
  }
}

// Función auxiliar para determinar el flujo de estados
function determinarFlujoEstados(allStatuses, estadoTarget) {
  // Estados base que siempre se incluyen (excepto RECIBIDO ya que las órdenes se crean en ese estado)
  const flujoBase = ["DIAGNOSTICO", "PRESUPUESTO"];

  // Si el estado target es intermedio, solo llegar hasta ahí
  if (estadoTarget.tipo === "intermedio") {
    if (estadoTarget.codigo === "DIAGNOSTICO") {
      return ["DIAGNOSTICO"];
    }
    if (estadoTarget.codigo === "PRESUPUESTO") {
      return ["DIAGNOSTICO", "PRESUPUESTO"];
    }
    if (estadoTarget.codigo === "EN_PROCESO") {
      return ["DIAGNOSTICO", "PRESUPUESTO", "EN_PROCESO"];
    }
    if (estadoTarget.codigo === "FINALIZADO") {
      return ["DIAGNOSTICO", "PRESUPUESTO", "EN_PROCESO", "FINALIZADO"];
    }
  }

  // Para estados finales, incluir el flujo completo
  if (estadoTarget.codigo === "FACTURADO") {
    return [
      "DIAGNOSTICO",
      "PRESUPUESTO",
      "EN_PROCESO",
      "FINALIZADO",
      "FACTURADO",
    ];
  }
  if (estadoTarget.codigo === "ENTREGADO") {
    return [
      "DIAGNOSTICO",
      "PRESUPUESTO",
      "EN_PROCESO",
      "FINALIZADO",
      "FACTURADO",
      "ENTREGADO",
    ];
  }
  if (estadoTarget.codigo === "RECHAZADO") {
    return ["DIAGNOSTICO", "PRESUPUESTO", "RECHAZADO"];
  }
  if (estadoTarget.codigo === "CANCELADO") {
    return ["CANCELADO"];
  }

  // Para cualquier otro estado, incluirlo en el flujo
  if (!flujoBase.includes(estadoTarget.codigo)) {
    flujoBase.push(estadoTarget.codigo);
  }

  return flujoBase;
}

// Ejecutar el test
testWorkOrdersForAllStates().catch(console.error);
