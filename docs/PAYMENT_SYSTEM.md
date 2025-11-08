# Sistema de Pagos (Payment System)

## Descripción General

El sistema de pagos permite registrar y gestionar los pagos asociados a facturas. Soporta múltiples pagos por factura (pagos parciales) y actualiza automáticamente el estado de las facturas.

## Modelo de Datos (Payment)

### Estructura del Schema

```javascript
{
  invoice: ObjectId,           // Referencia a la factura (requerido)
  amount: Number,              // Monto del pago (min: 0.01, requerido)
  paymentDate: Date,           // Fecha del pago (default: Date.now)
  paymentMethod: String,       // Método de pago (enum, requerido)
  reference: String,           // Referencia/número de transacción (max 100 chars)
  notes: String,               // Notas adicionales (max 300 chars)
  status: String,              // Estado del pago (default: "confirmado")
  paymentDetails: {            // Detalles específicos según método
    bankName: String,          // Para transferencias
    accountNumber: String,     // Para transferencias
    cardLastFour: String,      // Para tarjetas (últimos 4 dígitos)
    cardType: String,          // visa, mastercard, amex, etc.
    checkNumber: String,       // Número de cheque
    cryptoCurrency: String,    // Tipo de criptomoneda
    walletAddress: String,     // Dirección de wallet cripto
    otherDetails: String       // Otros detalles
  },
  recordedBy: ObjectId,        // Usuario que registró el pago (requerido)
  eliminado: Boolean           // Borrado lógico (default: false)
}
```

### Métodos de Pago Disponibles

1. **efectivo** - Pago en efectivo
2. **transferencia** - Transferencia bancaria
   - Requiere: `bankName`, `accountNumber` en `paymentDetails`
3. **tarjeta_credito** - Tarjeta de crédito
   - Requiere: `cardLastFour`, `cardType` en `paymentDetails`
4. **tarjeta_debito** - Tarjeta de débito
   - Requiere: `cardLastFour`, `cardType` en `paymentDetails`
5. **cheque** - Pago con cheque
   - Requiere: `checkNumber` en `paymentDetails`
6. **cripto** - Criptomonedas
   - Requiere: `cryptoCurrency`, `walletAddress` en `paymentDetails`
7. **otro** - Otros métodos
   - Puede usar: `otherDetails` en `paymentDetails`

### Estados de Pago

1. **pendiente** - Pago registrado pero no confirmado
2. **confirmado** - Pago confirmado (estado por defecto)
3. **rechazado** - Pago rechazado o cancelado
4. **reembolsado** - Pago reembolsado

### Métodos del Modelo

#### confirm()

Confirma un pago pendiente.

```javascript
const payment = await Payment.findById(paymentId);
await payment.confirm();
```

#### reject(reason)

Rechaza un pago.

```javascript
const payment = await Payment.findById(paymentId);
await payment.reject("Fondos insuficientes");
```

#### refund(reason)

Registra un reembolso.

```javascript
const payment = await Payment.findById(paymentId);
await payment.refund("Solicitud del cliente");
```

## Rutas de la API

### Base URL

`/api/payments`

### Autenticación

Todas las rutas requieren autenticación mediante header `x-token`.

---

### GET /api/payments/invoice/:invoiceId

Obtiene todos los pagos de una factura específica.

**Parámetros de Ruta:**

- `invoiceId` - ID de la factura

**Respuesta Exitosa (200):**

```json
{
  "ok": true,
  "payments": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "invoice": "507f1f77bcf86cd799439012",
      "amount": 200000,
      "paymentDate": "2024-01-15T10:00:00.000Z",
      "paymentMethod": "transferencia",
      "reference": "TRF-001234",
      "status": "confirmado",
      "paymentDetails": {
        "bankName": "Banco Estado",
        "accountNumber": "1234567890"
      },
      "recordedBy": "507f1f77bcf86cd799439013"
    }
  ],
  "total": 200000
}
```

**Ejemplo de Uso:**

```bash
curl -X GET http://localhost:4000/api/payments/invoice/507f1f77bcf86cd799439012 \
  -H "x-token: YOUR_TOKEN"
```

---

### GET /api/payments/:id

Obtiene un pago específico por su ID.

**Parámetros de Ruta:**

- `id` - ID del pago

**Respuesta Exitosa (200):**

