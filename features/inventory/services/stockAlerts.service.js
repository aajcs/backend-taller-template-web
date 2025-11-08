const { Stock, Item } = require("../models");

/**
 * Servicio para detectar y gestionar alertas de stock mínimo
 */
const stockAlertsService = {
  /**
   * Obtener todos los items que están por debajo del stock mínimo
   * @param {Object} filters - Filtros opcionales (warehouse, categoria)
   * @returns {Promise<Array>} Lista de items con stock bajo
   */
  async getItemsBelowMinimum(filters = {}) {
    try {
      // Construir query base
      const query = { eliminado: false, estado: "activo" };

      // Agregar filtros si se proporcionan
      if (filters.categoria) {
        query.categoria = filters.categoria;
      }

      // Buscar todos los items activos
      const items = await Item.find(query).populate("marca categoria").lean();

      // Filtrar items que tienen stockMinimo definido
      const itemsWithMinimum = items.filter(
        (item) => item.stockMinimo && item.stockMinimo > 0
      );

      // Obtener stock para cada item
      const itemsWithStockInfo = await Promise.all(
        itemsWithMinimum.map(async (item) => {
          const stockQuery = {
            item: item._id,
            eliminado: false,
          };

          // Filtrar por almacén si se proporciona
          if (filters.warehouse) {
            stockQuery.warehouse = filters.warehouse;
          }

          // Obtener todos los stocks del item
          const stocks = await Stock.find(stockQuery)
            .populate("warehouse")
            .lean();

          // Calcular stock total disponible
          const stockTotal = stocks.reduce(
            (sum, s) => sum + (s.cantidad || 0),
            0
          );
          const reservadoTotal = stocks.reduce(
            (sum, s) => sum + (s.reservado || 0),
            0
          );
          const disponibleTotal = stockTotal - reservadoTotal;

          return {
            ...item,
            stockTotal,
            reservadoTotal,
            disponibleTotal,
            stocks,
            isBelowMinimum: disponibleTotal < item.stockMinimo,
            diferencia: item.stockMinimo - disponibleTotal,
            porcentajeStock: item.stockMinimo
              ? (disponibleTotal / item.stockMinimo) * 100
              : 0,
          };
        })
      );

      // Filtrar solo los que están por debajo del mínimo
      const itemsBelowMinimum = itemsWithStockInfo.filter(
        (item) => item.isBelowMinimum
      );

      // Ordenar por criticidad (menor porcentaje primero)
      itemsBelowMinimum.sort((a, b) => a.porcentajeStock - b.porcentajeStock);

      return itemsBelowMinimum;
    } catch (error) {
      console.error("Error al obtener items con stock bajo:", error);
      throw error;
    }
  },

  /**
   * Verificar si un item específico está por debajo del stock mínimo
   * @param {String} itemId - ID del item
   * @param {String} warehouseId - ID del almacén (opcional)
   * @returns {Promise<Object>} Información del item y su estado de stock
   */
  async checkItemAlert(itemId, warehouseId = null) {
    try {
      const item = await Item.findOne({
        _id: itemId,
        eliminado: false,
      })
        .populate("marca categoria")
        .lean();

      if (!item) {
        throw new Error("Item no encontrado");
      }

      // Si no tiene stock mínimo definido, no hay alerta
      if (!item.stockMinimo || item.stockMinimo <= 0) {
        return {
          ...item,
          hasMinimum: false,
          message: "Item no tiene stock mínimo configurado",
        };
      }

      const stockQuery = {
        item: itemId,
        eliminado: false,
      };

      if (warehouseId) {
        stockQuery.warehouse = warehouseId;
      }

      const stocks = await Stock.find(stockQuery).populate("warehouse").lean();

      const stockTotal = stocks.reduce((sum, s) => sum + (s.cantidad || 0), 0);
      const reservadoTotal = stocks.reduce(
        (sum, s) => sum + (s.reservado || 0),
        0
      );
      const disponibleTotal = stockTotal - reservadoTotal;

      const isBelowMinimum = disponibleTotal < item.stockMinimo;
      const diferencia = item.stockMinimo - disponibleTotal;
      const porcentajeStock = item.stockMinimo
        ? (disponibleTotal / item.stockMinimo) * 100
        : 0;

      let nivelAlerta = "ok";
      if (porcentajeStock === 0) {
        nivelAlerta = "critico";
      } else if (porcentajeStock < 50) {
        nivelAlerta = "urgente";
      } else if (porcentajeStock < 100) {
        nivelAlerta = "advertencia";
      }

      return {
        ...item,
        hasMinimum: true,
        stockTotal,
        reservadoTotal,
        disponibleTotal,
        stocks,
        isBelowMinimum,
        diferencia,
        porcentajeStock: Math.round(porcentajeStock * 100) / 100,
        nivelAlerta,
        message: isBelowMinimum
          ? `Stock por debajo del mínimo. Faltan ${diferencia} unidades.`
          : "Stock en nivel normal",
      };
    } catch (error) {
      console.error("Error al verificar alerta de item:", error);
      throw error;
    }
  },

  /**
   * Generar reporte de stock con estadísticas
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Object>} Reporte con estadísticas
   */
  async generateStockReport(filters = {}) {
    try {
      const itemsBelowMinimum = await this.getItemsBelowMinimum(filters);

      // Obtener todos los items con stockMinimo configurado
      const query = {
        eliminado: false,
        estado: "activo",
        stockMinimo: { $gt: 0 },
      };

      if (filters.categoria) {
        query.categoria = filters.categoria;
      }

      const totalItemsWithMinimum = await Item.countDocuments(query);

      const criticos = itemsBelowMinimum.filter(
        (item) => item.porcentajeStock === 0
      );
      const urgentes = itemsBelowMinimum.filter(
        (item) => item.porcentajeStock > 0 && item.porcentajeStock < 50
      );
      const advertencias = itemsBelowMinimum.filter(
        (item) => item.porcentajeStock >= 50 && item.porcentajeStock < 100
      );

      return {
        fecha: new Date(),
        resumen: {
          totalItemsConMinimo: totalItemsWithMinimum,
          totalConStockBajo: itemsBelowMinimum.length,
          criticos: criticos.length,
          urgentes: urgentes.length,
          advertencias: advertencias.length,
          ok: totalItemsWithMinimum - itemsBelowMinimum.length,
        },
        items: {
          criticos,
          urgentes,
          advertencias,
          todos: itemsBelowMinimum,
        },
      };
    } catch (error) {
      console.error("Error al generar reporte de stock:", error);
      throw error;
    }
  },

  /**
   * Obtener sugerencias de compra basadas en stock mínimo
   * @param {Object} filters - Filtros opcionales
   * @returns {Promise<Array>} Lista de items con sugerencias de compra
   */
  async getSuggestedPurchaseOrders(filters = {}) {
    try {
      const itemsBelowMinimum = await this.getItemsBelowMinimum(filters);

      return itemsBelowMinimum.map((item) => {
        // Calcular cantidad sugerida (mínimo + 20% de buffer)
        const cantidadSugerida = Math.ceil(
          item.diferencia + item.stockMinimo * 0.2
        );

        return {
          item: {
            id: item._id,
            codigo: item.codigo,
            nombre: item.nombre,
            marca: item.marca,
            categoria: item.categoria,
          },
          stockActual: item.disponibleTotal,
          stockMinimo: item.stockMinimo,
          faltante: item.diferencia,
          cantidadSugerida,
          nivelUrgencia: item.nivelAlerta,
          porcentajeStock: item.porcentajeStock,
        };
      });
    } catch (error) {
      console.error("Error al generar sugerencias de compra:", error);
      throw error;
    }
  },
};

module.exports = stockAlertsService;
