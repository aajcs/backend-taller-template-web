const { response } = require("express");
const { Payment, Invoice } = require("../models");

/**
 * Controlador para gestión de pagos
 */

// Obtener pagos de una factura
const getInvoicePayments = async (req, res = response) => {
  try {
    const { invoiceId } = req.params;

    // Verificar que la factura existe
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice || invoice.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Factura no encontrada",
      });
    }

    const payments = await Payment.find({
      invoice: invoiceId,
      eliminado: false,
    })
      .populate("recordedBy", "nombre email")
      .sort({ paymentDate: -1 });

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("Error al obtener pagos:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener pagos",
      error: error.message,
    });
  }
};

// Obtener pago por ID
const getPaymentById = async (req, res = response) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id)
      .populate("invoice", "invoiceNumber total paidAmount balance")
      .populate("recordedBy", "nombre email");

    if (!payment || payment.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Pago no encontrado",
      });
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("Error al obtener pago:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener pago",
      error: error.message,
    });
  }
};

// Registrar pago
const createPayment = async (req, res = response) => {
  try {
    const {
      invoice: invoiceId,
      amount,
      paymentDate,
      paymentMethod,
      reference,
      notes,
      paymentDetails,
    } = req.body;
    const userId = req.usuario._id;

    // Verificar que la factura existe
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice || invoice.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Factura no encontrada",
      });
    }

    // Verificar que la factura está emitida
    if (invoice.status === "borrador") {
      return res.status(400).json({
        success: false,
        message: "No se pueden registrar pagos en facturas en estado borrador",
      });
    }

    // Verificar que no se exceda el saldo pendiente
    if (amount > invoice.balance) {
      return res.status(400).json({
        success: false,
        message: `El monto del pago (${amount}) no puede ser mayor al saldo pendiente (${invoice.balance})`,
      });
    }

    // Crear pago
    const payment = new Payment({
      invoice: invoiceId,
      amount,
      paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
      paymentMethod,
      reference,
      notes,
      paymentDetails,
      recordedBy: userId,
    });

    await payment.save();

    // Actualizar factura
    invoice.paidAmount += amount;
    invoice.balance = invoice.total - invoice.paidAmount;

    // Cambiar estado según el pago
    if (invoice.balance <= 0) {
      invoice.status = "pagada_total";
    } else if (invoice.paidAmount > 0) {
      invoice.status = "pagada_parcial";
    }

    await invoice.save();

    // Poblar datos para respuesta
    await payment.populate("recordedBy", "nombre");

    res.status(201).json({
      success: true,
      message: "Pago registrado exitosamente",
      data: payment,
    });
  } catch (error) {
    console.error("Error al registrar pago:", error);
    res.status(500).json({
      success: false,
      message: "Error al registrar pago",
      error: error.message,
    });
  }
};

// Actualizar pago
const updatePayment = async (req, res = response) => {
  try {
    const { id } = req.params;
    const { reference, notes, paymentDetails } = req.body;

    const payment = await Payment.findById(id);

    if (!payment || payment.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Pago no encontrado",
      });
    }

    // Solo permitir actualizar si está pendiente
    if (payment.status !== "pendiente") {
      return res.status(400).json({
        success: false,
        message: "Solo se pueden actualizar pagos en estado pendiente",
      });
    }

    // Actualizar campos
    if (reference !== undefined) payment.reference = reference;
    if (notes !== undefined) payment.notes = notes;
    if (paymentDetails !== undefined) payment.paymentDetails = paymentDetails;

    await payment.save();

    res.json({
      success: true,
      message: "Pago actualizado exitosamente",
      data: payment,
    });
  } catch (error) {
    console.error("Error al actualizar pago:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar pago",
      error: error.message,
    });
  }
};

