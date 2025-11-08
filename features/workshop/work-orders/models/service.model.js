/**
 * Service Model
 * Modelo para servicios y mano de obra disponibles
 *
 * Cubre RF-15
 */

const { Schema, model } = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

const serviceSchema = new Schema(
  {
    // Información básica del servicio
    nombre: {
      type: String,
      required: [true, "El nombre del servicio es obligatorio"],
      trim: true,
      maxlength: [100, "El nombre no puede exceder 100 caracteres"],
    },

    descripcion: {
      type: String,
      trim: true,
      maxlength: [500, "La descripción no puede exceder 500 caracteres"],
    },

    // Código único para identificación
    codigo: {
      type: String,
      required: [true, "El código del servicio es obligatorio"],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [20, "El código no puede exceder 20 caracteres"],
      match: [
        /^[A-Z0-9_-]+$/,
        "El código solo puede contener letras mayúsculas, números, guiones y guiones bajos",
      ],
    },

    // Categorización del servicio (referencias a modelos)
    categoria: {
      type: Schema.Types.ObjectId,
      ref: "ServiceCategory",
      required: [true, "La categoría es obligatoria"],
    },

    subcategoria: {
      type: Schema.Types.ObjectId,
      ref: "ServiceSubcategory",
      required: [true, "La subcategoría es obligatoria"],
    },

    // Información de costos y tiempo
    precioBase: {
      type: Number,
      required: [true, "El precio base es obligatorio"],
      min: [0, "El precio base no puede ser negativo"],
    },

    tiempoEstimadoMinutos: {
      type: Number,
      required: [true, "El tiempo estimado es obligatorio"],
      min: [1, "El tiempo estimado debe ser al menos 1 minuto"],
    },

    // Unidad de medida para el tiempo
    unidadTiempo: {
      type: String,
      enum: {
        values: ["minutos", "horas", "dias"],
        message: "Unidad de tiempo no válida",
      },
      default: "minutos",
    },

    // Costo por hora adicional (si aplica)
    costoHoraAdicional: {
      type: Number,
      default: 0,
      min: [0, "El costo por hora adicional no puede ser negativo"],
    },

    // Información adicional
    requiereEspecialista: {
      type: Boolean,
      default: false,
    },

    dificultad: {
      type: String,
      enum: {
        values: ["baja", "media", "alta", "experto"],
        message: "Nivel de dificultad no válido",
      },
      default: "media",
    },

    // Lista de herramientas requeridas
    herramientasRequeridas: [
      {
        type: String,
        trim: true,
        maxlength: [
          100,
          "El nombre de la herramienta no puede exceder 100 caracteres",
        ],
      },
    ],

    // Lista de piezas comunes (referencias a productos)
    piezasComunes: [
      {
        producto: {
          type: Schema.Types.ObjectId,
          ref: "Producto",
        },
        cantidad: {
          type: Number,
          min: [1, "La cantidad debe ser al menos 1"],
        },
        obligatorio: {
          type: Boolean,
          default: false,
        },
      },
    ],

    // Garantía del servicio (en meses)
    garantiaMeses: {
      type: Number,
      default: 0,
      min: [0, "La garantía no puede ser negativa"],
    },

    // Instrucciones especiales
    instrucciones: {
      type: String,
      trim: true,
      maxlength: [1000, "Las instrucciones no pueden exceder 1000 caracteres"],
    },

    // Información de imagen/documentación
    imagen: {
      type: String,
      trim: true,
    },

    // Estado del servicio
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
serviceSchema.index({ codigo: 1 }, { unique: true });
serviceSchema.index({ nombre: 1 });
serviceSchema.index({ categoria: 1 });
serviceSchema.index({ subcategoria: 1 });
serviceSchema.index({ activo: 1 });
serviceSchema.index({ precioBase: 1 });

// Método para calcular costo total estimado
serviceSchema.methods.calcularCostoEstimado = function (horasAdicionales = 0) {
  const costoBase = this.precioBase;
  const costoAdicional = horasAdicionales * this.costoHoraAdicional;
  return costoBase + costoAdicional;
};

// Método para obtener tiempo estimado en horas
serviceSchema.methods.getTiempoEnHoras = function () {
  switch (this.unidadTiempo) {
    case "minutos":
      return this.tiempoEstimadoMinutos / 60;
    case "horas":
      return this.tiempoEstimadoMinutos;
    case "dias":
      return this.tiempoEstimadoMinutos * 24;
    default:
      return this.tiempoEstimadoMinutos / 60;
  }
};

// Método para verificar si el servicio requiere piezas específicas
serviceSchema.methods.requierePiezas = function () {
  return this.piezasComunes && this.piezasComunes.length > 0;
};

// Método para obtener piezas obligatorias
serviceSchema.methods.getPiezasObligatorias = function () {
  return this.piezasComunes.filter((pieza) => pieza.obligatorio);
};

// Método estático para buscar servicios por categoría
serviceSchema.statics.buscarPorCategoria = function (categoriaId) {
  return this.find({
    categoria: categoriaId,
    activo: true,
    eliminado: false,
  })
    .populate("categoria", "nombre")
    .populate("subcategoria", "nombre")
    .sort({ nombre: 1 });
};

// Método estático para buscar servicios por subcategoría
serviceSchema.statics.buscarPorSubcategoria = function (subcategoriaId) {
  return this.find({
    subcategoria: subcategoriaId,
    activo: true,
    eliminado: false,
  })
    .populate("categoria", "nombre")
    .populate("subcategoria", "nombre")
    .sort({ nombre: 1 });
};

// Método para validar que la subcategoría pertenece a la categoría
serviceSchema.methods.validarCategoriaSubcategoria = async function () {
  const ServiceSubcategory = require("./serviceSubcategory.model");

  const esValida = await ServiceSubcategory.validarSubcategoriaEnCategoria(
    this.subcategoria,
    this.categoria
  );

  if (!esValida) {
    throw new Error("La subcategoría no pertenece a la categoría especificada");
  }

  return true;
};

// Método estático para obtener servicios populares (más usados)
serviceSchema.statics.getServiciosPopulares = function (limite = 10) {
  // Nota: Este método requeriría un contador de uso en WorkOrderItem
  // Por ahora retorna servicios activos ordenados por nombre
  return this.find({
    activo: true,
    eliminado: false,
  })
    .sort({ nombre: 1 })
    .limit(limite);
};

// Pre-save middleware para validar referencias
serviceSchema.pre("save", async function (next) {
  if (this.isModified("categoria") || this.isModified("subcategoria")) {
    await this.validarCategoriaSubcategoria();
  }
  next();
});

// Plugin de paginación
serviceSchema.plugin(mongoosePaginate);

// Plugin de auditoría (si existe)
try {
  const auditPlugin = require("../../audit.plugin");
  serviceSchema.plugin(auditPlugin);
} catch (error) {
  // Plugin no disponible, continuar sin él
}

module.exports = model("Service", serviceSchema);
