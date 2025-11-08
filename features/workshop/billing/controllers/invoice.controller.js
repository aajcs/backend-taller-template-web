const { response } = require("express");
const { Invoice, InvoiceItem, Payment, WorkOrder } = require("../models");
const { WorkOrderItem } = require("../../work-orders/models");

/**
 * Controlador para gestión de facturas
 */

// Obtener todas las facturas
const getInvoices = async (req, res = response) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      customer,
      startDate,
      endDate,
    } = req.query;

    // Construir filtro
    const filter = { eliminado: false };

    if (status) filter.status = status;
    if (customer) filter.customer = customer;

    if (startDate || endDate) {
      filter.issueDate = {};
      if (startDate) filter.issueDate.$gte = new Date(startDate);
      if (endDate) filter.issueDate.$lte = new Date(endDate);
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { issueDate: -1 },
      populate: [
        { path: "workOrder", select: "workOrderNumber vehicle customer" },
        { path: "customer", select: "nombre email" },
        { path: "createdBy", select: "nombre" },
      ],
    };

    const invoices = await Invoice.paginate(filter, options);

    res.json({
      success: true,
      data: invoices,
    });
  } catch (error) {
    console.error("Error al obtener facturas:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener facturas",
      error: error.message,
    });
  }
};

// Obtener factura por ID
const getInvoiceById = async (req, res = response) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id)
      .populate("workOrder", "workOrderNumber vehicle customer status")
      .populate("customer", "nombre email telefono")
      .populate("createdBy", "nombre")
      .populate("updatedBy", "nombre");

    if (!invoice || invoice.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Factura no encontrada",
      });
    }

    // Obtener ítems de la factura
    const items = await InvoiceItem.find({ invoice: id, eliminado: false })
      .populate("service", "name basePrice")
      .populate("part", "nombre precioVenta");

    // Obtener pagos de la factura
    const payments = await Payment.find({ invoice: id, eliminado: false })
      .populate("recordedBy", "nombre")
      .sort({ paymentDate: -1 });

    res.json({
      success: true,
      data: {
        ...invoice.toObject(),
        items,
        payments,
      },
    });
  } catch (error) {
    console.error("Error al obtener factura:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener factura",
      error: error.message,
    });
  }
};

