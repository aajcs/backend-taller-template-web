/**
 * Script de diagnóstico para cuentas por cobrar
 * Verifica por qué las facturas no aparecen en el reporte
 */

const http = require("http");

// Configuración
const BASE_URL = "http://localhost:8000";
const API_PREFIX = "/api";

// Helper para hacer requests HTTP
const makeRequest = (method, endpoint, body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + API_PREFIX + endpoint);

    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (token) {
      options.headers["x-token"] = token;
    }

    const req = http.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        try {
          const parsedData = JSON.parse(data);
          resolve({
            statusCode: res.statusCode,
            data: parsedData,
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: data,
          });
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
};

const debugAccountsReceivable = async () => {
  try {
    console.log("🔍 DIAGNÓSTICO DE CUENTAS POR COBRAR");
    console.log("=".repeat(60));

    // 1. Autenticación
    console.log("\n1️⃣ Autenticando...");
    const authResponse = await makeRequest("POST", "/auth/login", {
      email: "superadmin@taller.com",
      password: "123456",
    });

    if (authResponse.statusCode !== 200) {
      console.error("❌ Error de autenticación:", authResponse.data);
      return;
    }

    const authToken = authResponse.data.token;
    console.log("✅ Autenticación exitosa");

    // 2. Listar TODAS las facturas
    console.log("\n2️⃣ Listando TODAS las facturas del sistema...");
    const allInvoicesResponse = await makeRequest(
      "GET",
      "/invoices",
      null,
      authToken
    );

    if (allInvoicesResponse.statusCode === 200) {
      const invoices =
        allInvoicesResponse.data.data || allInvoicesResponse.data.docs || [];
      console.log(`📊 Total de facturas: ${invoices.length}`);

      if (invoices.length > 0) {
        console.log("\nDetalle de facturas:");
        invoices.slice(0, 10).forEach((inv, idx) => {
          console.log(`\n${idx + 1}. ${inv.invoiceNumber || inv.id}`);
          console.log(`   - Estado: ${inv.status}`);
          console.log(`   - Total: $${inv.total}`);
          console.log(`   - Pagado: $${inv.paidAmount || 0}`);
          console.log(`   - Saldo: $${inv.balance}`);
          console.log(`   - Eliminado: ${inv.eliminado}`);
        });
      }
    }

    // 3. Buscar facturas con estado pagada_parcial
    console.log("\n3️⃣ Buscando facturas con estado 'pagada_parcial'...");
    const partialInvoicesResponse = await makeRequest(
      "GET",
      "/invoices?status=pagada_parcial",
      null,
      authToken
    );

    if (partialInvoicesResponse.statusCode === 200) {
      const partialInvoices =
        partialInvoicesResponse.data.data ||
        partialInvoicesResponse.data.docs ||
        [];
      console.log(
        `📊 Facturas pagadas parcialmente: ${partialInvoices.length}`
      );

      if (partialInvoices.length > 0) {
        partialInvoices.forEach((inv) => {
          console.log(`\n✅ ${inv.invoiceNumber}`);
          console.log(`   - Total: $${inv.total}`);
          console.log(`   - Pagado: $${inv.paidAmount}`);
          console.log(`   - Saldo: $${inv.balance}`);
        });
      }
    }

    // 4. Consultar pagos confirmados
    console.log("\n4️⃣ Consultando pagos confirmados...");
    // Nota: Necesitamos un endpoint para listar pagos, asumiendo que existe

    // 5. Consultar reporte de cuentas por cobrar
    console.log("\n5️⃣ Consultando reporte de cuentas por cobrar...");
    const today = new Date();
    const startDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    ).toISOString();
    const endDate = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0
    ).toISOString();

    const arResponse = await makeRequest(
      "GET",
      `/invoices/reports?type=accounts_receivable&startDate=${startDate}&endDate=${endDate}`,
      null,
      authToken
    );

    if (arResponse.statusCode === 200) {
      const arData = arResponse.data.data || arResponse.data;
      console.log("\n📊 REPORTE DE CUENTAS POR COBRAR:");
      console.log(
        `   - Facturas pendientes: ${arData.summary?.totalPendingInvoices || 0}`
      );
      console.log(
        `   - Total por cobrar: $${parseFloat(arData.summary?.totalReceivableAmount || 0).toLocaleString()}`
      );
      console.log(
        `   - Facturas vencidas: ${arData.summary?.overdueInvoices || 0}`
      );
      console.log(
        `   - Total vencido: $${parseFloat(arData.summary?.totalOverdueAmount || 0).toLocaleString()}`
      );

      if (arData.accountsReceivable && arData.accountsReceivable.length > 0) {
        console.log("\n📋 Facturas en el reporte:");
        arData.accountsReceivable.forEach((inv, idx) => {
          console.log(`\n${idx + 1}. ${inv.invoiceNumber}`);
          console.log(`   - Total: $${inv.totalAmount}`);
          console.log(`   - Pagado: $${inv.paidAmount}`);
          console.log(`   - Pendiente: $${inv.pendingAmount}`);
          console.log(`   - Estado: ${inv.status}`);
        });
      } else {
        console.log("\n⚠️ NO hay facturas en el reporte de cuentas por cobrar");
      }
    }

    // 6. Análisis de inconsistencias
    console.log("\n6️⃣ ANÁLISIS DE INCONSISTENCIAS:");
    console.log("-".repeat(60));

    if (allInvoicesResponse.statusCode === 200) {
      const allInvoices =
        allInvoicesResponse.data.data || allInvoicesResponse.data.docs || [];
      const arData =
        arResponse.statusCode === 200
          ? arResponse.data.data || arResponse.data
          : null;

      const partialInvoices = allInvoices.filter(
        (inv) =>
          (inv.status === "emitida" || inv.status === "pagada_parcial") &&
          inv.balance > 0 &&
          !inv.eliminado
      );

      console.log(
        `\n✓ Facturas con saldo pendiente en BD: ${partialInvoices.length}`
      );
      console.log(
        `✓ Facturas en reporte de cuentas por cobrar: ${arData?.accountsReceivable?.length || 0}`
      );

      if (
        partialInvoices.length > 0 &&
        (!arData?.accountsReceivable || arData.accountsReceivable.length === 0)
      ) {
        console.log("\n⚠️ INCONSISTENCIA DETECTADA:");
        console.log("   - Hay facturas con saldo pendiente en la BD");
        console.log(
          "   - Pero NO aparecen en el reporte de cuentas por cobrar"
        );
        console.log("\n   Facturas afectadas:");
        partialInvoices.forEach((inv) => {
          console.log(
            `   • ${inv.invoiceNumber}: Saldo $${inv.balance}, Estado: ${inv.status}`
          );
        });
      } else if (partialInvoices.length === 0) {
        console.log("\n✅ CONSISTENTE: No hay facturas con saldo pendiente");
      } else {
        console.log(
          "\n✅ CONSISTENTE: Todas las facturas pendientes están en el reporte"
        );
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ DIAGNÓSTICO COMPLETADO");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ ERROR EN DIAGNÓSTICO:");
    console.error(error);
  }
};

// Ejecutar diagnóstico
debugAccountsReceivable();
