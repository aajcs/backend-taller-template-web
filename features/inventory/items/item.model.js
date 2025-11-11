const { Schema, model } = require("mongoose");
const auditPlugin = require("../../../models/plugins/audit");

const ItemSchema = new Schema(
  {
    sku: { type: String, index: true },
    codigo: { type: String, index: true },
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
    },
    descripcion: { type: String },
    marca: { type: Schema.Types.ObjectId, ref: "Brand", default: null },
    modelo: { type: Schema.Types.ObjectId, ref: "ItemModel", default: null },
    categoria: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    unidad: { type: Schema.Types.ObjectId, ref: "Unit", default: null },
    precioCosto: { type: Number, default: 0, min: 0 },
    precioVenta: { type: Number, default: 0, min: 0 },
    stockMinimo: { type: Number, default: 0, min: 0 },
    stockMaximo: { type: Number, default: 0, min: 0 },
    imagenes: [{ type: String }],
    estado: { type: String, enum: ["activo", "inactivo"], default: "activo" },
    eliminado: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    // historial gestionado por plugin de auditoría
    historial: [{ type: Schema.Types.Mixed }],
  },
  { timestamps: true, versionKey: false }
);

ItemSchema.plugin(auditPlugin);

// ItemSchema.set("toJSON", {
//   transform: (doc, ret) => {
//     ret.id = ret._id.toString();
//     delete ret._id;
//     delete ret.__v;
//   },
// });

module.exports = model("Item", ItemSchema);
