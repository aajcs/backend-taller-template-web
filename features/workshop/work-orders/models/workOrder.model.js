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
    if (nuevoEstadoCodigo === "CERRADA_FACTURADA") {
      this.fechaCierre = new Date();

      // Generar factura automáticamente
      try {
        const Invoice = require("../../billing/models/invoice.model");
        const WorkOrderItem = require("./workOrderItem.model");

        // Verificar que no exista ya una factura
        const existingInvoice = await Invoice.findOne({
          workOrder: this._id,
          deleted: false,
        });

        if (!existingInvoice) {
          // Obtener items de la orden
          const workOrderItems = await WorkOrderItem.find({
            workOrder: this._id,
            eliminado: false,
          })
            .populate("servicio", "nombre descripcion precioBase")
            .populate("repuesto", "nombre codigo precio");

          if (workOrderItems.length > 0) {
            // Generar número de factura usando el método del modelo existente
            const invoiceNumber = await Invoice.generateInvoiceNumber();

            // Crear factura compatible con el modelo billing
            const invoice = new Invoice({
              invoiceNumber,
              workOrder: this._id,
              customer: this.customer._id, // El modelo billing espera ObjectId de Usuario
              issueDate: new Date(),
              dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 días
              status: "emitida",
              notes: `Factura generada automáticamente al cerrar la orden ${this.numeroOrden}`,
              createdBy: usuarioId,
            });

            // Crear ítems de la factura (embebidos en la factura)
            const invoiceItems = [];
            for (const item of workOrderItems) {
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

            if (invoiceItems.length > 0) {
              // Asignar items a la factura
              invoice.items = invoiceItems;

              // Aplicar IVA (16% para Colombia)
              await invoice.applyIVA(16);

              // Guardar factura
              await invoice.save();

              // Actualizar referencia en la orden
              this.invoice = invoice._id;
            }

            // Al cerrar la OT, solo verificar que las reservas estén entregadas/consumidas
            // NO consumir automáticamente - esto se hace cuando se entrega el repuesto
            try {
              const { Reservation } = require("../../inventory/models");

              for (const item of workOrderItems) {
                if (item.tipo === "repuesto" && item.reserva) {
                  const reserva = await Reservation.findById(item.reserva);
                  if (
                    reserva &&
                    reserva.estado !== "consumido" &&
                    reserva.estado !== "entregado"
                  ) {
                    console.warn(
                      `⚠️ Advertencia: Reserva ${reserva._id} para ${item.nombre} no ha sido entregada/consumida`
                    );
                    // Opcionalmente podrías bloquear el cierre de la OT si hay reservas no entregadas
                  }
                }
              }
            } catch (verificationError) {
              console.error("Error al verificar reservas:", verificationError);
            }
          }
        }
      } catch (invoiceError) {
        console.error(
          "Error al generar factura automáticamente:",
          invoiceError
        );
        // No fallar el cambio de estado por error en facturación
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
  const auditPlugin = require("../../audit.plugin");
  workOrderSchema.plugin(auditPlugin);
} catch (error) {
  // Plugin no disponible, continuar sin él
}

module.exports = model("WorkOrder", workOrderSchema);
