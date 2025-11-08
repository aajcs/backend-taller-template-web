const { Schema, model } = require("mongoose");
const auditPlugin = require("../../../models/plugins/audit");

const WarehouseSchema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
      unique: true,
    },
    codigo: {
      type: String,
      required: [true, "El código es obligatorio"],
      trim: true,
      unique: true,
      uppercase: true,
    },
    ubicacion: { type: String },
    tipo: {
      type: String,
      enum: ["almacen", "bodega", "taller", "otro"],
      default: "almacen",
    },
    capacidad: { type: Number, default: 0 },
    estado: { type: String, enum: ["activo", "inactivo"], default: "activo" },
    eliminado: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    historial: [{ type: Schema.Types.Mixed }],
  },
  { timestamps: true, versionKey: false }
);

WarehouseSchema.plugin(auditPlugin);

WarehouseSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

module.exports = model("Warehouse", WarehouseSchema);