```json
{
  "ok": true,
  "payment": {
    "_id": "507f1f77bcf86cd799439011",
    "invoice": {
      "_id": "507f1f77bcf86cd799439012",
      "invoiceNumber": "INV-000001",
      "total": 500000
    },
    "amount": 200000,
    "paymentDate": "2024-01-15T10:00:00.000Z",
    "paymentMethod": "transferencia",
    "status": "confirmado"
  }
}
```

---

### POST /api/payments

Crea un nuevo pago para una factura.

**Body:**

```json
{
  "invoice": "507f1f77bcf86cd799439012",
  "amount": 200000,
  "paymentDate": "2024-01-15T10:00:00.000Z",
  "paymentMethod": "transferencia",
  "reference": "TRF-001234",
  "notes": "Primer pago parcial",
  "paymentDetails": {
    "bankName": "Banco Estado",
    "accountNumber": "1234567890"
  }
}
```

**Validaciones:**

- `invoice` - Debe existir en la base de datos
- `amount` - Debe ser número > 0.01
- `paymentDate` - Formato ISO 8601 válido
- `paymentMethod` - Debe ser uno de los métodos permitidos

**Respuesta Exitosa (201):**

```json
{
  "ok": true,
  "payment": {
    "_id": "507f1f77bcf86cd799439011",
    "invoice": "507f1f77bcf86cd799439012",
    "amount": 200000,
    "paymentMethod": "transferencia",
    "status": "confirmado"
  },
  "invoice": {
    "_id": "507f1f77bcf86cd799439012",
    "paidAmount": 200000,
    "balance": 300000,
    "status": "pagada_parcial"
  }
}
```

**Comportamiento:**

- Actualiza automáticamente `paidAmount` de la factura
- Calcula el nuevo `balance` de la factura
- Actualiza el `status` de la factura:
  - `emitida` → `pagada_parcial` (si hay balance pendiente)
  - `pagada_parcial` → `pagada_total` (si balance = 0)

**Ejemplo de Uso:**

```bash
curl -X POST http://localhost:4000/api/payments \
  -H "x-token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invoice": "507f1f77bcf86cd799439012",
    "amount": 200000,
    "paymentMethod": "transferencia",
    "paymentDetails": {
      "bankName": "Banco Estado",
      "accountNumber": "1234567890"
    }
  }'
```

---

### PUT /api/payments/:id

Actualiza un pago existente.

**Parámetros de Ruta:**

- `id` - ID del pago a actualizar

**Body (campos opcionales):**

```json
{
  "amount": 250000,
  "paymentDate": "2024-01-16T10:00:00.000Z",
  "paymentMethod": "efectivo",
  "reference": "Updated reference",
  "notes": "Monto ajustado",
  "status": "confirmado",
  "paymentDetails": {}
}
```

**Respuesta Exitosa (200):**

```json
{
  "ok": true,
  "payment": {
    "_id": "507f1f77bcf86cd799439011",
    "amount": 250000,
    "status": "confirmado"
  }
}
```

---

### PATCH /api/payments/:id/confirm

Confirma un pago que está en estado pendiente.

**Parámetros de Ruta:**

- `id` - ID del pago a confirmar

**Respuesta Exitosa (200):**

```json
{
  "ok": true,
  "payment": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "confirmado"
  }
}
```

**Ejemplo de Uso:**

```bash
curl -X PATCH http://localhost:4000/api/payments/507f1f77bcf86cd799439011/confirm \
  -H "x-token: YOUR_TOKEN"
```

---

### PATCH /api/payments/:id/cancel

Cancela o rechaza un pago.

**Parámetros de Ruta:**

- `id` - ID del pago a cancelar

**Body (opcional):**

```json
{
  "reason": "Fondos insuficientes"
}
```

**Respuesta Exitosa (200):**

```json
{
  "ok": true,
  "payment": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "rechazado",
    "notes": "Fondos insuficientes"
  }
}
```

**Ejemplo de Uso:**

```bash
curl -X PATCH http://localhost:4000/api/payments/507f1f77bcf86cd799439011/cancel \
  -H "x-token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "Fondos insuficientes"}'
```

---

### DELETE /api/payments/:id

Elimina lógicamente un pago (marca `eliminado: true`).

**Parámetros de Ruta:**

- `id` - ID del pago a eliminar

