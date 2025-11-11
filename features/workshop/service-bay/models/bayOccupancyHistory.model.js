const { Schema, model } = require("mongoose");

const bayOccupancyHistorySchema = new Schema(
  {
    serviceBay: {
      type: Schema.Types.ObjectId,
      ref: "ServiceBay",
      required: true,
    },

    workOrder: {
      type: Schema.Types.ObjectId,
      ref: "WorkOrder",
      required: true,
    },

    vehicle: {
      type: Schema.Types.ObjectId,
      ref: "Vehicle",
    },

    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
    },

    // Tiempos
    entryTime: {
      type: Date,
      required: true,
    },

    exitTime: Date,

    // Duración en horas
    duration: {
      type: Number, // horas
      min: 0,
    },

    // Técnicos que trabajaron
    technicians: [
      {
        technician: {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
        role: String,
        hoursWorked: Number,
      },
    ],

    // Total de horas hombre
    totalTechnicianHours: {
      type: Number,
      default: 0,
    },

    // Servicios realizados
    services: [
      {
        service: {
          type: Schema.Types.ObjectId,
          ref: "Service",
        },
        description: String,
      },
    ],

    // Razón de salida
    exitReason: {
      type: String,
      enum: [
        "completado",
        "movido_otra_bahia",
        "cancelado",
        "espera_repuestos",
        "fin_jornada",
      ],
      default: "completado",
    },

    notes: String,

    eliminado: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "bay_occupancy_history",
  }
);

// Índices
bayOccupancyHistorySchema.index({ serviceBay: 1, entryTime: -1 });
bayOccupancyHistorySchema.index({ workOrder: 1 });
bayOccupancyHistorySchema.index({ entryTime: 1, exitTime: 1 });
bayOccupancyHistorySchema.index({ customer: 1 });

// Método para calcular duración
bayOccupancyHistorySchema.methods.calculateDuration = function () {
  if (!this.exitTime || !this.entryTime) {
    return 0;
  }

  const diffMs = this.exitTime - this.entryTime;
  const hours = diffMs / (1000 * 60 * 60);
  this.duration = Math.round(hours * 100) / 100; // 2 decimales
  return this.duration;
};

// Método para calcular total de horas técnico
bayOccupancyHistorySchema.methods.calculateTotalTechnicianHours = function () {
  this.totalTechnicianHours = this.technicians.reduce(
    (total, tech) => total + (tech.hoursWorked || 0),
    0
  );
  return this.totalTechnicianHours;
};

module.exports = model("BayOccupancyHistory", bayOccupancyHistorySchema);
