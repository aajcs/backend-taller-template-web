/**
 * Seeder de Inventario Completo
 * Crea: Items, Stock, Proveedores, Almacenes, Marcas, Categorías, Unidades
 */

require("dotenv").config();
const { dbConnection } = require("../config");
const Item = require("../../features/inventory/items/item.model");
const Stock = require("../../features/inventory/stock/stock.model");
const Supplier = require("../../features/inventory/suppliers/supplier.models");
const Warehouse = require("../../features/inventory/warehouses/warehouse.models");
const Brand = require("../../features/inventory/brands/brand.models");
const Category = require("../../features/inventory/categories/category.models");
const Unit = require("../../features/inventory/units/unit.models");

const seedInventory = async () => {
  try {
    await dbConnection();
    console.log("🔗 Conectado a MongoDB\n");

    console.log("=".repeat(60));
    console.log("🌱 SEEDER: INVENTARIO COMPLETO");
    console.log("=".repeat(60));

    // ============================================
    // 1. LIMPIAR DATOS EXISTENTES (OPCIONAL)
    // ============================================
    console.log("\n🧹 Limpiando datos existentes...");
    // await Item.deleteMany({});
    // await Stock.deleteMany({});
    // await Supplier.deleteMany({});
    // await Warehouse.deleteMany({});
    // await Brand.deleteMany({});
    // await Category.deleteMany({});
    // await Unit.deleteMany({});
    console.log("✅ Datos limpios (comentado para preservar datos existentes)");

    // ============================================
    // 2. CREAR UNIDADES
    // ============================================
    console.log("\n📏 PASO 1: Crear Unidades");
    console.log("-".repeat(60));

    const unidades = await Unit.find();
    let unidad;
    if (unidades.length === 0) {
      unidad = await Unit.create({
        nombre: "Unidad",
        simbolo: "Ud",
        tipo: "contable",
      });
      await Unit.create({ nombre: "Litro", simbolo: "L", tipo: "volumen" });
      await Unit.create({ nombre: "Kilogramo", simbolo: "Kg", tipo: "peso" });
      console.log("✅ 3 unidades creadas");
    } else {
      unidad = unidades[0];
      console.log(`✅ Usando unidad existente: ${unidad.nombre}`);
    }

    // ============================================
    // 3. CREAR CATEGORÍAS
    // ============================================
    console.log("\n📂 PASO 2: Crear Categorías");
    console.log("-".repeat(60));

    let categoriaFiltros, categoriaElectrico, categoriaLlantas;
    const categorias = await Category.find();

    if (categorias.length === 0) {
      categoriaFiltros = await Category.create({
        nombre: "Filtros",
        descripcion: "Filtros de aceite, aire, combustible",
      });
      categoriaElectrico = await Category.create({
        nombre: "Sistema Eléctrico",
        descripcion: "Baterías, bujías, alternadores",
      });
      categoriaLlantas = await Category.create({
        nombre: "Llantas y Frenos",
        descripcion: "Llantas, pastillas, discos",
      });
      console.log("✅ 3 categorías creadas");
    } else {
      categoriaFiltros =
        categorias.find((c) => c.nombre.includes("Filtro")) || categorias[0];
      categoriaElectrico =
        categorias.find((c) => c.nombre.includes("Eléctrico")) || categorias[0];
      categoriaLlantas =
        categorias.find((c) => c.nombre.includes("Llanta")) || categorias[0];
      console.log(`✅ Usando categorías existentes`);
    }

    // ============================================
    // 4. CREAR MARCAS
    // ============================================
    console.log("\n🏷️  PASO 3: Crear Marcas");
    console.log("-".repeat(60));

    let marcaBosch, marcaNGK, marcaMann;
    const marcas = await Brand.find();

    if (marcas.length === 0) {
      marcaBosch = await Brand.create({
        nombre: "Bosch",
        descripcion: "Marca alemana líder en autopartes",
      });
      marcaNGK = await Brand.create({
        nombre: "NGK",
        descripcion: "Especialista en bujías",
      });
      marcaMann = await Brand.create({
        nombre: "Mann Filter",
        descripcion: "Filtros de alta calidad",
      });
      console.log("✅ 3 marcas creadas");
    } else {
      marcaBosch = marcas.find((m) => m.nombre.includes("Bosch")) || marcas[0];
      marcaNGK = marcas.find((m) => m.nombre.includes("NGK")) || marcas[0];
      marcaMann = marcas.find((m) => m.nombre.includes("Mann")) || marcas[0];
      console.log(`✅ Usando marcas existentes`);
    }

    // ============================================
    // 5. CREAR PROVEEDORES
    // ============================================
    console.log("\n🏢 PASO 4: Crear Proveedores");
    console.log("-".repeat(60));

    let proveedor1, proveedor2;
    const proveedores = await Supplier.find();

    if (proveedores.length === 0) {
      proveedor1 = await Supplier.create({
        nombre: "AutoPartes Central S.A.",
        rif: "J-12345678-9",
        contacto: {
          telefono: "02129876543",
          email: "ventas@autopartescentral.com",
          direccion: "Av. Principal, Caracas",
        },
        condicionesPago: {
          plazo: 30,
          descuento: 5,
        },
      });

      proveedor2 = await Supplier.create({
        nombre: "Importadora Motor Total C.A.",
        rif: "J-98765432-1",
        contacto: {
          telefono: "02125556789",
          email: "compras@motortotal.com",
          direccion: "Zona Industrial, Valencia",
        },
        condicionesPago: {
          plazo: 45,
          descuento: 10,
        },
      });
      console.log("✅ 2 proveedores creados");
    } else {
      proveedor1 = proveedores[0];
      proveedor2 = proveedores[1] || proveedores[0];
      console.log(`✅ Usando proveedores existentes: ${proveedor1.nombre}`);
    }

    // ============================================
    // 6. CREAR ALMACENES
    // ============================================
    console.log("\n🏪 PASO 5: Crear Almacenes");
    console.log("-".repeat(60));

    let almacenPrincipal, almacenSecundario;
    const almacenes = await Warehouse.find();

    if (almacenes.length === 0) {
      almacenPrincipal = await Warehouse.create({
        nombre: "Almacén Principal",
        codigo: "ALM-001",
        ubicacion: "Planta Baja - Zona A",
        responsable: "Juan Pérez",
        capacidad: 1000,
      });

      almacenSecundario = await Warehouse.create({
        nombre: "Almacén Repuestos Rápidos",
        codigo: "ALM-002",
        ubicacion: "Primer Piso - Zona B",
        responsable: "María González",
        capacidad: 500,
      });
      console.log("✅ 2 almacenes creados");
    } else {
      almacenPrincipal = almacenes[0];
      almacenSecundario = almacenes[1] || almacenes[0];
      console.log(`✅ Usando almacenes existentes: ${almacenPrincipal.nombre}`);
    }

    // ============================================
    // 7. CREAR ITEMS (REPUESTOS)
    // ============================================
    console.log("\n📦 PASO 6: Crear Items (Repuestos)");
    console.log("-".repeat(60));

    const itemsData = [
      {
        nombre: "Filtro de Aceite",
        codigo: "FO-001",
        descripcion: "Filtro de aceite universal para motores 1.0 - 1.6L",
        categoria: categoriaFiltros._id,
        marca: marcaBosch._id,
        unidad: unidad._id,
        precio: 15000,
        stockMinimo: 10,
        stockMaximo: 100,
        ubicacion: "Estante A-1",
      },
      {
        nombre: "Filtro de Aire",
        codigo: "FA-001",
        descripcion: "Filtro de aire de alto flujo",
        categoria: categoriaFiltros._id,
        marca: marcaMann._id,
        unidad: unidad._id,
        precio: 12000,
        stockMinimo: 15,
        stockMaximo: 80,
        ubicacion: "Estante A-2",
      },
      {
        nombre: "Filtro de Combustible",
        codigo: "FC-001",
        descripcion: "Filtro de combustible gasolina",
        categoria: categoriaFiltros._id,
        marca: marcaMann._id,
        unidad: unidad._id,
        precio: 18000,
        stockMinimo: 8,
        stockMaximo: 60,
        ubicacion: "Estante A-3",
      },
      {
        nombre: "Bujía NGK",
        codigo: "BJ-001",
        descripcion: "Bujía de iridio NGK premium",
        categoria: categoriaElectrico._id,
        marca: marcaNGK._id,
        unidad: unidad._id,
        precio: 25000,
        stockMinimo: 20,
        stockMaximo: 200,
        ubicacion: "Estante B-1",
      },
      {
        nombre: "Batería 12V 60Ah",
        codigo: "BAT-001",
        descripcion: "Batería libre mantenimiento 12V 60Ah",
        categoria: categoriaElectrico._id,
        marca: marcaBosch._id,
        unidad: unidad._id,
        precio: 250000,
        stockMinimo: 5,
        stockMaximo: 30,
        ubicacion: "Estante B-2",
      },
      {
        nombre: "Pastillas de Freno Delanteras",
        codigo: "PF-001",
        descripcion: "Pastillas de freno cerámicas delanteras",
        categoria: categoriaLlantas._id,
        marca: marcaBosch._id,
        unidad: unidad._id,
        precio: 85000,
        stockMinimo: 10,
        stockMaximo: 50,
        ubicacion: "Estante C-1",
      },
      {
        nombre: "Llanta 185/65 R15",
        codigo: "LL-001",
        descripcion: "Llanta radial 185/65 R15",
        categoria: categoriaLlantas._id,
        marca: marcaBosch._id,
        unidad: unidad._id,
        precio: 180000,
        stockMinimo: 8,
        stockMaximo: 40,
        ubicacion: "Estante C-2",
      },
    ];

    const itemsCreados = [];
    for (const itemData of itemsData) {
      // Verificar si ya existe
      let item = await Item.findOne({ codigo: itemData.codigo });
      if (!item) {
        item = await Item.create(itemData);
        console.log(`✅ ${item.nombre} (${item.codigo})`);
      } else {
        console.log(`ℹ️  ${item.nombre} ya existe`);
      }
      itemsCreados.push(item);
    }

    // ============================================
    // 8. CREAR STOCK INICIAL
    // ============================================
    console.log("\n📊 PASO 7: Crear Stock Inicial");
    console.log("-".repeat(60));

    const stocksData = [
      {
        item: itemsCreados[0]._id,
        warehouse: almacenPrincipal._id,
        cantidad: 50,
      }, // Filtro Aceite
      {
        item: itemsCreados[1]._id,
        warehouse: almacenPrincipal._id,
        cantidad: 30,
      }, // Filtro Aire
      {
        item: itemsCreados[2]._id,
        warehouse: almacenPrincipal._id,
        cantidad: 25,
      }, // Filtro Combustible
      {
        item: itemsCreados[3]._id,
        warehouse: almacenPrincipal._id,
        cantidad: 100,
      }, // Bujías
      {
        item: itemsCreados[4]._id,
        warehouse: almacenPrincipal._id,
        cantidad: 15,
      }, // Batería
      {
        item: itemsCreados[5]._id,
        warehouse: almacenPrincipal._id,
        cantidad: 20,
      }, // Pastillas
      {
        item: itemsCreados[6]._id,
        warehouse: almacenPrincipal._id,
        cantidad: 12,
      }, // Llantas
      // Stock secundario
      {
        item: itemsCreados[0]._id,
        warehouse: almacenSecundario._id,
        cantidad: 20,
      }, // Filtro Aceite
      {
        item: itemsCreados[1]._id,
        warehouse: almacenSecundario._id,
        cantidad: 15,
      }, // Filtro Aire
      {
        item: itemsCreados[3]._id,
        warehouse: almacenSecundario._id,
        cantidad: 50,
      }, // Bujías
    ];

    for (const stockData of stocksData) {
      // Verificar si ya existe
      let stock = await Stock.findOne({
        item: stockData.item,
        warehouse: stockData.warehouse,
      });

      if (!stock) {
        stock = await Stock.create(stockData);
        const item = itemsCreados.find(
          (i) => i._id.toString() === stockData.item.toString()
        );
        const almacen =
          stockData.warehouse.toString() === almacenPrincipal._id.toString()
            ? almacenPrincipal
            : almacenSecundario;
        console.log(
          `✅ ${item.nombre} - ${almacen.nombre}: ${stockData.cantidad} uds`
        );
      } else {
        const item = itemsCreados.find(
          (i) => i._id.toString() === stockData.item.toString()
        );
        console.log(
          `ℹ️  ${item.nombre} - stock ya existe: ${stock.cantidad} uds`
        );
      }
    }

    // ============================================
    // RESUMEN FINAL
    // ============================================
    console.log("\n" + "=".repeat(60));
    console.log("📊 RESUMEN DEL SEEDER");
    console.log("=".repeat(60));

    const totalUnidades = await Unit.countDocuments();
    const totalCategorias = await Category.countDocuments();
    const totalMarcas = await Brand.countDocuments();
    const totalProveedores = await Supplier.countDocuments();
    const totalAlmacenes = await Warehouse.countDocuments();
    const totalItems = await Item.countDocuments();
    const totalStock = await Stock.countDocuments();

    console.log(`
    ✅ Unidades: ${totalUnidades}
    ✅ Categorías: ${totalCategorias}
    ✅ Marcas: ${totalMarcas}
    ✅ Proveedores: ${totalProveedores}
    ✅ Almacenes: ${totalAlmacenes}
    ✅ Items: ${totalItems}
    ✅ Registros de Stock: ${totalStock}
    `);

    console.log("=".repeat(60));
    console.log("🎉 SEEDER COMPLETADO EXITOSAMENTE");
    console.log("=".repeat(60));

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error en el seeder:", error);
    process.exit(1);
  }
};

// Ejecutar si se llama directamente
if (require.main === module) {
  seedInventory();
}

module.exports = seedInventory;