// Confirmar pago
const confirmPayment = async (req, res = response) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id).populate("invoice");

    if (!payment || payment.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Pago no encontrado",
      });
    }

    if (payment.status !== "pendiente") {
      return res.status(400).json({
        success: false,
        message: "El pago ya ha sido procesado",
      });
    }

    await payment.confirm();

    res.json({
      success: true,
      message: "Pago confirmado exitosamente",
      data: payment,
    });
  } catch (error) {
    console.error("Error al confirmar pago:", error);
    res.status(500).json({
      success: false,
      message: "Error al confirmar pago",
      error: error.message,
    });
  }
};

// Rechazar pago
const rejectPayment = async (req, res = response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const payment = await Payment.findById(id).populate("invoice");

    if (!payment || payment.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Pago no encontrado",
      });
    }

    if (payment.status !== "pendiente") {
      return res.status(400).json({
        success: false,
        message: "El pago ya ha sido procesado",
      });
    }

    await payment.reject(reason);

    // Revertir el pago en la factura
    const invoice = payment.invoice;
    invoice.paidAmount -= payment.amount;
    invoice.balance = invoice.total - invoice.paidAmount;

    // Ajustar estado de la factura
    if (invoice.paidAmount === 0) {
      invoice.status = "emitida";
    } else if (invoice.paidAmount > 0) {
      invoice.status = "pagada_parcial";
    }

    await invoice.save();

    res.json({
      success: true,
      message: "Pago rechazado exitosamente",
      data: payment,
    });
  } catch (error) {
    console.error("Error al rechazar pago:", error);
    res.status(500).json({
      success: false,
      message: "Error al rechazar pago",
      error: error.message,
    });
  }
};

// Reembolsar pago
const refundPayment = async (req, res = response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const payment = await Payment.findById(id).populate("invoice");

    if (!payment || payment.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Pago no encontrado",
      });
    }

    if (payment.status !== "confirmado") {
      return res.status(400).json({
        success: false,
        message: "Solo se pueden reembolsar pagos confirmados",
      });
    }

    await payment.refund(reason);

    // Revertir el pago en la factura
    const invoice = payment.invoice;
    invoice.paidAmount -= payment.amount;
    invoice.balance = invoice.total - invoice.paidAmount;

    // Ajustar estado de la factura
    if (invoice.paidAmount === 0) {
      invoice.status = "emitida";
    } else if (invoice.paidAmount > 0) {
      invoice.status = "pagada_parcial";
    }

    await invoice.save();

    res.json({
      success: true,
      message: "Pago reembolsado exitosamente",
      data: payment,
    });
  } catch (error) {
    console.error("Error al reembolsar pago:", error);
    res.status(500).json({
      success: false,
      message: "Error al reembolsar pago",
      error: error.message,
    });
  }
};

// Eliminar pago
const deletePayment = async (req, res = response) => {
  try {
    const { id } = req.params;

    const payment = await Payment.findById(id).populate("invoice");

    if (!payment || payment.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Pago no encontrado",
      });
    }

    // Solo permitir eliminar pagos pendientes
    if (payment.status !== "pendiente") {
      return res.status(400).json({
        success: false,
        message: "Solo se pueden eliminar pagos en estado pendiente",
      });
    }

    // Revertir el pago en la factura
    const invoice = payment.invoice;
    invoice.paidAmount -= payment.amount;
    invoice.balance = invoice.total - invoice.paidAmount;

    // Ajustar estado de la factura
    if (invoice.paidAmount === 0) {
      invoice.status = "emitida";
    } else if (invoice.paidAmount > 0) {
      invoice.status = "pagada_parcial";
    }

    await invoice.save();

    // Marcar pago como eliminado
    payment.eliminado = true;
    await payment.save();

    res.json({
      success: true,
      message: "Pago eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar pago:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar pago",
      error: error.message,
    });
  }
};

module.exports = {
  getInvoicePayments,
  getPaymentById,
  createPayment,
  updatePayment,
  confirmPayment,
  rejectPayment,
  refundPayment,
  deletePayment,
};
