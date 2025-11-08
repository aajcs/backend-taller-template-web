# 📦 SalesOrder API - Documentación Frontend

## 🔗 Base URL

```
/api/inventory/salesOrder
```

## 🔐 Autenticación

Todas las rutas requieren header JWT:

```
x-token: <jwt_token>
```

---

## 📋 Endpoints

### 1. **Crear Orden de Venta (Draft)**

```http
POST /api/inventory/salesOrder
```

**Request Body:**

```json
{
  "numero": "SO-2025-001",
  "cliente": "Cliente XYZ S.A.",
  "items": [
    {
      "item": "676abc123...",
      "cantidad": 100,
      "precioUnitario": 25.5
    },
    {
      "item": "676def456...",
      "cantidad": 50,
      "precioUnitario": 45.0
    }
  ]
}
```

**Campos opcionales:**

- `numero` (auto-generado si no se provee: `SO-<timestamp>`)
- `cliente`
- `precioUnitario` (default: 0)

**Response 201:**

```json
{
  "id": "676...",
  "numero": "SO-2025-001",
  "cliente": "Cliente XYZ S.A.",
  "fecha": "2025-11-03T10:00:00.000Z",
  "estado": "borrador",
  "items": [
    {
      "item": "676abc123...",
      "cantidad": 100,
      "precioUnitario": 25.5,
      "reservado": 0,
      "entregado": 0,
      "_id": "676..."
    },
    {
      "item": "676def456...",
      "cantidad": 50,
      "precioUnitario": 45.0,
      "reservado": 0,
      "entregado": 0,
      "_id": "676..."
    }
  ],
  "reservations": [],
  "eliminado": false,
  "createdAt": "2025-11-03T10:00:00.000Z",
  "updatedAt": "2025-11-03T10:00:00.000Z"
}
```

---

### 2. **Listar Órdenes de Venta**

```http
GET /api/inventory/salesOrder
```

**Response 200:**

```json
[
  {
    "id": "676...",
    "numero": "SO-2025-001",
    "cliente": "Cliente XYZ S.A.",
    "fecha": "2025-11-03T10:00:00.000Z",
    "estado": "confirmada",
    "items": [...],
    "reservations": [
      {
        "_id": "676res...",
        "item": {
          "_id": "676abc...",
          "nombre": "Producto A",
          "codigo": "PROD-A"
        },
        "warehouse": {
          "_id": "676wh...",
          "nombre": "Almacén Central",
          "codigo": "ALM-01"
        },
        "cantidad": 100,
        "estado": "activo"
      }
    ],
    "fechaConfirmacion": "2025-11-03T10:05:00.000Z",
    "createdAt": "2025-11-03T10:00:00.000Z",
    "updatedAt": "2025-11-03T10:05:00.000Z"
  }
]
```

---

### 3. **Obtener Orden Específica**

```http
GET /api/inventory/salesOrder/:id
```

**Response 200:** (mismo formato que list, pero objeto individual)
**Response 404:** Orden no encontrada

---

### 4. **Actualizar Orden (Draft/Pendiente)**

```http
PUT /api/inventory/salesOrder/:id
```

**Request Body:**

```json
{
  "cliente": "Cliente Actualizado S.A.",
  "items": [
    {
      "item": "676abc123...",
      "cantidad": 150,
      "precioUnitario": 26.0
    }
  ]
}
```

**⚠️ Nota:** Solo editable si estado es "borrador" o "pendiente"

---

### 5. **Confirmar Orden** 🔥

```http
POST /api/inventory/salesOrder/:id/confirm
```

**Request Body:**

```json
{
  "warehouse": "676wh123...",
  "idempotencyKey": "confirm-SO-2025-001-1730635200000"
}
```

**Campos:**

- `warehouse` _(requerido)_: ID del almacén desde donde reservar
- `idempotencyKey` _(opcional pero recomendado)_: String único para idempotencia

**Validaciones:**

- Estado debe ser "borrador" o "pendiente"
- Verifica stock disponible: `disponible = stock.cantidad - stock.reservado`
- Si no hay stock, devuelve error 400

**Response 200:**

