const { Schema, model } = require("mongoose");
const auditPlugin = require("../../../models/plugins/audit");

const StockSchema = new Schema(
  {
    item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
    warehouse: {
      type: Schema.Types.ObjectId,
      ref: "Warehouse",
      required: true,
    },
    cantidad: { type: Number, default: 0, min: 0 },
    costoPromedio: { type: Number, default: 0, min: 0 },
    lote: { type: String },
    ubicacionZona: { type: String },
    reservado: { type: Number, default: 0, min: 0 },
    eliminado: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    historial: [{ type: Schema.Types.Mixed }],
  },
  { timestamps: true, versionKey: false }
);

StockSchema.index({ item: 1, warehouse: 1 }, { unique: true });

StockSchema.plugin(auditPlugin);

StockSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

module.exports = model("Stock", StockSchema);
