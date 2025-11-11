const { Schema, model } = require("mongoose");

const workOrderAssignmentSchema = new Schema(
  {
    // Relaciones
    workOrder: {
      type: Schema.Types.ObjectId,
      ref: "WorkOrder",
      required: [true, "La orden de trabajo es obligatoria"],
    },

    technician: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "El técnico es obligatorio"],
    },

    serviceBay: {
      type: Schema.Types.ObjectId,
      ref: "ServiceBay",
      required: [true, "La bahía de servicio es obligatoria"],
    },

    // Rol del técnico en esta orden
    role: {
      type: String,
      enum: {
        values: ["principal", "asistente"],
        message: "{VALUE} no es un rol válido",
      },
      default: "principal",
    },

    // Tiempos de entrada y salida
    entryTime: {
      type: Date,
      required: [true, "La hora de entrada es obligatoria"],
      default: Date.now,
    },

    exitTime: Date,

    // Tiempo trabajado (calculado automáticamente al salir)
    hoursWorked: {
      type: Number, // horas decimales (ej: 2.5 = 2h 30min)
      min: 0,
      default: 0,
    },

    // Estado
    status: {
      type: String,
      enum: {
        values: ["activo", "completado", "cancelado"],
        message: "{VALUE} no es un estado válido",
      },
      default: "activo",
    },

    // Notas
    entryNotes: String,
    exitNotes: String,

    // Auditoría
    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    eliminado: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "work_order_assignments",
  }
);

// Índices
workOrderAssignmentSchema.index({ workOrder: 1, technician: 1 });
workOrderAssignmentSchema.index({ technician: 1, status: 1 });
workOrderAssignmentSchema.index({ serviceBay: 1, status: 1 });
workOrderAssignmentSchema.index({ entryTime: 1 });

// Método para calcular horas trabajadas
workOrderAssignmentSchema.methods.calculateHoursWorked = function () {
  if (!this.exitTime || !this.entryTime) {
    return 0;
  }

  const diffMs = this.exitTime - this.entryTime;
  const hours = diffMs / (1000 * 60 * 60);
  this.hoursWorked = Math.round(hours * 100) / 100; // 2 decimales
  return this.hoursWorked;
};

// Método para registrar salida
workOrderAssignmentSchema.methods.exit = async function (exitNotes = "") {
  this.exitTime = new Date();
  this.exitNotes = exitNotes;
  this.status = "completado";
  this.calculateHoursWorked();
  await this.save();
  return this;
};

// Virtual para obtener duración en formato legible
workOrderAssignmentSchema.virtual("duration").get(function () {
  if (!this.hoursWorked) return null;

  const hours = Math.floor(this.hoursWorked);
  const minutes = Math.round((this.hoursWorked - hours) * 60);

  return {
    hours,
    minutes,
    formatted: `${hours}h ${minutes}min`,
    total: this.hoursWorked,
  };
});

// Virtual para verificar si está activo
workOrderAssignmentSchema.virtual("isActive").get(function () {
  return this.status === "activo" && !this.exitTime;
});

workOrderAssignmentSchema.set("toJSON", { virtuals: true });
workOrderAssignmentSchema.set("toObject", { virtuals: true });

module.exports = model("WorkOrderAssignment", workOrderAssignmentSchema);