// Crear factura desde orden de trabajo
const createInvoiceFromWorkOrder = async (req, res = response) => {
  try {
    const { workOrderId } = req.params; // ID viene del path parameter
    const { dueDate, notes, paymentTerms } = req.body;
    const userId = req.usuario._id;

    // Verificar que la OT existe y está en estado correcto
    const workOrder = await WorkOrder.findById(workOrderId)
      .populate("customer")
      .populate("estado");

    if (!workOrder || workOrder.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Orden de trabajo no encontrada",
      });
    }

    // Verificar estado (LISTO_ENTREGA o permitir cualquier estado para pruebas)
    // if (workOrder.estado?.codigo !== "LISTO_ENTREGA") {
    //   return res.status(400).json({
    //     success: false,
    //     message:
    //       'La orden de trabajo debe estar en estado "Listo para Entrega"',
    //   });
    // }

    // Verificar que no existe ya una factura para esta OT
    const existingInvoice = await Invoice.findOne({
      workOrder: workOrderId,
      eliminado: false,
    });

    if (existingInvoice) {
      return res.status(400).json({
        success: false,
        message: "Ya existe una factura para esta orden de trabajo",
      });
    }

    // Generar número de factura
    const invoiceNumber = await Invoice.generateInvoiceNumber();

    // Crear factura
    const invoice = new Invoice({
      invoiceNumber,
      workOrder: workOrderId,
      customer: workOrder.customer,
      issueDate: new Date(),
      dueDate: new Date(dueDate),
      notes,
      paymentTerms,
      createdBy: userId,
    });

    // Obtener ítems de la orden de trabajo
    const workOrderItems = await WorkOrderItem.find({
      workOrder: workOrderId,
      eliminado: false,
    })
      .populate("servicio")
      .populate("repuesto");

    // Guardar factura primero para obtener el _id
    await invoice.save();

    // Crear ítems de la factura desde los ítems de la OT
    const invoiceItems = [];
    let subtotalAcumulado = 0;

    for (const item of workOrderItems) {
      // Incluir todos los items (o filtrar por estado si es necesario)
      // Mapear tipos: "servicio" → "service", "repuesto" → "part"
      const itemType = item.tipo === "servicio" ? "service" : "part";
      const itemSubtotal = item.cantidad * item.precioUnitario;
      subtotalAcumulado += itemSubtotal;

      const invoiceItem = new InvoiceItem({
        invoice: invoice._id,
        type: itemType,
        service: item.servicio?._id,
        part: item.repuesto?._id,
        description: item.nombre || item.descripcion || "Item",
        quantity: item.cantidad,
        unitPrice: item.precioUnitario,
        subtotal: itemSubtotal,
        notes: item.notas,
      });

      invoiceItems.push(invoiceItem);
    }

    // Guardar items
    if (invoiceItems.length > 0) {
      await InvoiceItem.insertMany(invoiceItems);
    }

    // Actualizar totales de la factura
    invoice.subtotal = subtotalAcumulado;
    invoice.total = subtotalAcumulado; // Sin impuestos inicialmente
    invoice.balance = invoice.total;
    await invoice.save();

    // Poblar datos para respuesta
    await invoice.populate([
      { path: "workOrder", select: "workOrderNumber" },
      { path: "customer", select: "nombre email" },
    ]);

    res.status(201).json({
      success: true,
      message: "Factura creada exitosamente",
      data: invoice,
    });
  } catch (error) {
    console.error("Error al crear factura:", error);
    res.status(500).json({
      success: false,
      message: "Error al crear factura",
      error: error.message,
    });
  }
};

// Actualizar factura
const updateInvoice = async (req, res = response) => {
  try {
    const { id } = req.params;
    const { dueDate, notes, paymentTerms, status } = req.body;
    const userId = req.usuario._id;

    const invoice = await Invoice.findById(id);

    if (!invoice || invoice.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Factura no encontrada",
      });
    }

    // Solo permitir actualizar si está en borrador
    if (invoice.status !== "borrador") {
      return res.status(400).json({
        success: false,
        message: "Solo se pueden actualizar facturas en estado borrador",
      });
    }

    // Actualizar campos
    if (dueDate) invoice.dueDate = new Date(dueDate);
    if (notes !== undefined) invoice.notes = notes;
    if (paymentTerms !== undefined) invoice.paymentTerms = paymentTerms;
    if (status) invoice.status = status;

    invoice.updatedBy = userId;

    await invoice.save();

    res.json({
      success: true,
      message: "Factura actualizada exitosamente",
      data: invoice,
    });
  } catch (error) {
    console.error("Error al actualizar factura:", error);
    res.status(500).json({
      success: false,
      message: "Error al actualizar factura",
      error: error.message,
    });
  }
};

// Aplicar IVA a factura
const applyIVA = async (req, res = response) => {
  try {
    const { id } = req.params;
    const { ivaRate = 19 } = req.body;

    const invoice = await Invoice.findById(id);

    if (!invoice || invoice.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Factura no encontrada",
      });
    }

    if (invoice.status !== "borrador") {
      return res.status(400).json({
        success: false,
        message: "Solo se puede aplicar IVA a facturas en estado borrador",
      });
    }

    invoice.applyIVA(ivaRate);
    await invoice.save();

    res.json({
      success: true,
      message: "IVA aplicado exitosamente",
      data: invoice,
    });
  } catch (error) {
    console.error("Error al aplicar IVA:", error);
    res.status(500).json({
      success: false,
      message: "Error al aplicar IVA",
      error: error.message,
    });
  }
};

