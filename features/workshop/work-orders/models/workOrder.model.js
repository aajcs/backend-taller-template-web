/**
 * WorkOrder Model
 * Modelo principal para Órdenes de Trabajo
 *
 * Cubre RF-11, RF-12, RF-13, RF-16
 */

const { Schema, model } = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const workOrderSchema = new Schema(
  {
    // Número de orden único
    numeroOrden: {
      type: String,
      unique: true,
      trim: true,
    },

    // RF-11: Vinculación a cliente y vehículo existentes
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "El cliente es obligatorio"],
    },

    vehicle: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
      required: [true, "El vehículo es obligatorio"],
    },

    // RF-12: Información básica de la OT
    fechaApertura: {
      type: Date,
      default: Date.now,
      required: [true, "La fecha de apertura es obligatoria"],
    },

    motivo: {
      type: String,
      required: [true, "El motivo de la visita es obligatorio"],
      trim: true,
      maxlength: [500, "El motivo no puede exceder 500 caracteres"],
    },

    kilometraje: {
      type: Number,
      required: [true, "El kilometraje es obligatorio"],
      min: [0, "El kilometraje debe ser mayor o igual a 0"],
    },

    tecnicoAsignado: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El técnico asignado es obligatorio"],
    },

    // RF-13: Estados de la OT (referencia a WorkOrderStatus)
    estado: {
      type: Schema.Types.ObjectId,
      ref: "WorkOrderStatus",
      required: [true, "El estado es obligatorio"],
    },

    // Información adicional
    prioridad: {
      type: String,
      enum: ["baja", "normal", "alta", "urgente"],
      default: "normal",
    },

    descripcionProblema: {
      type: String,
      trim: true,
      maxlength: [1000, "La descripción no puede exceder 1000 caracteres"],
    },

    diagnostico: {
      type: String,
      trim: true,
      maxlength: [1000, "El diagnóstico no puede exceder 1000 caracteres"],
    },

    observaciones: {
      type: String,
      trim: true,
      maxlength: [500, "Las observaciones no pueden exceder 500 caracteres"],
    },

    // RF-16: Información de costos
    subtotalRepuestos: {
      type: Number,
      default: 0,
      min: [0, "El subtotal de repuestos no puede ser negativo"],
    },

    subtotalServicios: {
      type: Number,
      default: 0,
      min: [0, "El subtotal de servicios no puede ser negativo"],
    },

    descuento: {
      type: Number,
      default: 0,
      min: [0, "El descuento no puede ser negativo"],
    },

    impuesto: {
      type: Number,
      default: 0,
      min: [0, "El impuesto no puede ser negativo"],
    },

    costoTotal: {
      type: Number,
      default: 0,
      min: [0, "El costo total no puede ser negativo"],
    },

    // Fechas importantes
    fechaEstimadaEntrega: {
      type: Date,
    },

    fechaRealEntrega: {
      type: Date,
    },

    fechaCierre: {
      type: Date,
    },

    // Información de facturación
    invoice: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
    },

    // NUEVO: Gestión de bahías de servicio
    serviceBay: {
      type: Schema.Types.ObjectId,
      ref: "ServiceBay",
    },

    // NUEVO: Referencias a asignaciones de técnicos
    assignments: [
      {
        type: Schema.Types.ObjectId,
        ref: "WorkOrderAssignment",
      },
    ],

    // NUEVO: Tiempo total trabajado (suma de todos los técnicos)
    totalHoursWorked: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Auditoría
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // Eliminación lógica
    eliminado: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Campo virtual para items (relación con WorkOrderItem)
workOrderSchema.virtual("items", {
  ref: "WorkOrderItem",
  localField: "_id",
  foreignField: "workOrder",
  match: { eliminado: false }, // Solo items no eliminados
});

// Índices para optimización
workOrderSchema.index({ numeroOrden: 1 }, { unique: true, sparse: true });
workOrderSchema.index({ customer: 1, vehicle: 1 });
workOrderSchema.index({ estado: 1 });
workOrderSchema.index({ tecnicoAsignado: 1 });
workOrderSchema.index({ fechaApertura: -1 });

// Método para calcular costo total automáticamente
workOrderSchema.methods.calcularCostoTotal = function () {
  // Inicializar campos si son undefined
  this.subtotalRepuestos = this.subtotalRepuestos || 0;
  this.subtotalServicios = this.subtotalServicios || 0;
  this.descuento = this.descuento || 0;
  this.impuesto = this.impuesto || 0;

  this.costoTotal =
    this.subtotalRepuestos +
    this.subtotalServicios -
    this.descuento +
    this.impuesto;
  return this.costoTotal;
};

