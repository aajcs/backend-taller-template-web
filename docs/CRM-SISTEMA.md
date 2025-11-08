# 🚗 Sistema CRM - Customer Relationship Management

## 📋 Descripción General

El sistema CRM (Customer Relationship Management) del Taller es una solución completa para gestionar la relación con clientes, sus vehículos, órdenes de trabajo, facturación y pagos. Permite a los talleres mecánicos administrar eficientemente todo el ciclo de servicio desde que el cliente llega hasta la entrega final del vehículo.

---

## 🏗️ Arquitectura del Sistema

```
CRM
├── Clientes (Customers)
│   ├── Personas
│   └── Empresas
│
├── Vehículos (Vehicles)
│   ├── Marcas (VehicleBrand)
│   ├── Modelos (VehicleModel)
│   └── Vehículos del Cliente (Vehicle)
│
├── Órdenes de Trabajo (WorkOrders)
│   ├── Estados (WorkOrderStatus)
│   ├── Ítems de Servicio/Repuestos (WorkOrderItem)
│   └── Historial de Cambios (WorkOrderHistory)
│
└── Facturación (Billing)
    ├── Facturas (Invoice)
    └── Pagos (Payment)
```

---

## 📊 Flujo del Sistema

```
1. REGISTRO DE CLIENTE
   ↓
2. REGISTRO DE VEHÍCULO
   ↓
3. CREACIÓN DE ORDEN DE TRABAJO
   ↓
4. ASIGNACIÓN DE TÉCNICO
   ↓
5. REGISTRO DE SERVICIOS/REPUESTOS
   ↓
6. CAMBIOS DE ESTADO (Recibido → En Diagnóstico → En Reparación → Listo → Entregado)
   ↓
7. GENERACIÓN DE FACTURA
   ↓
8. REGISTRO DE PAGOS
   ↓
9. ENTREGA DEL VEHÍCULO
```

---

## 🗂️ Modelos del Sistema

### 1. Customer (Cliente)

Gestiona la información de clientes, tanto personas naturales como empresas.

**Características:**

- ✅ Soporte para personas y empresas
- ✅ Validación de correo y teléfono
- ✅ RIF y razón social para empresas
- ✅ Estado activo/inactivo
- ✅ Eliminación lógica

**Ejemplo JSON - Persona:**

```json
{
  "_id": "673cd1234567890abcdef001",
  "nombre": "Carlos Alberto Pérez",
  "tipo": "persona",
  "telefono": "+584241234567",
  "correo": "carlos.perez@gmail.com",
  "direccion": "Av. Principal, Edificio Vista Hermosa, Apto 5-B, Valencia",
  "notas": "Cliente preferencial desde 2020",
  "estado": "activo",
  "eliminado": false,
  "createdAt": "2025-01-15T09:30:00.000Z",
  "updatedAt": "2025-01-15T09:30:00.000Z"
}
```

**Ejemplo JSON - Empresa:**

```json
{
  "_id": "673cd1234567890abcdef002",
  "nombre": "Transportes Venezuela C.A.",
  "tipo": "empresa",
  "telefono": "+582129876543",
  "correo": "administracion@transportesvenezuela.com",
  "direccion": "Zona Industrial La Yaguara, Galpón 15, Caracas",
  "rif": "J-30567890-2",
  "razonSocial": "Transportes Venezuela Compañía Anónima",
  "notas": "Flota de 25 vehículos. Contrato de mantenimiento mensual",
  "estado": "activo",
  "eliminado": false,
  "createdAt": "2025-01-10T14:20:00.000Z",
  "updatedAt": "2025-01-10T14:20:00.000Z"
}
```

---

### 2. VehicleBrand (Marca de Vehículo)

Catálogo de marcas de vehículos disponibles en el sistema.

**Ejemplo JSON:**

