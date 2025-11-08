const { Schema, model } = require("mongoose");
const auditPlugin = require("../../../models/plugins/audit");

const ReservationSchema = new Schema(
  {
    item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    warehouse: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    cantidad: { type: Number, required: true, min: 1 },
    reservadoPor: { type: Schema.Types.ObjectId, ref: "User" },
    motivo: { type: String },
    ordenTrabajo: { type: Schema.Types.ObjectId, ref: "WorkOrder" },
    ordenSalida: { type: Schema.Types.ObjectId, ref: "SalidaInventario" },
    estado: {
      type: String,
      enum: [
        "activo",
        "pendiente_retiro",
        "entregado",
        "consumido",
        "liberado",
        "cancelado",
      ],
      default: "activo",
    },
    fechaEntrega: { type: Date },
    entregadoPor: { type: Schema.Types.ObjectId, ref: "User" },
    recibidoPor: { type: Schema.Types.ObjectId, ref: "User" },
    eliminado: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

ReservationSchema.plugin(auditPlugin);

ReservationSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

module.exports = model("Reservation", ReservationSchema);
