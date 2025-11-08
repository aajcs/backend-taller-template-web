const { Schema, model } = require("mongoose");
const mongoosePaginate = require("mongoose-paginate-v2");

/**
 * Modelo de Factura
 * RF-24: Generar factura desde OT en estado "Listo para Entrega"
 * RF-25: Tomar ítems automáticamente de la OT
 * RF-26: Aplicar impuestos (IVA)
 * RF-27: Registrar pagos
 * RF-28: Emitir factura final
 */
const invoiceSchema = new Schema(
  {
    // Número único de factura
    invoiceNumber: {
      type: String,
      required: [true, "El número de factura es obligatorio"],
      unique: true,
      trim: true,
    },

    // Referencia a la orden de trabajo
    workOrder: {
      type: Schema.Types.ObjectId,
      ref: "WorkOrder",
      required: [true, "La orden de trabajo es obligatoria"],
    },

    // Cliente (tomado de la OT)
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "El cliente es obligatorio"],
    },

    // Fecha de emisión
    issueDate: {
      type: Date,
      default: Date.now,
      required: true,
    },

    // Fecha de vencimiento
    dueDate: {
      type: Date,
      required: [true, "La fecha de vencimiento es obligatoria"],
    },

    // Estado de la factura
    status: {
      type: String,
      enum: {
        values: [
          "borrador",
          "emitida",
          "pagada_parcial",
          "pagada_total",
          "vencida",
          "cancelada",
        ],
        message: "{VALUE} no es un estado válido",
      },
      default: "borrador",
    },

    // Subtotal (sin impuestos)
    subtotal: {
      type: Number,
      required: true,
      min: [0, "El subtotal no puede ser negativo"],
      default: 0,
    },

    // Impuestos aplicados
    taxes: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        rate: {
          type: Number,
          required: true,
          min: [0, "La tasa de impuesto no puede ser negativa"],
          max: [100, "La tasa de impuesto no puede ser mayor a 100%"],
        },
        amount: {
          type: Number,
          required: true,
          min: [0, "El monto del impuesto no puede ser negativo"],
        },
      },
    ],

    // Total con impuestos
    total: {
      type: Number,
      required: true,
      min: [0, "El total no puede ser negativo"],
      default: 0,
    },

    // Ítems de la factura (embebidos)
    items: [
      {
        type: {
          type: String,
          enum: ["service", "part"],
          required: true,
        },
        service: {
          type: Schema.Types.ObjectId,
          ref: "Service",
        },
        part: {
          type: Schema.Types.ObjectId,
          ref: "Producto",
        },
        description: {
          type: String,
          required: true,
          trim: true,
          maxlength: [
            200,
            "La descripción no puede tener más de 200 caracteres",
          ],
        },
        quantity: {
          type: Number,
          required: true,
          min: [0.01, "La cantidad debe ser mayor a 0"],
        },
        unitPrice: {
          type: Number,
          required: true,
          min: [0, "El precio unitario no puede ser negativo"],
        },
        subtotal: {
          type: Number,
          default: 0,
        },
        notes: {
          type: String,
          trim: true,
          maxlength: [200, "Las notas no pueden tener más de 200 caracteres"],
        },
      },
    ],

    // Notas adicionales
    notes: {
      type: String,
      trim: true,
      maxlength: [500, "Las notas no pueden tener más de 500 caracteres"],
    },

    // Información de pago
    paymentTerms: {
      type: String,
      trim: true,
      maxlength: [
        200,
        "Los términos de pago no pueden tener más de 200 caracteres",
      ],
    },

    // Total pagado
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, "El monto pagado no puede ser negativo"],
    },

    // Saldo pendiente
    balance: {
      type: Number,
      default: 0,
      min: [0, "El saldo no puede ser negativo"],
    },

    // Usuario que creó la factura
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Usuario que actualizó por última vez
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    // Eliminación lógica
    eliminado: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "invoices",
  }
);

// Índices para optimización
invoiceSchema.index({ workOrder: 1 });
invoiceSchema.index({ customer: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ issueDate: -1 });
invoiceSchema.index({ dueDate: 1 });
invoiceSchema.index({ invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ eliminado: 1 });

// Método para calcular totales
invoiceSchema.methods.calculateTotals = function () {
  this.subtotal =
    this.items?.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    ) || 0;

  // Calcular impuestos
  const taxAmount = this.taxes?.reduce((sum, tax) => sum + tax.amount, 0) || 0;

  this.total = this.subtotal + taxAmount;
  this.balance = this.total - this.paidAmount;

  return this;
};

// Método para aplicar IVA
invoiceSchema.methods.applyIVA = function (ivaRate = 19) {
  if (!this.taxes) this.taxes = [];

  // Remover IVA existente si hay
  this.taxes = this.taxes.filter((tax) => tax.name !== "IVA");

  const ivaAmount = (this.subtotal * ivaRate) / 100;

  this.taxes.push({
    name: "IVA",
    rate: ivaRate,
    amount: ivaAmount,
  });

  this.calculateTotals();
  return this;
};

// Método para verificar si está pagada
invoiceSchema.methods.isPaid = function () {
  return this.balance <= 0;
};

// Método para verificar si está vencida
invoiceSchema.methods.isOverdue = function () {
  return (
    this.status !== "pagada_total" &&
    this.status !== "cancelada" &&
    new Date() > this.dueDate
  );
};

// Método estático para generar número de factura
invoiceSchema.statics.generateInvoiceNumber = async function () {
  const lastInvoice = await this.findOne({}, {}, { sort: { createdAt: -1 } });
  const lastNumber = lastInvoice
    ? parseInt(lastInvoice.invoiceNumber.replace("INV-", ""))
    : 0;
  const nextNumber = (lastNumber + 1).toString().padStart(6, "0");
  return `INV-${nextNumber}`;
};

// Plugin de paginación
invoiceSchema.plugin(mongoosePaginate);

module.exports = model("Invoice", invoiceSchema);
