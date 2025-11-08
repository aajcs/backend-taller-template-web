const { Schema, model } = require("mongoose");

/**
 * Modelo de Ítem de Factura
 * Representa cada línea de la factura (repuestos o servicios)
 */
const invoiceItemSchema = new Schema(
  {
    // Referencia a la factura
    invoice: {
      type: Schema.Types.ObjectId,
      ref: "Invoice",
      required: [true, "La factura es obligatoria"],
    },

    // Tipo de ítem (service o part)
    type: {
      type: String,
      enum: {
        values: ["service", "part"],
        message: "{VALUE} no es un tipo válido",
      },
      required: [true, "El tipo es obligatorio"],
    },

    // Referencia al servicio o repuesto
    service: {
      type: Schema.Types.ObjectId,
      ref: "Service",
    },

    part: {
      type: Schema.Types.ObjectId,
      ref: "Producto",
    },

    // Descripción del ítem
    description: {
      type: String,
      required: [true, "La descripción es obligatoria"],
      trim: true,
      maxlength: [200, "La descripción no puede tener más de 200 caracteres"],
    },

    // Cantidad
    quantity: {
      type: Number,
      required: [true, "La cantidad es obligatoria"],
      min: [0.01, "La cantidad debe ser mayor a 0"],
    },

    // Precio unitario
    unitPrice: {
      type: Number,
      required: [true, "El precio unitario es obligatorio"],
      min: [0, "El precio unitario no puede ser negativo"],
    },

    // Subtotal (cantidad * precio unitario)
    subtotal: {
      type: Number,
      required: true,
      min: [0, "El subtotal no puede ser negativo"],
      default: 0,
    },

    // Notas adicionales
    notes: {
      type: String,
      trim: true,
      maxlength: [200, "Las notas no pueden tener más de 200 caracteres"],
    },

    // Eliminación lógica
    eliminado: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: "invoice_items",
  }
);

// Índices para optimización
invoiceItemSchema.index({ invoice: 1 });
invoiceItemSchema.index({ service: 1 });
invoiceItemSchema.index({ part: 1 });
invoiceItemSchema.index({ type: 1 });
invoiceItemSchema.index({ eliminado: 1 });

// Calcular subtotal antes de guardar
invoiceItemSchema.pre("save", function (next) {
  this.subtotal = this.quantity * this.unitPrice;
  next();
});

// Método para actualizar subtotal
invoiceItemSchema.methods.updateSubtotal = function () {
  this.subtotal = this.quantity * this.unitPrice;
  return this;
};

module.exports = model("InvoiceItem", invoiceItemSchema);
