/**
 * Seeder: AutoSys (Talleres/Refinerías)
 * Crea talleres de ejemplo para el sistema
 */

require("dotenv").config();
const { dbConnection } = require("../config");
const AutoSys = require("../../features/autoSys/autoSys.models");

const seedAutoSys = async () => {
  try {
    await dbConnection();
    console.log("🔗 Conectado a MongoDB\n");

    console.log("=".repeat(60));
    console.log("🌱 SEEDER: AUTOSYS (TALLERES)");
    console.log("=".repeat(60));

    // ============================================
    // PASO 1: Limpiar datos existentes (opcional)
    // ============================================
    console.log("\n🧹 PASO 1: Verificar datos existentes");
    console.log("-".repeat(60));

    const talleresExistentes = await AutoSys.countDocuments({
      eliminado: false,
    });
    console.log(`ℹ️  Talleres existentes: ${talleresExistentes}`);

    // ============================================
    // PASO 2: Crear Talleres
    // ============================================
    console.log("\n🏢 PASO 2: Crear Talleres");
    console.log("-".repeat(60));

    const talleres = [
      {
        nombre: "AutoTaller Central",
        rif: "J-12345678-9",
        ubicacion: "Av. Principal, Centro Comercial Plaza, Local 5, Caracas",
        telefono: "+58-212-1234567",
        procesamientoDia: 15,
        legal: "Carlos García",
        img: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=400",
        estado: "activo",
      },
      // {
      //   nombre: "Taller Mecánico Express",
      //   rif: "J-98765432-1",
      //   ubicacion: "Calle Los Mecánicos, Zona Industrial, Valencia",
      //   telefono: "+58-241-9876543",
      //   procesamientoDia: 20,
      //   legal: "María Rodríguez",
      //   img: "https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=400",
      //   estado: "activo",
      // },
      // {
      //   nombre: "ServiFrenos Premium",
      //   rif: "J-55566677-8",
      //   ubicacion: "Av. Bolívar, Edificio Torre Auto, Piso 1, Maracaibo",
      //   telefono: "+58-261-5556667",
      //   procesamientoDia: 10,
      //   legal: "José Martínez",
      //   img: "https://images.unsplash.com/photo-1632823469850-464a850d3c5c?w=400",
      //   estado: "activo",
      // },
      // {
      //   nombre: "TallerTech Pro",
      //   rif: "J-11122233-4",
      //   ubicacion:
      //     "Carretera Nacional, KM 15, Zona Industrial La Urbina, Caracas",
      //   telefono: "+58-212-1112223",
      //   procesamientoDia: 25,
      //   legal: "Ana López",
      //   img: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=400",
      //   estado: "activo",
      // },
      // {
      //   nombre: "Automotriz Los Primos",
      //   rif: "J-99988877-6",
      //   ubicacion:
      //     "Av. Libertador, Centro Empresarial, Oficina 202, Barquisimeto",
      //   telefono: "+58-251-9998887",
      //   procesamientoDia: 12,
      //   legal: "Pedro Sánchez",
      //   img: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=400",
      //   estado: "activo",
      // },
      // {
      //   nombre: "Taller Especializado Diesel",
      //   rif: "J-44455566-2",
      //   ubicacion: "Zona Franca, Galpón 8, Puerto La Cruz",
      //   telefono: "+58-281-4445556",
      //   procesamientoDia: 8,
      //   legal: "Luis Fernández",
      //   img: "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=400",
      //   estado: "activo",
      // },
      // {
      //   nombre: "Centro Automotriz 360",
      //   rif: "J-77788899-0",
      //   ubicacion: "Av. Universidad, Local Comercial 15-A, Mérida",
      //   telefono: "+58-274-7778889",
      //   procesamientoDia: 18,
      //   legal: "Carmen Torres",
      //   img: "https://images.unsplash.com/photo-1615906655593-ad0386982a0f?w=400",
      //   estado: "activo",
      // },
      // {
      //   nombre: "Taller El Rápido (Inactivo)",
      //   rif: "J-33344455-5",
      //   ubicacion: "Calle Principal, Sector San José, San Cristóbal",
      //   telefono: "+58-276-3334445",
      //   procesamientoDia: 5,
      //   legal: "Roberto Díaz",
      //   img: "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=400",
      //   estado: "inactivo",
      // },
    ];

    const talleresCreados = [];

    for (const tallerData of talleres) {
      // Verificar si ya existe por RIF
      let taller = await AutoSys.findOne({
        rif: tallerData.rif,
        eliminado: false,
      });

      if (!taller) {
        taller = await AutoSys.create(tallerData);
        console.log(
          `✅ ${taller.nombre} - ${taller.rif} (${taller.procesamientoDia} vehículos/día)`
        );
        talleresCreados.push(taller);
      } else {
        console.log(`ℹ️  ${tallerData.nombre} ya existe (${taller.rif})`);
        talleresCreados.push(taller);
      }
    }

    // ============================================
    // RESUMEN
    // ============================================
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMEN DEL SEEDER");
    console.log("=".repeat(60));

    const totalTalleres = await AutoSys.countDocuments({ eliminado: false });
    const talleresActivos = await AutoSys.countDocuments({
      eliminado: false,
      estado: "activo",
    });
    const talleresInactivos = await AutoSys.countDocuments({
      eliminado: false,
      estado: "inactivo",
    });

    const capacidadTotal = talleresCreados.reduce(
      (sum, t) => sum + t.procesamientoDia,
      0
    );

    console.log(`
    ✅ Total Talleres: ${totalTalleres}
    ✅ Talleres Activos: ${talleresActivos}
    ⚠️  Talleres Inactivos: ${talleresInactivos}
    📊 Capacidad Total: ${capacidadTotal} vehículos/día
    
    DETALLES:
    ${talleresCreados
      .map(
        (t, i) =>
          `    ${i + 1}. ${t.nombre}
       RIF: ${t.rif}
       Ubicación: ${t.ubicacion}
       Capacidad: ${t.procesamientoDia} veh/día
       Estado: ${t.estado === "activo" ? "🟢 Activo" : "🔴 Inactivo"}`
      )
      .join("\n\n")}
    `);

    console.log("=".repeat(60));
    console.log("🎉 SEEDER COMPLETADO EXITOSAMENTE");
    console.log("=".repeat(60));

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error en el seeder:", error);
    console.error(error.stack);
    process.exit(1);
  }
};

// Ejecutar seeder
seedAutoSys();
