const { Schema, model } = require("mongoose");
const auditPlugin = require("../../../../models/plugins/audit");

// Definición del esquema para el modelo VehicleModel (Modelo de Vehículo)
const VehicleModelSchema = Schema(
  {
    // Referencia a la marca del vehículo
    brand: {
      type: Schema.Types.ObjectId,
      ref: "VehicleBrand",
      required: [true, "La marca del modelo es requerida"],
    },

    // Nombre del modelo
    nombre: {
      type: String,
      required: [true, "El nombre del modelo es requerido"],
      minlength: [2, "El nombre debe tener al menos 2 caracteres"],
      maxlength: [50, "El nombre no puede exceder los 50 caracteres"],
    },

    // Descripción opcional del modelo
    descripcion: {
      type: String,
      required: false,
      maxlength: [200, "La descripción no puede exceder los 200 caracteres"],
    },

    // Tipo de vehículo (sedán, SUV, pickup, etc.)
    tipo: {
      type: String,
      required: false,
      enum: [
        "sedan",
        "suv",
        "pickup",
        "hatchback",
        "coupe",
        "convertible",
        "wagon",
        "van",
        "truck",
        "motorcycle",
        "other",
      ],
      default: "other",
    },

    // Categoría del motor (gasolina, diesel, eléctrico, híbrido)
    motor: {
      type: String,
      required: false,
      enum: ["gasolina", "diesel", "electrico", "hibrido", "gas"],
      default: "gasolina",
    },

    // Años de producción (rango opcional)
    yearInicio: {
      type: Number,
      required: false,
      min: [1900, "El año de inicio debe ser mayor o igual a 1900"],
    },

    yearFin: {
      type: Number,
      required: false,
      max: [
        new Date().getFullYear() + 2,
        "El año de fin no puede ser muy futuro",
      ],
    },

    // Estado del modelo (activo o inactivo)
    estado: {
      type: String,
      enum: ["activo", "inactivo"],
      default: "activo",
    },

    // Indica si el modelo ha sido eliminado (eliminación lógica)
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
VehicleModelSchema.plugin(auditPlugin);

// Configuración para transformar el objeto JSON al devolverlo
VehicleModelSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject.__v;
  },
});

// Índices para optimizar búsquedas
VehicleModelSchema.index({ brand: 1 });
VehicleModelSchema.index({ nombre: 1 });
VehicleModelSchema.index({ tipo: 1 });
VehicleModelSchema.index({ motor: 1 });
VehicleModelSchema.index({ estado: 1, eliminado: 1 });

// Índice compuesto único: una marca no puede tener dos modelos con el mismo nombre
VehicleModelSchema.index({ brand: 1, nombre: 1 }, { unique: true });

module.exports = model("VehicleModel", VehicleModelSchema);