// Emitir factura (cambiar estado a emitida)
const emitInvoice = async (req, res = response) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id);

    if (!invoice || invoice.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Factura no encontrada",
      });
    }

    if (invoice.status !== "borrador") {
      return res.status(400).json({
        success: false,
        message: "La factura ya ha sido emitida",
      });
    }

    invoice.status = "emitida";
    await invoice.save();

    res.json({
      success: true,
      message: "Factura emitida exitosamente",
      data: invoice,
    });
  } catch (error) {
    console.error("Error al emitir factura:", error);
    res.status(500).json({
      success: false,
      message: "Error al emitir factura",
      error: error.message,
    });
  }
};

// Eliminar factura
const deleteInvoice = async (req, res = response) => {
  try {
    const { id } = req.params;

    const invoice = await Invoice.findById(id);

    if (!invoice || invoice.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Factura no encontrada",
      });
    }

    // Solo permitir eliminar si está en borrador
    if (invoice.status !== "borrador") {
      return res.status(400).json({
        success: false,
        message: "Solo se pueden eliminar facturas en estado borrador",
      });
    }

    // Marcar como eliminada (eliminación lógica)
    invoice.eliminado = true;
    await invoice.save();

    // Eliminar ítems asociados
    await InvoiceItem.updateMany({ invoice: id }, { eliminado: true });

    res.json({
      success: true,
      message: "Factura eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar factura:", error);
    res.status(500).json({
      success: false,
      message: "Error al eliminar factura",
      error: error.message,
    });
  }
};

