const { Schema, model } = require("mongoose");
const auditPlugin = require("../../../../models/plugins/audit");

// Definición del esquema para el modelo VehicleBrand (Marca de Vehículo)
const VehicleBrandSchema = Schema(
  {
    // Nombre de la marca
    nombre: {
      type: String,
      required: [true, "El nombre de la marca es requerido"],
      unique: [true, "El nombre de la marca debe ser único"],
      minlength: [2, "El nombre debe tener al menos 2 caracteres"],
      maxlength: [50, "El nombre no puede exceder los 50 caracteres"],
      uppercase: true, // Convertir a mayúsculas
    },

    // Descripción opcional de la marca
    descripcion: {
      type: String,
      required: false,
      maxlength: [200, "La descripción no puede exceder los 200 caracteres"],
    },

    // País de origen de la marca
    paisOrigen: {
      type: String,
      required: false,
      maxlength: [50, "El país de origen no puede exceder los 50 caracteres"],
    },

    // Logo de la marca (URL opcional)
    logo: {
      type: String,
      required: false,
    },

    // Estado de la marca (activa o inactiva)
    estado: {
      type: String,
      enum: ["activo", "inactivo"],
      default: "activo",
    },

    // Indica si la marca ha sido eliminada (eliminación lógica)
    eliminado: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Aplicar plugin de auditoría
VehicleBrandSchema.plugin(auditPlugin);

// Configuración para transformar el objeto JSON al devolverlo
VehicleBrandSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject.__v;
  },
});

// Índices para optimizar búsquedas
VehicleBrandSchema.index({ nombre: 1 });
VehicleBrandSchema.index({ estado: 1, eliminado: 1 });

module.exports = model("VehicleBrand", VehicleBrandSchema);
