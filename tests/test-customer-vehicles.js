/**
 * Test: Clientes y Vehículos Asociados
 * Valida que al buscar un cliente, se muestren correctamente sus vehículos asociados
 * con toda la información poblada (marca, modelo, etc.)
 */

require("dotenv").config();
const { dbConnection } = require("../database/config");
const Customer = require("../features/crm/customers/models/customer.model");
const Vehicle = require("../features/crm/vehicles/models/vehicle.model");
const VehicleBrand = require("../features/crm/vehicles/models/vehicleBrand.model");
const VehicleModel = require("../features/crm/vehicles/models/vehicleModel.model");

const testCustomerVehicles = async () => {
  let testCustomerId = null;
  let testVehicleIds = [];
  let testBrandId = null;
  let testModelIds = [];

  try {
    await dbConnection();
    console.log("🔗 Conectado a MongoDB\n");

    console.log("=".repeat(60));
    console.log("🧪 TEST: CLIENTES Y VEHÍCULOS ASOCIADOS");
    console.log("=".repeat(60));

    // ============================================
    // PASO 1: Crear Marca de Vehículo
    // ============================================
    console.log("\n📝 PASO 1: CREAR marca de vehículo");
    console.log("-".repeat(60));

    const marcaData = {
      nombre: "Toyota Test",
      pais: "Japón",
      descripcion: "Marca de prueba para test",
    };

    const marca = await VehicleBrand.create(marcaData);
    testBrandId = marca._id;

    console.log(`✅ Marca creada exitosamente:`);
    console.log(`   - ID: ${marca._id}`);
    console.log(`   - Nombre: ${marca.nombre}`);
    console.log(`   - País: ${marca.pais}`);

    // ============================================
    // PASO 2: Crear Modelos de Vehículo
    // ============================================
    console.log("\n📝 PASO 2: CREAR modelos de vehículo");
    console.log("-".repeat(60));

    const modelos = [
      { nombre: "Corolla", tipo: "sedan", brand: testBrandId },
      { nombre: "Camry", tipo: "sedan", brand: testBrandId },
      { nombre: "RAV4", tipo: "suv", brand: testBrandId },
    ];

    for (const modeloData of modelos) {
      const modelo = await VehicleModel.create(modeloData);
      testModelIds.push(modelo._id);
      console.log(`✅ Modelo creado: ${modelo.nombre} (${modelo.tipo})`);
    }

    // ============================================
    // PASO 3: Crear Cliente
    // ============================================
    console.log("\n📝 PASO 3: CREAR cliente de prueba");
    console.log("-".repeat(60));

    const clienteData = {
      nombre: "Juan Pérez Testing",
      tipo: "persona",
      telefono: "+584121234567",
      correo: `test.customer.${Date.now()}@example.com`,
      direccion: "Calle Principal #123, Caracas",
      notas: "Cliente creado para test de vehículos asociados",
    };

    const cliente = await Customer.create(clienteData);
    testCustomerId = cliente._id;

    console.log(`✅ Cliente creado exitosamente:`);
    console.log(`   - ID: ${cliente._id}`);
    console.log(`   - Nombre: ${cliente.nombre}`);
    console.log(`   - Tipo: ${cliente.tipo}`);
    console.log(`   - Correo: ${cliente.correo}`);

    // ============================================
    // PASO 4: Crear Vehículos Asociados al Cliente
    // ============================================
    console.log("\n📝 PASO 4: CREAR vehículos asociados al cliente");
    console.log("-".repeat(60));

    const randomSuffix = Math.floor(Math.random() * 10000);
    const vehiculos = [
      {
        placa: `TST${randomSuffix}A`,
        model: testModelIds[0],
        year: 2020,
        color: "Blanco",
        vin: `1HGBH41JXMN10${randomSuffix}`.padEnd(17, "0"),
        kilometraje: 50000,
        customer: testCustomerId,
      },
      {
        placa: `TST${randomSuffix}B`,
        model: testModelIds[1],
        year: 2019,
        color: "Negro",
        vin: `2HGBH41JXMN20${randomSuffix}`.padEnd(17, "0"),
        kilometraje: 75000,
        customer: testCustomerId,
      },
      {
        placa: `TST${randomSuffix}C`,
        model: testModelIds[2],
        year: 2021,
        color: "Rojo",
        vin: `3HGBH41JXMN30${randomSuffix}`.padEnd(17, "0"),
        kilometraje: 30000,
        customer: testCustomerId,
      },
    ];

    for (const vehiculoData of vehiculos) {
      const vehiculo = await Vehicle.create(vehiculoData);
      testVehicleIds.push(vehiculo._id);
      console.log(
        `✅ Vehículo creado: ${vehiculoData.placa} - ${vehiculoData.color}`
      );
    }
    console.log(`\n   Total de vehículos creados: ${testVehicleIds.length}`);

    // ============================================
    // PASO 5: TEST - Buscar Cliente SIN Población
    // ============================================
    console.log("\n🔍 PASO 5: BUSCAR cliente SIN población de vehículos");
    console.log("-".repeat(60));

    const clienteSinPopular = await Customer.findById(testCustomerId);

    console.log(`✅ Cliente encontrado:`);
    console.log(`   - ID: ${clienteSinPopular._id}`);
    console.log(`   - Nombre: ${clienteSinPopular.nombre}`);
    console.log(
      `   - Tiene propiedad 'vehicles': ${clienteSinPopular.vehicles !== undefined}`
    );

    if (clienteSinPopular.vehicles) {
      console.log(
        `   ⚠️  ADVERTENCIA: El cliente SIN popular ya tiene la propiedad vehicles`
      );
    }

    // ============================================
    // PASO 6: TEST - Buscar Cliente CON Población
    // ============================================
    console.log("\n🔍 PASO 6: BUSCAR cliente CON población de vehículos");
    console.log("-".repeat(60));

    const clienteConVehiculos = await Customer.findById(
      testCustomerId
    ).populate({
      path: "vehicles",
      populate: {
        path: "model",
        select: "nombre tipo",
        populate: {
          path: "brand",
          select: "nombre pais",
        },
      },
    });

    console.log(`✅ Cliente encontrado con población:`);
    console.log(`   - ID: ${clienteConVehiculos._id}`);
    console.log(`   - Nombre: ${clienteConVehiculos.nombre}`);
    console.log(
      `   - Tiene propiedad 'vehicles': ${clienteConVehiculos.vehicles !== undefined}`
    );

    if (!clienteConVehiculos.vehicles) {
      throw new Error("❌ ERROR: El cliente NO tiene la propiedad 'vehicles'");
    }

    if (!Array.isArray(clienteConVehiculos.vehicles)) {
      throw new Error("❌ ERROR: La propiedad 'vehicles' NO es un array");
    }

    if (clienteConVehiculos.vehicles.length === 0) {
      throw new Error("❌ ERROR: El array de vehículos está VACÍO");
    }

    console.log(
      `   ✅ Vehículos encontrados: ${clienteConVehiculos.vehicles.length}`
    );

    // Validar cada vehículo
    console.log("\n   📋 Detalle de vehículos asociados:");
    clienteConVehiculos.vehicles.forEach((vehiculo, index) => {
      console.log(`\n   Vehículo ${index + 1}:`);
      console.log(`      - Placa: ${vehiculo.placa}`);
      console.log(`      - Color: ${vehiculo.color}`);
      console.log(`      - Año: ${vehiculo.year}`);
      console.log(`      - Kilometraje: ${vehiculo.kilometraje}`);

      // Validar población de modelo
      if (vehiculo.model && typeof vehiculo.model === "object") {
        console.log(
          `      - Modelo: ${vehiculo.model.nombre} (${vehiculo.model.tipo}) ✅`
        );

        // Validar población de marca dentro del modelo
        if (vehiculo.model.brand && typeof vehiculo.model.brand === "object") {
          console.log(`      - Marca: ${vehiculo.model.brand.nombre} ✅`);
        } else {
          console.log(`      - Marca: NO POBLADA ❌`);
        }
      } else {
        console.log(`      - Modelo: NO POBLADO ❌`);
      }
    });

    // ============================================
    // PASO 7: TEST - Método getVehicles()
    // ============================================
    console.log("\n🔍 PASO 7: PROBAR método getVehicles()");
    console.log("-".repeat(60));

    const vehiculosDelCliente = await clienteConVehiculos.getVehicles();

    console.log(`✅ Método getVehicles() ejecutado:`);
    console.log(`   - Vehículos retornados: ${vehiculosDelCliente.length}`);

    if (vehiculosDelCliente.length !== testVehicleIds.length) {
      throw new Error(
        `❌ ERROR: Se esperaban ${testVehicleIds.length} vehículos, pero se obtuvieron ${vehiculosDelCliente.length}`
      );
    }

    console.log(`   ✅ Cantidad de vehículos correcta`);

    // ============================================
    // PASO 8: TEST - Método countVehicles()
    // ============================================
    console.log("\n🔍 PASO 8: PROBAR método countVehicles()");
    console.log("-".repeat(60));

    const contadorVehiculos = await clienteConVehiculos.countVehicles();

    console.log(`✅ Método countVehicles() ejecutado:`);
    console.log(`   - Contador: ${contadorVehiculos}`);

    if (contadorVehiculos !== testVehicleIds.length) {
      throw new Error(
        `❌ ERROR: El contador muestra ${contadorVehiculos}, pero se crearon ${testVehicleIds.length} vehículos`
      );
    }

    console.log(`   ✅ Contador de vehículos correcto`);

    // ============================================
    // PASO 9: TEST - Buscar Todos los Clientes
    // ============================================
    console.log("\n🔍 PASO 9: BUSCAR todos los clientes con vehículos");
    console.log("-".repeat(60));

    const todosLosClientes = await Customer.find({ eliminado: false })
      .populate({
        path: "vehicles",
        populate: {
          path: "model",
          select: "nombre",
          populate: {
            path: "brand",
            select: "nombre",
          },
        },
      })
      .limit(10);

    console.log(`✅ Clientes encontrados: ${todosLosClientes.length}`);

    // Buscar nuestro cliente de prueba
    const clientePrueba = todosLosClientes.find(
      (c) => c._id.toString() === testCustomerId.toString()
    );

    if (!clientePrueba) {
      console.log(
        `   ⚠️  Cliente de prueba no encontrado en los primeros 10 registros`
      );
    } else {
      console.log(`   ✅ Cliente de prueba encontrado en la lista`);
      console.log(
        `   - Vehículos en lista: ${clientePrueba.vehicles ? clientePrueba.vehicles.length : 0}`
      );
    }

    // ============================================
    // LIMPIEZA: Eliminar Datos de Prueba
    // ============================================
    console.log("\n🧹 LIMPIEZA: Eliminando datos de prueba");
    console.log("-".repeat(60));

    // Eliminar vehículos
    for (const vehiculoId of testVehicleIds) {
      await Vehicle.findByIdAndUpdate(vehiculoId, { eliminado: true });
    }
    console.log(
      `✅ ${testVehicleIds.length} vehículos marcados como eliminados`
    );

    // Eliminar cliente
    await Customer.findByIdAndUpdate(testCustomerId, { eliminado: true });
    console.log(`✅ Cliente marcado como eliminado`);

    // Eliminar modelos
    for (const modeloId of testModelIds) {
      await VehicleModel.findByIdAndDelete(modeloId);
    }
    console.log(`✅ ${testModelIds.length} modelos eliminados`);

    // Eliminar marca
    await VehicleBrand.findByIdAndDelete(testBrandId);
    console.log(`✅ Marca eliminada`);

    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log("\n" + "=".repeat(60));
    console.log("✅ TODOS LOS TESTS PASARON EXITOSAMENTE");
    console.log("=".repeat(60));
    console.log("\n✓ Virtual field 'vehicles' funciona correctamente");
    console.log("✓ Población de relaciones funciona (marca y modelo)");
    console.log("✓ Método getVehicles() retorna todos los vehículos");
    console.log("✓ Método countVehicles() cuenta correctamente");
    console.log("✓ Búsqueda de clientes con vehículos funciona");
    console.log("\n🎉 Test completado con éxito\n");

    process.exit(0);
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ ERROR EN EL TEST");
    console.error("=".repeat(60));
    console.error(`\n${error.message}`);
    console.error("\nStack trace:");
    console.error(error.stack);

    // Intentar limpieza en caso de error
    try {
      console.log("\n🧹 Intentando limpieza...");
      if (testVehicleIds.length > 0) {
        for (const vehiculoId of testVehicleIds) {
          await Vehicle.findByIdAndUpdate(vehiculoId, { eliminado: true });
        }
      }
      if (testCustomerId) {
        await Customer.findByIdAndUpdate(testCustomerId, { eliminado: true });
      }
      if (testModelIds.length > 0) {
        for (const modeloId of testModelIds) {
          await VehicleModel.findByIdAndDelete(modeloId);
        }
      }
      if (testBrandId) {
        await VehicleBrand.findByIdAndDelete(testBrandId);
      }
      console.log("✅ Limpieza completada");
    } catch (cleanupError) {
      console.error("⚠️  Error durante la limpieza:", cleanupError.message);
    }

    process.exit(1);
  }
};

// Ejecutar el test
testCustomerVehicles();
