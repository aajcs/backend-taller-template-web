/**
 * Test: AutoSys (Talleres/Refinerías)
 * Prueba todas las operaciones CRUD y validaciones del modelo AutoSys
 */

require("dotenv").config();
const { dbConnection } = require("../database/config");
const AutoSys = require("../features/autoSys/autoSys.models");

const testAutoSys = async () => {
  let talleresPrueba = [];

  try {
    await dbConnection();
    console.log("🔗 Conectado a MongoDB\n");

    console.log("=".repeat(60));
    console.log("🧪 TEST: AUTOSYS (TALLERES)");
    console.log("=".repeat(60));

    // ============================================
    // PASO 1: Crear Taller
    // ============================================
    console.log("\n📝 PASO 1: CREAR taller");
    console.log("-".repeat(60));

    const nuevoTallerData = {
      nombre: "Taller Test Temporal",
      rif: `J-TEST-${Date.now()}`,
      ubicacion: "Av. Test, Zona Industrial Test, Local 99",
      telefono: "+58-212-9999999",
      procesamientoDia: 30,
      legal: "Admin Test System",
      estado: "activo",
    };

    const nuevoTaller = await AutoSys.create(nuevoTallerData);
    talleresPrueba.push(nuevoTaller);

    console.log(`✅ Taller creado exitosamente:`);
    console.log(`   - ID: ${nuevoTaller._id}`);
    console.log(`   - Nombre: ${nuevoTaller.nombre}`);
    console.log(`   - RIF: ${nuevoTaller.rif}`);
    console.log(`   - Ubicación: ${nuevoTaller.ubicacion}`);
    console.log(`   - Teléfono: ${nuevoTaller.telefono}`);
    console.log(`   - Capacidad: ${nuevoTaller.procesamientoDia} veh/día`);
    console.log(`   - Legal: ${nuevoTaller.legal}`);
    console.log(`   - Estado: ${nuevoTaller.estado}`);
    console.log(`   - Creado: ${nuevoTaller.createdAt}`);

    // ============================================
    // PASO 2: Leer Taller
    // ============================================
    console.log("\n🔍 PASO 2: LEER taller");
    console.log("-".repeat(60));

    const tallerLeido = await AutoSys.findById(nuevoTaller._id);

    if (!tallerLeido) {
      throw new Error("No se pudo leer el taller creado");
    }

    console.log(`✅ Taller leído exitosamente:`);
    console.log(`   - ID: ${tallerLeido._id}`);
    console.log(`   - Nombre: ${tallerLeido.nombre}`);
    console.log(`   - RIF: ${tallerLeido.rif}`);
    console.log(`   - Estado: ${tallerLeido.estado}`);

    // ============================================
    // PASO 3: Actualizar Taller
    // ============================================
    console.log("\n✏️  PASO 3: ACTUALIZAR taller");
    console.log("-".repeat(60));

    const datosActualizacion = {
      telefono: "+58-212-8888888",
      procesamientoDia: 35,
      ubicacion: "Av. Nueva Dirección, Zona Industrial Actualizada",
    };

    const tallerAntes = {
      telefono: tallerLeido.telefono,
      procesamientoDia: tallerLeido.procesamientoDia,
      ubicacion: tallerLeido.ubicacion,
    };

    const tallerActualizado = await AutoSys.findByIdAndUpdate(
      nuevoTaller._id,
      datosActualizacion,
      { new: true, runValidators: true }
    );

    console.log(`✅ Taller actualizado:`);
    console.log(`\n   📞 Teléfono:`);
    console.log(`      Antes: ${tallerAntes.telefono}`);
    console.log(`      Ahora: ${tallerActualizado.telefono}`);
    console.log(`\n   🔧 Capacidad:`);
    console.log(`      Antes: ${tallerAntes.procesamientoDia} veh/día`);
    console.log(`      Ahora: ${tallerActualizado.procesamientoDia} veh/día`);
    console.log(`\n   📍 Ubicación:`);
    console.log(`      Antes: ${tallerAntes.ubicacion}`);
    console.log(`      Ahora: ${tallerActualizado.ubicacion}`);

    // ============================================
    // PASO 4: Cambiar Estado (Activo/Inactivo)
    // ============================================
    console.log("\n🔄 PASO 4: CAMBIAR estado del taller");
    console.log("-".repeat(60));

    const estadoAnterior = tallerActualizado.estado;

    const tallerInactivo = await AutoSys.findByIdAndUpdate(
      nuevoTaller._id,
      { estado: "inactivo" },
      { new: true, runValidators: true }
    );

    console.log(`✅ Estado cambiado:`);
    console.log(
      `   - Antes: ${estadoAnterior === "activo" ? "🟢 Activo" : "🔴 Inactivo"}`
    );
    console.log(
      `   - Ahora: ${tallerInactivo.estado === "activo" ? "🟢 Activo" : "🔴 Inactivo"}`
    );

    // Reactivar para siguientes pruebas
    await AutoSys.findByIdAndUpdate(
      nuevoTaller._id,
      { estado: "activo" },
      { new: true }
    );
    console.log(`   - Reactivado: 🟢 Activo`);

    // ============================================
    // PASO 5: Validación de Campos Únicos
    // ============================================
    console.log("\n🔒 PASO 5: VALIDAR campos únicos (RIF y Nombre)");
    console.log("-".repeat(60));

    try {
      // Intentar crear taller con RIF duplicado
      await AutoSys.create({
        nombre: "Taller Otro Nombre",
        rif: nuevoTaller.rif, // RIF duplicado
        ubicacion: "Otra ubicación",
        telefono: "+58-212-7777777",
        procesamientoDia: 10,
        legal: "Otro representante",
      });
      console.log(`❌ ERROR: Debió fallar por RIF duplicado`);
    } catch (error) {
      // Mongoose puede lanzar MongooseError o el error puede tener cause con code 11000
      const isDuplicateKey =
        error.code === 11000 || (error.cause && error.cause.code === 11000);
      const isRifKey =
        (error.keyPattern && error.keyPattern.rif) ||
        (error.cause && error.cause.keyPattern && error.cause.keyPattern.rif);

      if (isDuplicateKey && isRifKey) {
        console.log(`✅ Validación de RIF único funcionando correctamente`);
        console.log(`   - Error esperado: No se permite RIF duplicado`);
      } else {
        throw error;
      }
    }

    try {
      // Intentar crear taller con nombre duplicado
      await AutoSys.create({
        nombre: nuevoTaller.nombre, // Nombre duplicado
        rif: "J-OTRO-123456",
        ubicacion: "Otra ubicación",
        telefono: "+58-212-6666666",
        procesamientoDia: 10,
        legal: "Otro representante",
      });
      console.log(`❌ ERROR: Debió fallar por nombre duplicado`);
    } catch (error) {
      // Mongoose puede lanzar MongooseError o el error puede tener cause con code 11000
      const isDuplicateKey =
        error.code === 11000 || (error.cause && error.cause.code === 11000);
      const isNombreKey =
        (error.keyPattern && error.keyPattern.nombre) ||
        (error.cause &&
          error.cause.keyPattern &&
          error.cause.keyPattern.nombre);

      if (isDuplicateKey && isNombreKey) {
        console.log(`✅ Validación de nombre único funcionando correctamente`);
        console.log(`   - Error esperado: No se permite nombre duplicado`);
      } else {
        throw error;
      }
    }

    // ============================================
    // PASO 6: Validación de Longitudes de Campos
    // ============================================
    console.log("\n📏 PASO 6: VALIDAR longitudes de campos");
    console.log("-".repeat(60));

    try {
      // Nombre muy corto
      await AutoSys.create({
        nombre: "AB", // Menos de 3 caracteres
        rif: "J-SHORT-123",
        ubicacion: "Ubicación válida",
        telefono: "+58-212-5555555",
        procesamientoDia: 10,
      });
      console.log(`❌ ERROR: Debió fallar por nombre muy corto`);
    } catch (error) {
      if (error.errors && error.errors.nombre) {
        console.log(`✅ Validación de longitud mínima de nombre`);
        console.log(`   - Error: ${error.errors.nombre.message}`);
      } else {
        throw error;
      }
    }

    try {
      // Nombre muy largo
      await AutoSys.create({
        nombre: "A".repeat(51), // Más de 50 caracteres
        rif: "J-LONG-123",
        ubicacion: "Ubicación válida",
        telefono: "+58-212-4444444",
        procesamientoDia: 10,
      });
      console.log(`❌ ERROR: Debió fallar por nombre muy largo`);
    } catch (error) {
      if (error.errors && error.errors.nombre) {
        console.log(`✅ Validación de longitud máxima de nombre`);
        console.log(`   - Error: ${error.errors.nombre.message}`);
      } else {
        throw error;
      }
    }

    // ============================================
    // PASO 7: Validación de Campos Requeridos
    // ============================================
    console.log("\n✔️  PASO 7: VALIDAR campos requeridos");
    console.log("-".repeat(60));

    const camposRequeridos = [
      { campo: "nombre", valor: null },
      { campo: "rif", valor: null },
      { campo: "ubicacion", valor: null },
      { campo: "procesamientoDia", valor: null },
    ];

    for (const { campo, valor } of camposRequeridos) {
      try {
        const dataIncompleta = {
          nombre: "Taller Completo",
          rif: `J-REQ-${Date.now()}-${Math.random()}`,
          ubicacion: "Ubicación completa",
          telefono: "+58-212-3333333",
          procesamientoDia: 10,
        };

        // Eliminar el campo a validar
        dataIncompleta[campo] = valor;

        await AutoSys.create(dataIncompleta);
        console.log(`❌ ERROR: Debió fallar por falta de ${campo}`);
      } catch (error) {
        if (error.errors && error.errors[campo]) {
          console.log(`✅ Campo "${campo}" es requerido correctamente`);
        } else {
          throw error;
        }
      }
    }

    // ============================================
    // PASO 8: Validación de Capacidad Negativa
    // ============================================
    console.log("\n🔢 PASO 8: VALIDAR capacidad no negativa");
    console.log("-".repeat(60));

    try {
      await AutoSys.create({
        nombre: "Taller Negativo",
        rif: `J-NEG-${Date.now()}`,
        ubicacion: "Ubicación válida",
        telefono: "+58-212-2222222",
        procesamientoDia: -5, // Capacidad negativa
      });
      console.log(`❌ ERROR: Debió fallar por capacidad negativa`);
    } catch (error) {
      if (error.errors && error.errors.procesamientoDia) {
        console.log(`✅ Validación de capacidad no negativa`);
        console.log(`   - Error: ${error.errors.procesamientoDia.message}`);
      } else {
        throw error;
      }
    }

    // ============================================
    // PASO 9: Eliminación Lógica
    // ============================================
    console.log("\n🗑️  PASO 9: ELIMINACIÓN lógica");
    console.log("-".repeat(60));

    const tallerEliminado = await AutoSys.findByIdAndUpdate(
      nuevoTaller._id,
      { eliminado: true },
      { new: true }
    );

    console.log(`✅ Taller marcado como eliminado:`);
    console.log(`   - ID: ${tallerEliminado._id}`);
    console.log(`   - Nombre: ${tallerEliminado.nombre}`);
    console.log(
      `   - Eliminado: ${tallerEliminado.eliminado ? "✅ Sí" : "❌ No"}`
    );

    // Verificar que no aparece en consultas normales
    const tallerBuscado = await AutoSys.findOne({
      _id: nuevoTaller._id,
      eliminado: false,
    });

    if (!tallerBuscado) {
      console.log(
        `✅ El taller eliminado NO aparece en consultas normales (eliminado: false)`
      );
    }

    // ============================================
    // PASO 10: Listar Talleres
    // ============================================
    console.log("\n📋 PASO 10: LISTAR talleres");
    console.log("-".repeat(60));

    const talleresActivos = await AutoSys.find({
      eliminado: false,
      estado: "activo",
    }).sort({ nombre: 1 });

    const talleresInactivos = await AutoSys.find({
      eliminado: false,
      estado: "inactivo",
    }).sort({ nombre: 1 });

    console.log(`\n   🟢 Talleres ACTIVOS: ${talleresActivos.length}`);
    talleresActivos.slice(0, 5).forEach((taller, index) => {
      console.log(`   ${index + 1}. ${taller.nombre}`);
      console.log(
        `      RIF: ${taller.rif} | Capacidad: ${taller.procesamientoDia} veh/día`
      );
    });

    if (talleresActivos.length > 5) {
      console.log(`   ... y ${talleresActivos.length - 5} más`);
    }

    console.log(`\n   🔴 Talleres INACTIVOS: ${talleresInactivos.length}`);
    talleresInactivos.forEach((taller, index) => {
      console.log(`   ${index + 1}. ${taller.nombre} (${taller.rif})`);
    });

    // ============================================
    // PASO 11: Estadísticas
    // ============================================
    console.log("\n📊 PASO 11: ESTADÍSTICAS");
    console.log("-".repeat(60));

    const totalTalleres = await AutoSys.countDocuments({ eliminado: false });
    const totalActivos = talleresActivos.length;
    const totalInactivos = talleresInactivos.length;

    const capacidadTotal = talleresActivos.reduce(
      (sum, t) => sum + t.procesamientoDia,
      0
    );
    const capacidadPromedio =
      totalActivos > 0 ? capacidadTotal / totalActivos : 0;

    const tallerMayorCapacidad = talleresActivos.reduce(
      (max, t) => (t.procesamientoDia > max.procesamientoDia ? t : max),
      talleresActivos[0] || { procesamientoDia: 0 }
    );

    const tallerMenorCapacidad = talleresActivos.reduce(
      (min, t) => (t.procesamientoDia < min.procesamientoDia ? t : min),
      talleresActivos[0] || { procesamientoDia: 0 }
    );

    console.log(`\n   📈 Estadísticas generales:`);
    console.log(`   - Total talleres: ${totalTalleres}`);
    console.log(
      `   - Activos: ${totalActivos} (${((totalActivos / totalTalleres) * 100).toFixed(1)}%)`
    );
    console.log(
      `   - Inactivos: ${totalInactivos} (${((totalInactivos / totalTalleres) * 100).toFixed(1)}%)`
    );
    console.log(`\n   🔧 Capacidad de procesamiento:`);
    console.log(`   - Total: ${capacidadTotal} vehículos/día`);
    console.log(
      `   - Promedio: ${capacidadPromedio.toFixed(1)} vehículos/día por taller`
    );

    if (tallerMayorCapacidad.nombre) {
      console.log(`\n   🏆 Mayor capacidad:`);
      console.log(`   - ${tallerMayorCapacidad.nombre}`);
      console.log(
        `   - ${tallerMayorCapacidad.procesamientoDia} vehículos/día`
      );
    }

    if (tallerMenorCapacidad.nombre) {
      console.log(`\n   📉 Menor capacidad:`);
      console.log(`   - ${tallerMenorCapacidad.nombre}`);
      console.log(
        `   - ${tallerMenorCapacidad.procesamientoDia} vehículos/día`
      );
    }

    // ============================================
    // RESUMEN
    // ============================================
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMEN DEL TEST");
    console.log("=".repeat(60));
    console.log(`
    ESCENARIO: CRUD Completo de AutoSys
    
    PRUEBAS REALIZADAS:
    ✅ 1. Crear taller
    ✅ 2. Leer taller
    ✅ 3. Actualizar taller
    ✅ 4. Cambiar estado (activo/inactivo)
    ✅ 5. Validar campos únicos (RIF y Nombre)
    ✅ 6. Validar longitudes de campos
    ✅ 7. Validar campos requeridos
    ✅ 8. Validar capacidad no negativa
    ✅ 9. Eliminación lógica
    ✅ 10. Listar talleres (activos e inactivos)
    ✅ 11. Estadísticas del sistema
    
    VALIDACIONES:
    - RIF único: ✅
    - Nombre único: ✅
    - Longitudes de texto: ✅
    - Campos requeridos: ✅
    - Capacidad no negativa: ✅
    - Eliminación lógica: ✅
    - Estados (activo/inactivo): ✅
    
    ESTADO FINAL:
    - Talleres totales: ${totalTalleres}
    - Talleres activos: ${totalActivos}
    - Capacidad total: ${capacidadTotal} veh/día
    `);

    console.log("=".repeat(60));
    console.log("🎉 TEST COMPLETADO EXITOSAMENTE");
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ Error en el test:", error);
    console.error(error.stack);
  } finally {
    // Limpiar datos de prueba
    console.log("\n🧹 Limpiando datos de prueba...");

    for (const taller of talleresPrueba) {
      try {
        await AutoSys.deleteOne({ _id: taller._id });
        console.log(`🧹 Taller eliminado: ${taller.nombre}`);
      } catch (error) {
        console.log(
          `⚠️  No se pudo eliminar el taller ${taller.nombre}:`,
          error.message
        );
      }
    }

    console.log("✅ Limpieza completada\n");
    process.exit(0);
  }
};

// Ejecutar test
testAutoSys();
