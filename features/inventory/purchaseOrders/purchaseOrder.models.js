const { Schema, model } = require("mongoose");
const auditPlugin = require("../../../models/plugins/audit");

const PurchaseOrderSchema = new Schema(
  {
    numero: { type: String, required: true, unique: true },
    proveedor: { type: Schema.Types.ObjectId, ref: "Supplier", required: true },
    fecha: { type: Date, default: Date.now },
    items: [
      {
        item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
        cantidad: { type: Number, required: true, min: 0 },
        precioUnitario: { type: Number, required: true, min: 0 },
        recibido: { type: Number, default: 0, min: 0 },
      },
    ],
    estado: {
      type: String,
      enum: ["pendiente", "parcial", "recibido", "cancelado"],
      default: "pendiente",
    },
    creadoPor: { type: Schema.Types.ObjectId, ref: "User" },
    eliminado: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

PurchaseOrderSchema.plugin(auditPlugin);

PurchaseOrderSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

module.exports = model("PurchaseOrder", PurchaseOrderSchema);