// Obtener reportes de facturas
const getInvoiceReports = async (req, res = response) => {
  try {
    const { startDate, endDate, type, customer } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const baseFilter = { eliminado: false };
    if (startDate || endDate) {
      baseFilter.issueDate = dateFilter;
    }
    if (customer) baseFilter.customer = customer;

    let reportData = {};

    if (type === "invoices_issued") {
      // Reporte de facturas emitidas
      const filter = { ...baseFilter, status: "emitida" };

      const invoices = await Invoice.find(filter)
        .populate("customer", "nombre email telefono")
        .populate("workOrder", "workOrderNumber vehicle")
        .populate("items.product", "nombre precio")
        .sort({ issueDate: -1 });

      // Calcular estadísticas
      const totalInvoices = invoices.length;
      const totalAmount = invoices.reduce((sum, inv) => sum + inv.total, 0);
      const totalIVA = invoices.reduce((sum, inv) => sum + inv.ivaAmount, 0);
      const totalWithoutIVA = totalAmount - totalIVA;

      reportData = {
        type: "invoices_issued",
        period: { startDate, endDate },
        summary: {
          totalInvoices,
          totalAmount: totalAmount.toFixed(2),
          totalIVA: totalIVA.toFixed(2),
          totalWithoutIVA: totalWithoutIVA.toFixed(2),
        },
        invoices: invoices.map((inv) => ({
          id: inv._id,
          invoiceNumber: inv.invoiceNumber,
          issueDate: inv.issueDate,
          dueDate: inv.dueDate,
          customer: inv.customer,
          workOrder: inv.workOrder,
          subtotal: inv.subtotal,
          ivaAmount: inv.ivaAmount,
          total: inv.total,
          status: inv.status,
          notes: inv.notes,
          paymentTerms: inv.paymentTerms,
        })),
      };
    } else if (type === "accounts_receivable") {
      // Reporte de cuentas por cobrar
      // NOTA: Para cuentas por cobrar, generalmente queremos ver TODAS las facturas pendientes
      // independientemente de su fecha de emisión, pero podemos filtrar por fecha de vencimiento
      const arFilter = {
        eliminado: false,
        status: { $in: ["emitida", "pagada_parcial"] },
      };

      // Opcional: Si se especifican fechas, aplicar al dueDate en lugar de issueDate
      // Esto tiene más sentido para cuentas por cobrar
      if (customer) {
        arFilter.customer = customer;
      }

      // DEBUG: Log del filtro
      console.log(
        "[DEBUG] Filtro de cuentas por cobrar:",
        JSON.stringify(arFilter, null, 2)
      );

      const invoices = await Invoice.find(arFilter)
        .populate("customer", "nombre email telefono")
        .populate("workOrder", "workOrderNumber vehicle")
        .sort({ dueDate: 1 }); // Ordenar por fecha de vencimiento

      // DEBUG: Log de facturas encontradas
      console.log(
        `[DEBUG] Facturas encontradas con filtro: ${invoices.length}`
      );
      if (invoices.length > 0) {
        invoices.forEach((inv) => {
          console.log(
            `[DEBUG] - ${inv.invoiceNumber}: estado=${inv.status}, balance=${inv.balance}, paidAmount=${inv.paidAmount}, total=${inv.total}, issueDate=${inv.issueDate}`
          );
        });
      }

      // Obtener pagos para calcular saldos pendientes
      const invoiceIds = invoices.map((inv) => inv._id);
      const payments = await Payment.find({
        invoice: { $in: invoiceIds },
        status: "confirmado",
        eliminado: false,
      });

      console.log(`[DEBUG] Pagos encontrados: ${payments.length}`);
      if (payments.length > 0) {
        payments.forEach((p) => {
          console.log(
            `[DEBUG] - Pago: invoice=${p.invoice}, amount=${p.amount}, status=${p.status}`
          );
        });
      }

      // Calcular pagos por factura
      const paymentsByInvoice = payments.reduce((acc, payment) => {
        const invoiceId = payment.invoice.toString();
        if (!acc[invoiceId]) acc[invoiceId] = 0;
        acc[invoiceId] += payment.amount;
        return acc;
      }, {});

      // Calcular cuentas por cobrar
      const accountsReceivable = invoices.map((invoice) => {
        const paidAmount = paymentsByInvoice[invoice._id.toString()] || 0;
        const pendingAmount = invoice.total - paidAmount;

        return {
          id: invoice._id,
          invoiceNumber: invoice.invoiceNumber,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
          customer: invoice.customer,
          workOrder: invoice.workOrder,
          totalAmount: invoice.total,
          paidAmount,
          pendingAmount,
          status: invoice.status,
          daysOverdue: Math.max(
            0,
            Math.floor(
              (new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24)
            )
          ),
          paymentTerms: invoice.paymentTerms,
        };
      });

      // Filtrar solo facturas con saldo pendiente
      const pendingInvoices = accountsReceivable.filter(
        (inv) => inv.pendingAmount > 0
      );

      // Calcular estadísticas
      const totalReceivable = pendingInvoices.reduce(
        (sum, inv) => sum + inv.pendingAmount,
        0
      );
      const overdueInvoices = pendingInvoices.filter(
        (inv) => inv.daysOverdue > 0
      );
      const totalOverdue = overdueInvoices.reduce(
        (sum, inv) => sum + inv.pendingAmount,
        0
      );

      reportData = {
        type: "accounts_receivable",
        period: { startDate, endDate },
        summary: {
          totalPendingInvoices: pendingInvoices.length,
          totalReceivableAmount: totalReceivable.toFixed(2),
          overdueInvoices: overdueInvoices.length,
          totalOverdueAmount: totalOverdue.toFixed(2),
        },
        accountsReceivable: pendingInvoices,
        // DEBUG INFO (remover en producción)
        _debug: {
          totalInvoicesFound: invoices.length,
          totalPaymentsFound: payments.length,
          invoicesBeforeFilter: accountsReceivable.length,
          invoicesAfterFilter: pendingInvoices.length,
          sampleInvoices: invoices.slice(0, 3).map((inv) => ({
            number: inv.invoiceNumber,
            status: inv.status,
            total: inv.total,
            paidAmount: inv.paidAmount,
            balance: inv.balance,
          })),
        },
      };
    } else {
      return res.status(400).json({
        success: false,
        message:
          "Tipo de reporte no válido. Use: invoices_issued o accounts_receivable",
      });
    }

    res.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error("Error al obtener reportes:", error);
    res.status(500).json({
      success: false,
      message: "Error al obtener reportes",
      error: error.message,
    });
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
  createInvoiceFromWorkOrder,
  updateInvoice,
  applyIVA,
  emitInvoice,
  deleteInvoice,
  getInvoiceReports,
};
