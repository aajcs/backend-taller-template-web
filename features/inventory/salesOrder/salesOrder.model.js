const { Schema, model } = require("mongoose");
const auditPlugin = require("../../../models/plugins/audit");

const SalesLineSchema = new Schema({
  item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
  cantidad: { type: Number, required: true, min: 1 },
  precioUnitario: { type: Number, default: 0 },
  reservado: { type: Number, default: 0 },
  entregado: { type: Number, default: 0 },
});

const SalesOrderSchema = new Schema(
  {
    numero: { type: String, required: true, unique: true },
    cliente: { type: String },
    fecha: { type: Date, default: Date.now },
    estado: {
      type: String,
      enum: [
        "borrador",
        "pendiente",
        "confirmada",
        "parcial",
        "despachada",
        "cancelada",
      ],
      default: "draft",
    },
    items: [SalesLineSchema],
    reservations: [{ type: Schema.Types.ObjectId, ref: "Reservation" }],
    // Idempotency keys para operaciones críticas
    confirmIdempotencyKey: { type: String, unique: true, sparse: true },
    shipIdempotencyKey: { type: String, unique: true, sparse: true },
    cancelIdempotencyKey: { type: String, unique: true, sparse: true },
    // Tracking timestamps
    fechaConfirmacion: { type: Date },
    fechaDespacho: { type: Date },
    fechaCancelacion: { type: Date },
    creadoPor: { type: Schema.Types.ObjectId, ref: "User" },
    eliminado: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

SalesOrderSchema.plugin(auditPlugin);

SalesOrderSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

module.exports = model("SalesOrder", SalesOrderSchema);
