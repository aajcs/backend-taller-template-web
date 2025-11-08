# 📊 Funcionalidad de Stock Mínimo

Sistema de alertas y monitoreo de stock mínimo para inventario.

## 🎯 Descripción

Esta funcionalidad permite configurar un stock mínimo para cada item del inventario y recibir alertas cuando el stock disponible cae por debajo de ese umbral. El sistema también genera sugerencias automáticas de órdenes de compra basadas en los niveles de stock.

## 📁 Archivos Creados

### 1. Servicio de Alertas

**Ubicación:** `features/inventory/services/stockAlerts.service.js`

Servicio principal que contiene la lógica de negocio para:

- Detectar items con stock bajo el mínimo
- Verificar alertas de items específicos
- Generar reportes de stock
- Calcular sugerencias de compra

### 2. Modelo de Alertas de Stock

**Ubicación:** `features/inventory/notifications/stockAlert.models.js`

Modelo Mongoose `StockAlert` para almacenar alertas de stock, incluyendo:

- Tipo de notificación (stock_minimo, stock_critico, etc.)
- Nivel de urgencia (info, advertencia, urgente, critico)
- Referencias a items y almacenes
- Estados de lectura

### 3. Controladores

**Ubicación:** `features/inventory/stock/stockAlerts.controllers.js`

Controladores HTTP para los endpoints de alertas de stock.

### 4. Rutas

**Ubicación:** `features/inventory/stock/stock.routes.js` (actualizado)

Rutas agregadas para acceder a la funcionalidad de alertas.

## 🔗 Endpoints API

### 1. Obtener items con stock bajo el mínimo

```http
GET /api/inventory/stock/alerts/below-minimum
```

**Query Parameters:**

- `warehouse` (opcional): ID del almacén para filtrar
- `categoria` (opcional): ID de categoría para filtrar

**Respuesta:**

```json
{
  "total": 3,
  "items": [
    {
      "_id": "...",
      "codigo": "BAT-12V-001",
      "nombre": "Batería 12V 100Ah",
      "stockMinimo": 5,
      "stockTotal": 2,
      "disponibleTotal": 2,
      "reservadoTotal": 0,
      "isBelowMinimum": true,
      "diferencia": 3,
      "porcentajeStock": 40,
      "nivelAlerta": "urgente"
    }
  ],
  "mensaje": "Se encontraron 3 items con stock por debajo del mínimo"
}
```

### 2. Verificar alerta de un item específico

```http
GET /api/inventory/stock/alerts/item/:itemId
```

**Query Parameters:**

- `warehouse` (opcional): ID del almacén para verificar

**Respuesta:**

```json
{
  "_id": "...",
  "nombre": "Batería 12V 100Ah",
  "codigo": "BAT-12V-001",
  "stockMinimo": 5,
  "hasMinimum": true,
  "stockTotal": 2,
  "disponibleTotal": 2,
  "isBelowMinimum": true,
  "diferencia": 3,
  "porcentajeStock": 40,
  "nivelAlerta": "urgente",
  "message": "Stock por debajo del mínimo. Faltan 3 unidades.",
  "stocks": [
    {
      "warehouse": {...},
      "cantidad": 2,
      "reservado": 0
    }
  ]
}
```

### 3. Generar reporte de stock

```http
GET /api/inventory/stock/alerts/report
```

**Query Parameters:**

- `warehouse` (opcional): ID del almacén
- `categoria` (opcional): ID de categoría

**Respuesta:**

```json
{
  "fecha": "2025-11-07T00:00:00.000Z",
  "resumen": {
    "totalItemsConMinimo": 50,
    "totalConStockBajo": 8,
    "criticos": 2,
    "urgentes": 3,
    "advertencias": 3,
    "ok": 42
  },
  "items": {
    "criticos": [...],
    "urgentes": [...],
    "advertencias": [...],
    "todos": [...]
  }
}
```

### 4. Obtener sugerencias de órdenes de compra

```http
GET /api/inventory/stock/alerts/purchase-suggestions
```

**Query Parameters:**

- `warehouse` (opcional): ID del almacén
- `categoria` (opcional): ID de categoría

**Respuesta:**

```json
{
  "total": 5,
  "sugerencias": [
    {
      "item": {
        "id": "...",
        "codigo": "BAT-12V-001",
        "nombre": "Batería 12V 100Ah",
        "marca": {...},
        "categoria": {...}
      },
      "stockActual": 2,
      "stockMinimo": 5,
      "faltante": 3,
      "cantidadSugerida": 7,
      "nivelUrgencia": "urgente",
      "porcentajeStock": 40
    }
  ],
  "mensaje": "Se generaron 5 sugerencias de compra"
}
```

