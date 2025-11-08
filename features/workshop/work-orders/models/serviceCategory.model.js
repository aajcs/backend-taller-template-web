/**
 * ServiceCategory Model
 * Modelo para categorías de servicios
 */

const { Schema, model } = require("mongoose");

const serviceCategorySchema = new Schema(
  {
    // Nombre de la categoría
    nombre: {
      type: String,
      required: [true, "El nombre de la categoría es obligatorio"],
      unique: true,
      trim: true,
      maxlength: [50, "El nombre no puede exceder 50 caracteres"],
    },

    // Descripción de la categoría
    descripcion: {
      type: String,
      trim: true,
      maxlength: [200, "La descripción no puede exceder 200 caracteres"],
    },

    // Código único para identificación
    codigo: {
      type: String,
      required: [true, "El código de la categoría es obligatorio"],
      unique: true,
      uppercase: true,
      trim: true,
      maxlength: [20, "El código no puede exceder 20 caracteres"],
      match: [
        /^[A-Z_]+$/,
        "El código solo puede contener letras mayúsculas y guiones bajos",
      ],
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

    // Estado de la categoría
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
serviceCategorySchema.index({ codigo: 1 }, { unique: true });
serviceCategorySchema.index({ nombre: 1 });
serviceCategorySchema.index({ orden: 1 });
serviceCategorySchema.index({ activo: 1 });

// Plugin de auditoría (si existe)
try {
  const auditPlugin = require("../../audit.plugin");
  serviceCategorySchema.plugin(auditPlugin);
} catch (error) {
  // Plugin no disponible, continuar sin él
}

module.exports = model("ServiceCategory", serviceCategorySchema);
