const { Schema, model } = require("mongoose");
const auditPlugin = require("../../../models/plugins/audit");

const MovementSchema = new Schema(
  {
    tipo: {
      type: String,
      enum: [
        "entrada",
        "salida",
        "transferencia",
        "ajuste",
        "venta",
        "compra",
        "consumo",
      ],
      required: true,
    },
    referencia: { type: String }, // ej: nro factura, nro remision, guia
    referenciaTipo: { type: String }, // ej: 'purchaseOrder' | 'sale' | 'reservation'
    item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    cantidad: { type: Number, required: true, min: 0 },
    costoUnitario: { type: Number, default: 0, min: 0 },
    warehouseFrom: { type: Schema.Types.ObjectId, ref: "Warehouse" },
    warehouseTo: { type: Schema.Types.ObjectId, ref: "Warehouse" },
    reserva: { type: Schema.Types.ObjectId, ref: "Reservation" },
    lote: { type: String },
    usuario: { type: Schema.Types.ObjectId, ref: "User" },
    motivo: { type: String },
    metadata: { type: Schema.Types.Mixed },
    idempotencyKey: { type: String, unique: true, sparse: true }, // para evitar duplicados
    fecha: { type: Date, default: Date.now },
    resultadoStock: {
      cantidad: { type: Number },
      reservado: { type: Number },
    },
    eliminado: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

MovementSchema.plugin(auditPlugin);

MovementSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

module.exports = model("Movement", MovementSchema);