```json
{
  "_id": "673cd1234567890abcdef010",
  "nombre": "TOYOTA",
  "descripcion": "Fabricante japonés de automóviles y camiones",
  "paisOrigen": "Japón",
  "logo": "https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_logo.png",
  "estado": "activo",
  "eliminado": false,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

---

### 3. VehicleModel (Modelo de Vehículo)

Modelos específicos de cada marca.

**Ejemplo JSON:**

```json
{
  "_id": "673cd1234567890abcdef020",
  "brand": "673cd1234567890abcdef010",
  "nombre": "Corolla",
  "descripcion": "Sedán compacto, uno de los más vendidos a nivel mundial",
  "tipo": "sedan",
  "motor": "gasolina",
  "yearInicio": 1966,
  "yearFin": 2025,
  "estado": "activo",
  "eliminado": false,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

**Tipos de vehículo disponibles:**

- `sedan` - Sedán
- `suv` - Vehículo Utilitario Deportivo
- `pickup` - Camioneta Pickup
- `hatchback` - Hatchback
- `coupe` - Coupé
- `convertible` - Convertible
- `wagon` - Camioneta Familiar
- `van` - Van/Minivan
- `truck` - Camión
- `motorcycle` - Motocicleta
- `other` - Otro

**Tipos de motor disponibles:**

- `gasolina` - Motor a gasolina
- `diesel` - Motor diésel
- `electrico` - Motor eléctrico
- `hibrido` - Motor híbrido
- `gas` - Motor a gas

---

### 4. Vehicle (Vehículo del Cliente)

Vehículos propiedad de los clientes registrados en el taller.

**Ejemplo JSON:**

```json
{
  "_id": "673cd1234567890abcdef030",
  "customer": "673cd1234567890abcdef001",
  "model": "673cd1234567890abcdef020",
  "year": 2018,
  "placa": "ABC123D",
  "vin": "3VWFE21C04M000001",
  "color": "Gris Plata",
  "kilometraje": 85000,
  "estado": "activo",
  "eliminado": false,
  "historial": [],
  "createdAt": "2025-01-15T10:00:00.000Z",
  "updatedAt": "2025-03-20T16:45:00.000Z"
}
```

**Datos Populados:**

```json
{
  "_id": "673cd1234567890abcdef030",
  "customer": {
    "_id": "673cd1234567890abcdef001",
    "nombre": "Carlos Alberto Pérez",
    "telefono": "+584241234567",
    "correo": "carlos.perez@gmail.com"
  },
  "model": {
    "_id": "673cd1234567890abcdef020",
    "nombre": "Corolla",
    "tipo": "sedan",
    "brand": {
      "_id": "673cd1234567890abcdef010",
      "nombre": "TOYOTA"
    }
  },
  "year": 2018,
  "placa": "ABC123D",
  "vin": "3VWFE21C04M000001",
  "color": "Gris Plata",
  "kilometraje": 85000,
  "estado": "activo"
}
```

---

### 5. WorkOrderStatus (Estados de Orden de Trabajo)

Define los estados por los que puede pasar una orden de trabajo.

**Ejemplo JSON:**

```json
{
  "_id": "673cd1234567890abcdef040",
  "codigo": "RECIBIDO",
  "nombre": "Recibido",
  "descripcion": "El vehículo ha sido recibido en el taller",
  "color": "#3498db",
  "orden": 1,
  "activo": true,
  "eliminado": false,
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

**Estados Estándar del Sistema:**

| Orden | Código                 | Nombre               | Color       | Descripción                                      |
| ----- | ---------------------- | -------------------- | ----------- | ------------------------------------------------ |
| 1     | `RECIBIDO`             | Recibido             | 🔵 Azul     | Vehículo recibido en el taller                   |
| 2     | `EN_DIAGNOSTICO`       | En Diagnóstico       | 🟡 Amarillo | Técnico está diagnosticando el problema          |
| 3     | `ESPERANDO_APROBACION` | Esperando Aprobación | 🟠 Naranja  | Esperando aprobación del cliente para reparación |
| 4     | `EN_REPARACION`        | En Reparación        | 🟣 Púrpura  | Trabajos de reparación en proceso                |
| 5     | `ESPERANDO_REPUESTOS`  | Esperando Repuestos  | 🟤 Marrón   | Esperando llegada de repuestos                   |
| 6     | `LISTO_ENTREGA`        | Listo para Entrega   | 🟢 Verde    | Vehículo terminado, listo para entregar          |
| 7     | `ENTREGADO`            | Entregado            | ⚫ Negro    | Vehículo entregado al cliente                    |
| 8     | `CANCELADO`            | Cancelado            | 🔴 Rojo     | Orden cancelada                                  |

---

### 6. WorkOrder (Orden de Trabajo)

Documento principal que gestiona toda la información del servicio al vehículo.

**Ejemplo JSON Completo:**

```json
{
  "_id": "673cd1234567890abcdef050",
  "numeroOrden": "OT-2025-00158",
  "customer": "673cd1234567890abcdef001",
  "vehicle": "673cd1234567890abcdef030",
  "fechaApertura": "2025-03-20T08:30:00.000Z",
  "motivo": "Mantenimiento preventivo de 80.000 km + cambio de frenos",
  "kilometraje": 85000,
  "tecnicoAsignado": "673cd1234567890abcdef100",
  "estado": "673cd1234567890abcdef046",
  "prioridad": "normal",
  "descripcionProblema": "Cliente solicita mantenimiento programado. Reporta ruido en frenos delanteros al frenar.",
  "diagnostico": "Frenos delanteros con pastillas al 15% de vida útil. Discos con desgaste dentro de límites. Requiere cambio de aceite motor, filtros y revisión general según manual.",
  "observaciones": "Cliente menciona que el vehículo será usado para viaje largo la próxima semana. Prioridad normal.",
  "subtotalRepuestos": 12500.0,
  "subtotalServicios": 8000.0,
  "descuento": 1000.0,
  "impuesto": 3120.0,
  "costoTotal": 22620.0,
  "fechaEstimadaEntrega": "2025-03-22T17:00:00.000Z",
  "fechaRealEntrega": null,
  "fechaCierre": null,
  "invoice": null,
  "eliminado": false,
  "createdAt": "2025-03-20T08:30:00.000Z",
  "updatedAt": "2025-03-20T16:45:00.000Z"
}
```

**Datos Populados con Relaciones:**

```json
{
  "_id": "673cd1234567890abcdef050",
  "numeroOrden": "OT-2025-00158",
  "customer": {
    "_id": "673cd1234567890abcdef001",
    "nombre": "Carlos Alberto Pérez",
    "telefono": "+584241234567",
    "correo": "carlos.perez@gmail.com"
  },
  "vehicle": {
    "_id": "673cd1234567890abcdef030",
    "placa": "ABC123D",
    "year": 2018,
    "color": "Gris Plata",
    "model": {
      "nombre": "Corolla",
      "brand": {
        "nombre": "TOYOTA"
      }
    }
  },
  "fechaApertura": "2025-03-20T08:30:00.000Z",
  "motivo": "Mantenimiento preventivo de 80.000 km + cambio de frenos",
  "kilometraje": 85000,
  "tecnicoAsignado": {
    "_id": "673cd1234567890abcdef100",
    "nombre": "Miguel Rodríguez",
    "rol": "Técnico Senior"
  },
  "estado": {
    "_id": "673cd1234567890abcdef046",
    "codigo": "LISTO_ENTREGA",
    "nombre": "Listo para Entrega",
    "color": "#27ae60"
  },
  "prioridad": "normal",
  "diagnostico": "Frenos delanteros con pastillas al 15% de vida útil...",
  "subtotalRepuestos": 12500.0,
  "subtotalServicios": 8000.0,
  "descuento": 1000.0,
  "impuesto": 3120.0,
  "costoTotal": 22620.0,
  "fechaEstimadaEntrega": "2025-03-22T17:00:00.000Z",
  "items": [
    {
      "_id": "673cd1234567890abcdef060",
      "tipo": "part",
      "descripcion": "Pastillas de freno delanteras Toyota",
      "cantidad": 1,
      "precioUnitario": 4500.0,
      "subtotal": 4500.0
    },
    {
      "_id": "673cd1234567890abcdef061",
      "tipo": "service",
      "descripcion": "Cambio de aceite y filtro motor",
      "cantidad": 1,
      "precioUnitario": 3500.0,
      "subtotal": 3500.0
    }
  ]
}
```

---

### 7. WorkOrderItem (Ítem de Orden de Trabajo)

Representa servicios o repuestos incluidos en una orden de trabajo.

**Ejemplo JSON - Repuesto:**

```json
{
  "_id": "673cd1234567890abcdef060",
  "workOrder": "673cd1234567890abcdef050",
  "tipo": "part",
  "part": "673cd1234567890abcdef200",
  "service": null,
  "descripcion": "Pastillas de freno delanteras Toyota Original",
  "cantidad": 1,
  "precioUnitario": 4500.0,
  "subtotal": 4500.0,
  "notas": "Repuesto original Toyota, incluye instalación",
  "estado": "aplicado",
  "tecnico": "673cd1234567890abcdef100",
  "fechaAplicacion": "2025-03-21T10:30:00.000Z",
  "eliminado": false,
  "createdAt": "2025-03-20T09:15:00.000Z",
  "updatedAt": "2025-03-21T10:30:00.000Z"
}
```

**Ejemplo JSON - Servicio:**

```json
{
  "_id": "673cd1234567890abcdef061",
  "workOrder": "673cd1234567890abcdef050",
  "tipo": "service",
  "part": null,
  "service": "673cd1234567890abcdef300",
  "descripcion": "Cambio de aceite y filtro motor (servicio 80.000 km)",
  "cantidad": 1,
  "precioUnitario": 3500.0,
  "subtotal": 3500.0,
  "notas": "Incluye aceite sintético 5W-30 y filtro original",
  "estado": "completado",
  "tecnico": "673cd1234567890abcdef100",
  "fechaAplicacion": "2025-03-21T11:00:00.000Z",
  "eliminado": false,
  "createdAt": "2025-03-20T09:20:00.000Z",
  "updatedAt": "2025-03-21T11:00:00.000Z"
}
```

**Estados de Ítem:**

- `pendiente` - Pendiente de aplicación
- `en_proceso` - En proceso de aplicación
- `completado` - Completado
- `aplicado` - Aplicado (para repuestos instalados)
- `cancelado` - Cancelado

---

### 8. WorkOrderHistory (Historial de Cambios)

Rastrea todos los cambios de estado y modificaciones de una orden de trabajo.

**Ejemplo JSON:**

```json
{
  "_id": "673cd1234567890abcdef070",
  "workOrder": "673cd1234567890abcdef050",
  "estadoAnterior": "673cd1234567890abcdef044",
  "estadoNuevo": "673cd1234567890abcdef046",
  "fechaCambio": "2025-03-21T16:30:00.000Z",
  "usuario": "673cd1234567890abcdef100",
  "notas": "Todos los servicios completados. Vehículo lavado y listo para entrega.",
  "eliminado": false,
  "createdAt": "2025-03-21T16:30:00.000Z",
  "updatedAt": "2025-03-21T16:30:00.000Z"
}
```

**Datos Populados:**

```json
{
  "_id": "673cd1234567890abcdef070",
  "workOrder": {
    "_id": "673cd1234567890abcdef050",
    "numeroOrden": "OT-2025-00158"
  },
  "estadoAnterior": {
    "_id": "673cd1234567890abcdef044",
    "codigo": "EN_REPARACION",
    "nombre": "En Reparación",
    "color": "#9b59b6"
  },
  "estadoNuevo": {
    "_id": "673cd1234567890abcdef046",
    "codigo": "LISTO_ENTREGA",
    "nombre": "Listo para Entrega",
    "color": "#27ae60"
  },
  "fechaCambio": "2025-03-21T16:30:00.000Z",
  "usuario": {
    "_id": "673cd1234567890abcdef100",
    "nombre": "Miguel Rodríguez"
  },
  "notas": "Todos los servicios completados. Vehículo lavado y listo para entrega."
}
```

---

### 9. Invoice (Factura)

Documento de facturación generado desde una orden de trabajo.

**Ejemplo JSON:**

```json
{
  "_id": "673cd1234567890abcdef080",
  "invoiceNumber": "FAC-2025-00321",
  "workOrder": "673cd1234567890abcdef050",
  "customer": "673cd1234567890abcdef001",
  "issueDate": "2025-03-22T09:00:00.000Z",
  "dueDate": "2025-03-29T23:59:59.000Z",
  "status": "pagada_total",
  "subtotal": 19500.0,
  "taxes": [
    {
      "name": "IVA",
      "rate": 16,
      "amount": 3120.0,
      "_id": "673cd1234567890abcdef081"
    }
  ],
  "total": 22620.0,
  "items": [
    {
      "type": "part",
      "part": "673cd1234567890abcdef200",
      "description": "Pastillas de freno delanteras Toyota Original",
      "quantity": 1,
      "unitPrice": 4500.0,
      "subtotal": 4500.0,
      "_id": "673cd1234567890abcdef082"
    },
    {
      "type": "service",
      "service": "673cd1234567890abcdef300",
      "description": "Cambio de aceite y filtro motor (servicio 80.000 km)",
      "quantity": 1,
      "unitPrice": 3500.0,
      "subtotal": 3500.0,
      "_id": "673cd1234567890abcdef083"
    },
    {
      "type": "part",
      "part": "673cd1234567890abcdef201",
      "description": "Aceite motor sintético 5W-30 (4 litros)",
      "quantity": 1,
      "unitPrice": 3200.0,
      "subtotal": 3200.0,
      "_id": "673cd1234567890abcdef084"
    },
    {
      "type": "part",
      "part": "673cd1234567890abcdef202",
      "description": "Filtro de aceite original Toyota",
      "quantity": 1,
      "unitPrice": 800.0,
      "subtotal": 800.0,
      "_id": "673cd1234567890abcdef085"
    },
    {
      "type": "service",
      "service": "673cd1234567890abcdef301",
      "description": "Mano de obra - Cambio de frenos",
      "quantity": 2,
      "unitPrice": 2500.0,
      "subtotal": 5000.0,
      "_id": "673cd1234567890abcdef086"
    },
    {
      "type": "service",
      "service": "673cd1234567890abcdef302",
      "description": "Inspección general y lavado",
      "quantity": 1,
      "unitPrice": 2500.0,
      "subtotal": 2500.0,
      "_id": "673cd1234567890abcdef087"
    }
  ],
  "discount": 1000.0,
  "discountReason": "Cliente preferencial",
  "notes": "Pago completo recibido en efectivo. Garantía de 30 días en repuestos y mano de obra.",
  "paymentStatus": "paid",
  "totalPaid": 22620.0,
  "balance": 0,
  "deleted": false,
  "createdAt": "2025-03-22T09:00:00.000Z",
  "updatedAt": "2025-03-22T11:30:00.000Z"
}
```

**Estados de Factura:**

- `borrador` - Factura en proceso de creación
- `emitida` - Factura emitida, pendiente de pago
- `pagada_parcial` - Pagada parcialmente
- `pagada_total` - Pagada completamente
- `vencida` - Factura vencida sin pagar
- `cancelada` - Factura cancelada

---

### 10. Payment (Pago)

Registro de pagos aplicados a una factura.

**Ejemplo JSON - Pago en Efectivo:**

```json
{
  "_id": "673cd1234567890abcdef090",
  "invoice": "673cd1234567890abcdef080",
  "amount": 22620.0,
  "paymentDate": "2025-03-22T11:30:00.000Z",
  "paymentMethod": "efectivo",
  "reference": "PAGO-EF-00421",
  "notes": "Pago completo en efectivo. Cliente entrega monto exacto.",
  "status": "confirmado",
  "recordedBy": "673cd1234567890abcdef110",
  "paymentDetails": {},
  "deleted": false,
  "createdAt": "2025-03-22T11:30:00.000Z",
  "updatedAt": "2025-03-22T11:30:00.000Z"
}
```

**Ejemplo JSON - Pago por Transferencia:**

```json
{
  "_id": "673cd1234567890abcdef091",
  "invoice": "673cd1234567890abcdef080",
  "amount": 22620.0,
  "paymentDate": "2025-03-22T10:15:00.000Z",
  "paymentMethod": "transferencia",
  "reference": "REF-00123456789",
  "notes": "Transferencia bancaria confirmada",
  "status": "confirmado",
  "recordedBy": "673cd1234567890abcdef110",
  "paymentDetails": {
    "bankName": "Banco de Venezuela",
    "accountNumber": "0102-****-****-****-5678"
  },
  "deleted": false,
  "createdAt": "2025-03-22T10:15:00.000Z",
  "updatedAt": "2025-03-22T10:15:00.000Z"
}
```

**Ejemplo JSON - Pago con Tarjeta:**

```json
{
  "_id": "673cd1234567890abcdef092",
  "invoice": "673cd1234567890abcdef080",
  "amount": 15000.0,
  "paymentDate": "2025-03-22T10:00:00.000Z",
  "paymentMethod": "tarjeta_debito",
  "reference": "AUTH-987654",
  "notes": "Pago parcial con tarjeta de débito",
  "status": "confirmado",
  "recordedBy": "673cd1234567890abcdef110",
  "paymentDetails": {
    "cardLastFour": "4321",
    "cardType": "visa"
  },
  "deleted": false,
  "createdAt": "2025-03-22T10:00:00.000Z",
  "updatedAt": "2025-03-22T10:00:00.000Z"
}
```

**Métodos de Pago Disponibles:**

- `efectivo` - Efectivo
- `transferencia` - Transferencia bancaria
- `tarjeta_credito` - Tarjeta de crédito
- `tarjeta_debito` - Tarjeta de débito
- `cheque` - Cheque
- `cripto` - Criptomoneda
- `otro` - Otro método

**Estados de Pago:**

- `pendiente` - Pendiente de confirmación
- `confirmado` - Confirmado
- `rechazado` - Rechazado
- `reembolsado` - Reembolsado

---

## 🔄 Casos de Uso Completos

### Caso 1: Nuevo Cliente con Vehículo

**1. Registrar Cliente:**

```http
POST /api/customers
Content-Type: application/json

{
  "nombre": "María González",
  "tipo": "persona",
  "telefono": "+584149876543",
  "correo": "maria.gonzalez@gmail.com",
  "direccion": "Calle Las Flores, Casa 23, Maracay"
}
```

**2. Registrar Vehículo:**

```http
POST /api/vehicles
Content-Type: application/json

{
  "customer": "673cd1234567890abcdef001",
  "model": "673cd1234567890abcdef020",
  "year": 2020,
  "placa": "XYZ789E",
  "vin": "1HGBH41JXMN109186",
  "color": "Blanco Perla",
  "kilometraje": 45000
}
```

---

### Caso 2: Crear Orden de Trabajo

**1. Crear OT:**

```http
POST /api/work-orders
Content-Type: application/json

{
  "customer": "673cd1234567890abcdef001",
  "vehicle": "673cd1234567890abcdef030",
  "motivo": "Revisión de motor y cambio de aceite",
  "kilometraje": 45000,
  "tecnicoAsignado": "673cd1234567890abcdef100",
  "prioridad": "normal",
  "descripcionProblema": "Cliente reporta ruido extraño en el motor al acelerar",
  "fechaEstimadaEntrega": "2025-03-25T17:00:00.000Z"
}
```

**2. Agregar Ítems a la OT:**

```http
POST /api/work-order-items
Content-Type: application/json

{
  "workOrder": "673cd1234567890abcdef050",
  "tipo": "service",
  "service": "673cd1234567890abcdef300",
  "descripcion": "Cambio de aceite motor sintético",
  "cantidad": 1,
  "precioUnitario": 3500.00
}
```

---

### Caso 3: Cambiar Estado de OT

```http
PUT /api/work-orders/673cd1234567890abcdef050/cambiar-estado
Content-Type: application/json

{
  "nuevoEstado": "EN_REPARACION",
  "notas": "Iniciando trabajos de reparación del motor"
}
```

---

### Caso 4: Generar Factura

```http
POST /api/invoices/from-work-order
Content-Type: application/json

{
  "workOrderId": "673cd1234567890abcdef050",
  "dueDate": "2025-03-29T23:59:59.000Z",
  "discount": 500.00,
  "discountReason": "Cliente frecuente"
}
```

---

### Caso 5: Registrar Pago

```http
POST /api/payments
Content-Type: application/json

{
  "invoice": "673cd1234567890abcdef080",
  "amount": 22620.00,
  "paymentMethod": "transferencia",
  "reference": "REF-123456789",
  "paymentDetails": {
    "bankName": "Banco Mercantil",
    "accountNumber": "0105-****-****-1234"
  },
  "notes": "Pago completo recibido vía transferencia"
}
```

---

## 📊 Reportes y Estadísticas

### Clientes Más Frecuentes

```javascript
// Top 10 clientes con más órdenes de trabajo
GET /api/customers/top-frequent?limit=10
```

### Ingresos por Período

```javascript
// Ingresos del mes actual
GET /api/invoices/revenue?startDate=2025-03-01&endDate=2025-03-31
```

### Órdenes de Trabajo por Estado

```javascript
// Distribución de OT por estado
GET / api / work - orders / stats - by - status;
```

### Técnicos con Más Órdenes

```javascript
// Ranking de técnicos
GET / api / work - orders / stats - by - technician;
```

---

## 🔐 Permisos y Roles

| Rol               | Clientes | Vehículos | OT              | Facturas | Pagos        |
| ----------------- | -------- | --------- | --------------- | -------- | ------------ |
| **Admin**         | ✅ CRUD  | ✅ CRUD   | ✅ CRUD         | ✅ CRUD  | ✅ CRUD      |
| **Gerente**       | ✅ CRUD  | ✅ CRUD   | ✅ CRUD         | ✅ CRUD  | ✅ CRUD      |
| **Técnico**       | 👁️ Ver   | 👁️ Ver    | ✅ CRUD         | 👁️ Ver   | ❌ No        |
| **Recepcionista** | ✅ CRUD  | ✅ CRUD   | ✅ Crear/Editar | ✅ Ver   | ✅ Registrar |
| **Cajero**        | 👁️ Ver   | 👁️ Ver    | 👁️ Ver          | ✅ CRUD  | ✅ CRUD      |

---

## 🚀 Conclusión

El sistema CRM proporciona una solución completa para talleres mecánicos que incluye:

✅ **Gestión de Clientes** - Personas y empresas con datos completos
✅ **Catálogo de Vehículos** - Marcas, modelos y vehículos de clientes
✅ **Órdenes de Trabajo** - Control completo del ciclo de servicio
✅ **Estados Configurables** - Seguimiento detallado del progreso
✅ **Facturación Automática** - Generación desde OT con impuestos
✅ **Registro de Pagos** - Múltiples métodos y estados
✅ **Historial Completo** - Auditoría de todos los cambios
✅ **Reportes y Estadísticas** - Análisis de negocio

Para más información sobre otros módulos:

- [Inventario](./INVENTARIO.md)
- [Stock Mínimo](./STOCK-MINIMO.md)
- [AutoSys (Talleres)](./AUTOSYS.md)