```json
{
  "id": "676...",
  "numero": "SO-2025-001",
  "estado": "confirmada",
  "fechaConfirmacion": "2025-11-03T10:05:00.000Z"ß,
  "confirmIdempotencyKey": "confirm-SO-2025-001-1730635200000",
  "items": [
    {
      "item": "676abc123...",
      "cantidad": 100,
      "reservado": 100,
      "entregado": 0,
      "_id": "676..."
    }
  ],
  "reservations": [
    {
      "_id": "676res...",
      "item": {
        "_id": "676abc...",
        "nombre": "Producto A",
        "codigo": "PROD-A"
      },
      "warehouse": {
        "_id": "676wh...",
        "nombre": "Almacén Central",
        "codigo": "ALM-01"
      },
      "cantidad": 100,
      "estado": "activo",
      "origenTipo": "SalesOrder",
      "origen": "676..."
    }
  ],
  "createdAt": "2025-11-03T10:00:00.000Z",
  "updatedAt": "2025-11-03T10:05:00.000Z"
}
```

**Efectos:**

- Crea `Reservation` por cada línea
- Incrementa `Stock.reservado`
- Actualiza líneas: `line.reservado = cantidad`
- Cambia estado a "confirmada"
- Asigna `fechaConfirmacion`

**Errores:**

- **400**: Stock insuficiente, warehouse faltante, estado inválido
- **404**: Orden no encontrada
- **409**: Ya confirmada con diferente idempotencyKey

---

### 6. **Despachar Orden (Completa o Parcial)** 🔥🔥

```http
POST /api/inventory/salesOrder/:id/ship
```

#### **Opción A: Despacho Completo**

```json
{
  "idempotencyKey": "ship-SO-2025-001-1730635800000"
}
```

- Despacha **todas** las líneas completas
- Marca todas las reservations como "consumido"
- Crea movements tipo "salida" por cada reserva
- Actualiza `line.entregado = line.cantidad` para todas las líneas
- Estado final: "despachada"
- Asigna `fechaDespacho`

#### **Opción B: Despacho Parcial** ⭐ NUEVO

```json
{
  "idempotencyKey": "ship-SO-2025-001-part1-1730635800000",
  "items": [
    {
      "item": "676abc123...",
      "cantidad": 30
    },
    {
      "item": "676def456...",
      "cantidad": 50
    }
  ]
}
```

**Campos:**

- `items` _(opcional)_: Array de items a despachar con cantidades específicas
- `idempotencyKey` _(recomendado)_

**Validaciones:**

- Estado debe ser "confirmada" o "parcial"
- Si `cantidad > cantidadPendiente`, usa `cantidadPendiente` (clamp)
- Verifica que exista reserva activa para cada item

**Response 200 (Parcial):**

```json
{
  "id": "676...",
  "numero": "SO-2025-001",
  "estado": "parcial",
  "items": [
    {
      "item": "676abc123...",
      "cantidad": 100,
      "reservado": 100,
      "entregado": 30,
      "_id": "676..."
    },
    {
      "item": "676def456...",
      "cantidad": 50,
      "reservado": 50,
      "entregado": 50,
      "_id": "676..."
    }
  ],
  "reservations": [
    {
      "_id": "676res1...",
      "item": {...},
      "warehouse": {...},
      "cantidad": 100,
      "estado": "activo"
    },
    {
      "_id": "676res2...",
      "item": {...},
      "warehouse": {...},
      "cantidad": 50,
      "estado": "consumido"
    }
  ],
  "shipIdempotencyKey": "ship-SO-2025-001-part1-1730635800000",
  "updatedAt": "2025-11-03T10:10:00.000Z"
}
```

**Response 200 (Completo):**

```json
{
  "id": "676...",
  "numero": "SO-2025-001",
  "estado": "despachada",
  "fechaDespacho": "2025-11-03T10:15:00.000Z",
  "items": [
    {
      "item": "676abc123...",
      "cantidad": 100,
      "reservado": 100,
      "entregado": 100,
      "_id": "676..."
    }
  ],
  "reservations": [
    {
      "_id": "676res...",
      "estado": "consumido"
    }
  ]
}
```

**Lógica de Estado:**

```javascript
// Calcula automáticamente:
const allDelivered = items.every((line) => line.entregado >= line.cantidad);
estado = allDelivered ? "despachada" : "parcial";

// fechaDespacho solo se asigna cuando estado === "despachada"
```

**Efectos:**

- Crea `Movement` tipo "salida" por cada item despachado
- Decrementa `Stock.cantidad`
- Decrementa `Stock.reservado`
- Incrementa `line.entregado`
- Marca reservations como "consumido" solo si línea completa
- Actualiza estado a "parcial" o "despachada"

**Errores:**

