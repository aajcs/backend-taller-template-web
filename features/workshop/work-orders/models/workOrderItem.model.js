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
workOrderItemSchema.methods.marcarCompletado = async function (
  tiempoReal,
  usuarioId,
  notas
) {
  try {
    // Validar que no esté ya completado
    if (this.estado === "completado") {
      return {
        success: false,
        message: "El item ya está completado",
      };
    }

    // Actualizar estado y tiempo
    this.estado = "completado";
    if (tiempoReal !== undefined) {
      this.tiempoReal = tiempoReal;
    }

    // Registrar en historial
    if (usuarioId) {
      const WorkOrderHistory = require("./workOrderHistory.model");
      await WorkOrderHistory.create({
        workOrder: this.workOrder,
        tipo: "completado_item",
        descripcion: `${this.tipo === "servicio" ? "Servicio" : "Repuesto"} completado: ${this.nombre}`,
        usuario: usuarioId,
        itemAfectado: this._id,
        notas: notas || "",
        detalles: {
          tipo: this.tipo,
          nombre: this.nombre,
          tiempoEstimado: this.tiempoEstimado,
          tiempoReal: tiempoReal,
          precioTotal: this.precioTotal,
        },
        fecha: new Date(),
      });
    }

    await this.save();
    return {
      success: true,
      message: "Item marcado como completado",
    };
  } catch (error) {
    console.error("Error al marcar item como completado:", error);
    return {
      success: false,
      message: "Error interno al completar el item",
    };
  }
};

// Método para cambiar estado del item
workOrderItemSchema.methods.cambiarEstado = async function (
  nuevoEstado,
  usuarioId,
  notas
) {
  try {
    const estadosValidos = [
      "pendiente",
      "en_proceso",
      "completado",
      "cancelado",
    ];

    if (!estadosValidos.includes(nuevoEstado)) {
      return {
        success: false,
        message: `Estado '${nuevoEstado}' no válido`,
      };
    }

    // Validar transiciones de estado
    const validTransitions = {
      pendiente: ["en_proceso", "cancelado"],
      en_proceso: ["completado", "cancelado", "pendiente"],
      completado: [], // No se puede cambiar desde completado
      cancelado: ["pendiente"], // Se puede reactivar
    };

    const estadoActual = this.estado;
    const transicionesPermitidas = validTransitions[estadoActual] || [];

    if (!transicionesPermitidas.includes(nuevoEstado)) {
      return {
        success: false,
        message: `No se puede cambiar del estado '${estadoActual}' al estado '${nuevoEstado}'`,
        transicionesPermitidas,
      };
    }

    const estadoAnterior = this.estado;
    this.estado = nuevoEstado;

    // Agregar notas si se proporcionaron
    if (notas) {
      this.notas = this.notas
        ? `${this.notas}\n[${new Date().toISOString()}] ${notas}`
        : notas;
    }

    // Registrar en historial
    if (usuarioId) {
      const WorkOrderHistory = require("./workOrderHistory.model");
      await WorkOrderHistory.create({
        workOrder: this.workOrder,
        tipo: "modificado_item",
        descripcion: `Estado de ${this.tipo} cambiado: ${estadoAnterior} → ${nuevoEstado}`,
        usuario: usuarioId,
        itemAfectado: this._id,
        notas: notas || "",
        detalles: {
          tipo: this.tipo,
          nombre: this.nombre,
          estadoAnterior,
          estadoNuevo: nuevoEstado,
        },
        fecha: new Date(),
      });
    }

    await this.save();
    return {
      success: true,
      message: `Estado cambiado a ${nuevoEstado}`,
    };
  } catch (error) {
    console.error("Error al cambiar estado del item:", error);
    return {
      success: false,
      message: "Error interno al cambiar estado",
    };
  }
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

// Hook para registrar creación de item en historial
workOrderItemSchema.post("save", async function (doc) {
  if (this.isNew) {
    try {
      const WorkOrderHistory = require("./workOrderHistory.model");
      await WorkOrderHistory.create({
        workOrder: doc.workOrder,
        tipo: "agregado_item",
        descripcion: `${doc.tipo === "servicio" ? "Servicio" : "Repuesto"} agregado: ${doc.nombre}`,
        usuario: doc.createdBy,
        itemAfectado: doc._id,
        detalles: {
          tipo: doc.tipo,
          nombre: doc.nombre,
          cantidad: doc.cantidad,
          precioUnitario: doc.precioUnitario,
          precioTotal: doc.precioTotal,
        },
        fecha: new Date(),
      });
    } catch (error) {
      console.error("Error al registrar creación de item en historial:", error);
    }
  }
});

// Hook para registrar eliminación de item
workOrderItemSchema.pre("save", async function (next) {
  try {
    if (
      !this.isNew &&
      this.isModified("eliminado") &&
      this.eliminado === true
    ) {
      const WorkOrderHistory = require("./workOrderHistory.model");
      await WorkOrderHistory.create({
        workOrder: this.workOrder,
        tipo: "eliminado_item",
        descripcion: `${this.tipo === "servicio" ? "Servicio" : "Repuesto"} eliminado: ${this.nombre}`,
        usuario: this.updatedBy || this.createdBy,
        itemAfectado: this._id,
        detalles: {
          tipo: this.tipo,
          nombre: this.nombre,
          cantidad: this.cantidad,
          precioTotal: this.precioTotal,
        },
        fecha: new Date(),
      });
    }
    next();
  } catch (error) {
    console.error("Error en pre-save hook de item:", error);
    next(error);
  }
});

module.exports = model("WorkOrderItem", workOrderItemSchema);