// Método para calcular costos desde los items de la orden
workOrderSchema.methods.calcularCostosDesdeItems = async function () {
  try {
    const WorkOrderItem = require("./workOrderItem.model");

    // Obtener todos los items no eliminados de esta orden
    const items = await WorkOrderItem.find({
      workOrder: this._id,
      eliminado: false,
    });

    // Calcular subtotales
    let subtotalRepuestos = 0;
    let subtotalServicios = 0;

    for (const item of items) {
      if (item.tipo === "repuesto") {
        subtotalRepuestos += item.precioFinal;
      } else if (item.tipo === "servicio") {
        subtotalServicios += item.precioFinal;
      }
    }

    // Actualizar los campos
    this.subtotalRepuestos = subtotalRepuestos;
    this.subtotalServicios = subtotalServicios;

    // Calcular costo total
    this.calcularCostoTotal();

    return {
      subtotalRepuestos: this.subtotalRepuestos,
      subtotalServicios: this.subtotalServicios,
      descuento: this.descuento,
      impuesto: this.impuesto,
      costoTotal: this.costoTotal,
    };
  } catch (error) {
    console.error("Error al calcular costos desde items:", error);
    throw error;
  }
};

// Método para cambiar estado con validaciones
workOrderSchema.methods.cambiarEstado = async function (
  nuevoEstadoCodigo,
  usuarioId,
  notas = ""
) {
  console.log(
    `🚀 INICIO cambiarEstado: nuevoEstadoCodigo='${nuevoEstadoCodigo}', usuarioId='${usuarioId}'`
  );
  const WorkOrderStatus = require("./workOrderStatus.model");
  const WorkOrderHistory = require("./workOrderHistory.model");

  try {
    // Buscar el nuevo estado por código
    const nuevoEstado = await WorkOrderStatus.findOne({
      codigo: nuevoEstadoCodigo,
      activo: true,
    });

    if (!nuevoEstado) {
      return {
        success: false,
        message: `Estado '${nuevoEstadoCodigo}' no válido o inactivo`,
      };
    }

    console.log(
      `✅ Estado encontrado: ${nuevoEstado.nombre} (código: ${nuevoEstado.codigo})`
    );

    // Obtener el estado actual
    const estadoActual = await WorkOrderStatus.findById(this.estado);
    if (!estadoActual) {
      return {
        success: false,
        message: "Estado actual no encontrado",
      };
    }

    // Validar que el estado actual no sea final
    if (estadoActual.tipo === "final") {
      return {
        success: false,
        message: `No se puede cambiar de un estado final (${estadoActual.nombre})`,
      };
    }

    // Validar transición permitida
    if (
      !estadoActual.transicionesPermitidas.includes(nuevoEstadoCodigo) &&
      nuevoEstadoCodigo !== "CANCELADA"
    ) {
      return {
        success: false,
        message: `No se puede cambiar del estado '${estadoActual.nombre}' al estado '${nuevoEstado.nombre}'`,
      };
    }

    // Guardar en historial
    await WorkOrderHistory.create({
      workOrder: this._id,
      tipo: "cambio_estado",
      descripcion: `Estado cambiado de '${estadoActual.nombre}' a '${nuevoEstado.nombre}'`,
      estadoAnterior: estadoActual._id,
      estadoNuevo: nuevoEstado._id,
      usuario: usuarioId,
      notas,
      fecha: new Date(),
    });

    // Actualizar el estado
    this.estado = nuevoEstado._id;

    // Actualizar fechas según el estado
    console.log(
      `🔍 Verificando condición FACTURADO: nuevoEstadoCodigo='${nuevoEstadoCodigo}' === 'FACTURADO'? ${nuevoEstadoCodigo === "FACTURADO"}`
    );
    if (nuevoEstadoCodigo === "FACTURADO") {
      console.log(
        "🎯 Estado FACTURADO detectado - iniciando generación de factura"
      );
      this.fechaCierre = new Date();

      // Generar factura automáticamente
      try {
        console.log("🔄 Iniciando generación automática de factura...");
        const Invoice = require("../../billing/models/invoice.model");
        const WorkOrderItem = require("./workOrderItem.model");

        // Verificar que no exista ya una factura
        const existingInvoice = await Invoice.findOne({
          workOrder: this._id,
          deleted: false,
        });

        if (!existingInvoice) {
          console.log("📋 Buscando items de la orden...");
          // Obtener items de la orden
          const workOrderItems = await WorkOrderItem.find({
            workOrder: this._id,
            eliminado: false,
          })
            .populate("servicio", "nombre descripcion precioBase")
            .populate("repuesto", "nombre codigo precio");

          console.log(
            `📦 Encontrados ${workOrderItems.length} items en la orden`
          );

          // DEBUG: Mostrar estado de cada item
          workOrderItems.forEach((item, index) => {
            console.log(
              `   Item ${index + 1}: ${item.nombre} - Estado: ${item.estado}`
            );
          });

          if (workOrderItems.length > 0) {
            // Filtrar solo items completados
            const completedItems = workOrderItems.filter(
              (item) => item.estado === "completado"
            );
            console.log(
              `✅ Items completados: ${completedItems.length} de ${workOrderItems.length}`
            );

            if (completedItems.length > 0) {
              // Generar número de factura usando el método del modelo existente
              console.log("🔢 Generando número de factura...");
              const invoiceNumber = await Invoice.generateInvoiceNumber();
              console.log(`📄 Número de factura generado: ${invoiceNumber}`);

              // Crear factura compatible con el modelo billing
              console.log("📝 Creando factura...");
              console.log(`👤 Customer ID: ${this.customer}`);
              const invoice = new Invoice({
                invoiceNumber,
                workOrder: this._id,
                customer: this.customer, // El modelo billing espera ObjectId de Customer
                issueDate: new Date(),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
                status: "emitida",
                notes: `Factura generada automáticamente al cerrar la orden ${this.numeroOrden}`,
                createdBy: usuarioId,
              });

              // Crear ítems de la factura (embebidos en la factura)
              const invoiceItems = [];
              for (const item of completedItems) {
                if (item.estado === "completado") {
                  // Solo items completados
                  invoiceItems.push({
                    type: item.tipo === "servicio" ? "service" : "part", // Mapear tipos
                    service: item.servicio?._id,
                    part: item.repuesto?._id,
                    description:
                      item.nombre ||
                      (item.servicio
                        ? item.servicio.nombre
                        : item.repuesto.nombre),
                    quantity: item.cantidad,
                    unitPrice: item.precioUnitario,
                    subtotal: item.cantidad * item.precioUnitario, // Calcular subtotal
                    notes: item.notas,
                  });
                }
              }

              console.log(
                `📋 ${invoiceItems.length} items preparados para factura`
              );

              if (invoiceItems.length > 0) {
                // Asignar items a la factura
                invoice.items = invoiceItems;

                // Aplicar IVA (16% para Colombia)
                console.log("💰 Aplicando IVA...");
                await invoice.applyIVA(16);

                // Guardar factura
                console.log("💾 Guardando factura...");
                await invoice.save();
                console.log(
                  `✅ Factura guardada exitosamente: ${invoice.invoiceNumber}`
                );
              } else {
                console.log("⚠️ No hay items válidos para crear factura");
              }
            } else {
              console.log("⚠️ No hay items completados para facturar");
            }
          } else {
            console.log("⚠️ No se encontraron items en la orden de trabajo");
          }
        } else {
          console.log("⚠️ Ya existe una factura para esta orden de trabajo");
        }
      } catch (error) {
        console.error("❌ Error en generación automática de factura:", error);
        // No fallar la operación si hay error en facturación
      }
    }

    // Liberar reservas si la orden se cancela
    if (nuevoEstadoCodigo === "CANCELADA") {
      try {
        const WorkOrderItem = require("./workOrderItem.model");
        const { Reservation } = require("../../inventory/models");

        // Obtener items de repuestos con reservas activas
        const workOrderItems = await WorkOrderItem.find({
          workOrder: this._id,
          tipo: "repuesto",
          reserva: { $exists: true, $ne: null },
          eliminado: false,
        });

        for (const item of workOrderItems) {
          // Marcar reserva como liberada
          await Reservation.findByIdAndUpdate(item.reserva, {
            estado: "liberado",
          });
        }
      } catch (cancelError) {
        console.error("Error al liberar reservas:", cancelError);
        // No fallar el cambio de estado por error en liberación de reservas
      }
    }

    await this.save();

    return {
      success: true,
      message: `Estado cambiado de '${estadoActual.nombre}' a '${nuevoEstado.nombre}'`,
      estadoAnterior: estadoActual,
      estadoNuevo: nuevoEstado,
    };
  } catch (error) {
    return {
      success: false,
      message: `Error al cambiar estado: ${error.message}`,
    };
  }
};