- **400**: Estado inválido, item no encontrado, ya completamente entregado
- **404**: Orden no encontrada
- **409**: Ya despachada con diferente idempotencyKey

---

### 7. **Cancelar Orden** 🔥

```http
POST /api/inventory/salesOrder/:id/cancel
```

**Request Body:**

```json
{
  "idempotencyKey": "cancel-SO-2025-001-1730636000000"
}
```

**Validaciones:**

- Estado debe ser "borrador", "pendiente", "confirmada" o "parcial"
- No se puede cancelar si estado es "despachada" o "cancelada"

**Response 200:**

```json
{
  "id": "676...",
  "numero": "SO-2025-001",
  "estado": "cancelada",
  "fechaCancelacion": "2025-11-03T10:20:00.000Z",
  "cancelIdempotencyKey": "cancel-SO-2025-001-1730636000000",
  "reservations": [
    {
      "_id": "676res...",
      "estado": "liberado"
    }
  ]
}
```

**Efectos:**

- Marca todas las `Reservation` como "liberado"
- **Decrementa `Stock.reservado`** (FIX aplicado en Fase 1)
- Cambia estado a "cancelada"
- Asigna `fechaCancelacion`

**Errores:**

- **400**: Estado no permite cancelación
- **404**: Orden no encontrada
- **409**: Ya cancelada con diferente idempotencyKey

---

## 🎯 Flujos de Negocio

### **Flujo 1: Orden Completa (Sin Parciales)**

```
1. POST /salesOrder              → estado: "borrador"
2. POST /:id/confirm             → estado: "confirmada"
3. POST /:id/ship (sin items)    → estado: "despachada"
```

### **Flujo 2: Orden con Despachos Parciales**

```
1. POST /salesOrder              → estado: "borrador"
2. POST /:id/confirm             → estado: "confirmada"
3. POST /:id/ship { items: [...] } → estado: "parcial"
4. POST /:id/ship { items: [...] } → estado: "parcial"
5. POST /:id/ship { items: [...] } → estado: "despachada"
```

### **Flujo 3: Cancelación**

```
1. POST /salesOrder              → estado: "borrador"
2. POST /:id/confirm             → estado: "confirmada"
3. POST /:id/cancel              → estado: "cancelada"
```

---

## 🔒 Manejo de Idempotencia

### **¿Qué es idempotencyKey?**

String único que previene duplicados en reintentos de red. Si se repite la request con el mismo key, el servidor devuelve el resultado anterior sin procesar nuevamente.

### **Generación Recomendada:**

```javascript
const generateIdempotencyKey = (operation, orderId) => {
  return `${operation}-${orderId}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
};

// Ejemplos:
confirm: "confirm-SO-2025-001-1730635200000-a7b3x";
ship: "ship-SO-2025-001-1730635800000-k9m2p";
cancel: "cancel-SO-2025-001-1730636000000-f4n8q";
```

### **Uso en Frontend:**

```javascript
// Guardar key en state/localStorage antes de enviar
const idempotencyKey = generateIdempotencyKey("confirm", orderId);
localStorage.setItem(`pending-confirm-${orderId}`, idempotencyKey);

try {
  const response = await confirmOrder(orderId, warehouse, idempotencyKey);
  localStorage.removeItem(`pending-confirm-${orderId}`);
  return response;
} catch (error) {
  if (error.status === 409) {
    // Ya procesada con otro key
    console.error("Order already confirmed");
  } else {
    // Reintentar con el mismo key
    const savedKey = localStorage.getItem(`pending-confirm-${orderId}`);
    await confirmOrder(orderId, warehouse, savedKey);
  }
}
```

---

## 📊 Modelo de Datos (SalesOrder)

```typescript
interface SalesOrder {
  id: string;
  numero: string; // Único
  cliente?: string;
  fecha: Date; // Default: now
  estado:
    | "borrador"
    | "pendiente"
    | "confirmada"
    | "parcial"
    | "despachada"
    | "cancelada";

  items: SalesLine[];
  reservations: Reservation[]; // Populated con item y warehouse

  // Idempotency
  confirmIdempotencyKey?: string; // Único, sparse
  shipIdempotencyKey?: string; // Único, sparse
  cancelIdempotencyKey?: string; // Único, sparse

  // Tracking
  fechaConfirmacion?: Date;
  fechaDespacho?: Date;
  fechaCancelacion?: Date;

  // Audit
  creadoPor?: string;
  eliminado: boolean; // Default: false
  createdAt: Date;
  updatedAt: Date;
  historial?: HistorialEntry[]; // Plugin de auditoría
}

