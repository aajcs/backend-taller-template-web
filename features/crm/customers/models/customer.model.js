const { Schema, model } = require("mongoose");
const auditPlugin = require("../../../../models/plugins/audit");

/**
 * Customer Schema
 * Modelo para la gestión de clientes en el sistema CRM
 */
const CustomerSchema = Schema(
  {
    // Información básica del cliente
    nombre: {
      type: String,
      required: [true, "El nombre es obligatorio"],
      trim: true,
      maxlength: [100, "El nombre no puede exceder 100 caracteres"],
    },

    // Tipo de cliente: persona o empresa
    tipo: {
      type: String,
      required: [true, "El tipo de cliente es obligatorio"],
      enum: {
        values: ["persona", "empresa"],
        message: "El tipo debe ser: persona o empresa",
      },
    },

    // Información de contacto
    telefono: {
      type: String,
      required: [true, "El teléfono es obligatorio"],
      trim: true,
      match: [
        /^\+58\d{10}$/,
        "El teléfono debe tener el formato +584241234567",
      ],
    },

    correo: {
      type: String,
      required: [true, "El correo es obligatorio"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "El correo debe tener un formato válido",
      ],
    },

    // Dirección opcional
    direccion: {
      type: String,
      trim: true,
      maxlength: [200, "La dirección no puede exceder 200 caracteres"],
    },

    // Campos específicos para empresas
    rif: {
      type: String,
      trim: true,
      uppercase: true,
      sparse: true, // Permite valores null/undefined sin violar unicidad
      match: [
        /^[JVG]-?\d{8}-?\d{1}$/,
        "El RIF debe tener el formato J-12345678-9, V-12345678-9 o G-12345678-9",
      ],
      validate: {
        validator: function (value) {
          // Solo validar si es empresa
          if (this.tipo === "empresa") {
            return value != null && value !== "";
          }
          return true; // Para personas, permitir null
        },
        message: "El RIF es obligatorio para clientes tipo empresa",
      },
    },

    razonSocial: {
      type: String,
      trim: true,
      maxlength: [150, "La razón social no puede exceder 150 caracteres"],
      validate: {
        validator: function (value) {
          // Solo validar si es empresa
          if (this.tipo === "empresa") {
            return value != null && value !== "";
          }
          return true; // Para personas, permitir null
        },
        message: "La razón social es obligatoria para clientes tipo empresa",
      },
    },

    // Notas adicionales
    notas: {
      type: String,
      trim: true,
      maxlength: [500, "Las notas no pueden exceder 500 caracteres"],
    },

    // Estado del cliente
    estado: {
      type: String,
      enum: {
        values: ["activo", "inactivo"],
        message: "El estado debe ser: activo o inactivo",
      },
      default: "activo",
    },

    // Eliminación lógica
    eliminado: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
    toJSON: { virtuals: true }, // Incluir virtuals en JSON
    toObject: { virtuals: true }, // Incluir virtuals en objetos
  }
);

// Índices para optimizar consultas
CustomerSchema.index({ correo: 1 }, { unique: true });
CustomerSchema.index({ rif: 1 }, { unique: true, sparse: true });
CustomerSchema.index({ tipo: 1, estado: 1 });
CustomerSchema.index({ eliminado: 1 });

// Aplicar plugin de auditoría
CustomerSchema.plugin(auditPlugin);

// Método virtual para obtener nombre completo (útil para personas)
CustomerSchema.virtual("nombreCompleto").get(function () {
  if (this.tipo === "empresa") {
    return this.razonSocial || this.nombre;
  }
  return this.nombre;
});

// Método para obtener información de contacto formateada
CustomerSchema.methods.getContacto = function () {
  return {
    telefono: this.telefono,
    correo: this.correo,
    direccion: this.direccion,
  };
};

// Método para verificar si es empresa
CustomerSchema.methods.esEmpresa = function () {
  return this.tipo === "empresa";
};

// Campo virtual para obtener vehículos asociados
CustomerSchema.virtual("vehicles", {
  ref: "Vehicle",
  localField: "_id",
  foreignField: "customer",
  match: { eliminado: false }, // Solo vehículos no eliminados
  options: { sort: { createdAt: -1 } }, // Ordenar por fecha de creación descendente
});

// Método para obtener vehículos con detalles completos
CustomerSchema.methods.getVehicles = async function () {
  const Vehicle = require("../../vehicles/models/vehicle.model");
  return await Vehicle.find({
    customer: this._id,
    eliminado: false,
  })
    .populate({
      path: "model",
      select: "nombre tipo motor",
      populate: {
        path: "brand",
        select: "nombre paisOrigen",
      },
    })
    .sort({ createdAt: -1 });
};

// Método para contar vehículos activos
CustomerSchema.methods.countVehicles = async function () {
  const Vehicle = require("../../vehicles/models/vehicle.model");
  return await Vehicle.countDocuments({
    customer: this._id,
    eliminado: false,
    estado: "activo",
  });
};

// Método estático para buscar por RIF
CustomerSchema.statics.findByRif = function (rif) {
  return this.findOne({
    rif: rif.toUpperCase(),
    eliminado: false,
  });
};

// Método estático para buscar por correo
CustomerSchema.statics.findByCorreo = function (correo) {
  return this.findOne({
    correo: correo.toLowerCase(),
    eliminado: false,
  });
};

// Método estático para obtener clientes activos
CustomerSchema.statics.findActive = function () {
  return this.find({
    estado: "activo",
    eliminado: false,
  });
};

module.exports = model("Customer", CustomerSchema);
