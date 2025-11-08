/**
 * Inventory Seeder
 * Crea datos completos para el módulo de inventario
 * Incluye: Brands, Categories, Models, Items, Suppliers, Stock
 */

require("dotenv").config();
const { dbConnection } = require("../database/config");

// Modelos de inventario
const {
  Brand,
  Category,
  ItemModel,
  Item,
  Supplier,
  Warehouse,
  Stock,
  Unit,
} = require("../features/inventory/models");

const seedInventory = async () => {
  try {
    await dbConnection();
    console.log("🔗 Conectado a MongoDB");

    // 1. Crear unidades de medida (verificar si ya existen)
    console.log("📏 Verificando/creando unidades de medida...");
    const units = [
      { nombre: "Pieza", simbolo: "pz", descripcion: "Unidad básica" },
      { nombre: "Litro", simbolo: "L", descripcion: "Unidad de volumen" },
      { nombre: "Kilogramo", simbolo: "kg", descripcion: "Unidad de peso" },
      { nombre: "Metro", simbolo: "m", descripcion: "Unidad de longitud" },
    ];

    const createdUnits = [];
    for (const unitData of units) {
      const existingUnit = await Unit.findOne({ nombre: unitData.nombre });
      if (!existingUnit) {
        const unit = new Unit(unitData);
        await unit.save();
        createdUnits.push(unit);
      } else {
        createdUnits.push(existingUnit);
      }
    }
    console.log(`✅ ${createdUnits.length} unidades verificadas/creadas`);

    // 2. Crear marcas de repuestos (verificar si ya existen)
    console.log("🏷️ Verificando/creando marcas de repuestos...");
    const brands = [
      {
        nombre: "Bosch",
        descripcion: "Especialistas en sistemas automotrices",
      },
      {
        nombre: "Michelin",
        descripcion: "Fabricante de neumáticos y componentes",
      },
      { nombre: "Valeo", descripcion: "Componentes automotrices" },
      { nombre: "NGK", descripcion: "Especialistas en bujías y sensores" },
      { nombre: "Monroe", descripcion: "Amortiguadores y suspensiones" },
    ];

    const createdBrands = [];
    for (const brandData of brands) {
      const existingBrand = await Brand.findOne({ nombre: brandData.nombre });
      if (!existingBrand) {
        const brand = new Brand(brandData);
        await brand.save();
        createdBrands.push(brand);
      } else {
        createdBrands.push(existingBrand);
      }
    }
    console.log(`✅ ${createdBrands.length} marcas verificadas/creadas`);

    // 3. Crear categorías de repuestos (verificar si ya existen)
    console.log("📂 Verificando/creando categorías de repuestos...");
    const categories = [
      {
        nombre: "Filtros",
        descripcion: "Filtros de aceite, aire, combustible",
      },
      { nombre: "Neumáticos", descripcion: "Neumáticos y llantas" },
      { nombre: "Baterías", descripcion: "Baterías y componentes eléctricos" },
      { nombre: "Suspensión", descripcion: "Amortiguadores, resortes, bujes" },
      { nombre: "Frenos", descripcion: "Pastillas, discos, tambores de freno" },
      { nombre: "Motor", descripcion: "Componentes del motor" },
    ];

    const createdCategories = [];
    for (const categoryData of categories) {
      const existingCategory = await Category.findOne({
        nombre: categoryData.nombre,
      });
      if (!existingCategory) {
        const category = new Category(categoryData);
        await category.save();
        createdCategories.push(category);
      } else {
        createdCategories.push(existingCategory);
      }
    }
    console.log(
      `✅ ${createdCategories.length} categorías verificadas/creadas`
    );

    // 4. Crear modelos de artículos (verificar si ya existen)
    console.log("🔧 Verificando/creando modelos de artículos...");
    const itemModels = [
      {
        nombre: "Filtro de Aceite",
        descripcion: "Filtro para aceite del motor",
      },
      { nombre: "Filtro de Aire", descripcion: "Filtro de aire del motor" },
      { nombre: "Bujía", descripcion: "Bujía de encendido" },
      {
        nombre: "Pastilla de Freno",
        descripcion: "Pastilla de freno delantera",
      },
      { nombre: "Amortiguador", descripcion: "Amortiguador de suspensión" },
      { nombre: "Batería 12V", descripcion: "Batería de 12 voltios" },
    ];

    const createdItemModels = [];
    for (const modelData of itemModels) {
      const existingModel = await ItemModel.findOne({
        nombre: modelData.nombre,
      });
      if (!existingModel) {
        const model = new ItemModel(modelData);
        await model.save();
        createdItemModels.push(model);
      } else {
        createdItemModels.push(existingModel);
      }
    }
    console.log(
      `✅ ${createdItemModels.length} modelos de artículos verificados/creados`
    );

    // 5. Crear proveedores (verificar si ya existen)
    console.log("🏢 Verificando/creando proveedores...");
    const suppliers = [
      {
        nombre: "AutoParts Express",
        rif: "J-123456789",
        telefono: "+58-212-555-0101",
        email: "ventas@autopartsexpress.com",
        direccion: "Av. Principal de Los Ruices, Caracas",
        contacto: "María González",
        tipo: "Distribuidor",
      },
      {
        nombre: "Repuestos Caracas",
        rif: "J-987654321",
        telefono: "+58-212-555-0202",
        email: "info@repuestosccs.com",
        direccion: "Calle 5 con Calle 8, La Candelaria",
        contacto: "Carlos Rodríguez",
        tipo: "Mayorista",
      },
      {
        nombre: "Importadora Venezuela",
        rif: "J-456789123",
        telefono: "+58-212-555-0303",
        email: "importaciones@ivenezuela.com",
        direccion: "Zona Industrial de Valencia",
        contacto: "Ana López",
        tipo: "Importador",
      },
    ];

    const createdSuppliers = [];
    for (const supplierData of suppliers) {
      const existingSupplier = await Supplier.findOne({
        rif: supplierData.rif,
      });
      if (!existingSupplier) {
        const supplier = new Supplier(supplierData);
        await supplier.save();
        createdSuppliers.push(supplier);
      } else {
        createdSuppliers.push(existingSuppliers);
      }
    }
    console.log(
      `✅ ${createdSuppliers.length} proveedores verificados/creados`
    );

    // 6. Crear almacenes (verificar si ya existen)
    console.log("🏭 Verificando/creando almacenes...");
    const warehouses = [
      {
        nombre: "Almacén Principal",
        codigo: "ALM-001",
        ubicacion: "Av. Universidad, Caracas",
        capacidad: 10000,
        tipo: "almacen",
      },
      {
        nombre: "Almacén Taller",
        codigo: "ALM-002",
        ubicacion: "Calle del Taller, Caracas",
        capacidad: 2000,
        tipo: "taller",
      },
    ];

    const createdWarehouses = [];
    for (const warehouseData of warehouses) {
      const existingWarehouse = await Warehouse.findOne({
        codigo: warehouseData.codigo,
      });
      if (!existingWarehouse) {
        const warehouse = new Warehouse(warehouseData);
        await warehouse.save();
        createdWarehouses.push(warehouse);
      } else {
        createdWarehouses.push(existingWarehouse);
      }
    }
    console.log(`✅ ${createdWarehouses.length} almacenes verificados/creados`);

    // 7. Crear repuestos/artículos (verificar si ya existen)
    console.log("🔩 Verificando/creando repuestos...");
    const items = [
      {
        sku: "FLT-ACE-001",
        codigo: "FLT-ACE-001",
        nombre: "Filtro de Aceite Bosch",
        descripcion: "Filtro de aceite para motores de gasolina",
        marca: createdBrands[0]._id, // Bosch
        modelo: createdItemModels[0]._id, // Filtro de Aceite
        categoria: createdCategories[0]._id, // Filtros
        unidad: createdUnits[0]._id, // Pieza
        precioCosto: 25000,
        precioVenta: 35000,
        stockMinimo: 5,
        stockMaximo: 50,
      },
      {
        sku: "FLT-AIR-001",
        codigo: "FLT-AIR-001",
        nombre: "Filtro de Aire Bosch",
        descripcion: "Filtro de aire para motores de gasolina",
        marca: createdBrands[0]._id, // Bosch
        modelo: createdItemModels[1]._id, // Filtro de Aire
        categoria: createdCategories[0]._id, // Filtros
        unidad: createdUnits[0]._id, // Pieza
        precioCosto: 18000,
        precioVenta: 25000,
        stockMinimo: 3,
        stockMaximo: 30,
      },
      {
        sku: "BUJ-NGK-001",
        codigo: "BUJ-NGK-001",
        nombre: "Bujía NGK",
        descripcion: "Bujía de encendido estándar",
        marca: createdBrands[3]._id, // NGK
        modelo: createdItemModels[2]._id, // Bujía
        categoria: createdCategories[5]._id, // Motor
        unidad: createdUnits[0]._id, // Pieza
        precioCosto: 12000,
        precioVenta: 18000,
        stockMinimo: 10,
        stockMaximo: 100,
      },
      {
        sku: "BAT-12V-001",
        codigo: "BAT-12V-001",
        nombre: "Batería 12V 100Ah",
        descripcion: "Batería de 12 voltios 100 amperios/hora",
        marca: createdBrands[0]._id, // Bosch
        modelo: createdItemModels[5]._id, // Batería 12V
        categoria: createdCategories[2]._id, // Baterías
        unidad: createdUnits[0]._id, // Pieza
        precioCosto: 150000,
        precioVenta: 220000,
        stockMinimo: 2,
        stockMaximo: 20,
      },
      {
        sku: "AMT-MON-001",
        codigo: "AMT-MON-001",
        nombre: "Amortiguador Monroe",
        descripcion: "Amortiguador delantero para sedán",
        marca: createdBrands[4]._id, // Monroe
        modelo: createdItemModels[4]._id, // Amortiguador
        categoria: createdCategories[3]._id, // Suspensión
        unidad: createdUnits[0]._id, // Pieza
        precioCosto: 85000,
        precioVenta: 120000,
        stockMinimo: 4,
        stockMaximo: 40,
      },
    ];

    const createdItems = [];
    for (const itemData of items) {
      const existingItem = await Item.findOne({ sku: itemData.sku });
      if (!existingItem) {
        const item = new Item(itemData);
        await item.save();
        createdItems.push(item);
      } else {
        createdItems.push(existingItem);
      }
    }
    console.log(`✅ ${createdItems.length} repuestos verificados/creados`);

    // 8. Crear stock inicial (verificar si ya existe)
    console.log("📦 Verificando/creando stock inicial...");
    const stocks = [
      {
        item: createdItems[0]._id, // Filtro de Aceite Bosch
        warehouse: createdWarehouses[0]._id, // Almacén Principal
        cantidad: 25,
        cantidadReservada: 0,
        ubicacion: "Estante A-01",
      },
      {
        item: createdItems[1]._id, // Filtro de Aire Bosch
        warehouse: createdWarehouses[0]._id, // Almacén Principal
        cantidad: 15,
        cantidadReservada: 0,
        ubicacion: "Estante A-02",
      },
      {
        item: createdItems[2]._id, // Bujía NGK
        warehouse: createdWarehouses[0]._id, // Almacén Principal
        cantidad: 50,
        cantidadReservada: 0,
        ubicacion: "Estante B-01",
      },
      {
        item: createdItems[3]._id, // Batería 12V
        warehouse: createdWarehouses[0]._id, // Almacén Principal
        cantidad: 8,
        cantidadReservada: 0,
        ubicacion: "Estante C-01",
      },
      {
        item: createdItems[4]._id, // Amortiguador Monroe
        warehouse: createdWarehouses[0]._id, // Almacén Principal
        cantidad: 12,
        cantidadReservada: 0,
        ubicacion: "Estante D-01",
      },
    ];

    const createdStocks = [];
    for (const stockData of stocks) {
      const existingStock = await Stock.findOne({
        item: stockData.item,
        warehouse: stockData.warehouse,
      });
      if (!existingStock) {
        const stock = new Stock(stockData);
        await stock.save();
        createdStocks.push(stock);
      } else {
        createdStocks.push(existingStock);
      }
    }
    console.log(
      `✅ ${createdStocks.length} registros de stock verificados/creados`
    );

    // 9. Resumen final
    console.log("\n" + "=".repeat(50));
    console.log("🎉 INVENTARIO SEMBRADO EXITOSAMENTE");
    console.log("=".repeat(50));

    console.log("\n📊 RESUMEN DE DATOS CREADOS:");
    console.log(`📏 Unidades: ${createdUnits.length}`);
    console.log(`🏷️ Marcas: ${createdBrands.length}`);
    console.log(`📂 Categorías: ${createdCategories.length}`);
    console.log(`🔧 Modelos: ${createdItemModels.length}`);
    console.log(`🏢 Proveedores: ${createdSuppliers.length}`);
    console.log(`🏭 Almacenes: ${createdWarehouses.length}`);
    console.log(`🔩 Repuestos: ${createdItems.length}`);
    console.log(`📦 Stock: ${createdStocks.length}`);

    console.log("\n🚀 ENDPOINTS DISPONIBLES:");
    console.log("GET /api/inventory/items - Listar repuestos");
    console.log("GET /api/inventory/stock - Ver inventario");
    console.log("GET /api/inventory/suppliers - Ver proveedores");
    console.log("GET /api/inventory/warehouses - Ver almacenes");
    console.log("GET /api/inventory/brands - Ver marcas");
    console.log("GET /api/inventory/categories - Ver categorías");

    console.log("\n💡 REPUESTOS DISPONIBLES:");
    console.log("• Filtros de aceite y aire Bosch");
    console.log("• Bujías NGK");
    console.log("• Baterías 12V");
    console.log("• Amortiguadores Monroe");

    console.log("\n✨ ¡Módulo de inventario listo para pruebas!");
  } catch (error) {
    console.error("❌ Error en seed de inventario:", error);
  } finally {
    process.exit(0);
  }
};

seedInventory();