interface SalesLine {
  _id: string;
  item: string; // ObjectId → Item
  cantidad: number; // Min: 1
  precioUnitario: number; // Default: 0
  reservado: number; // Default: 0
  entregado: number; // Default: 0
}

interface Reservation {
  _id: string;
  item: {
    _id: string;
    nombre: string;
    codigo: string;
  };
  warehouse: {
    _id: string;
    nombre: string;
    codigo: string;
  };
  cantidad: number;
  estado: "activo" | "liberado" | "consumido" | "cancelado";
  origenTipo: "SalesOrder";
  origen: string; // SalesOrder ID
}
```

---

## 🚨 Códigos de Error

| Código | Descripción                                             |
| ------ | ------------------------------------------------------- |
| 400    | Validación fallida, estado inválido, stock insuficiente |
| 404    | SalesOrder no encontrada                                |
| 409    | Conflicto de idempotencyKey (ya procesada con otro key) |
| 422    | Error de validación express-validator                   |
| 500    | Error interno del servidor                              |

---

## 💡 Ejemplos de Integración Frontend

### **React Hook: useSalesOrder**

```javascript
import { useState } from "react";

const API_BASE = "/api/inventory/salesOrder";

const useSalesOrder = (token) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const headers = {
    "Content-Type": "application/json",
    "x-token": token,
  };

  const createOrder = async (orderData) => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers,
        body: JSON.stringify(orderData),
      });
      if (!res.ok) throw await res.json();
      return await res.json();
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const confirmOrder = async (id, warehouse, idempotencyKey) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${id}/confirm`, {
        method: "POST",
        headers,
        body: JSON.stringify({ warehouse, idempotencyKey }),
      });
      if (!res.ok) throw await res.json();
      return await res.json();
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const shipOrder = async (id, items, idempotencyKey) => {
    setLoading(true);
    try {
      const body = { idempotencyKey };
      if (items && items.length > 0) body.items = items;

      const res = await fetch(`${API_BASE}/${id}/ship`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) throw await res.json();
      return await res.json();
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (id, idempotencyKey) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${id}/cancel`, {
        method: "POST",
        headers,
        body: JSON.stringify({ idempotencyKey }),
      });
      if (!res.ok) throw await res.json();
      return await res.json();
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const listOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE, { headers });
      if (!res.ok) throw await res.json();
      return await res.json();
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getOrder = async (id) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${id}`, { headers });
      if (!res.ok) throw await res.json();
      return await res.json();
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    createOrder,
    confirmOrder,
    shipOrder,
    cancelOrder,
    listOrders,
    getOrder,
  };
};

export default useSalesOrder;
```

### **Componente: ShipOrderModal (Despacho Parcial)**

```javascript
import React, { useState } from "react";

const ShipOrderModal = ({ order, onShip, onClose }) => {
  const [itemsToShip, setItemsToShip] = useState(
    order.items.map((line) => ({
      item: line.item,
      cantidad: line.cantidad - (line.entregado || 0),
      maxCantidad: line.cantidad - (line.entregado || 0),
    }))
  );

  const handleQuantityChange = (index, value) => {
    const newItems = [...itemsToShip];
    newItems[index].cantidad = Math.min(
      Math.max(0, parseInt(value) || 0),
      newItems[index].maxCantidad
    );
    setItemsToShip(newItems);
  };

  const handleShipFull = () => {
    const idempotencyKey = `ship-${order.numero}-full-${Date.now()}`;
    onShip(order.id, null, idempotencyKey); // null = full ship
  };

  const handleShipPartial = () => {
    const items = itemsToShip
      .filter((item) => item.cantidad > 0)
      .map((item) => ({ item: item.item, cantidad: item.cantidad }));

    if (items.length === 0) {
      alert("Debe seleccionar al menos un item con cantidad > 0");
      return;
    }

    const idempotencyKey = `ship-${order.numero}-partial-${Date.now()}`;
    onShip(order.id, items, idempotencyKey);
  };

  return (
    <div className="modal">
      <h2>Despachar Orden {order.numero}</h2>

      <div className="items-list">
        {order.items.map((line, index) => (
          <div key={line._id} className="item-row">
            <span>{line.item?.nombre || line.item}</span>
            <div>
              <label>Cantidad a despachar:</label>
              <input
                type="number"
                min="0"
                max={itemsToShip[index].maxCantidad}
                value={itemsToShip[index].cantidad}
                onChange={(e) => handleQuantityChange(index, e.target.value)}
              />
              <span>/ {itemsToShip[index].maxCantidad} pendiente</span>
            </div>
            <div>
              <small>
                Total: {line.cantidad} | Entregado: {line.entregado || 0} |
                Pendiente: {line.cantidad - (line.entregado || 0)}
              </small>
            </div>
          </div>
        ))}
      </div>

      <div className="actions">
        <button onClick={handleShipFull}>Despachar Todo</button>
        <button onClick={handleShipPartial}>Despacho Parcial</button>
        <button onClick={onClose}>Cancelar</button>
      </div>
    </div>
  );
};

export default ShipOrderModal;
```