## 🎚️ Niveles de Alerta

El sistema clasifica las alertas en 4 niveles:

| Nivel         | Porcentaje de Stock | Descripción                               |
| ------------- | ------------------- | ----------------------------------------- |
| `ok`          | ≥ 100%              | Stock suficiente                          |
| `advertencia` | 50% - 99%           | Stock bajo, próximo al mínimo             |
| `urgente`     | 1% - 49%            | Stock crítico, reabastecimiento necesario |
| `critico`     | 0%                  | Sin stock disponible                      |

## 📝 Configuración de Stock Mínimo

Para que un item tenga alertas de stock mínimo, debe configurarse el campo `stockMinimo` en el modelo Item:

```javascript
// Ejemplo al crear un item
{
  "nombre": "Batería 12V 100Ah",
  "codigo": "BAT-12V-001",
  "stockMinimo": 5,  // Cantidad mínima requerida
  "stockMaximo": 30,
  ...
}
```

## 🔄 Cálculo de Sugerencias de Compra

La cantidad sugerida se calcula con la siguiente fórmula:

```
cantidadSugerida = faltante + (stockMinimo × 0.20)
```

Esto asegura que se ordene suficiente stock para:

1. Cubrir el faltante actual
2. Agregar un 20% de buffer adicional

## 🧪 Testing

El test `test-minimum-stock-alert.js` valida:

✅ Detección de items con stock por debajo del mínimo
✅ Cálculo correcto de porcentajes y diferencias
✅ Clasificación de niveles de alerta
✅ Generación de sugerencias de compra
✅ Reportes completos de stock

**Ejecutar test:**

```bash
node tests/test-minimum-stock-alert.js
```

## 💡 Casos de Uso

### 1. Dashboard de Alertas

```javascript
const alertas = await stockAlertsService.getItemsBelowMinimum();
// Mostrar items que requieren atención inmediata
```

### 2. Generar Orden de Compra Automática

```javascript
const sugerencias = await stockAlertsService.getSuggestedPurchaseOrders();
// Crear órdenes de compra basadas en sugerencias
```

### 3. Notificaciones Periódicas

```javascript
const reporte = await stockAlertsService.generateStockReport();
// Enviar reporte diario por email a los encargados
```

### 4. Verificar Item Antes de Reservar

```javascript
const alerta = await stockAlertsService.checkItemAlert(itemId, warehouseId);
if (alerta.isBelowMinimum) {
  console.warn(`Advertencia: Stock bajo del mínimo`);
}
```

## 📊 Integración con Frontend

### Ejemplo de componente React

```javascript
import { useEffect, useState } from "react";

const StockAlertsWidget = () => {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const fetchAlerts = async () => {
      const response = await fetch("/api/inventory/stock/alerts/below-minimum");
      const data = await response.json();
      setAlerts(data.items);
    };
    fetchAlerts();

    // Actualizar cada 5 minutos
    const interval = setInterval(fetchAlerts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="alerts-widget">
      <h3>⚠️ Alertas de Stock ({alerts.length})</h3>
      {alerts.map((item) => (
        <div key={item._id} className={`alert alert-${item.nivelAlerta}`}>
          <strong>{item.nombre}</strong>
          <span>
            Stock: {item.disponibleTotal} / {item.stockMinimo}
          </span>
          <span>{item.porcentajeStock}%</span>
        </div>
      ))}
    </div>
  );
};
```

## 🔐 Permisos

Se recomienda configurar permisos en las rutas según roles:

- **Consultar alertas**: Todos los usuarios autenticados
- **Ver reportes completos**: Admin, Almacenista
- **Generar sugerencias de compra**: Admin, Compras

## 🎯 Próximas Mejoras

- [ ] Sistema de notificaciones por email
- [ ] Notificaciones push en tiempo real
- [ ] Historial de alertas
- [ ] Configuración de umbrales personalizados por almacén
- [ ] Predicción de stock basada en consumo histórico
- [ ] Integración con sistema de órdenes de compra automático

## 📚 Referencias

- [Documentación de Inventario](../features/inventory/README.md)
- [API de Stock](../features/inventory/stock/)
- [Modelos de Datos](../features/inventory/models/)
