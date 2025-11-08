const { Schema, model } = require("mongoose");
const auditPlugin = require("../../models/plugins/audit");

const UserSchema = Schema(
  {
    img: {
      type: String,
    },
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
    },
    correo: {
      type: String,
      required: [true, "El correo es obligatorio"],
      unique: true,
    },
    telefono: {
      type: String,
      // required: [true, "El teléfono es obligatorio"],
    },
    password: {
      type: String,
      required: [true, "La contraseña es obligatoria"],
    },

    rol: {
      type: String,
      required: true,
      default: "lectura",
      enum: ["superAdmin", "admin", "operador", "user", "lectura"],
    },
    departamento: [
      {
        type: String,
        required: true,
      },
    ],

    acceso: {
      type: String,
      required: true,
      default: "ninguno",
      enum: ["limitado", "completo", "ninguno"],
    },
    estado: {
      type: String,
      default: true,
    },
    eliminado: {
      type: Boolean,
      default: false,
    },
    online: {
      type: Boolean,
      default: false,
    },
    // Tokens de notificaciones push para FCM
    fcmTokens: {
      type: [String],
      default: [],
    },
    google: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
UserSchema.plugin(auditPlugin);

UserSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    // delete returnedObject._id;
    delete returnedObject.__v;
    delete returnedObject.password;
  },
});

module.exports = model("User", UserSchema);