### **Visualización de Estado con Badges**

```javascript
const OrderStatusBadge = ({ estado }) => {
  const config = {
    borrador: { color: "gray", label: "Borrador" },
    pendiente: { color: "yellow", label: "Pendiente" },
    confirmada: { color: "blue", label: "Confirmada" },
    parcial: { color: "orange", label: "Parcial" },
    despachada: { color: "green", label: "Despachada" },
    cancelada: { color: "red", label: "Cancelada" },
  };

  const { color, label } = config[estado] || config.borrador;

  return <span className={`badge badge-${color}`}>{label}</span>;
};
```

### **Progreso de Despacho**

```javascript
const ShipmentProgress = ({ order }) => {
  const totalItems = order.items.reduce((sum, line) => sum + line.cantidad, 0);
  const shippedItems = order.items.reduce(
    (sum, line) => sum + (line.entregado || 0),
    0
  );
  const percentage = (shippedItems / totalItems) * 100;

  return (
    <div className="shipment-progress">
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${percentage}%` }} />
      </div>
      <span>
        {shippedItems} / {totalItems} items despachados ({percentage.toFixed(1)}
        %)
      </span>

      <div className="items-detail">
        {order.items.map((line) => (
          <div key={line._id}>
            <span>{line.item?.nombre}</span>
            <span>
              {line.entregado || 0} / {line.cantidad}
            </span>
            <span>
              {line.entregado >= line.cantidad
                ? "✅"
                : line.entregado > 0
                  ? "⏳"
                  : "⬜"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## 📝 Notas Importantes

1. **Idempotencia es crítica**: Siempre incluir `idempotencyKey` en operaciones confirm/ship/cancel para evitar duplicados en reintentos
2. **Despacho parcial**: El campo `items` en ship es opcional. Si se omite, se despacha todo
3. **Estado automático**: El backend calcula si es "parcial" o "despachada" basado en `line.entregado`
4. **Fechas de tracking**: `fechaDespacho` solo se asigna cuando estado cambia a "despachada", no en despachos parciales
5. **Populate**: Todas las responses incluyen datos completos de `item` y `warehouse` en las reservations
6. **Transacciones**: Todas las operaciones críticas usan transacciones MongoDB para garantizar consistencia
7. **Stock disponible**: Se calcula como `stock.cantidad - stock.reservado` en tiempo real durante confirm

---

## 🔄 Ejemplo de Flujo Completo con Despacho Parcial

```javascript
// 1. Crear orden con 2 líneas
POST /api/inventory/salesOrder
{
  "items": [
    { "item": "item1", "cantidad": 100 },
    { "item": "item2", "cantidad": 50 }
  ]
}
// Response: estado = "borrador"

// 2. Confirmar
POST /api/inventory/salesOrder/:id/confirm
{ "warehouse": "wh1", "idempotencyKey": "conf-1" }
// Response: estado = "confirmada", fechaConfirmacion asignada

// 3. Despacho parcial #1
POST /api/inventory/salesOrder/:id/ship
{
  "idempotencyKey": "ship-1",
  "items": [
    { "item": "item1", "cantidad": 30 }
  ]
}
// Response:
// - estado = "parcial"
// - items[0].entregado = 30
// - fechaDespacho = null (aún no completo)

// 4. Despacho parcial #2
POST /api/inventory/salesOrder/:id/ship
{
  "idempotencyKey": "ship-2",
  "items": [
    { "item": "item1", "cantidad": 70 },
    { "item": "item2", "cantidad": 50 }
  ]
}
// Response:
// - estado = "despachada"
// - items[0].entregado = 100
// - items[1].entregado = 50
// - fechaDespacho = "2025-11-03T..." (asignado aquí)
```
