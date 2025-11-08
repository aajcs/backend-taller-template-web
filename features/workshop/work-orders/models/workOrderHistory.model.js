/**
 * WorkOrderHistory Model
 * Modelo para historial de cambios en Órdenes de Trabajo
 *
 * Proporciona tracking completo de actividades y cambios de estado
 */

const { Schema, model } = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const workOrderHistorySchema = new Schema(
  {
    // Referencia a la orden de trabajo
    workOrder: {
      type: Schema.Types.ObjectId,
      ref: "WorkOrder",
      required: [true, "La orden de trabajo es obligatoria"],
    },

    // Tipo de actividad/evento
    tipo: {
      type: String,
      enum: {
        values: [
          "creacion_ot",
          "cambio_estado",
          "asignacion_tecnico",
          "agregado_item",
          "modificado_item",
          "eliminado_item",
          "actualizacion_costos",
          "comentario",
          "adjunto_archivo",
          "aprobacion_cliente",
          "diagnostico",
          "completado_item",
          "facturacion",
          "cierre_ot",
        ],
        message: "Tipo de actividad no válido",
      },
      required: [true, "El tipo de actividad es obligatorio"],
    },

    // Descripción de la actividad
    descripcion: {
      type: String,
      required: [true, "La descripción es obligatoria"],
      trim: true,
      maxlength: [500, "La descripción no puede exceder 500 caracteres"],
    },

    // Usuario que realizó la actividad
    usuario: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El usuario es obligatorio"],
    },

    // Información detallada del cambio (JSON)
    detalles: {
      type: Schema.Types.Mixed, // Permite objetos complejos
    },

    // Información específica según el tipo de actividad
    estadoAnterior: {
      type: Schema.Types.ObjectId,
      ref: "WorkOrderStatus",
    },

    estadoNuevo: {
      type: Schema.Types.ObjectId,
      ref: "WorkOrderStatus",
    },

    // Notas adicionales sobre el cambio
    notas: {
      type: String,
      trim: true,
      maxlength: [500, "Las notas no pueden exceder 500 caracteres"],
    },

    // Fecha del evento
    fecha: {
      type: Date,
      default: Date.now,
    },

    tecnicoAnterior: {
      type: Schema.Types.ObjectId,
      ref: "Usuario",
    },

    tecnicoNuevo: {
      type: Schema.Types.ObjectId,
      ref: "Usuario",
    },

    itemAfectado: {
      type: Schema.Types.ObjectId,
      ref: "WorkOrderItem",
    },

    // Archivos adjuntos (si aplica)
    archivosAdjuntos: [
      {
        nombre: {
          type: String,
          trim: true,
          maxlength: [
            100,
            "El nombre del archivo no puede exceder 100 caracteres",
          ],
        },
        url: {
          type: String,
          trim: true,
        },
        tipo: {
          type: String,
          trim: true,
          maxlength: [50, "El tipo de archivo no puede exceder 50 caracteres"],
        },
      },
    ],

    // Información de tiempo y costos (si aplica)
    tiempoInvertido: {
      type: Number, // En minutos
      min: [0, "El tiempo invertido no puede ser negativo"],
    },

    costoAdicional: {
      type: Number,
      default: 0,
      min: [0, "El costo adicional no puede ser negativo"],
    },

    // Notas adicionales
    notas: {
      type: String,
      trim: true,
      maxlength: [300, "Las notas no pueden exceder 300 caracteres"],
    },

    // Metadata adicional
    ipAddress: {
      type: String,
      trim: true,
    },

    userAgent: {
      type: String,
      trim: true,
    },

    // Para eliminación lógica (aunque el historial normalmente no se elimina)
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
workOrderHistorySchema.index({ workOrder: 1, createdAt: -1 });
workOrderHistorySchema.index({ tipo: 1 });
workOrderHistorySchema.index({ usuario: 1 });
workOrderHistorySchema.index({ createdAt: -1 });

// Método para crear entrada de cambio de estado
workOrderHistorySchema.statics.registrarCambioEstado = async function (
  workOrderId,
  estadoAnterior,
  estadoNuevo,
  usuarioId,
  notas = null
) {
  const entrada = new this({
    workOrder: workOrderId,
    tipo: "cambio_estado",
    descripcion: `Cambio de estado: ${estadoAnterior} → ${estadoNuevo}`,
    usuario: usuarioId,
    detalles: {
      estadoAnterior,
      estadoNuevo,
      timestamp: new Date(),
    },
    estadoAnterior,
    estadoNuevo,
    notas,
  });

  return entrada.save();
};

// Método para registrar asignación de técnico
workOrderHistorySchema.statics.registrarAsignacionTecnico = async function (
  workOrderId,
  tecnicoAnterior,
  tecnicoNuevo,
  usuarioId
) {
  const entrada = new this({
    workOrder: workOrderId,
    tipo: "asignacion_tecnico",
    descripcion: `Reasignación de técnico: ${tecnicoAnterior ? "Técnico anterior" : "Sin asignar"} → Técnico nuevo`,
    usuario: usuarioId,
    detalles: {
      tecnicoAnterior,
      tecnicoNuevo,
      timestamp: new Date(),
    },
    tecnicoAnterior,
    tecnicoNuevo,
  });

  return entrada.save();
};

// Método para registrar actividad general
workOrderHistorySchema.statics.registrarActividad = async function (
  workOrderId,
  tipo,
  descripcion,
  usuarioId,
  detalles = {},
  notas = null
) {
  const entrada = new this({
    workOrder: workOrderId,
    tipo,
    descripcion,
    usuario: usuarioId,
    detalles: {
      ...detalles,
      timestamp: new Date(),
    },
    notas,
  });

  return entrada.save();
};

// Método para obtener historial completo de una OT
workOrderHistorySchema.statics.getHistorialCompleto = function (workOrderId) {
  return this.find({
    workOrder: workOrderId,
    eliminado: false,
  })
    .populate("usuario", "nombre email")
    .populate("tecnicoAnterior", "nombre")
    .populate("tecnicoNuevo", "nombre")
    .populate("itemAfectado", "nombre tipo")
    .sort({ createdAt: -1 });
};

// Método para obtener estadísticas de actividades
workOrderHistorySchema.statics.getEstadisticasActividades = function (
  workOrderId
) {
  return this.aggregate([
    { $match: { workOrder: workOrderId, eliminado: false } },
    {
      $group: {
        _id: "$tipo",
        count: { $sum: 1 },
        ultimoRegistro: { $max: "$createdAt" },
      },
    },
    { $sort: { count: -1 } },
  ]);
};

// Método para obtener tiempo total invertido
workOrderHistorySchema.statics.getTiempoTotalInvertido = function (
  workOrderId
) {
  return this.aggregate([
    {
      $match: {
        workOrder: workOrderId,
        eliminado: false,
        tiempoInvertido: { $exists: true, $ne: null },
      },
    },
    {
      $group: {
        _id: null,
        tiempoTotal: { $sum: "$tiempoInvertido" },
      },
    },
  ]);
};

// Plugin de paginación
workOrderHistorySchema.plugin(mongoosePaginate);

// Plugin de auditoría (si existe)
try {
  const auditPlugin = require("../../audit.plugin");
  workOrderHistorySchema.plugin(auditPlugin);
} catch (error) {
  // Plugin no disponible, continuar sin él
}

module.exports = model("WorkOrderHistory", workOrderHistorySchema);
