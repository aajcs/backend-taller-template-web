const { response } = require("express");
const { InvoiceItem, Invoice } = require("../models");

/**
 * Controlador para gestión de ítems de factura
 */

// Obtener ítems de una factura
const getInvoiceItems = async (req, res = response) => {
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

    const items = await InvoiceItem.find({
      invoice: invoiceId,
      eliminado: false,
    })
      .populate("service", "name basePrice")
      .populate("part", "nombre precioVenta")
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error("Error al obtener ítems de factura:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener ítems de factura",
      error: error.message,
    });
  }
};

// Obtener ítem específico por ID
const getInvoiceItemById = async (req, res = response) => {
  try {
    const { id } = req.params;

    const item = await InvoiceItem.findById(id)
      .populate("invoice", "invoiceNumber")
      .populate("service", "name basePrice")
      .populate("part", "nombre precioVenta");

    if (!item || item.deleted) {
      return res.status(404).json({
        success: false,
        message: "Ítem de factura no encontrado",
      });
    }

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("Error al obtener ítem de factura:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener ítem de factura",
      error: error.message,
    });
  }
};

// Agregar ítem a factura
const addInvoiceItem = async (req, res = response) => {
  try {
    const { invoiceId } = req.params;
    const { type, service, part, description, quantity, unitPrice, notes } =
      req.body;

    // Verificar que la factura existe y está en estado editable
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice || invoice.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Factura no encontrada",
      });
    }

    if (invoice.status !== "borrador") {
      return res.status(400).json({
        success: false,
        message: "Solo se pueden agregar ítems a facturas en estado borrador",
      });
    }

    // Crear ítem
    const item = new InvoiceItem({
      invoice: invoiceId,
      type,
      service: type === "service" ? service : undefined,
      part: type === "part" ? part : undefined,
      description,
      quantity,
      unitPrice,
      notes,
    });

    await item.save();

    // Recalcular totales de la factura
    await invoice.calculateTotals();
    await invoice.save();

    // Poblar datos para respuesta
    await item.populate("service", "name basePrice");
    await item.populate("part", "nombre precioVenta");

    res.status(201).json({
      success: true,
      message: "Ítem agregado exitosamente",
      data: item,
    });
  } catch (error) {
    console.error("Error al agregar ítem:", error);
    res.status(500).json({
      success: false,
      message: "Error al agregar ítem",
      error: error.message,
    });
  }
};

// Actualizar ítem de factura
const updateInvoiceItem = async (req, res = response) => {
  try {
    const { id } = req.params;
    const { description, quantity, unitPrice, notes } = req.body;

    const item = await InvoiceItem.findById(id);

    if (!item || item.deleted) {
      return res.status(404).json({
        success: false,
        message: "Ítem de factura no encontrado",
      });
    }

    // Verificar que la factura está en estado editable
    const invoice = await Invoice.findById(item.invoice);
    if (invoice.status !== "borrador") {
      return res.status(400).json({
        success: false,
        message:
          "Solo se pueden actualizar ítems de facturas en estado borrador",
      });
    }

    // Actualizar campos
    if (description !== undefined) item.description = description;
    if (quantity !== undefined) item.quantity = quantity;
    if (unitPrice !== undefined) item.unitPrice = unitPrice;
    if (notes !== undefined) item.notes = notes;

    await item.save();

    // Recalcular totales de la factura
    await invoice.calculateTotals();
    await invoice.save();

    res.json({
      success: true,
      message: "Ítem actualizado exitosamente",
      data: item,
    });
  } catch (error) {
    console.error("Error al actualizar ítem:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar ítem",
      error: error.message,
    });
  }
};

// Eliminar ítem de factura
const deleteInvoiceItem = async (req, res = response) => {
  try {
    const { id } = req.params;

    const item = await InvoiceItem.findById(id);

    if (!item || item.deleted) {
      return res.status(404).json({
        success: false,
        message: "Ítem de factura no encontrado",
      });
    }

    // Verificar que la factura está en estado editable
    const invoice = await Invoice.findById(item.invoice);
    if (invoice.status !== "borrador") {
      return res.status(400).json({
        success: false,
        message: "Solo se pueden eliminar ítems de facturas en estado borrador",
      });
    }

    // Marcar como eliminado (eliminación lógica)
    item.deleted = true;
    await item.save();

    // Recalcular totales de la factura
    await invoice.calculateTotals();
    await invoice.save();

    res.json({
      success: true,
      message: "Ítem eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar ítem:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar ítem",
      error: error.message,
    });
  }
};

module.exports = {
  getInvoiceItems,
  getInvoiceItemById,
  addInvoiceItem,
  updateInvoiceItem,
  deleteInvoiceItem,
};
