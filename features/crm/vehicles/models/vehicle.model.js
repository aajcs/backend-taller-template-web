const { Schema, model } = require("mongoose");
const auditPlugin = require("../../../../models/plugins/audit");

// Definición del esquema para el modelo Vehicle
const VehicleSchema = Schema(
  {
    // Referencia al cliente propietario del vehículo
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "El cliente propietario es requerido"],
    },

    // Referencia al modelo del vehículo (incluye marca y modelo)
    model: {
      type: Schema.Types.ObjectId,
      ref: "VehicleModel",
      required: [true, "El modelo del vehículo es requerido"],
    },

    // Año del vehículo
    year: {
      type: Number,
      required: [true, "El año del vehículo es requerido"],
      min: [1900, "El año debe ser mayor o igual a 1900"],
      max: [
        new Date().getFullYear() + 1,
        "El año no puede ser mayor al año siguiente",
      ],
    },

    // Placa del vehículo (única)
    placa: {
      type: String,
      required: [true, "La placa del vehículo es requerida"],
      unique: [true, "La placa del vehículo debe ser única"],
      uppercase: true,
      minlength: [3, "La placa debe tener al menos 3 caracteres"],
      maxlength: [10, "La placa no puede exceder los 10 caracteres"],
    },

    // VIN/Serial de Carrocería (único)
    vin: {
      type: String,
      required: [true, "El VIN/Serial de carrocería es requerido"],
      unique: [true, "El VIN/Serial debe ser único"],
      uppercase: true,
      minlength: [17, "El VIN debe tener 17 caracteres"],
      maxlength: [17, "El VIN debe tener 17 caracteres"],
    },

    // Color del vehículo (opcional)
    color: {
      type: String,
      required: false,
      maxlength: [30, "El color no puede exceder los 30 caracteres"],
    },

    // Kilometraje actual (opcional)
    kilometraje: {
      type: Number,
      required: false,
      min: [0, "El kilometraje no puede ser negativo"],
    },

    // Estado del vehículo (activo o inactivo)
    estado: {
      type: String,
      enum: ["activo", "inactivo"],
      default: "activo",
    },

    // Indica si el vehículo ha sido eliminado (eliminación lógica)
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
VehicleSchema.plugin(auditPlugin);

// Configuración para transformar el objeto JSON al devolverlo
VehicleSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject.__v;
  },
});

// Índices para optimizar búsquedas
VehicleSchema.index({ customer: 1 });
VehicleSchema.index({ placa: 1 });
VehicleSchema.index({ vin: 1 });
VehicleSchema.index({ marca: 1, modelo: 1 });
VehicleSchema.index({ estado: 1, eliminado: 1 });

module.exports = model("Vehicle", VehicleSchema);
