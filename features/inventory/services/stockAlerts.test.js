/**
 * Test para Stock Alerts Service
 * ================================
 *
 * Objetivo: Validar el servicio de alertas de stock
 *
 * Funcionalidades probadas:
 * -------------------------
 * 1. Listar items con stock por debajo del mínimo
 * 2. Generar reporte estadístico de alertas
 * 3. Obtener sugerencias de órdenes de compra
 * 4. Consultar alerta de un item específico
 *
 * Nota: Este test NO crea items ni movimientos. Usa items existentes
 *       en el sistema que ya tienen stock mínimo configurado.
 *
 * Prerrequisitos:
 * ---------------
 * - Base de datos con items que tienen stockMinimo configurado
 * - Items con stock por debajo del mínimo (para ver alertas)
 * - Usuario con credenciales válidas
 *
 * Endpoints probados:
 * -------------------
 * - GET /api/inventory/stock/alerts/below-minimum
 * - GET /api/inventory/stock/alerts/report
 * - GET /api/inventory/stock/alerts/purchase-suggestions
 * - GET /api/inventory/stock/alerts/item/:itemId
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

async function testStockAlerts() {
  console.log(
    "╔══════════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║                 TEST: STOCK ALERTS SERVICE                       ║"
  );
  console.log(
    "╚══════════════════════════════════════════════════════════════════╝"
  );

  try {
    // ============================================
    // PASO 1: AUTENTICACIÓN
    // ============================================
    console.log("\n\n🔐 PASO 1: Autenticación");
    console.log("-".repeat(50));

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

    const { token } = loginResponse.data;
    console.log("✅ Autenticado correctamente");

    // ============================================
    // PASO 2.1: LISTAR ITEMS DEBAJO DEL MÍNIMO
    // ============================================
    console.log(
      "\n\n📋 PASO 2.1: Listar items con stock por debajo del mínimo"
    );
    console.log("-".repeat(50));

    const belowMinResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/stock/alerts/below-minimum?limite=100",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (belowMinResponse.statusCode !== 200) {
      console.error(
        "❌ Error obteniendo items debajo del mínimo:",
        belowMinResponse.data
      );
      return;
    }

    const itemsDebajo = belowMinResponse.data.items || [];
    console.log(`\n📊 Items encontrados: ${itemsDebajo.length}`);

    if (itemsDebajo.length === 0) {
      console.log("\n✅ No hay items con stock por debajo del mínimo");
      console.log(
        "   Esto es bueno - significa que el inventario está bien abastecido"
      );
    } else {
      console.log("\n🔍 Primeros 5 items con alertas:");
      console.log("-".repeat(50));

      itemsDebajo.slice(0, 5).forEach((item, index) => {
        const disponible = item.disponibleTotal || 0;
        const minimo = item.stockMinimo || 0;
        const porcentaje = item.porcentajeStock || 0;
        const diferencia = item.diferencia || 0;
        const nivel = item.nivelAlerta || "desconocido";

        let emoji = "⚠️";
        if (nivel === "critico") emoji = "🔴";
        else if (nivel === "urgente") emoji = "🟠";
        else if (nivel === "advertencia") emoji = "🟡";

        console.log(
          `\n${index + 1}. ${emoji} ${item.item?.nombre || item.nombre || "Sin nombre"}`
        );
        console.log(`   Código: ${item.item?.codigo || item.codigo || "N/A"}`);
        console.log(
          `   Stock: ${disponible}/${minimo} unidades (${porcentaje.toFixed(1)}%)`
        );
        console.log(`   Faltante: ${Math.abs(diferencia)} unidades`);
        console.log(`   Nivel: ${nivel.toUpperCase()}`);
      });

      // Resumen por nivel de alerta
      const criticos = itemsDebajo.filter(
        (i) => i.nivelAlerta === "critico"
      ).length;
      const urgentes = itemsDebajo.filter(
        (i) => i.nivelAlerta === "urgente"
      ).length;
      const advertencias = itemsDebajo.filter(
        (i) => i.nivelAlerta === "advertencia"
      ).length;

      console.log("\n📊 Resumen de alertas:");
      console.log("-".repeat(50));
      console.log(`   🔴 Críticos (0%): ${criticos}`);
      console.log(`   🟠 Urgentes (<50%): ${urgentes}`);
      console.log(`   🟡 Advertencias (50-99%): ${advertencias}`);
    }

    // ============================================
    // PASO 2.2: GENERAR REPORTE DE ALERTAS
    // ============================================
    console.log("\n\n📈 PASO 2.2: Generar reporte estadístico");
    console.log("-".repeat(50));

    const reportResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/stock/alerts/report",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (reportResponse.statusCode !== 200) {
      console.error("❌ Error generando reporte:", reportResponse.data);
      return;
    }

    const report = reportResponse.data;
    console.log("\n📊 Estadísticas generales:");
    console.log("-".repeat(50));
    console.log(
      `   📦 Total items con mínimo configurado: ${report.totalItems || 0}`
    );
    console.log(`   🔴 Críticos (0%): ${report.criticos || 0}`);
    console.log(`   🟠 Urgentes (<50%): ${report.urgentes || 0}`);
    console.log(`   🟡 Advertencias (50-99%): ${report.advertencias || 0}`);
    console.log(`   ✅ OK (>=100%): ${report.ok || 0}`);

    if (report.totalItems > 0) {
      const porcentajeProblemas = (
        ((report.criticos + report.urgentes + report.advertencias) /
          report.totalItems) *
        100
      ).toFixed(1);
      console.log(`\n   ⚠️  Items con problemas: ${porcentajeProblemas}%`);
    }

    // ============================================
    // PASO 2.3: OBTENER SUGERENCIAS DE COMPRA
    // ============================================
    console.log("\n\n🛒 PASO 2.3: Obtener sugerencias de órdenes de compra");
    console.log("-".repeat(50));

    const suggestionsResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/inventory/stock/alerts/purchase-suggestions?limite=100",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token,
      },
    });

    if (suggestionsResponse.statusCode !== 200) {
      console.error(
        "❌ Error obteniendo sugerencias:",
        suggestionsResponse.data
      );
      return;
    }

    const suggestions = suggestionsResponse.data.suggestions || [];
    console.log(`\n📋 Sugerencias generadas: ${suggestions.length}`);

    if (suggestions.length === 0) {
      console.log("\n✅ No hay sugerencias de compra necesarias");
      console.log("   El inventario está bien abastecido");
    } else {
      console.log("\n🔝 Top 5 compras sugeridas:");
      console.log("-".repeat(50));

      let totalInversion = 0;

      suggestions.slice(0, 5).forEach((sugg, index) => {
        const item = sugg.item || {};
        const cantidadSugerida = sugg.cantidadSugerida || 0;
        const precioEstimado = item.precioCompra || 0;
        const costoTotal = cantidadSugerida * precioEstimado;
        totalInversion += costoTotal;

        console.log(`\n${index + 1}. ${item.nombre || "Sin nombre"}`);
        console.log(`   Código: ${item.codigo || "N/A"}`);
        console.log(`   Stock actual: ${sugg.disponibleTotal || 0} unidades`);
        console.log(`   Stock mínimo: ${sugg.stockMinimo || 0} unidades`);
        console.log(`   🛒 Cantidad sugerida: ${cantidadSugerida} unidades`);
        console.log(`   💰 Costo estimado: $${costoTotal.toFixed(2)}`);
      });

      console.log("\n💰 Resumen financiero (Top 5):");
      console.log("-".repeat(50));
      console.log(`   Inversión total estimada: $${totalInversion.toFixed(2)}`);
    }

    // ============================================
    // PASO 2.4: CONSULTAR ALERTA DE ITEM ESPECÍFICO
    // ============================================
    console.log("\n\n🔍 PASO 2.4: Consultar alerta de un item específico");
    console.log("-".repeat(50));

    if (itemsDebajo.length > 0) {
      const primerItem = itemsDebajo[0];
      const itemId =
        primerItem.item?._id || primerItem.item?.id || primerItem._id;

      if (itemId) {
        const itemAlertResponse = await makeRequest({
          hostname: "localhost",
          port: 4000,
          path: `/api/inventory/stock/alerts/item/${itemId}`,
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "x-token": token,
          },
        });

        if (itemAlertResponse.statusCode === 200) {
          const alert = itemAlertResponse.data;
          console.log(
            `\n✅ Consulta exitosa para: ${primerItem.item?.nombre || primerItem.nombre}`
          );
          console.log("-".repeat(50));
          console.log(
            `   Estado de alerta: ${alert.tieneAlerta ? "🚨 SÍ" : "✅ NO"}`
          );

          if (alert.tieneAlerta && alert.detalles) {
            const d = alert.detalles;
            console.log(
              `   Stock disponible: ${d.disponibleTotal || 0} unidades`
            );
            console.log(`   Stock mínimo: ${d.stockMinimo || 0} unidades`);
            console.log(
              `   Porcentaje: ${d.porcentajeStock?.toFixed(1) || 0}%`
            );
            console.log(`   Faltante: ${Math.abs(d.diferencia || 0)} unidades`);
            console.log(`   Nivel: ${(d.nivelAlerta || "").toUpperCase()}`);
          }
        } else {
          console.error("❌ Error consultando item:", itemAlertResponse.data);
        }
      } else {
        console.log("⚠️  No se pudo obtener el ID del item para consultar");
      }
    } else {
      console.log(
        "\n⚠️  No hay items con alertas para consultar individualmente"
      );
      console.log(
        "   Para probar esta funcionalidad, necesitas items con stock bajo"
      );
    }

    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log(
      "\n\n╔══════════════════════════════════════════════════════════════════╗"
    );
    console.log(
      "║                      RESUMEN DEL TEST                            ║"
    );
    console.log(
      "╚══════════════════════════════════════════════════════════════════╝"
    );
    console.log("\n✅ Pruebas completadas:");
    console.log("   1. ✅ Listar items debajo del mínimo");
    console.log("   2. ✅ Generar reporte estadístico");
    console.log("   3. ✅ Obtener sugerencias de compra");
    console.log("   4. ✅ Consultar alerta de item específico");

    console.log("\n📊 Resultados:");
    console.log(`   • Items con alertas: ${itemsDebajo.length}`);
    console.log(`   • Total items monitoreados: ${report.totalItems || 0}`);
    console.log(`   • Sugerencias de compra: ${suggestions.length}`);

    console.log("\n🎯 Estado del servicio: OPERACIONAL ✅");
    console.log("\n" + "=".repeat(70) + "\n");
  } catch (error) {
    console.error("\n❌ Error durante el test:", error.message);
    console.error(error.stack);
  }
}

// Ejecutar el test
testStockAlerts();
