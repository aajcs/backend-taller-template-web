const mongoose = require("mongoose");
const {
  ServiceCategory,
  ServiceSubcategory,
  Service,
} = require("./features/workshop/work-orders/models");

// Script de prueba para verificar el sistema de categorías
async function testCategoriesSystem() {
  try {
    console.log("🧪 Probando sistema de categorías y subcategorías...");

    // Crear una categoría de prueba
    const testCategory = new ServiceCategory({
      nombre: "Categoría de Prueba",
      descripcion: "Categoría para testing",
      codigo: "TEST_CATEGORY",
      color: "#FF0000",
      icono: "test",
      orden: 99,
    });
    await testCategory.save();
    console.log("✅ Categoría creada:", testCategory.nombre);

    // Crear una subcategoría que referencia la categoría
    const testSubcategory = new ServiceSubcategory({
      nombre: "Subcategoría de Prueba",
      descripcion: "Subcategoría para testing",
      codigo: "TEST_SUBCATEGORY",
      categoria: testCategory._id,
      orden: 1,
    });
    await testSubcategory.save();
    console.log("✅ Subcategoría creada:", testSubcategory.nombre);

    // Crear un servicio que referencia ambas
    const testService = new Service({
      nombre: "Servicio de Prueba",
      descripcion: "Servicio para testing",
      codigo: "TEST_SERVICE",
      categoria: testCategory._id,
      subcategoria: testSubcategory._id,
      precioBase: 100.0,
      tiempoEstimadoMinutos: 60,
      unidadTiempo: "minutos",
      requiereEspecialista: false,
      dificultad: "baja",
    });
    await testService.save();
    console.log("✅ Servicio creado:", testService.nombre);

    // Probar populate para verificar referencias
    const populatedService = await Service.findById(testService._id)
      .populate("categoria")
      .populate("subcategoria");

    console.log("✅ Servicio con referencias populadas:");
    console.log("  - Servicio:", populatedService.nombre);
    console.log("  - Categoría:", populatedService.categoria.nombre);
    console.log("  - Subcategoría:", populatedService.subcategoria.nombre);

    // Limpiar datos de prueba
    await Service.findByIdAndDelete(testService._id);
    await ServiceSubcategory.findByIdAndDelete(testSubcategory._id);
    await ServiceCategory.findByIdAndDelete(testCategory._id);
    console.log("🧹 Datos de prueba limpiados");

    console.log("🎉 Sistema de categorías funcionando correctamente!");
  } catch (error) {
    console.error("❌ Error en la prueba:", error);
  } finally {
    mongoose.connection.close();
  }
}

module.exports = { testCategoriesSystem };

// Ejecutar si se llama directamente
if (require.main === module) {
  require("../../database/config")
    .dbConnection()
    .then(() => testCategoriesSystem())
    .catch(console.error);
}
