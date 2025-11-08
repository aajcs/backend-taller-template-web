/**
 * WorkOrderStatus Model
 * Modelo para estados de Órdenes de Trabajo
 *
 * Cubre RF-13
 */

const { Schema, model } = require("mongoose");

const workOrderStatusSchema = new Schema(
  {
    // Identificador único del estado
    codigo: {
      type: String,
      required: [true, "El código del estado es obligatorio"],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [20, "El código no puede exceder 20 caracteres"],
      match: [
        /^[A-Z_]+$/,
        "El código solo puede contener letras mayúsculas y guiones bajos",
      ],
    },

    // Nombre descriptivo
    nombre: {
      type: String,
      required: [true, "El nombre del estado es obligatorio"],
      trim: true,
      maxlength: [50, "El nombre no puede exceder 50 caracteres"],
    },

    // Descripción del estado
    descripcion: {
      type: String,
      trim: true,
      maxlength: [200, "La descripción no puede exceder 200 caracteres"],
    },

    // Color para UI (opcional)
    color: {
      type: String,
      trim: true,
      maxlength: [
        7,
        "El color debe ser un código hexadecimal válido (#RRGGBB)",
      ],
      match: [
        /^#[0-9A-Fa-f]{6}$/,
        "El color debe ser un código hexadecimal válido",
      ],
    },

    // Icono para UI (opcional)
    icono: {
      type: String,
      trim: true,
      maxlength: [50, "El icono no puede exceder 50 caracteres"],
    },

    // Orden de aparición en listas
    orden: {
      type: Number,
      default: 0,
      min: [0, "El orden debe ser mayor o igual a 0"],
    },

    // Tipo de estado
    tipo: {
      type: String,
      enum: {
        values: ["inicial", "intermedio", "final"],
        message: "Tipo de estado no válido",
      },
      default: "intermedio",
    },

    // Estados siguientes permitidos (transiciones válidas)
    transicionesPermitidas: [
      {
        type: String,
        uppercase: true,
        trim: true,
      },
    ],

    // Configuración adicional
    requiereAprobacion: {
      type: Boolean,
      default: false,
    },

    requiereDocumentacion: {
      type: Boolean,
      default: false,
    },

    notificarCliente: {
      type: Boolean,
      default: false,
    },

    notificarTecnico: {
      type: Boolean,
      default: true,
    },

    tiempoEstimadoHoras: {
      type: Number,
      min: [0, "El tiempo estimado no puede ser negativo"],
    },

    // Estado del registro
    activo: {
      type: Boolean,
      default: true,
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
workOrderStatusSchema.index({ codigo: 1 }, { unique: true });
workOrderStatusSchema.index({ orden: 1 });
workOrderStatusSchema.index({ tipo: 1 });
workOrderStatusSchema.index({ activo: 1 });

// Método para verificar si una transición es válida
workOrderStatusSchema.methods.puedeTransitarA = function (codigoDestino) {
  return this.transicionesPermitidas.includes(codigoDestino.toUpperCase());
};

// Método para obtener estados siguientes disponibles
workOrderStatusSchema.statics.getEstadosSiguientes = async function (
  codigoActual
) {
  const estadoActual = await this.findOne({
    codigo: codigoActual.toUpperCase(),
    activo: true,
    eliminado: false,
  });

  if (!estadoActual) {
    return [];
  }

  const estadosSiguientes = await this.find({
    codigo: { $in: estadoActual.transicionesPermitidas },
    activo: true,
    eliminado: false,
  }).sort({ orden: 1 });

  return estadosSiguientes;
};

// Método para obtener todos los estados activos ordenados
workOrderStatusSchema.statics.getEstadosActivos = function () {
  return this.find({
    activo: true,
    eliminado: false,
  }).sort({ orden: 1 });
};

// Método para validar configuración de estados
workOrderStatusSchema.statics.validarConfiguracionEstados = async function () {
  const estados = await this.find({ activo: true, eliminado: false });

  // Verificar que existe al menos un estado inicial
  const estadoInicial = estados.find((e) => e.tipo === "inicial");
  if (!estadoInicial) {
    throw new Error("Debe existir al menos un estado inicial");
  }

  // Verificar que existe al menos un estado final
  const estadoFinal = estados.find((e) => e.tipo === "final");
  if (!estadoFinal) {
    throw new Error("Debe existir al menos un estado final");
  }

  // Verificar que las transiciones referencian estados existentes
  for (const estado of estados) {
    for (const transicion of estado.transicionesPermitidas) {
      const estadoDestino = estados.find((e) => e.codigo === transicion);
      if (!estadoDestino) {
        throw new Error(
          `El estado '${estado.nombre}' referencia una transición inválida: '${transicion}'`
        );
      }
    }
  }

  return true;
};

// Plugin de auditoría (si existe)
try {
  const auditPlugin = require("../../audit.plugin");
  workOrderStatusSchema.plugin(auditPlugin);
} catch (error) {
  // Plugin no disponible, continuar sin él
}

module.exports = model("WorkOrderStatus", workOrderStatusSchema);
