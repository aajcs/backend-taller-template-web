/**
 * WorkOrderItem Model
 * Modelo para items de Órdenes de Trabajo (repuestos y servicios)
 *
 * Cubre RF-14, RF-15
 */

const { Schema, model } = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const workOrderItemSchema = new Schema(
  {
    // Referencia a la orden de trabajo
    workOrder: {
      type: Schema.Types.ObjectId,
      ref: "WorkOrder",
      required: [true, "La orden de trabajo es obligatoria"],
    },

    // Tipo de item (repuesto o servicio)
    tipo: {
      type: String,
      enum: {
        values: ["repuesto", "servicio"],
        message: "Tipo de item no válido",
      },
      required: [true, "El tipo de item es obligatorio"],
    },

    // Para repuestos (RF-14)
    repuesto: {
      type: Schema.Types.ObjectId,
      ref: "Item", // Referencia al módulo de inventario
      required: function () {
        return this.tipo === "repuesto";
      },
    },

    // Para servicios (RF-15)
    servicio: {
      type: Schema.Types.ObjectId,
      ref: "Service",
      required: function () {
        return this.tipo === "servicio";
      },
    },

    // Información del item
    nombre: {
      type: String,
      required: [true, "El nombre del item es obligatorio"],
      trim: true,
      maxlength: [200, "El nombre no puede exceder 200 caracteres"],
    },

    descripcion: {
      type: String,
      trim: true,
      maxlength: [500, "La descripción no puede exceder 500 caracteres"],
    },

    // Cantidad y precios
    cantidad: {
      type: Number,
      required: [true, "La cantidad es obligatoria"],
      min: [0.01, "La cantidad debe ser mayor a 0"],
    },

    precioUnitario: {
      type: Number,
      required: [true, "El precio unitario es obligatorio"],
      min: [0, "El precio unitario no puede ser negativo"],
    },

    precioTotal: {
      type: Number,
      default: function () {
        return this.cantidad * this.precioUnitario;
      },
      min: [0, "El precio total no puede ser negativo"],
    },

    // Descuentos aplicables
    descuento: {
      type: Number,
      default: 0,
      min: [0, "El descuento no puede ser negativo"],
    },

    precioFinal: {
      type: Number,
      default: function () {
        return this.precioTotal - this.descuento;
      },
      min: [0, "El precio final no puede ser negativo"],
    },

    // Información adicional para repuestos
    numeroParte: {
      type: String,
      trim: true,
      maxlength: [50, "El número de parte no puede exceder 50 caracteres"],
    },

    reserva: {
      type: Schema.Types.ObjectId,
      ref: "Reservation",
    },

    ubicacionInstalacion: {
      type: String,
      trim: true,
      maxlength: [
        100,
        "La ubicación de instalación no puede exceder 100 caracteres",
      ],
    },

    // Información adicional para servicios
    tiempoEstimado: {
      type: Number, // En minutos
      min: [0, "El tiempo estimado no puede ser negativo"],
    },

    tiempoReal: {
      type: Number, // En minutos
      min: [0, "El tiempo real no puede ser negativo"],
    },

    // Estado del item
    estado: {
      type: String,
      enum: {
        values: ["pendiente", "en_proceso", "completado", "cancelado"],
        message: "Estado de item no válido",
      },
      default: "pendiente",
    },

    // Notas adicionales
    notas: {
      type: String,
      trim: true,
      maxlength: [300, "Las notas no pueden exceder 300 caracteres"],
    },

    // Eliminación lógica
    eliminado: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

// Índices para optimización
workOrderItemSchema.index({ workOrder: 1 });
workOrderItemSchema.index({ tipo: 1 });
workOrderItemSchema.index({ repuesto: 1 }, { sparse: true });
workOrderItemSchema.index({ servicio: 1 }, { sparse: true });
workOrderItemSchema.index({ estado: 1 });

// Método para recalcular precios
workOrderItemSchema.methods.recalcularPrecios = function () {
  this.precioTotal = this.cantidad * this.precioUnitario;
  this.precioFinal = this.precioTotal - this.descuento;
  return this.precioFinal;
};

// Método para marcar como completado
workOrderItemSchema.methods.marcarCompletado = function (tiempoReal) {
  this.estado = "completado";
  if (tiempoReal !== undefined) {
    this.tiempoReal = tiempoReal;
  }
  return this.save();
};

// Método para cancelar item
workOrderItemSchema.methods.cancelar = function () {
  this.estado = "cancelado";
  return this.save();
};

// Pre-save middleware para calcular precios automáticamente
workOrderItemSchema.pre("save", function (next) {
  if (
    this.isModified("cantidad") ||
    this.isModified("precioUnitario") ||
    this.isModified("descuento")
  ) {
    this.recalcularPrecios();
  }
  next();
});

// Plugin de paginación
workOrderItemSchema.plugin(mongoosePaginate);

// Plugin de auditoría (si existe)
try {
  const auditPlugin = require("../../audit.plugin");
  workOrderItemSchema.plugin(auditPlugin);
} catch (error) {
  // Plugin no disponible, continuar sin él
}

module.exports = model("WorkOrderItem", workOrderItemSchema);
