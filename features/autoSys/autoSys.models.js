const { Schema, model } = require("mongoose");
const auditPlugin = require("../../models/plugins/audit");

// Definición del esquema para el modelo AutoSys (Refinería/Taller)
const AutoSysSchema = Schema(
  {
    // Ubicación física del taller
    ubicacion: {
      type: String,
      required: [true, "Ubicación física del taller es necesaria"],
      minlength: [3, "La ubicación debe tener al menos 3 caracteres"],
      maxlength: [100, "La ubicación no puede exceder los 100 caracteres"],
    },

    // Teléfono del taller
    telefono: {
      type: String,
      required: [false, "El teléfono es necesario"],
      minlength: [3, "El teléfono debe tener al menos 3 caracteres"],
      maxlength: [15, "El teléfono no puede exceder los 15 caracteres"],
    },

    // Capacidad de procesamiento diario
    procesamientoDia: {
      type: Number,
      required: [true, "La capacidad del taller es necesaria"],
      min: [0, "La capacidad no puede ser negativa"],
    },

    // Nombre del taller
    nombre: {
      type: String,
      required: [true, "El nombre del taller es necesario"],
      minlength: [3, "El nombre debe tener al menos 3 caracteres"],
      maxlength: [50, "El nombre no puede exceder los 50 caracteres"],
      unique: [true, "El nombre del taller debe ser único"],
    },

    // Número de Identificación Tributaria (RIF)
    rif: {
      type: String,
      required: [true, "El RIF es necesario"],
      unique: [true, "El RIF debe ser único"],
      minlength: [5, "El RIF debe tener al menos 5 caracteres"],
      maxlength: [20, "El RIF no puede exceder los 20 caracteres"],
    },

    // Representante legal del taller
    legal: {
      type: String,
      required: [false, "El representante legal es necesario"],
      minlength: [3, "El representante legal debe tener al menos 3 caracteres"],
      maxlength: [
        50,
        "El representante legal no puede exceder los 50 caracteres",
      ],
    },

    // Imagen asociada al taller (logo)
    img: {
      type: String, // URL de la imagen
    },

    // Estado del taller (activo o inactivo)
    estado: {
      type: String,
      enum: ["activo", "inactivo"],
      default: "activo",
    },

    // Indica si el taller ha sido eliminado (eliminación lógica)
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
AutoSysSchema.plugin(auditPlugin);

// Configuración para transformar el objeto JSON al devolverlo
AutoSysSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject.__v;
  },
});

module.exports = model("AutoSys", AutoSysSchema);