**Respuesta Exitosa (200):**

```json
{
  "ok": true,
  "msg": "Pago eliminado correctamente"
}
```

---

## Flujo Completo de Pagos

### Escenario: Factura de $500,000 con dos pagos parciales

#### 1. Crear Factura

```bash
POST /api/invoices/from-work-order/:workOrderId
```

**Resultado:**

- Invoice: `status: "borrador"`, `total: 500000`, `balance: 500000`

#### 2. Emitir Factura

```bash
PATCH /api/invoices/:id/emit
```

**Resultado:**

- Invoice: `status: "emitida"`, `total: 500000`, `balance: 500000`

#### 3. Primer Pago Parcial ($200,000)

```bash
POST /api/payments
{
  "invoice": "507f1f77bcf86cd799439012",
  "amount": 200000,
  "paymentMethod": "transferencia",
  "paymentDetails": {
    "bankName": "Banco Estado",
    "accountNumber": "1234567890"
  }
}
```

**Resultado:**

- Payment 1: `amount: 200000`, `status: "confirmado"`
- Invoice: `status: "pagada_parcial"`, `paidAmount: 200000`, `balance: 300000`

#### 4. Segundo Pago Parcial ($300,000)

```bash
POST /api/payments
{
  "invoice": "507f1f77bcf86cd799439012",
  "amount": 300000,
  "paymentMethod": "efectivo"
}
```

**Resultado:**

- Payment 2: `amount: 300000`, `status: "confirmado"`
- Invoice: `status: "pagada_total"`, `paidAmount: 500000`, `balance: 0`

---

## Lógica de Negocio

### Actualización Automática de Facturas

Cuando se crea un pago:

1. Se suma el `amount` del pago al `paidAmount` de la factura
2. Se calcula el nuevo `balance`: `total - paidAmount`
3. Se actualiza el `status` de la factura:
   ```javascript
   if (balance === 0) {
     status = "pagada_total";
   } else if (paidAmount > 0) {
     status = "pagada_parcial";
   }
   ```

### Validaciones Importantes

1. **Invoice debe existir:** La factura a la que se asocia el pago debe estar registrada
2. **Amount > 0:** El monto del pago debe ser mayor a 0.01
3. **Payment Method válido:** Debe ser uno de los 7 métodos permitidos
4. **PaymentDate formato ISO:** La fecha debe estar en formato ISO 8601
5. **No sobre-pagar:** El sistema permite pagos que excedan el total (se debe validar en frontend)

### Métodos del Modelo Payment

```javascript
// Confirmar pago pendiente
payment.confirm();
// Resultado: status = "confirmado"

// Rechazar pago
payment.reject("Motivo del rechazo");
// Resultado: status = "rechazado", notes += motivo

// Reembolsar pago
payment.refund("Motivo del reembolso");
// Resultado: status = "reembolsado", notes += motivo
```

---

## Ejemplos de Uso por Método de Pago

### Efectivo

```json
{
  "invoice": "507f1f77bcf86cd799439012",
  "amount": 100000,
  "paymentMethod": "efectivo",
  "notes": "Pago en efectivo recibido en caja"
}
```

### Transferencia Bancaria

```json
{
  "invoice": "507f1f77bcf86cd799439012",
  "amount": 200000,
  "paymentMethod": "transferencia",
  "reference": "TRF-001234",
  "paymentDetails": {
    "bankName": "Banco Estado",
    "accountNumber": "1234567890"
  }
}
```

### Tarjeta de Crédito

```json
{
  "invoice": "507f1f77bcf86cd799439012",
  "amount": 150000,
  "paymentMethod": "tarjeta_credito",
  "reference": "AUTH-567890",
  "paymentDetails": {
    "cardLastFour": "4242",
    "cardType": "visa"
  }
}
```

### Cheque

```json
{
  "invoice": "507f1f77bcf86cd799439012",
  "amount": 300000,
  "paymentMethod": "cheque",
  "reference": "CHQ-789012",
  "paymentDetails": {
    "checkNumber": "0001234567"
  }
}
```

### Criptomoneda

```json
{
  "invoice": "507f1f77bcf86cd799439012",
  "amount": 250000,
  "paymentMethod": "cripto",
  "reference": "TX-abc123def456",
  "paymentDetails": {
    "cryptoCurrency": "Bitcoin",
    "walletAddress": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
  }
}
```

