/**
 * ServiceSubcategory Model
 * Modelo para subcategorías de servicios
 */

const { Schema, model } = require("mongoose");

const serviceSubcategorySchema = new Schema(
  {
    // Referencia a la categoría padre
    categoria: {
      type: Schema.Types.ObjectId,
      ref: "ServiceCategory",
      required: [true, "La categoría padre es obligatoria"],
    },

    // Nombre de la subcategoría
    nombre: {
      type: String,
      required: [true, "El nombre de la subcategoría es obligatorio"],
      trim: true,
      maxlength: [50, "El nombre no puede exceder 50 caracteres"],
    },

    // Descripción de la subcategoría
    descripcion: {
      type: String,
      trim: true,
      maxlength: [200, "La descripción no puede exceder 200 caracteres"],
    },

    // Código único para identificación (combinado con categoría)
    codigo: {
      type: String,
      required: [true, "El código de la subcategoría es obligatorio"],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [20, "El código no puede exceder 20 caracteres"],
      match: [
        /^[A-Z0-9_]+$/,
        "El código solo puede contener letras mayúsculas, números y guiones bajos",
      ],
    },

    // Estado de la subcategoría
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
serviceSubcategorySchema.index({ categoria: 1 });
serviceSubcategorySchema.index({ codigo: 1 }, { unique: true });
serviceSubcategorySchema.index({ nombre: 1 });
serviceSubcategorySchema.index({ activo: 1 });

// Índice compuesto para unicidad dentro de una categoría
serviceSubcategorySchema.index({ categoria: 1, nombre: 1 }, { unique: true });

// Método para obtener subcategorías por categoría
serviceSubcategorySchema.statics.getByCategoria = function (categoriaId) {
  return this.find({
    categoria: categoriaId,
    activo: true,
    eliminado: false,
  }).sort({ nombre: 1 });
};

// Método para validar que una subcategoría pertenece a una categoría
serviceSubcategorySchema.statics.validarSubcategoriaEnCategoria =
  async function (subcategoriaId, categoriaId) {
    const subcategoria = await this.findOne({
      _id: subcategoriaId,
      categoria: categoriaId,
      activo: true,
      eliminado: false,
    });

    return !!subcategoria;
  };

// Plugin de auditoría (si existe)
try {
  const auditPlugin = require("../../audit.plugin");
  serviceSubcategorySchema.plugin(auditPlugin);
} catch (error) {
  // Plugin no disponible, continuar sin él
}

module.exports = model("ServiceSubcategory", serviceSubcategorySchema);
