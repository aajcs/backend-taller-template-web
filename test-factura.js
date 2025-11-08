require("dotenv").config();
const mongoose = require("mongoose");
const {
  WorkOrder,
  WorkOrderItem,
} = require("./features/workshop/work-orders/models");
const Invoice = require("./features/workshop/billing/models/invoice.model");
// Importar modelos necesarios para que estén registrados
require("./features/crm/customers/models/customer.model");
require("./features/crm/vehicles/models/vehicle.model");
require("./features/workshop/work-orders/models/service.model");
require("./features/workshop/work-orders/models/serviceCategory.model");
require("./features/user/user.models");

async function testFacturaAutomatica() {
  try {
    // Conectar usando la misma configuración que la app
    const clientOptions = {
      serverApi: { version: "1", strict: true, deprecationErrors: true },
    };

    await mongoose.connect(process.env.MONGODB_CNN, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });

    console.log("Conectado a MongoDB Atlas");

    // Buscar o crear una orden de trabajo para prueba
    let workOrder = await WorkOrder.findOne({
      eliminado: false,
      "estado.codigo": "LISTO_ENTREGA",
    })
      .populate("customer")
      .populate("estado");

    if (!workOrder) {
      console.log("Creando orden de trabajo de prueba...");

      // Buscar un customer existente
      const Customer = mongoose.model("Customer");
      const customer = await Customer.findOne();

      if (!customer) {
        console.log("No hay customers en la base de datos. Creando uno...");
        const newCustomer = new Customer({
          nombre: "Cliente de Prueba",
          correo: "prueba@test.com",
          telefono: "123456789",
          tipo: "persona_natural",
          estado: true,
        });
        await newCustomer.save();
        console.log("Customer creado:", newCustomer._id);
      }

      // Buscar un vehículo existente o crear uno
      const Vehicle = mongoose.model("Vehicle");
      let vehicle = await Vehicle.findOne();

      if (!vehicle) {
        console.log("No hay vehículos en la base de datos. Creando uno...");
        const VehicleModel = mongoose.model("VehicleModel");
        let vehicleModel = await VehicleModel.findOne();

        if (!vehicleModel) {
          console.log("Creando modelo de vehículo...");
          vehicleModel = new VehicleModel({
            marca: "Toyota",
            modelo: "Corolla",
            anio: 2020,
            tipo: "sedan",
          });
          await vehicleModel.save();
        }

        vehicle = new Vehicle({
          customer: customer._id,
          model: vehicleModel._id,
          placa: "ABC123",
          vin: "1HGBH41JXMN109186",
          anio: 2020,
          color: "Blanco",
          kilometraje: 50000,
        });
        await vehicle.save();
        console.log("Vehículo creado:", vehicle._id);
      }

      // Buscar estado LISTO_ENTREGA
      const WorkOrderStatus = require("./features/workshop/work-orders/models/workOrderStatus.model");
      const listoEntregaStatus = await WorkOrderStatus.findOne({
        codigo: "LISTO_ENTREGA",
      });

      if (!listoEntregaStatus) {
        console.log("Estado LISTO_ENTREGA no encontrado. Ejecutando seeder...");
        // Aquí podríamos ejecutar el seeder, pero por simplicidad crearemos manualmente
        console.log(
          "ERROR: Estados no inicializados. Ejecuta el seeder primero."
        );
        return;
      }

      // Crear orden de trabajo
      workOrder = new WorkOrder({
        numeroOrden: "OT-TEST-" + Date.now(),
        customer: customer._id,
        vehicle: vehicle._id,
        estado: listoEntregaStatus._id,
        prioridad: "normal", // Corregido: baja, normal, alta, urgente
        motivo: "Prueba de facturación automática", // Campo obligatorio
        kilometraje: 50000, // Campo obligatorio
        descripcionProblema: "Orden de prueba para facturación automática",
        sintomas: ["Prueba de facturación"],
        tecnicoAsignado: customer._id, // Usando customer como técnico para simplificar
      });

      await workOrder.save();
      console.log("Orden de trabajo creada:", workOrder.numeroOrden);

      // Crear items para la orden
      // Primero crear un servicio básico
      const Service = mongoose.model("Service");
      let service = await Service.findOne();

      if (!service) {
        console.log("Creando servicio de prueba...");
        // Crear categoría de servicio primero
        const ServiceCategory = mongoose.model("ServiceCategory");
        let category = await ServiceCategory.findOne();

        if (!category) {
          category = new ServiceCategory({
            nombre: "Categoría de Prueba",
            descripcion: "Categoría para pruebas",
          });
          await category.save();
        }

        service = new Service({
          nombre: "Servicio de Prueba",
          descripcion: "Servicio para prueba de facturación",
          codigo: "TEST-SRV",
          categoria: category._id,
          precioBase: 100000,
          tiempoEstimadoMinutos: 60,
        });
        await service.save();
      }

      const workOrderItem = new WorkOrderItem({
        workOrder: workOrder._id,
        tipo: "servicio",
        servicio: service._id,
        nombre: "Servicio de prueba",
        descripcion: "Servicio para prueba de facturación",
        cantidad: 1,
        precioUnitario: 100000,
        precioTotal: 100000,
        estado: "completado",
        tiempoEstimado: 60,
        notas: "Item creado para prueba de facturación",
      });

      await workOrderItem.save();
      console.log("Item de orden creado");

      // Recargar la orden con populate
      workOrder = await WorkOrder.findById(workOrder._id)
        .populate("customer")
        .populate("estado");
    }

    console.log("Orden encontrada:", {
      id: workOrder._id,
      numero: workOrder.numeroOrden,
      estado: workOrder.estado?.codigo,
      customer: workOrder.customer?.nombre,
    });

    // Verificar si ya tiene items
    const items = await WorkOrderItem.find({
      workOrder: workOrder._id,
      eliminado: false,
    });

    console.log(`La orden tiene ${items.length} items`);

    if (items.length === 0) {
      console.log("La orden no tiene items, creando uno de prueba...");

      // Crear un item de prueba
      const testItem = new WorkOrderItem({
        workOrder: workOrder._id,
        tipo: "servicio",
        nombre: "Servicio de prueba",
        cantidad: 1,
        precioUnitario: 100000,
        estado: "completado",
        notas: "Item creado para prueba de facturación",
      });

      await testItem.save();
      console.log("Item de prueba creado");
    }

    // Intentar cambiar el estado a CERRADA_FACTURADA
    console.log("Cambiando estado a CERRADA_FACTURADA...");

    // Si ya está en estado final, primero cambiar a un estado anterior
    if (workOrder.estado?.codigo === "CERRADA_FACTURADA") {
      console.log(
        "La orden ya está en estado final. Cambiando primero a LISTO_ENTREGA..."
      );
      const resetResult = await workOrder.cambiarEstado(
        "LISTO_ENTREGA",
        workOrder.customer._id,
        "Reset para prueba de facturación"
      );
      console.log("Resultado del reset:", resetResult);
    }

    const result = await workOrder.cambiarEstado(
      "CERRADA_FACTURADA",
      workOrder.customer._id,
      "Prueba de facturación automática"
    );
    console.log("Resultado del cambio de estado:", result);

    if (result.success) {
      // Verificar si se creó la factura
      const invoice = await Invoice.findOne({
        workOrder: workOrder._id,
        deleted: false,
      });

      if (invoice) {
        console.log("Factura creada exitosamente:", {
          numero: invoice.invoiceNumber,
          total: invoice.total,
          items: invoice.items?.length || 0,
        });
      } else {
        console.log("ERROR: No se creó la factura");
      }
    }
  } catch (error) {
    console.error("Error en la prueba:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Desconectado de MongoDB");
  }
}

testFacturaAutomatica();