---

## Validaciones del Sistema

### En el Modelo (Schema)

- `invoice`: Required, debe ser ObjectId válido
- `amount`: Required, Number, mínimo 0.01
- `paymentMethod`: Required, debe estar en el enum de 7 métodos
- `reference`: Opcional, máximo 100 caracteres
- `notes`: Opcional, máximo 300 caracteres
- `status`: Default "confirmado", enum de 4 estados
- `recordedBy`: Required, ObjectId del usuario

### En las Rutas (Validators)

- `invoice`: Debe existir en la base de datos (custom validator)
- `amount`: Debe ser float > 0
- `paymentDate`: Debe ser fecha ISO 8601 válida (si se proporciona)
- `paymentMethod`: Debe ser uno de los 7 métodos permitidos
- Todos los campos opcionales son validados si se proporcionan

---

## Estados de la Factura según Pagos

| Pagos Recibidos   | paidAmount | balance | Status Invoice |
| ----------------- | ---------- | ------- | -------------- |
| 0                 | 0          | 500000  | emitida        |
| 1 ($200k)         | 200000     | 300000  | pagada_parcial |
| 2 ($200k + $300k) | 500000     | 0       | pagada_total   |

---

## Notas Técnicas

1. **Borrado Lógico:** Los pagos se marcan como `eliminado: true` en lugar de eliminarse físicamente
2. **Población de Datos:** Al consultar pagos, se puede popular la referencia a `invoice` y `recordedBy`
3. **Timestamps:** El modelo incluye `createdAt` y `updatedAt` automáticos
4. **Actualización Atómica:** Las actualizaciones a la factura se hacen de forma atómica para evitar inconsistencias
5. **Auditoría:** Cada pago registra quién lo creó mediante `recordedBy`

---

## Integración con Frontend

### Headers Requeridos

```javascript
{
  'x-token': 'YOUR_JWT_TOKEN',
  'Content-Type': 'application/json'
}
```

### Manejo de Errores

Todas las rutas devuelven errores en formato:

```json
{
  "ok": false,
  "msg": "Mensaje de error descriptivo",
  "errors": [] // Array de errores de validación (si aplica)
}
```

### Códigos de Estado HTTP

- `200` - Operación exitosa (GET, PUT, PATCH, DELETE)
- `201` - Recurso creado exitosamente (POST)
- `400` - Error de validación
- `401` - No autenticado
- `403` - No autorizado
- `404` - Recurso no encontrado
- `500` - Error interno del servidor

---

## Relación con Invoice Model

El modelo Payment está estrechamente relacionado con Invoice:

```javascript
// Invoice Schema (campos relevantes)
{
  total: Number,        // Total de la factura
  paidAmount: Number,   // Suma de todos los pagos confirmados
  balance: Number,      // total - paidAmount
  status: String        // emitida, pagada_parcial, pagada_total
}
```

Cuando se crea/actualiza un Payment:

1. Se actualiza `invoice.paidAmount`
2. Se recalcula `invoice.balance`
3. Se actualiza `invoice.status` según corresponda

---

## Comandos de Testing

### Crear Pago de Prueba

```bash
curl -X POST http://localhost:4000/api/payments \
  -H "x-token: YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "invoice": "INVOICE_ID",
    "amount": 100000,
    "paymentMethod": "efectivo"
  }'
```

### Listar Pagos de una Factura

```bash
curl -X GET http://localhost:4000/api/payments/invoice/INVOICE_ID \
  -H "x-token: YOUR_TOKEN"
```

### Confirmar Pago

```bash
curl -X PATCH http://localhost:4000/api/payments/PAYMENT_ID/confirm \
  -H "x-token: YOUR_TOKEN"
```

---

## Conclusión

El sistema de pagos proporciona:

- ✅ Soporte para 7 métodos de pago diferentes
- ✅ Pagos parciales y totales
- ✅ Actualización automática del estado de facturas
- ✅ Trazabilidad completa (quién registró, cuándo, método usado)
- ✅ Detalles específicos por tipo de pago
- ✅ Estados de confirmación/rechazo/reembolso
- ✅ Borrado lógico para mantener historial
- ✅ API RESTful completa

Este sistema permite una gestión flexible y completa del ciclo de cobro de facturas.
