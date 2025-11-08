const { response, request } = require("express");
const stockAlertsService = require("../services/stockAlerts.service");

/**
 * Obtener items con stock por debajo del mínimo
 */
const getItemsBelowMinimum = async (req = request, res = response, next) => {
  try {
    const filters = {};

    // Filtros opcionales desde query params
    if (req.query.warehouse) {
      filters.warehouse = req.query.warehouse;
    }
    if (req.query.categoria) {
      filters.categoria = req.query.categoria;
    }

    const items = await stockAlertsService.getItemsBelowMinimum(filters);

    res.json({
      total: items.length,
      items,
      mensaje:
        items.length > 0
          ? `Se encontraron ${items.length} items con stock por debajo del mínimo`
          : "Todos los items tienen stock suficiente",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Verificar alerta de un item específico
 */
const checkItemAlert = async (req = request, res = response, next) => {
  try {
    const { itemId } = req.params;
    const { warehouse } = req.query;

    const alert = await stockAlertsService.checkItemAlert(itemId, warehouse);

    res.json(alert);
  } catch (err) {
    next(err);
  }
};

/**
 * Generar reporte de stock con estadísticas
 */
const generateStockReport = async (req = request, res = response, next) => {
  try {
    const filters = {};

    if (req.query.warehouse) {
      filters.warehouse = req.query.warehouse;
    }
    if (req.query.categoria) {
      filters.categoria = req.query.categoria;
    }

    const reporte = await stockAlertsService.generateStockReport(filters);

    res.json(reporte);
  } catch (err) {
    next(err);
  }
};

/**
 * Obtener sugerencias de compra basadas en stock mínimo
 */
const getSuggestedPurchaseOrders = async (
  req = request,
  res = response,
  next
) => {
  try {
    const filters = {};

    if (req.query.warehouse) {
      filters.warehouse = req.query.warehouse;
    }
    if (req.query.categoria) {
      filters.categoria = req.query.categoria;
    }

    const sugerencias =
      await stockAlertsService.getSuggestedPurchaseOrders(filters);

    res.json({
      total: sugerencias.length,
      sugerencias,
      mensaje:
        sugerencias.length > 0
          ? `Se generaron ${sugerencias.length} sugerencias de compra`
          : "No hay sugerencias de compra en este momento",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getItemsBelowMinimum,
  checkItemAlert,
  generateStockReport,
  getSuggestedPurchaseOrders,
};
