const { Schema, model } = require("mongoose");
const auditPlugin = require("../../../models/plugins/audit");

const StockAlertSchema = new Schema(
  {
    tipo: {
      type: String,
      enum: [
        "stock_minimo",
        "stock_critico",
        "orden_pendiente",
        "reserva_vencida",
        "movimiento",
        "otro",
      ],
      required: true,
    },
    titulo: {
      type: String,
      required: [true, "El título es obligatorio"],
    },
    mensaje: {
      type: String,
      required: [true, "El mensaje es obligatorio"],
    },
    nivel: {
      type: String,
      enum: ["info", "advertencia", "urgente", "critico"],
      default: "info",
    },
    item: {
      type: Schema.Types.ObjectId,
      ref: "Item",
    },
    warehouse: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
    },
    datos: {
      type: Schema.Types.Mixed,
      // Puede contener datos adicionales como:
      // { stockActual, stockMinimo, diferencia, porcentaje, etc. }
    },
    leida: {
      type: Boolean,
      default: false,
    },
    leidaPor: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    fechaLeida: {
      type: Date,
    },
    destinatarios: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
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

StockAlertSchema.plugin(auditPlugin);

StockAlertSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

// Índices para mejorar consultas
StockAlertSchema.index({ tipo: 1, leida: 1, createdAt: -1 });
StockAlertSchema.index({ item: 1, tipo: 1 });
StockAlertSchema.index({ destinatarios: 1, leida: 1 });

module.exports = model("StockAlert", StockAlertSchema);
