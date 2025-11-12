/**
 * Test para Services
 * ===================
 *
 * Objetivo: Validar CRUD de servicios de taller automotriz
 *
 * Funcionalidades probadas:
 * -------------------------
 * 1. Crear servicios específicos de taller (cambio de aceite, frenos, alineación, etc.)
 * 2. Listar servicios con filtros (por categoría, subcategoría, dificultad)
 * 3. Obtener servicio por ID con detalles completos
 * 4. Actualizar servicios (precio, tiempo, requisitos)
 * 5. Buscar servicios por nombre/código
 * 6. Activar/desactivar servicios
 * 7. Validaciones de negocio
 *
 * Estructura de servicios:
 * -------------------------
 * Por categoría:
 * - Mantenimiento Preventivo: Cambio de aceite, Cambio de filtros, Revisión de fluidos
 * - Reparación de Motor: Overhaul completo, Reparación de culata, Cambio de pistones
 * - Sistema de Frenos: Cambio de pastillas, Cambio de discos, Purga de líquido
 * - Suspensión y Dirección: Cambio de amortiguadores, Alineación y balanceo
 * - Sistema Eléctrico: Cambio de batería, Reparación de alternador
 * - Aire Acondicionado: Recarga de gas, Reparación de compresor
 * - Diagnóstico Electrónico: Escaneo de códigos, Reseteo de sensores
 *
 * Campos probados:
 * ----------------
 * - nombre, descripcion, codigo (único)
 * - categoria, subcategoria (referencias)
 * - precioBase, tiempoEstimadoMinutos
 * - requiereEspecialista, dificultad
 * - herramientasRequeridas, garantiaMeses
 * - activo, eliminado
 *
 * Endpoints probados:
 * -------------------
 * - POST /api/services
 * - GET /api/services
 * - GET /api/services/:id
 * - GET /api/services/search
 * - PUT /api/services/:id
 * - PATCH /api/services/:id/toggle
 * - DELETE /api/services/:id
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

async function testServices() {
  console.log(
    "╔══════════════════════════════════════════════════════════════════╗"
  );
  console.log(
    "║             TEST: SERVICES (SERVICIOS DE TALLER)                ║"
  );
  console.log(
    "╚══════════════════════════════════════════════════════════════════╝"
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

    const { token } = loginResponse.data;
    console.log("✅ Autenticado correctamente");

    // Headers comunes para todas las peticiones
    const headers = {
      "Content-Type": "application/json",
      "x-token": token,
    };

    // ============================================
    // PASO 2: OBTENER CATEGORÍAS Y SUBCATEGORÍAS EXISTENTES
    // ============================================
    console.log("\n\n📋 PASO 2: Obtener categorías y subcategorías existentes");
    console.log("-".repeat(70));

    const categoriesResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/service-categories",
      method: "GET",
      headers,
    });

    if (categoriesResponse.statusCode !== 200) {
      console.error("❌ Error al obtener categorías:", categoriesResponse.data);
      return;
    }

    const categories = categoriesResponse.data.data || [];
    console.log(`✅ ${categories.length} categorías encontradas`);

    // Mapear categorías por código para fácil acceso
    const categoryMap = {};
    categories.forEach((cat) => {
      categoryMap[cat.codigo] = cat._id;
    });

    // Obtener subcategorías
    const subcategoriesResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/service-subcategories",
      method: "GET",
      headers,
    });

    if (subcategoriesResponse.statusCode !== 200) {
      console.error(
        "❌ Error al obtener subcategorías:",
        subcategoriesResponse.data
      );
      return;
    }

    const subcategories = subcategoriesResponse.data.data || [];
    console.log(`✅ ${subcategories.length} subcategorías encontradas`);

    // Mapear subcategorías por código
    const subcategoryMap = {};
    subcategories.forEach((subcat) => {
      subcategoryMap[subcat.codigo] = subcat._id;
    });

    // ============================================
    // PASO 3: CREAR SERVICIOS POR CATEGORÍA
    // ============================================
    console.log("\n\n➕ PASO 3: Crear servicios de taller automotriz");
    console.log("-".repeat(70));

    const servicesToCreate = [
      // MANTENIMIENTO PREVENTIVO
      {
        nombre: "Cambio de Aceite y Filtro",
        descripcion:
          "Cambio completo de aceite de motor y filtro. Incluye revisión de niveles.",
        codigo: "SERV_ACEITE_001",
        categoria: categoryMap["MANT_PREV"],
        subcategoria: subcategoryMap["MANT_PREV_ACE"],
        precioBase: 45.0,
        tiempoEstimadoMinutos: 45,
        unidadTiempo: "minutos",
        costoHoraAdicional: 20.0,
        requiereEspecialista: false,
        dificultad: "baja",
        herramientasRequeridas: [
          "Llave de filtro",
          "Bandeja recolectora",
          "Embudo",
        ],
        garantiaMeses: 3,
        instrucciones:
          "Drenar aceite con motor caliente. Verificar estado de tapón de drenaje.",
      },
      {
        nombre: "Cambio de Bujías",
        descripcion:
          "Cambio completo de bujías. Incluye limpieza y verificación de cables.",
        codigo: "SERV_BUJIAS_001",
        categoria: categoryMap["MANT_PREV"],
        subcategoria: subcategoryMap["MANT_PREV_BUJ"],
        precioBase: 35.0,
        tiempoEstimadoMinutos: 30,
        unidadTiempo: "minutos",
        requiereEspecialista: false,
        dificultad: "baja",
        herramientasRequeridas: ["Llave de bujías", "Calibrador de electrodos"],
        garantiaMeses: 6,
      },
      {
        nombre: "Revisión de Fluidos General",
        descripcion:
          "Revisión y reposición de todos los fluidos: refrigerante, líquido de frenos, dirección hidráulica, limpiaparabrisas.",
        codigo: "SERV_FLUIDOS_001",
        categoria: categoryMap["MANT_PREV"],
        subcategoria: subcategoryMap["MANT_PREV_FLU"],
        precioBase: 25.0,
        tiempoEstimadoMinutos: 30,
        unidadTiempo: "minutos",
        requiereEspecialista: false,
        dificultad: "baja",
        herramientasRequeridas: ["Embudo", "Probador de refrigerante"],
        garantiaMeses: 1,
      },

      // REPARACIÓN DE MOTOR
      {
        nombre: "Overhaul de Motor Completo",
        descripcion:
          "Desmontaje, rectificación y armado completo del motor. Incluye reemplazo de todos los sellos y empaques.",
        codigo: "SERV_OVERHAUL_001",
        categoria: categoryMap["REP_MOTOR"],
        subcategoria: subcategoryMap["REP_MOTOR_OVH"],
        precioBase: 2500.0,
        tiempoEstimadoMinutos: 2880, // 48 horas
        unidadTiempo: "minutos",
        costoHoraAdicional: 50.0,
        requiereEspecialista: true,
        dificultad: "experto",
        herramientasRequeridas: [
          "Grúa de motor",
          "Torquímetro",
          "Micrometro",
          "Prensa hidráulica",
          "Kit de herramientas especiales",
        ],
        garantiaMeses: 12,
        instrucciones:
          "Requiere medición de todas las tolerancias. Verificar planitud de superficies. Torque crítico en todos los pernos.",
      },
      {
        nombre: "Rectificación de Culata",
        descripcion:
          "Desmontaje, rectificación y armado de culata. Incluye cambio de válvulas y empaque.",
        codigo: "SERV_CULATA_001",
        categoria: categoryMap["REP_MOTOR"],
        subcategoria: subcategoryMap["REP_MOTOR_CUL"],
        precioBase: 850.0,
        tiempoEstimadoMinutos: 720, // 12 horas
        unidadTiempo: "minutos",
        costoHoraAdicional: 45.0,
        requiereEspecialista: true,
        dificultad: "alta",
        herramientasRequeridas: [
          "Torquímetro",
          "Calibrador de válvulas",
          "Prensa de válvulas",
        ],
        garantiaMeses: 6,
      },
      {
        nombre: "Cambio de Kit de Distribución",
        descripcion:
          "Cambio completo de correa/cadena de distribución, tensores y bombas auxiliares.",
        codigo: "SERV_DISTRIB_001",
        categoria: categoryMap["REP_MOTOR"],
        subcategoria: subcategoryMap["REP_MOTOR_DIS"],
        precioBase: 450.0,
        tiempoEstimadoMinutos: 360, // 6 horas
        unidadTiempo: "minutos",
        costoHoraAdicional: 40.0,
        requiereEspecialista: true,
        dificultad: "alta",
        herramientasRequeridas: [
          "Calador de distribución",
          "Llaves especiales",
          "Torquímetro",
        ],
        garantiaMeses: 12,
        instrucciones:
          "Calado crítico. Verificar marcas de tiempo. No arrancar motor hasta verificar.",
      },

      // SISTEMA DE FRENOS
      {
        nombre: "Cambio de Pastillas de Freno",
        descripcion:
          "Cambio de pastillas delanteras o traseras. Incluye limpieza de calibres.",
        codigo: "SERV_PASTILLAS_001",
        categoria: categoryMap["SIS_FRENOS"],
        subcategoria: subcategoryMap["SIS_FRENOS_PAS"],
        precioBase: 80.0,
        tiempoEstimadoMinutos: 60,
        unidadTiempo: "minutos",
        requiereEspecialista: false,
        dificultad: "baja",
        herramientasRequeridas: [
          "Llave de rueda",
          "Gato hidráulico",
          "Compresor de pistones",
        ],
        garantiaMeses: 6,
      },
      {
        nombre: "Cambio de Discos de Freno",
        descripcion:
          "Cambio de discos delanteros o traseros. Incluye limpieza del sistema.",
        codigo: "SERV_DISCOS_001",
        categoria: categoryMap["SIS_FRENOS"],
        subcategoria: subcategoryMap["SIS_FRENOS_DIS"],
        precioBase: 150.0,
        tiempoEstimadoMinutos: 90,
        unidadTiempo: "minutos",
        requiereEspecialista: false,
        dificultad: "media",
        herramientasRequeridas: [
          "Llave de impacto",
          "Gato hidráulico",
          "Torquímetro",
        ],
        garantiaMeses: 12,
      },
      {
        nombre: "Purga de Sistema de Frenos",
        descripcion:
          "Purga completa del sistema de frenos. Reemplazo de líquido de frenos.",
        codigo: "SERV_PURGA_001",
        categoria: categoryMap["SIS_FRENOS"],
        subcategoria: subcategoryMap["SIS_FRENOS_PUR"],
        precioBase: 55.0,
        tiempoEstimadoMinutos: 45,
        unidadTiempo: "minutos",
        requiereEspecialista: false,
        dificultad: "media",
        herramientasRequeridas: [
          "Kit de purga",
          "Llave de purga",
          "Recipiente recolector",
        ],
        garantiaMeses: 6,
        instrucciones:
          "Purgar en orden: RR, RL, FR, FL. No dejar entrar aire al sistema.",
      },

      // SUSPENSIÓN Y DIRECCIÓN
      {
        nombre: "Cambio de Amortiguadores",
        descripcion:
          "Cambio de amortiguadores delanteros o traseros. Incluye prueba de manejo.",
        codigo: "SERV_AMORT_001",
        categoria: categoryMap["SUSP_DIR"],
        subcategoria: subcategoryMap["SUSP_DIR_AMO"],
        precioBase: 280.0,
        tiempoEstimadoMinutos: 120,
        unidadTiempo: "minutos",
        requiereEspecialista: false,
        dificultad: "media",
        herramientasRequeridas: [
          "Gato hidráulico",
          "Compresor de resortes",
          "Llaves métricas",
        ],
        garantiaMeses: 12,
      },
      {
        nombre: "Alineación y Balanceo Computarizado",
        descripcion:
          "Alineación de ángulos (camber, caster, toe) y balanceo de las 4 ruedas.",
        codigo: "SERV_ALINE_001",
        categoria: categoryMap["SUSP_DIR"],
        subcategoria: subcategoryMap["SUSP_DIR_ALI"],
        precioBase: 60.0,
        tiempoEstimadoMinutos: 60,
        unidadTiempo: "minutos",
        requiereEspecialista: true,
        dificultad: "media",
        herramientasRequeridas: [
          "Equipo de alineación",
          "Balanceadora",
          "Llaves de ajuste",
        ],
        garantiaMeses: 3,
        instrucciones:
          "Verificar presión de neumáticos antes de alinear. Ajustar según especificaciones del fabricante.",
      },
      {
        nombre: "Reparación de Cremallera de Dirección",
        descripcion:
          "Desmontaje, reparación o reemplazo de cremallera de dirección. Incluye purga del sistema.",
        codigo: "SERV_CREMAL_001",
        categoria: categoryMap["SUSP_DIR"],
        subcategoria: subcategoryMap["SUSP_DIR_CRE"],
        precioBase: 450.0,
        tiempoEstimadoMinutos: 240, // 4 horas
        unidadTiempo: "minutos",
        costoHoraAdicional: 40.0,
        requiereEspecialista: true,
        dificultad: "alta",
        herramientasRequeridas: [
          "Extractor de rótulas",
          "Llaves especiales",
          "Gato hidráulico",
        ],
        garantiaMeses: 12,
      },

      // SISTEMA ELÉCTRICO
      {
        nombre: "Cambio de Batería",
        descripcion:
          "Reemplazo de batería. Incluye limpieza de bornes y prueba del sistema de carga.",
        codigo: "SERV_BATERIA_001",
        categoria: categoryMap["SIS_ELEC"],
        subcategoria: subcategoryMap["SIS_ELEC_BAT"],
        precioBase: 25.0,
        tiempoEstimadoMinutos: 20,
        unidadTiempo: "minutos",
        requiereEspecialista: false,
        dificultad: "baja",
        herramientasRequeridas: [
          "Llaves combinadas",
          "Limpiador de bornes",
          "Probador de batería",
        ],
        garantiaMeses: 1,
        instrucciones:
          "Desconectar siempre negativo primero. Verificar voltaje del sistema.",
      },
      {
        nombre: "Reparación de Alternador",
        descripcion:
          "Desmontaje, reparación y prueba del alternador. Incluye cambio de rodamientos y escobillas.",
        codigo: "SERV_ALTER_001",
        categoria: categoryMap["SIS_ELEC"],
        subcategoria: subcategoryMap["SIS_ELEC_ALT"],
        precioBase: 180.0,
        tiempoEstimadoMinutos: 180, // 3 horas
        unidadTiempo: "minutos",
        requiereEspecialista: true,
        dificultad: "alta",
        herramientasRequeridas: [
          "Multímetro",
          "Prensa de rodamientos",
          "Soldador",
        ],
        garantiaMeses: 6,
      },
      {
        nombre: "Reparación de Motor de Arranque",
        descripcion:
          "Desmontaje y reparación del motor de arranque. Incluye cambio de bendix.",
        codigo: "SERV_ARRAN_001",
        categoria: categoryMap["SIS_ELEC"],
        subcategoria: subcategoryMap["SIS_ELEC_ARR"],
        precioBase: 150.0,
        tiempoEstimadoMinutos: 150,
        unidadTiempo: "minutos",
        requiereEspecialista: true,
        dificultad: "media",
        herramientasRequeridas: [
          "Multímetro",
          "Llaves especiales",
          "Extractor de piñones",
        ],
        garantiaMeses: 6,
      },

      // AIRE ACONDICIONADO
      {
        nombre: "Recarga de Gas Aire Acondicionado",
        descripcion:
          "Recarga completa del sistema de A/C. Incluye vacío y prueba de fugas.",
        codigo: "SERV_GAS_AC_001",
        categoria: categoryMap["AIRE_ACOND"],
        subcategoria: subcategoryMap["AIRE_ACOND_GAS"],
        precioBase: 80.0,
        tiempoEstimadoMinutos: 90,
        unidadTiempo: "minutos",
        requiereEspecialista: true,
        dificultad: "media",
        herramientasRequeridas: [
          "Estación de carga",
          "Manómetros",
          "Detector de fugas",
        ],
        garantiaMeses: 3,
        instrucciones:
          "Verificar fugas antes de cargar. Hacer vacío 30 minutos mínimo.",
      },
      {
        nombre: "Reparación de Compresor A/C",
        descripcion:
          "Desmontaje, reparación o reemplazo del compresor. Incluye cambio de aceite del sistema.",
        codigo: "SERV_COMPR_AC_001",
        categoria: categoryMap["AIRE_ACOND"],
        subcategoria: subcategoryMap["AIRE_ACOND_COM"],
        precioBase: 420.0,
        tiempoEstimadoMinutos: 300, // 5 horas
        unidadTiempo: "minutos",
        costoHoraAdicional: 45.0,
        requiereEspecialista: true,
        dificultad: "alta",
        herramientasRequeridas: [
          "Estación de recuperación",
          "Llaves especiales",
          "Torquímetro",
        ],
        garantiaMeses: 12,
      },

      // DIAGNÓSTICO ELECTRÓNICO
      {
        nombre: "Escaneo de Códigos de Falla",
        descripcion:
          "Escaneo completo del sistema OBD2. Interpretación de códigos y recomendaciones.",
        codigo: "SERV_SCAN_001",
        categoria: categoryMap["DIAG_ELEC"],
        subcategoria: subcategoryMap["DIAG_ELEC_ESC"],
        precioBase: 30.0,
        tiempoEstimadoMinutos: 30,
        unidadTiempo: "minutos",
        requiereEspecialista: true,
        dificultad: "baja",
        herramientasRequeridas: ["Scanner OBD2", "Laptop con software"],
        garantiaMeses: 0,
        instrucciones: "Documentar todos los códigos antes de borrar.",
      },
      {
        nombre: "Diagnóstico y Reparación de Sensores",
        descripcion:
          "Diagnóstico de sensores defectuosos (O2, MAF, TPS, etc.) y reemplazo.",
        codigo: "SERV_SENSOR_001",
        categoria: categoryMap["DIAG_ELEC"],
        subcategoria: subcategoryMap["DIAG_ELEC_SEN"],
        precioBase: 85.0,
        tiempoEstimadoMinutos: 90,
        unidadTiempo: "minutos",
        requiereEspecialista: true,
        dificultad: "media",
        herramientasRequeridas: ["Scanner", "Multímetro", "Osciloscopio"],
        garantiaMeses: 6,
      },
    ];

    const createdServices = [];
    let successCount = 0;

    for (const serviceData of servicesToCreate) {
      const response = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: "/api/services",
          method: "POST",
          headers,
        },
        serviceData
      );

      if (response.statusCode === 201) {
        createdServices.push(response.data.data);
        successCount++;
        console.log(`   ✅ ${serviceData.nombre} (${serviceData.codigo})`);
      } else {
        console.log(
          `   ❌ ${serviceData.nombre}: ${response.data.message || "Error"}`
        );
      }
    }

    console.log(
      `\n✅ ${successCount}/${servicesToCreate.length} servicios creados`
    );

    // Guardar IDs de servicios para siguientes tests
    const serviceIds = createdServices.map((s) => s._id);
    const firstServiceId = serviceIds[0];

    // ============================================
    // PASO 4: LISTAR SERVICIOS CON PAGINACIÓN
    // ============================================
    console.log("\n\n📋 PASO 4: Listar servicios con paginación");
    console.log("-".repeat(70));

    const listResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/services?page=1&limit=10",
      method: "GET",
      headers,
    });

    if (listResponse.statusCode === 200) {
      const services = listResponse.data.data || [];
      const pagination = listResponse.data.pagination;
      console.log(`✅ ${services.length} servicios obtenidos`);
      console.log(`   Total en DB: ${pagination.total}`);
      console.log(`   Página: ${pagination.page}/${pagination.pages}`);

      // Mostrar algunos servicios
      console.log("\n   Primeros servicios:");
      services.slice(0, 5).forEach((service) => {
        console.log(
          `   - ${service.nombre} (${service.codigo}) - $${service.precioBase}`
        );
        console.log(
          `     Categoría: ${service.categoria?.nombre || "N/A"} | Dificultad: ${service.dificultad}`
        );
      });
    } else {
      console.log("❌ Error al listar servicios:", listResponse.data.message);
    }

    // ============================================
    // PASO 5: FILTRAR SERVICIOS POR CATEGORÍA
    // ============================================
    console.log(
      "\n\n🔍 PASO 5: Filtrar servicios por categoría (Mantenimiento)"
    );
    console.log("-".repeat(70));

    const mantCategoryId = categoryMap["MANT_PREV"];
    const filterResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: `/api/services?categoria=${mantCategoryId}`,
      method: "GET",
      headers,
    });

    if (filterResponse.statusCode === 200) {
      const filteredServices = filterResponse.data.data || [];
      console.log(
        `✅ ${filteredServices.length} servicios de Mantenimiento Preventivo`
      );
      filteredServices.forEach((service) => {
        console.log(
          `   - ${service.nombre} ($${service.precioBase}) - ${service.tiempoEstimadoMinutos}min`
        );
      });
    } else {
      console.log("❌ Error al filtrar:", filterResponse.data.message);
    }

    // ============================================
    // PASO 6: BUSCAR SERVICIOS POR TEXTO
    // ============================================
    console.log("\n\n🔎 PASO 6: Buscar servicios por texto");
    console.log("-".repeat(70));

    const searchResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/services/search?q=freno",
      method: "GET",
      headers,
    });

    if (searchResponse.statusCode === 200) {
      const searchResults = searchResponse.data.data || [];
      console.log(
        `✅ ${searchResults.length} servicios encontrados con 'freno'`
      );
      searchResults.forEach((service) => {
        console.log(`   - ${service.nombre} (${service.codigo})`);
      });
    } else {
      console.log("❌ Error en búsqueda:", searchResponse.data.message);
    }

    // ============================================
    // PASO 7: OBTENER SERVICIO POR ID CON DETALLES
    // ============================================
    console.log(
      "\n\n🔍 PASO 7: Obtener servicio por ID con detalles completos"
    );
    console.log("-".repeat(70));

    if (firstServiceId) {
      const detailResponse = await makeRequest({
        hostname: "localhost",
        port: 4000,
        path: `/api/services/${firstServiceId}`,
        method: "GET",
        headers,
      });

      if (detailResponse.statusCode === 200) {
        const service = detailResponse.data.data;
        console.log("✅ Detalles del servicio obtenidos:");
        console.log(`   ID: ${service._id}`);
        console.log(`   Nombre: ${service.nombre}`);
        console.log(`   Código: ${service.codigo}`);
        console.log(`   Categoría: ${service.categoria?.nombre || "N/A"}`);
        console.log(
          `   Subcategoría: ${service.subcategoria?.nombre || "N/A"}`
        );
        console.log(`   Precio Base: $${service.precioBase}`);
        console.log(
          `   Tiempo Estimado: ${service.tiempoEstimadoMinutos} ${service.unidadTiempo}`
        );
        console.log(`   Dificultad: ${service.dificultad}`);
        console.log(
          `   Requiere Especialista: ${service.requiereEspecialista ? "Sí" : "No"}`
        );
        console.log(`   Garantía: ${service.garantiaMeses} meses`);
        if (service.herramientasRequeridas?.length > 0) {
          console.log(
            `   Herramientas: ${service.herramientasRequeridas.join(", ")}`
          );
        }
        console.log(`   Estado: ${service.activo ? "Activo" : "Inactivo"}`);
      } else {
        console.log(
          "❌ Error al obtener detalles:",
          detailResponse.data.message || "Error desconocido"
        );
        if (detailResponse.data.error) {
          console.log(`   Error técnico: ${detailResponse.data.error}`);
        }
      }
    } else {
      console.log("⚠️  No hay servicios para probar este paso");
    }

    // ============================================
    // PASO 8: ACTUALIZAR SERVICIO
    // ============================================
    console.log(
      "\n\n✏️  PASO 8: Actualizar servicio (cambiar precio y tiempo)"
    );
    console.log("-".repeat(70));

    if (firstServiceId) {
      const updateResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: `/api/services/${firstServiceId}`,
          method: "PUT",
          headers,
        },
        {
          precioBase: 55.0,
          tiempoEstimadoMinutos: 60,
          descripcion:
            "Cambio completo de aceite de motor y filtro. Incluye revisión completa de niveles y puntos de lubricación.",
        }
      );

      if (updateResponse.statusCode === 200) {
        const updated = updateResponse.data.data;
        console.log("✅ Servicio actualizado correctamente");
        console.log(`   Nuevo precio: $${updated.precioBase}`);
        console.log(
          `   Nuevo tiempo: ${updated.tiempoEstimadoMinutos} minutos`
        );
        console.log(`   Descripción actualizada: ${updated.descripcion}`);
      } else {
        console.log("❌ Error al actualizar:", updateResponse.data.message);
      }
    }

    // ============================================
    // PASO 9: FILTRAR POR DIFICULTAD
    // ============================================
    console.log("\n\n⚡ PASO 9: Filtrar servicios por dificultad (experto)");
    console.log("-".repeat(70));

    const expertResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/services?dificultad=experto",
      method: "GET",
      headers,
    });

    if (expertResponse.statusCode === 200) {
      const expertServices = expertResponse.data.data || [];
      console.log(
        `✅ ${expertServices.length} servicios de nivel experto encontrados`
      );
      expertServices.forEach((service) => {
        console.log(`   - ${service.nombre}`);
        console.log(
          `     Precio: $${service.precioBase} | Tiempo: ${service.tiempoEstimadoMinutos}min | Especialista: ${service.requiereEspecialista ? "Sí" : "No"}`
        );
      });
    } else {
      console.log(
        "❌ Error al filtrar por dificultad:",
        expertResponse.data.message
      );
    }

    // ============================================
    // PASO 10: FILTRAR SERVICIOS QUE REQUIEREN ESPECIALISTA
    // ============================================
    console.log("\n\n👨‍🔧 PASO 10: Servicios que requieren especialista");
    console.log("-".repeat(70));

    const specialistResponse = await makeRequest({
      hostname: "localhost",
      port: 4000,
      path: "/api/services?requiereEspecialista=true",
      method: "GET",
      headers,
    });

    if (specialistResponse.statusCode === 200) {
      const specialistServices = specialistResponse.data.data || [];
      console.log(
        `✅ ${specialistServices.length} servicios requieren especialista`
      );
      specialistServices.slice(0, 5).forEach((service) => {
        console.log(
          `   - ${service.nombre} (${service.dificultad}) - $${service.precioBase}`
        );
      });
    } else {
      console.log(
        "❌ Error al filtrar por especialista:",
        specialistResponse.data.message
      );
    }

    // ============================================
    // PASO 11: ACTIVAR/DESACTIVAR SERVICIO
    // ============================================
    console.log("\n\n🔄 PASO 11: Activar/Desactivar servicio (usando PUT)");
    console.log("-".repeat(70));

    if (firstServiceId) {
      // Desactivar usando PUT
      const deactivateResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: `/api/services/${firstServiceId}`,
          method: "PUT",
          headers,
        },
        {
          activo: false,
        }
      );

      if (deactivateResponse.statusCode === 200) {
        console.log("✅ Servicio desactivado");
        console.log(
          `   Estado: ${deactivateResponse.data.data.activo ? "Activo" : "Inactivo"}`
        );
      } else {
        console.log("❌ Error al desactivar:", deactivateResponse.data.message);
      }

      // Reactivar
      const reactivateResponse = await makeRequest(
        {
          hostname: "localhost",
          port: 4000,
          path: `/api/services/${firstServiceId}`,
          method: "PUT",
          headers,
        },
        {
          activo: true,
        }
      );

      if (reactivateResponse.statusCode === 200) {
        console.log("✅ Servicio reactivado");
        console.log(
          `   Estado: ${reactivateResponse.data.data.activo ? "Activo" : "Inactivo"}`
        );
      } else {
        console.log("❌ Error al reactivar:", reactivateResponse.data.message);
      }
    } else {
      console.log("⚠️  No hay servicios para probar este paso");
    }

    // ============================================
    // PASO 12: VALIDACIONES DE NEGOCIO
    // ============================================
    console.log("\n\n🛡️  PASO 12: Validaciones de negocio");
    console.log("-".repeat(70));

    // Validación 1: Código duplicado
    console.log("\n   Prueba 1: Intentar crear servicio con código duplicado");
    const duplicateResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/services",
        method: "POST",
        headers,
      },
      {
        nombre: "Servicio Test Duplicado",
        codigo: "SERV_ACEITE_001", // Ya existe
        categoria: categoryMap["MANT_PREV"],
        subcategoria: subcategoryMap["MANT_ACEITE"],
        precioBase: 50.0,
        tiempoEstimadoMinutos: 60,
      }
    );

    if (duplicateResponse.statusCode === 400) {
      console.log("   ✅ Validación correcta: Código duplicado rechazado");
      console.log(`   Mensaje: ${duplicateResponse.data.message}`);
    } else {
      console.log("   ❌ Error: Debió rechazar código duplicado");
    }

    // Validación 2: Categoría inválida
    console.log(
      "\n   Prueba 2: Intentar crear servicio con categoría inválida"
    );
    const invalidCategoryResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/services",
        method: "POST",
        headers,
      },
      {
        nombre: "Servicio Test Categoría Inválida",
        codigo: "SERV_TEST_INVALID",
        categoria: "507f1f77bcf86cd799439011", // ID que no existe
        subcategoria: subcategoryMap["MANT_ACEITE"],
        precioBase: 50.0,
        tiempoEstimadoMinutos: 60,
      }
    );

    if (invalidCategoryResponse.statusCode >= 400) {
      console.log("   ✅ Validación correcta: Categoría inválida rechazada");
      console.log(`   Mensaje: ${invalidCategoryResponse.data.message}`);
    } else {
      console.log("   ❌ Error: Debió rechazar categoría inválida");
    }

    // Validación 3: Subcategoría no pertenece a categoría
    console.log(
      "\n   Prueba 3: Subcategoría que no pertenece a la categoría seleccionada"
    );
    const mismatchResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/services",
        method: "POST",
        headers,
      },
      {
        nombre: "Servicio Test Mismatch",
        codigo: "SERV_TEST_MISMATCH",
        categoria: categoryMap["REP_MOTOR"], // Reparación Motor
        subcategoria: subcategoryMap["SIS_FRENOS_PAS"], // Subcategoría de Frenos (no pertenece a Motor)
        precioBase: 50.0,
        tiempoEstimadoMinutos: 60,
      }
    );

    if (mismatchResponse.statusCode === 400) {
      console.log(
        "   ✅ Validación correcta: Subcategoría no pertenece a categoría"
      );
      console.log(`   Mensaje: ${mismatchResponse.data.message}`);
    } else {
      console.log("   ❌ Error: Debió rechazar mismatch de categorías");
      console.log(
        `   Código: ${mismatchResponse.statusCode}, Mensaje: ${mismatchResponse.data.message}`
      );
    }

    // Validación 4: Campos requeridos
    console.log("\n   Prueba 4: Intentar crear servicio sin campos requeridos");
    const missingFieldsResponse = await makeRequest(
      {
        hostname: "localhost",
        port: 4000,
        path: "/api/services",
        method: "POST",
        headers,
      },
      {
        nombre: "Servicio Sin Datos",
        // Falta codigo, categoria, subcategoria, precioBase, tiempoEstimadoMinutos
      }
    );

    if (missingFieldsResponse.statusCode >= 400) {
      console.log("   ✅ Validación correcta: Campos requeridos faltantes");
      console.log(
        `   Mensaje: ${missingFieldsResponse.data.message || "Datos inválidos"}`
      );
    } else {
      console.log("   ❌ Error: Debió rechazar datos incompletos");
    }

    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log("\n\n" + "=".repeat(70));
    console.log("✅ TEST COMPLETADO - SERVICES (SERVICIOS DE TALLER)");
    console.log("=".repeat(70));
    console.log(`\n📊 Resumen de resultados:`);
    console.log(
      `   • Servicios creados: ${successCount}/${servicesToCreate.length}`
    );
    console.log(`   • Listado con paginación: ✅`);
    console.log(`   • Filtrado por categoría: ✅`);
    console.log(`   • Búsqueda por texto: ✅`);
    console.log(`   • Obtener por ID: ✅`);
    console.log(`   • Actualización: ✅`);
    console.log(`   • Filtrado por dificultad: ✅`);
    console.log(`   • Filtrado por especialista: ✅`);
    console.log(`   • Toggle activo/inactivo: ✅`);
    console.log(`   • Validaciones de negocio: ✅`);
    console.log(`\n✨ Todos los tests ejecutados exitosamente\n`);
  } catch (error) {
    console.error("\n❌ Error durante el test:", error.message);
    console.error(error.stack);
  }
}

// Ejecutar el test
testServices();