// Virtual para obtener el tiempo transcurrido
workOrderSchema.virtual("diasTranscurridos").get(function () {
  const fechaInicio = this.fechaApertura;
  const fechaFin = this.fechaCierre || new Date();
  const diffTime = Math.abs(fechaFin - fechaInicio);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Plugin de paginación
workOrderSchema.plugin(mongoosePaginate);

// Plugin de auditoría (si existe)
try {
  const auditPlugin = require("../../models/plugins/audit");
  workOrderSchema.plugin(auditPlugin);
} catch (error) {
  // Plugin no disponible, continuar sin él
}

// Hook para registrar creación de orden en historial
workOrderSchema.post("save", async function (doc) {
  // Solo registrar si es una creación nueva (no actualización)
  if (this.isNew) {
    try {
      const WorkOrderHistory = require("./workOrderHistory.model");
      await WorkOrderHistory.create({
        workOrder: doc._id,
        tipo: "creacion_ot",
        descripcion: `Orden de trabajo ${doc.numeroOrden} creada`,
        usuario: doc.createdBy,
        detalles: {
          customer: doc.customer,
          vehicle: doc.vehicle,
          priority: doc.prioridad,
          motivo: doc.motivo,
        },
        fecha: new Date(),
      });
    } catch (error) {
      console.error("Error al registrar creación en historial:", error);
    }
  }
});

// Hook para registrar cambios en campos importantes
workOrderSchema.pre("save", async function (next) {
  try {
    // Solo procesar si no es una creación nueva
    if (!this.isNew) {
      const WorkOrderHistory = require("./workOrderHistory.model");
      const User = require("../../../user/user.models");

      // Obtener documento original
      const original = await this.constructor.findById(this._id);

      if (original) {
        // Registrar cambio de técnico asignado
        if (
          this.tecnicoAsignado?.toString() !==
          original.tecnicoAsignado?.toString()
        ) {
          const tecnicoAnterior = original.tecnicoAsignado
            ? await User.findById(original.tecnicoAsignado)
            : null;
          const tecnicoNuevo = this.tecnicoAsignado
            ? await User.findById(this.tecnicoAsignado)
            : null;

          await WorkOrderHistory.create({
            workOrder: this._id,
            tipo: "asignacion_tecnico",
            descripcion: `Técnico asignado cambiado`,
            usuario: this.updatedBy || this.createdBy,
            tecnicoAnterior: tecnicoAnterior?._id,
            tecnicoNuevo: tecnicoNuevo?._id,
            detalles: {
              tecnicoAnterior: tecnicoAnterior
                ? `${tecnicoAnterior.nombre} ${tecnicoAnterior.apellido || ""}`.trim()
                : null,
              tecnicoNuevo: tecnicoNuevo
                ? `${tecnicoNuevo.nombre} ${tecnicoNuevo.apellido || ""}`.trim()
                : null,
            },
            fecha: new Date(),
          });
        }

        // Registrar cambio de prioridad
        if (this.prioridad !== original.prioridad) {
          await WorkOrderHistory.create({
            workOrder: this._id,
            tipo: "actualizacion_costos",
            descripcion: `Prioridad cambiada de '${original.prioridad}' a '${this.prioridad}'`,
            usuario: this.updatedBy || this.createdBy,
            detalles: {
              campo: "prioridad",
              valorAnterior: original.prioridad,
              valorNuevo: this.prioridad,
            },
            fecha: new Date(),
          });
        }

        // Registrar actualización de costos
        if (this.costoTotal !== original.costoTotal) {
          await WorkOrderHistory.create({
            workOrder: this._id,
            tipo: "actualizacion_costos",
            descripcion: `Costo total actualizado: $${original.costoTotal || 0} → $${this.costoTotal || 0}`,
            usuario: this.updatedBy || this.createdBy,
            detalles: {
              costoAnterior: original.costoTotal,
              costoNuevo: this.costoTotal,
              subtotalServicios: this.subtotalServicios,
              subtotalRepuestos: this.subtotalRepuestos,
              descuento: this.descuento,
              impuesto: this.impuesto,
            },
            fecha: new Date(),
          });
        }
      }
    }
    next();
  } catch (error) {
    console.error("Error en pre-save hook:", error);
    next(error);
  }
});

module.exports = model("WorkOrder", workOrderSchema);
