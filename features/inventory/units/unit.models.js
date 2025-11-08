const { Schema, model } = require("mongoose");
const auditPlugin = require("../../../models/plugins/audit");

const UnitSchema = new Schema(
  {
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
      unique: true,
    },
    descripcion: { type: String },
    estado: { type: String, enum: ["activo", "inactivo"], default: "activo" },
    eliminado: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    historial: [{ type: Schema.Types.Mixed }],
  },
  { timestamps: true, versionKey: false }
);

UnitSchema.plugin(auditPlugin);

UnitSchema.set("toJSON", {
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  },
});

module.exports = model("Unit", UnitSchema);
