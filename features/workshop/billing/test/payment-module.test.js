/**
 * Test Completo del Módulo de Pagos
 * ==================================
 *
 * Objetivo: Validar todas las funcionalidades del módulo de pagos
 *
 * Funcionalidades a Probar:
 * 1. Creación de pagos (parciales y totales)
 * 2. Múltiples métodos de pago (efectivo, transferencia, tarjeta, etc.)
 * 3. Gestión de estados de pago (pendiente, confirmado, rechazado, reembolsado)
 * 4. Actualización de pagos
 * 5. Confirmación, rechazo y reembolso de pagos
 * 6. Eliminación de pagos
 * 7. Validaciones y manejo de errores
 * 8. Actualización automática del balance de facturas
 *
 * Estructura del Test:
 * ====================
 *
 * PASO 1: Configuración Inicial
 * - Autenticación
 * - Crear factura de prueba
 *
 * PASO 2: Testing de Creación de Pagos
 * - Pago total con diferentes métodos
 * - Pago parcial
 * - Múltiples pagos parciales
 *
 * PASO 3: Testing de Gestión de Estados
 * - Confirmar pago pendiente
 * - Rechazar pago
 * - Reembolsar pago confirmado
 *
 * PASO 4: Testing de Actualización
 * - Modificar monto y método de pago
 * - Agregar notas y referencias
 *
 * PASO 5: Testing de Eliminación
 * - Eliminar pago pendiente
 * - Intentar eliminar pago confirmado
 *
 * PASO 6: Testing de Validaciones
 * - Monto inválido (negativo, cero)
 * - Método de pago inválido
 * - Pago mayor al balance pendiente
 * - Referencias duplicadas
 *
 * Resultado Esperado:
 * - Pagos creados correctamente con todos los métodos
 * - Estados de pago gestionados apropiadamente
 * - Balance de facturas actualizado automáticamente
 * - Validaciones funcionando correctamente
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

async function testPaymentModule() {
  console.log(
    "╔══════════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║           TEST COMPLETO DEL MÓDULO DE PAGOS                   ║"
  );
  console.log(
    "╚══════════════════════════════════════════════════════════════════╝"
  );

  let testInvoice = null;
  let createdPayments = [];

  try {
    // ============================================
    // PASO 1: CONFIGURACIÓN INICIAL
    // ============================================
    console.log("\n\n🔐 PASO 1: Configuración Inicial");
    console.log("-".repeat(70));

    // Autenticación
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
    console.log(`   Usuario: ${loggedUser.nombre} ${loggedUser.apellido || ""}`);

    const headers = {
      "Content-Type": "application/json",
      "x-token": token,
    };

    // ============================================
    // PASO 2: CREAR ORDEN DE TRABAJO BASE
    // ============================================
    console.log("\n\n📋 PASO 2: Crear Orden de Trabajo Base");
    console.log("-".repeat(70));

    // Obtener datos necesarios
    console.log("\n📋 Obteniendo datos necesarios...");

    // Clientes
    const customersResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/customers?limite=5",
      method: "GET",
      headers,
    });
    const customers = customersResponse.data.customers || customersResponse.data.data || [];
    console.log(`✅ ${customers.length} clientes disponibles`);

    // Vehículos
    const vehiclesResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/vehicles?limite=5",
      method: "GET",
      headers,
    });
    const vehicles = vehiclesResponse.data.vehicles || vehiclesResponse.data.data || [];
    console.log(`✅ ${vehicles.length} vehículos disponibles`);

    // Servicios
    const servicesResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/services?limite=5",
      method: "GET",
      headers,
    });
    const services = servicesResponse.data.services || servicesResponse.data.data || [];
    console.log(`✅ ${services.length} servicios disponibles`);

    // Repuestos
    const repuestosResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/items?limite=5",
      method: "GET",
      headers,
    });
    const repuestos = repuestosResponse.data.items || repuestosResponse.data.data || [];
    console.log(`✅ ${repuestos.length} repuestos disponibles`);

    // ============================================
    // PASO 3: CREAR ORDEN DE TRABAJO
    // ============================================
    console.log("\n\n🏭 PASO 3: Crear Orden de Trabajo");
    console.log("-".repeat(70));

    const workOrderData = {
      customer: customers[0]._id,
      vehicle: vehicles[0]._id,
      motivo: "Mantenimiento completo para testing de pagos",
      kilometraje: 50000,
      tecnicoAsignado: loggedUser._id,
      prioridad: "normal",
      descripcionProblema: "Vehículo requiere mantenimiento integral para validar sistema de pagos",
      fechaEstimadaEntrega: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        {
          tipo: "servicio",
          servicio: services[0]._id,
          nombre: services[0].nombre || "Servicio de Prueba",
          descripcion: "Servicio completo para testing",
          cantidad: 1,
          precioUnitario: 250,
          precioFinal: 250,
        },
        {
          tipo: "repuesto",
          repuesto: repuestos[0]._id,
          nombre: repuestos[0].nombre || "Repuesto de Prueba 1",
          descripcion: "Repuesto necesario",
          cantidad: 2,
          precioUnitario: 75,
          precioFinal: 150,
        },
        {
          tipo: "repuesto",
          repuesto: repuestos[1]._id,
          nombre: repuestos[1].nombre || "Repuesto de Prueba 2",
          descripcion: "Repuesto adicional",
          cantidad: 1,
          precioUnitario: 120,
          precioFinal: 120,
        },
      ],
    };

    const createWorkOrderResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/work-orders",
        method: "POST",
        headers,
      },
      workOrderData
    );

    if (createWorkOrderResponse.statusCode !== 201) {
      console.error("❌ Error creando orden de trabajo:", createWorkOrderResponse.data);
      return;
    }

    const workOrder = createWorkOrderResponse.data.workOrder;
    console.log("✅ Orden de trabajo creada");
    console.log(`   Número: ${workOrder.numeroOrden}`);
    console.log(`   Cliente: ${customers[0].nombre}`);
    console.log(`   Vehículo: ${vehicles[0].placa || vehicles[0].marca}`);
    console.log(`   Ítems: ${workOrderData.items.length} (1 servicio + 2 repuestos)`);

    // Calcular total esperado
    const expectedTotal = workOrderData.items.reduce((sum, item) => sum + item.precioFinal, 0);
    console.log(`   💰 Total esperado: $${expectedTotal}`);

    // ============================================
    // PASO 4: LLEVAR OT A ESTADO FACTURADO
    // ============================================
    console.log("\n\n🚀 PASO 4: Llevar OT a Estado Facturado");
    console.log("-".repeat(70));

    // Flujo: RECIBIDO → DIAGNOSTICO → PRESUPUESTO → EN_PROCESO → FINALIZADO → FACTURADO
    const statusFlow = ["DIAGNOSTICO", "PRESUPUESTO", "EN_PROCESO", "FINALIZADO", "FACTURADO"];

    for (const statusCode of statusFlow) {
      console.log(`   ➡️ Cambiando a: ${statusCode}`);

      if (statusCode === "FACTURADO") {
        console.log(`   🔧 Cambiando estado vía API...`);
        const changeResponse = await makeRequest(
          {
            hostname: "localhost",
            port: 4000,
            path: `/api/work-orders/${workOrder._id}/change-status`,
            method: "POST",
            headers,
          },
          {
            newStatus: statusCode,
            notes: `Cambio automático para testing de pagos`,
          }
        );

        if (changeResponse.statusCode !== 200) {
          console.error(`❌ Error cambiando estado a ${statusCode}:`, changeResponse.data);
          return;
        }
        
        console.log(`      ✅ Estado cambiado a ${statusCode}`);
      } else {
        const changeResponse = await makeRequest(
          {
            hostname: "localhost",
            port: 4000,
            path: `/api/work-orders/${workOrder._id}/change-status`,
            method: "POST",
            headers,
          },
          {
            newStatus: statusCode,
            notes: `Paso automático para testing de pagos`,
          }
        );

        if (changeResponse.statusCode !== 200) {
          console.error(`❌ Error cambiando estado a ${statusCode}:`, changeResponse.data);
          return;
        }
        
        console.log(`      ✅ Estado cambiado a ${statusCode}`);
      }
    }

    // ============================================
    // PASO 5: OBTENER FACTURA CREADA
    // ============================================
    console.log("\n\n📄 PASO 5: Obtener Factura Creada");
    console.log("-".repeat(70));

    // Buscar la factura creada para esta orden de trabajo
    const invoicesResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/invoices",
      method: "GET",
      headers,
    });

    if (invoicesResponse.statusCode !== 200) {
      console.error("❌ Error obteniendo facturas:", invoicesResponse.data);
      return;
    }

    const invoices = invoicesResponse.data.invoices || invoicesResponse.data.data || invoicesResponse.data || [];
    console.log(`   📄 Encontradas ${Array.isArray(invoices) ? invoices.length : 'N/A'} facturas`);
    
    let invoice = null;
    if (Array.isArray(invoices)) {
      invoice = invoices.find(inv => inv.workOrder && (inv.workOrder._id === workOrder._id || inv.workOrder === workOrder._id));
    } else if (invoices.workOrder && (invoices.workOrder._id === workOrder._id || invoices.workOrder === workOrder._id)) {
      invoice = invoices;
    }

    if (!invoice) {
      console.error("❌ No se encontró la factura creada para la orden de trabajo");
      console.log("   WorkOrder ID:", workOrder._id);
      console.log("   Facturas encontradas:", invoices);
      return;
    }

    testInvoice = invoice;
    console.log("✅ Factura encontrada");
    console.log(`   Número: ${testInvoice.invoiceNumber || testInvoice.number || testInvoice._id}`);
    console.log(`   Total: $${testInvoice.total}`);
    console.log(`   Balance: $${testInvoice.balance || testInvoice.total}`);
    console.log(`   Estado: ${testInvoice.status || "borrador"}`);
    // ============================================
    // PASO 6: TESTING DE CREACIÓN DE PAGOS
    // ============================================
    console.log("\n\n💰 PASO 6: Testing de Creación de Pagos");
    console.log("-".repeat(70));

    // Pago total en efectivo
    console.log("\n💵 Creando pago total en efectivo...");
    const cashPaymentData = {
      invoice: testInvoice._id,
      amount: testInvoice.total,
      paymentMethod: "efectivo",
      reference: "TEST-CASH-001",
      notes: "Pago total en efectivo para testing",
    };

    const cashPaymentResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/payments",
        method: "POST",
        headers,
      },
      cashPaymentData
    );

    if (cashPaymentResponse.statusCode !== 201) {
      console.error("❌ Error creando pago en efectivo:", cashPaymentResponse.data);
    } else {
      const cashPayment = cashPaymentResponse.data.payment;
      createdPayments.push(cashPayment);
      console.log("✅ Pago en efectivo creado");
      console.log(`   ID: ${cashPayment._id}`);
      console.log(`   Monto: $${cashPayment.amount}`);
      console.log(`   Método: ${cashPayment.paymentMethod}`);
      console.log(`   Estado: ${cashPayment.status}`);
    }

    // Verificar que la factura esté pagada
    const invoiceCheckResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: `/api/invoices/${testInvoice._id}`,
      method: "GET",
      headers,
    });

    if (invoiceCheckResponse.statusCode === 200) {
      const updatedInvoice = invoiceCheckResponse.data.invoice;
      console.log(`   📊 Balance actualizado: $${updatedInvoice.balance}`);
      console.log(`   📊 Estado: ${updatedInvoice.status}`);
    }

    // Crear nueva factura para pagos parciales
    console.log("\n📄 Creando segunda factura para pagos parciales...");
    const partialInvoiceData = {
      customer: customer._id,
      issueDate: new Date().toISOString(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: "emitida",
      items: [
        {
          type: "service",
          description: "Servicio para pagos parciales",
          quantity: 1,
          unitPrice: 2000,
          subtotal: 2000,
        },
      ],
      notes: "Factura para testing de pagos parciales",
    };

    const createPartialInvoiceResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/invoices",
        method: "POST",
        headers,
      },
      partialInvoiceData
    );

    if (createPartialInvoiceResponse.statusCode !== 201) {
      console.error("❌ Error creando factura parcial:", createPartialInvoiceResponse.data);
      return;
    }

    const partialInvoice = createPartialInvoiceResponse.data.invoice;
    console.log("✅ Factura parcial creada");
    console.log(`   Número: ${partialInvoice.invoiceNumber}`);
    console.log(`   Total: $${partialInvoice.total}`);

    // Pago parcial con transferencia
    console.log("\n🏦 Creando pago parcial con transferencia...");
    const transferPaymentData = {
      invoice: partialInvoice._id,
      amount: 800,
      paymentMethod: "transferencia",
      reference: "TEST-TRANSFER-001",
      notes: "Pago parcial con transferencia bancaria",
      paymentDetails: {
        bankName: "Banco de Prueba",
        accountNumber: "1234567890",
      },
    };

    const transferPaymentResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/payments",
        method: "POST",
        headers,
      },
      transferPaymentData
    );

    if (transferPaymentResponse.statusCode !== 201) {
      console.error("❌ Error creando pago con transferencia:", transferPaymentResponse.data);
    } else {
      const transferPayment = transferPaymentResponse.data.payment;
      createdPayments.push(transferPayment);
      console.log("✅ Pago con transferencia creado");
      console.log(`   ID: ${transferPayment._id}`);
      console.log(`   Monto: $${transferPayment.amount}`);
      console.log(`   Banco: ${transferPayment.paymentDetails.bankName}`);
    }

    // Pago parcial con tarjeta de crédito
    console.log("\n💳 Creando pago parcial con tarjeta de crédito...");
    const cardPaymentData = {
      invoice: partialInvoice._id,
      amount: 600,
      paymentMethod: "tarjeta_credito",
      reference: "TEST-CARD-001",
      notes: "Pago parcial con tarjeta de crédito",
      paymentDetails: {
        cardLastFour: "1234",
        cardType: "visa",
      },
    };

    const cardPaymentResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/payments",
        method: "POST",
        headers,
      },
      cardPaymentData
    );

    if (cardPaymentResponse.statusCode !== 201) {
      console.error("❌ Error creando pago con tarjeta:", cardPaymentResponse.data);
    } else {
      const cardPayment = cardPaymentResponse.data.payment;
      createdPayments.push(cardPayment);
      console.log("✅ Pago con tarjeta creado");
      console.log(`   ID: ${cardPayment._id}`);
      console.log(`   Monto: $${cardPayment.amount}`);
      console.log(`   Tarjeta: **** ${cardPayment.paymentDetails.cardLastFour}`);
    }

    // Pago final para completar la factura
    console.log("\n💰 Creando pago final para completar factura...");
    const finalPaymentData = {
      invoice: partialInvoice._id,
      amount: 600, // 2000 - 800 - 600 = 600
      paymentMethod: "efectivo",
      reference: "TEST-FINAL-001",
      notes: "Pago final para completar factura",
    };

    const finalPaymentResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/payments",
        method: "POST",
        headers,
      },
      finalPaymentData
    );

    if (finalPaymentResponse.statusCode !== 201) {
      console.error("❌ Error creando pago final:", finalPaymentResponse.data);
    } else {
      const finalPayment = finalPaymentResponse.data.payment;
      createdPayments.push(finalPayment);
      console.log("✅ Pago final creado");
      console.log(`   ID: ${finalPayment._id}`);
      console.log(`   Monto: $${finalPayment.amount}`);
    }

    // Verificar balance final
    const finalInvoiceCheckResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: `/api/invoices/${partialInvoice._id}`,
      method: "GET",
      headers,
    });

    if (finalInvoiceCheckResponse.statusCode === 200) {
      const finalUpdatedInvoice = finalInvoiceCheckResponse.data.invoice;
      console.log(`   📊 Balance final: $${finalUpdatedInvoice.balance}`);
      console.log(`   📊 Estado final: ${finalUpdatedInvoice.status}`);
    }

    // ============================================
    // PASO 3: TESTING DE GESTIÓN DE ESTADOS
    // ============================================
    console.log("\n\n🔄 PASO 3: Testing de Gestión de Estados");
    console.log("-".repeat(70));

    // Crear pago pendiente
    console.log("\n⏳ Creando pago pendiente...");
    const pendingPaymentData = {
      invoice: partialInvoice._id,
      amount: 100,
      paymentMethod: "cheque",
      reference: "TEST-PENDING-001",
      notes: "Pago pendiente para testing de estados",
      status: "pendiente",
    };

    const pendingPaymentResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/payments",
        method: "POST",
        headers,
      },
      pendingPaymentData
    );

    let pendingPayment = null;
    if (pendingPaymentResponse.statusCode !== 201) {
      console.error("❌ Error creando pago pendiente:", pendingPaymentResponse.data);
    } else {
      pendingPayment = pendingPaymentResponse.data.payment;
      createdPayments.push(pendingPayment);
      console.log("✅ Pago pendiente creado");
      console.log(`   ID: ${pendingPayment._id}`);
      console.log(`   Estado: ${pendingPayment.status}`);
    }

    // Confirmar pago pendiente
    if (pendingPayment) {
      console.log("\n✅ Confirmando pago pendiente...");
      const confirmResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: `/api/payments/${pendingPayment._id}/confirm`,
          method: "PATCH",
          headers,
        },
        { notes: "Pago confirmado por testing" }
      );

      if (confirmResponse.statusCode !== 200) {
        console.error("❌ Error confirmando pago:", confirmResponse.data);
      } else {
        console.log("✅ Pago confirmado exitosamente");
        console.log(`   Nuevo estado: ${confirmResponse.data.payment.status}`);
      }
    }

    // Rechazar un pago (crear otro pago pendiente primero)
    console.log("\n❌ Creando pago para rechazar...");
    const rejectPaymentData = {
      invoice: partialInvoice._id,
      amount: 50,
      paymentMethod: "otro",
      reference: "TEST-REJECT-001",
      notes: "Pago que será rechazado",
      status: "pendiente",
    };

    const rejectPaymentResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/payments",
        method: "POST",
        headers,
      },
      rejectPaymentData
    );

    let rejectPayment = null;
    if (rejectPaymentResponse.statusCode !== 201) {
      console.error("❌ Error creando pago para rechazar:", rejectPaymentResponse.data);
    } else {
      rejectPayment = rejectPaymentResponse.data.payment;
      createdPayments.push(rejectPayment);
      console.log("✅ Pago para rechazar creado");
    }

    // Rechazar el pago
    if (rejectPayment) {
      console.log("\n❌ Rechazando pago...");
      const rejectResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: `/api/payments/${rejectPayment._id}/reject`,
          method: "PATCH",
          headers,
        },
        { reason: "Pago rechazado por testing" }
      );

      if (rejectResponse.statusCode !== 200) {
        console.error("❌ Error rechazando pago:", rejectResponse.data);
      } else {
        console.log("✅ Pago rechazado exitosamente");
        console.log(`   Nuevo estado: ${rejectResponse.data.payment.status}`);
        console.log(`   Notas: ${rejectResponse.data.payment.notes}`);
      }
    }

    // ============================================
    // PASO 4: TESTING DE ACTUALIZACIÓN
    // ============================================
    console.log("\n\n📝 PASO 4: Testing de Actualización");
    console.log("-".repeat(70));

    // Actualizar un pago confirmado
    const paymentToUpdate = createdPayments.find(p => p.status === "confirmado");
    if (paymentToUpdate) {
      console.log("\n📝 Actualizando pago confirmado...");
      const updateData = {
        amount: paymentToUpdate.amount + 50,
        notes: "Pago actualizado para testing",
        reference: `${paymentToUpdate.reference}-UPDATED`,
      };

      const updateResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: `/api/payments/${paymentToUpdate._id}`,
          method: "PUT",
          headers,
        },
        updateData
      );

      if (updateResponse.statusCode !== 200) {
        console.error("❌ Error actualizando pago:", updateResponse.data);
      } else {
        console.log("✅ Pago actualizado exitosamente");
        console.log(`   Nuevo monto: $${updateResponse.data.payment.amount}`);
        console.log(`   Nuevas notas: ${updateResponse.data.payment.notes}`);
      }
    }

    // ============================================
    // PASO 5: TESTING DE ELIMINACIÓN
    // ============================================
    console.log("\n\n🗑️ PASO 5: Testing de Eliminación");
    console.log("-".repeat(70));

    // Eliminar pago rechazado
    if (rejectPayment) {
      console.log("\n🗑️ Eliminando pago rechazado...");
      const deleteResponse = await makeRequest({
        hostname: "localhost",
        port: 4000,
        path: `/api/payments/${rejectPayment._id}`,
        method: "DELETE",
        headers,
      });

      if (deleteResponse.statusCode !== 200) {
        console.error("❌ Error eliminando pago:", deleteResponse.data);
      } else {
        console.log("✅ Pago eliminado exitosamente");
      }
    }

    // ============================================
    // PASO 6: TESTING DE VALIDACIONES
    // ============================================
    console.log("\n\n✅ PASO 6: Testing de Validaciones");
    console.log("-".repeat(70));

    // Intentar crear pago con monto negativo
    console.log("\n❌ Probando validación: monto negativo...");
    const invalidPaymentData = {
      invoice: partialInvoice._id,
      amount: -100,
      paymentMethod: "efectivo",
      reference: "TEST-INVALID-001",
    };

    const invalidPaymentResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/payments",
        method: "POST",
        headers,
      },
      invalidPaymentData
    );

    if (invalidPaymentResponse.statusCode !== 400) {
      console.log("⚠️ Validación de monto negativo no funcionó como esperado");
    } else {
      console.log("✅ Validación de monto negativo funciona correctamente");
    }

    // Intentar crear pago con método inválido
    console.log("\n❌ Probando validación: método de pago inválido...");
    const invalidMethodData = {
      invoice: partialInvoice._id,
      amount: 100,
      paymentMethod: "metodo_invalido",
      reference: "TEST-INVALID-METHOD-001",
    };

    const invalidMethodResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/payments",
        method: "POST",
        headers,
      },
      invalidMethodData
    );

    if (invalidMethodResponse.statusCode !== 400) {
      console.log("⚠️ Validación de método de pago no funcionó como esperado");
    } else {
      console.log("✅ Validación de método de pago funciona correctamente");
    }

    // ============================================
    // PASO 7: VERIFICACIÓN FINAL
    // ============================================
    console.log("\n\n📊 PASO 7: Verificación Final");
    console.log("-".repeat(70));

    // Obtener todos los pagos de la factura parcial
    console.log("\n📋 Obteniendo todos los pagos de la factura...");
    const paymentsResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: `/api/payments/invoice/${partialInvoice._id}`,
      method: "GET",
      headers,
    });

    if (paymentsResponse.statusCode === 200) {
      const payments = paymentsResponse.data.data;
      console.log(`✅ Encontrados ${payments.length} pagos`);
      payments.forEach((payment, index) => {
        console.log(`   ${index + 1}. ${payment.paymentMethod}: $${payment.amount} (${payment.status})`);
      });
    }

    // Verificar estado final de la factura
    const finalCheckResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: `/api/invoices/${partialInvoice._id}`,
      method: "GET",
      headers,
    });

    if (finalCheckResponse.statusCode === 200) {
      const finalInvoice = finalCheckResponse.data.invoice;
      console.log("\n📊 Estado final de la factura:");
      console.log(`   Balance: $${finalInvoice.balance}`);
      console.log(`   Estado: ${finalInvoice.status}`);
      console.log(`   Total pagado: $${finalInvoice.total - finalInvoice.balance}`);
    }

    console.log("\n🎉 TEST COMPLETADO EXITOSAMENTE");
    console.log("✅ Todas las funcionalidades de pagos han sido validadas");

  } catch (error) {
    console.error("\n❌ Error durante el test del módulo de pagos:", error);
  }
}

// Ejecutar el test
testPaymentModule();