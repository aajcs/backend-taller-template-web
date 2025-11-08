const { Schema, model } = require("mongoose");

/**
 * Modelo de Pago
 * RF-27: Registrar pago de factura (total o parcial) y método de pago
 */
const paymentSchema = new Schema(
  {
    // Referencia a la factura
    invoice: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
      required: [true, "La factura es obligatoria"],
    },

    // Monto del pago
    amount: {
      type: Number,
      required: [true, "El monto es obligatorio"],
      min: [0.01, "El monto debe ser mayor a 0"],
    },

    // Fecha del pago
    paymentDate: {
      type: Date,
      default: Date.now,
      required: true,
    },

    // Método de pago
    paymentMethod: {
      type: String,
      enum: {
        values: [
          "efectivo",
          "transferencia",
          "tarjeta_credito",
          "tarjeta_debito",
          "cheque",
          "cripto",
          "otro",
        ],
        message: "{VALUE} no es un método de pago válido",
      },
      required: [true, "El método de pago es obligatorio"],
    },

    // Referencia del pago (número de transacción, etc.)
    reference: {
      type: String,
      trim: true,
      maxlength: [100, "La referencia no puede tener más de 100 caracteres"],
    },

    // Notas del pago
    notes: {
      type: String,
      trim: true,
      maxlength: [300, "Las notas no pueden tener más de 300 caracteres"],
    },

    // Estado del pago
    status: {
      type: String,
      enum: {
        values: ["pendiente", "confirmado", "rechazado", "reembolsado"],
        message: "{VALUE} no es un estado válido",
      },
      default: "confirmado",
    },

    // Usuario que registró el pago
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Información adicional del método de pago
    paymentDetails: {
      // Para transferencias
      bankName: String,
      accountNumber: String,

      // Para tarjetas
      cardLastFour: String,
      cardType: {
        type: String,
        enum: ["visa", "mastercard", "amex", "diners", "otro"],
      },

      // Para cripto
      cryptoCurrency: String,
      walletAddress: String,
      transactionHash: String,
    },

    // Eliminación lógica
    eliminado: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "payments",
  }
);

// Índices para optimización
paymentSchema.index({ invoice: 1 });
paymentSchema.index({ paymentDate: -1 });
paymentSchema.index({ paymentMethod: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ recordedBy: 1 });
paymentSchema.index({ eliminado: 1 });

// Método para confirmar pago
paymentSchema.methods.confirm = function () {
  this.status = "confirmado";
  return this.save();
};

// Método para rechazar pago
paymentSchema.methods.reject = function (reason) {
  this.status = "rechazado";
  if (reason) {
    this.notes =
      (this.notes ? this.notes + " | " : "") + `Rechazado: ${reason}`;
  }
  return this.save();
};

// Método para reembolsar pago
paymentSchema.methods.refund = function (reason) {
  this.status = "reembolsado";
  if (reason) {
    this.notes =
      (this.notes ? this.notes + " | " : "") + `Reembolsado: ${reason}`;
  }
  return this.save();
};

module.exports = model("Payment", paymentSchema);
