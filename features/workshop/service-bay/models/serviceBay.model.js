const { Schema, model } = require("mongoose");

const serviceBaySchema = new Schema(
  {
    // Identificación
    name: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
      maxlength: [50, "El nombre no puede tener más de 50 caracteres"],
    },
    code: {
      type: String,
      required: [true, "El código es obligatorio"],
      unique: true,
      uppercase: true,
      trim: true,
    },

    // Área/Departamento
    area: {
      type: String,
      enum: {
        values: [
          "mecanica",
          "electricidad",
          "pintura",
          "latoneria",
          "lavado",
          "diagnostico",
          "multiple",
        ],
        message: "{VALUE} no es un área válida",
      },
      default: "mecanica",
    },

    // Estado actual
    status: {
      type: String,
      enum: {
        values: ["disponible", "ocupado", "mantenimiento", "fuera_servicio"],
        message: "{VALUE} no es un estado válido",
      },
      default: "disponible",
    },

    // Capacidad
    capacity: {
      type: String,
      enum: ["individual", "pequeña", "mediana", "grande", "multiple"],
      default: "multiple",
    },

    // Equipo disponible
    equipment: [
      {
        type: String,
        trim: true,
      },
    ],

    // Ocupación actual
    currentWorkOrder: {
      type: Schema.Types.ObjectId,
      ref: "WorkOrder",
    },

    currentTechnicians: [
      {
        technician: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        role: {
          type: String,
          enum: ["principal", "asistente"],
          default: "principal",
        },
        entryTime: Date,
      },
    ],

    occupiedSince: Date,
    estimatedEndTime: Date,

    // Configuración
    maxTechnicians: {
      type: Number,
      default: 2,
      min: 1,
    },

    order: {
      type: Number,
      default: 0,
    },

    notes: String,

    eliminado: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "service_bays",
  }
);

// Índices
serviceBaySchema.index({ status: 1, eliminado: -1 });
serviceBaySchema.index({ code: 1 });
serviceBaySchema.index({ area: 1 });

// Método para verificar si está disponible
serviceBaySchema.methods.isAvailable = function () {
  return this.status === "disponible" && !this.eliminado;
};

// Método para verificar si puede aceptar más técnicos
serviceBaySchema.methods.canAcceptMoreTechnicians = function () {
  return this.currentTechnicians.length < this.maxTechnicians;
};

// Método para ocupar la bahía
serviceBaySchema.methods.occupy = async function (workOrderId) {
  this.status = "ocupado";
  this.currentWorkOrder = workOrderId;
  this.occupiedSince = new Date();
  await this.save();
};

// Método para liberar la bahía
serviceBaySchema.methods.release = async function () {
  this.status = "disponible";
  this.currentWorkOrder = null;
  this.currentTechnicians = [];
  this.occupiedSince = null;
  this.estimatedEndTime = null;
  await this.save();
};

// Virtual para obtener el número de técnicos actuales
serviceBaySchema.virtual("currentTechnicianCount").get(function () {
  return this.currentTechnicians.length;
});

serviceBaySchema.set("toJSON", { virtuals: true });
serviceBaySchema.set("toObject", { virtuals: true });

module.exports = model("ServiceBay", serviceBaySchema);
