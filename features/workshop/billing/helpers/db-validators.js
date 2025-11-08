const Invoice = require("../models/invoice.model");
const InvoiceItem = require("../models/invoiceItem.model");
const Payment = require("../models/payment.model");

// Validar que existe una factura por ID
const existeInvoicePorId = async (id) => {
  const invoice = await Invoice.findById(id);
  if (!invoice) {
    throw new Error(`La factura con ID ${id} no existe`);
  }
  if (invoice.estado === false) {
    throw new Error(`La factura con ID ${id} está eliminada`);
  }
};

// Validar que existe un ítem de factura por ID
const existeInvoiceItemPorId = async (id) => {
  const invoiceItem = await InvoiceItem.findById(id);
  if (!invoiceItem) {
    throw new Error(`El ítem de factura con ID ${id} no existe`);
  }
  if (invoiceItem.estado === false) {
    throw new Error(`El ítem de factura con ID ${id} está eliminado`);
  }
};

// Validar que existe un pago por ID
const existePaymentPorId = async (id) => {
  const payment = await Payment.findById(id);
  if (!payment) {
    throw new Error(`El pago con ID ${id} no existe`);
  }
  if (payment.estado === false) {
    throw new Error(`El pago con ID ${id} está eliminado`);
  }
};

// Validar que la factura no esté emitida para ciertas operaciones
const invoiceNoEmitida = async (id) => {
  const invoice = await Invoice.findById(id);
  if (invoice.status === "emitida") {
    throw new Error("No se puede modificar una factura emitida");
  }
};

// Validar que el pago no esté confirmado para ciertas operaciones
const paymentNoConfirmado = async (id) => {
  const payment = await Payment.findById(id);
  if (payment.status === "confirmado") {
    throw new Error("No se puede modificar un pago confirmado");
  }
};

// Validar que el monto del pago no exceda el saldo pendiente de la factura
const validarMontoPago = async (invoiceId, amount) => {
  const invoice = await Invoice.findById(invoiceId).populate("items");
  if (!invoice) {
    throw new Error("Factura no encontrada");
  }

  // Calcular total pagado
  const totalPagado = await Payment.aggregate([
    { $match: { invoice: invoice._id, status: "confirmado", estado: true } },
    { $group: { _id: null, total: { $sum: "$amount" } } },
  ]);

  const pagado = totalPagado.length > 0 ? totalPagado[0].total : 0;
  const pendiente = invoice.total - pagado;

  if (amount > pendiente) {
    throw new Error(
      `El monto del pago (${amount}) excede el saldo pendiente (${pendiente})`
    );
  }
};

module.exports = {
  existeInvoicePorId,
  existeInvoiceItemPorId,
  existePaymentPorId,
  invoiceNoEmitida,
  paymentNoConfirmado,
  validarMontoPago,
};
