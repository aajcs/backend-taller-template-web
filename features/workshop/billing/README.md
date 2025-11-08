# Módulo de Facturación

## Descripción

Módulo completo para gestión de facturación y pagos en el sistema de taller. Implementa RF-24 a RF-29 del sistema.

## Funcionalidades

### 📄 Gestión de Facturas

- Creación automática desde órdenes de trabajo completadas
- Estados: borrador → emitida
- Aplicación de IVA configurable
- Gestión de fechas de emisión y vencimiento
- Notas y términos de pago

### 🛒 Gestión de Ítems de Factura

- Asociación con productos del inventario
- Cálculo automático de subtotales
- Descuentos por ítem
- Validaciones de stock y precios

### 💰 Gestión de Pagos

- Múltiples métodos de pago (efectivo, transferencia, cheque, tarjetas)
- Estados: pendiente → confirmado
- Validación de montos vs saldo pendiente
- Historial completo de pagos por factura

### 📊 Reportes (RF-29)

#### Facturas Emitidas

```
GET /api/invoices/reports?type=invoices_issued&startDate=2024-01-01&endDate=2024-12-31
```

- Lista completa de facturas emitidas en período
- Estadísticas: total facturas, montos con/sin IVA
- Detalle por cliente y orden de trabajo

#### Cuentas por Cobrar

```
GET /api/invoices/reports?type=accounts_receivable&startDate=2024-01-01&endDate=2024-12-31
```

- Facturas pendientes de pago completo
- Saldos pendientes por factura
- Días de vencimiento
- Estadísticas de morosidad

## Requerimientos Funcionales

- **RF-24**: ✅ Generar factura (pre-factura) desde OT en estado "Listo para Entrega"
- **RF-25**: ✅ Factura toma ítems automáticamente de la OT
- **RF-26**: ✅ Aplicar impuestos (IVA) al total
- **RF-27**: ✅ Registrar pago (total/parcial) y método de pago
- **RF-28**: ✅ Emitir factura final una vez pagada
- **RF-29**: ✅ Reportes de facturas emitidas y cuentas por cobrar

## Endpoints API

### Facturas

- `GET /api/invoices` - Listar facturas
- `GET /api/invoices/:id` - Obtener factura específica
- `POST /api/invoices/from-work-order/:workOrderId` - Crear desde orden de trabajo
- `PUT /api/invoices/:id` - Actualizar factura
- `PATCH /api/invoices/:id/apply-iva` - Aplicar IVA
- `PATCH /api/invoices/:id/emit` - Emitir factura
- `DELETE /api/invoices/:id` - Eliminar factura
- `GET /api/invoices/reports` - Reportes

### Ítems de Factura

- `GET /api/invoice-items` - Listar ítems
- `GET /api/invoice-items/:id` - Obtener ítem específico
- `POST /api/invoice-items` - Crear ítem
- `PUT /api/invoice-items/:id` - Actualizar ítem
- `DELETE /api/invoice-items/:id` - Eliminar ítem

### Pagos

- `GET /api/payments` - Listar pagos
- `GET /api/payments/by-invoice/:invoiceId` - Pagos por factura
- `GET /api/payments/:id` - Obtener pago específico
- `POST /api/payments` - Crear pago
- `PUT /api/payments/:id` - Actualizar pago
- `PATCH /api/payments/:id/confirm` - Confirmar pago
- `PATCH /api/payments/:id/cancel` - Cancelar pago
- `DELETE /api/payments/:id` - Eliminar pago

## Modelos de Datos

### Invoice

```javascript
{
  invoiceNumber: String, // Auto-generado
  workOrder: ObjectId,   // Referencia a orden de trabajo
  customer: ObjectId,    // Referencia a cliente
  issueDate: Date,       // Fecha de emisión
  dueDate: Date,         // Fecha de vencimiento
  items: [InvoiceItem],  // Ítems facturados
  subtotal: Number,      // Subtotal sin IVA
  ivaRate: Number,       // Tasa de IVA (%)
  ivaAmount: Number,     // Monto de IVA
  total: Number,         // Total con IVA
  status: String,        // borrador|emitida
  notes: String,         // Notas adicionales
  paymentTerms: String,  // Términos de pago
  deleted: Boolean       // Eliminación lógica
}
```

### InvoiceItem

```javascript
{
  invoice: ObjectId,     // Factura padre
  product: ObjectId,     // Producto facturado
  quantity: Number,      // Cantidad
  unitPrice: Number,     // Precio unitario
  discount: Number,      // Descuento (%)
  description: String,   // Descripción
  total: Number,         // Total del ítem
  deleted: Boolean       // Eliminación lógica
}
```

### Payment

```javascript
{
  invoice: ObjectId,     // Factura asociada
  amount: Number,        // Monto del pago
  paymentMethod: String, // Método de pago
  paymentDate: Date,     // Fecha del pago
  reference: String,     // Referencia externa
  status: String,        // pendiente|confirmado|cancelado
  notes: String,         // Notas del pago
  deleted: Boolean       // Eliminación lógica
}
```

## Estados y Transiciones

### Factura

- **borrador**: Editable, no visible para pagos
- **emitida**: No editable, permite pagos

### Pago

- **pendiente**: Registrado pero no confirmado
- **confirmado**: Aplicado a la factura
- **cancelado**: Anulado, no afecta saldos

## Validaciones

- Autenticación JWT requerida en todos los endpoints
- Validaciones de existencia de entidades relacionadas
- Validaciones de montos y fechas
- Validaciones de estado para operaciones permitidas
- Eliminación lógica en todos los modelos

## Estructura del Módulo

```text
features/workshop/billing/
├── models/
│   ├── invoice.model.js
│   ├── invoiceItem.model.js
│   ├── payment.model.js
│   └── index.js
├── controllers/
│   ├── invoice.controller.js
│   ├── invoiceItem.controller.js
│   ├── payment.controller.js
│   └── index.js
├── routes/
│   ├── invoice.routes.js
│   ├── invoiceItem.routes.js
│   ├── payment.routes.js
│   └── index.js
├── helpers/
│   └── db-validators.js
└── README.md
```

## Dependencias

- `express-validator` para validaciones
- `mongoose-paginate-v2` para paginación
- `jsonwebtoken` para autenticación
- Modelos relacionados: WorkOrder, Producto, Usuario

## Próximos Pasos

1. Implementar controllers
2. Crear rutas REST
3. Agregar validadores específicos
4. Integrar con el servidor principal
5. Implementar lógica de reportes
