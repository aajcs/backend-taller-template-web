# 📋 Rutas API - Backend Taller Template

**Base URL:** `http://localhost:4000`

---

## ✅ Estado de Validación de Rutas

| Módulo             | Ruta Base          | Estado       | Requiere Auth   |
| ------------------ | ------------------ | ------------ | --------------- |
| Auth               | `/api/auth`        | ✅ Funcional | No (para login) |
| Usuarios           | `/api/user`        | ✅ Funcional | Sí              |
| CRM - Clientes     | `/api/customers`   | ✅ Funcional | Sí              |
| CRM - Vehículos    | `/api/vehicles`    | ✅ Funcional | Sí              |
| Inventario         | `/api/inventory`   | ✅ Funcional | Sí              |
| Órdenes de Trabajo | `/api/work-orders` | ✅ Funcional | Sí              |
| Facturación        | `/api/invoices`    | ✅ Funcional | Sí              |
| Auto Sys           | `/api/autoSys`     | ✅ Funcional | Sí              |

---

## 🔐 Autenticación

### POST `/api/auth/login`

Iniciar sesión y obtener token JWT

**Body:**

```json
{
  "correo": "admin@example.com",
  "password": "123456"
}
```

**Respuesta:**

```json
{
  "user": { ... },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST `/api/auth/register`

Registrar nuevo usuario

---

## 👥 Usuarios

### GET `/api/user`

Obtener todos los usuarios

**Headers:**

```
x-token: tu_token_jwt
```

### GET `/api/user/:id`

Obtener usuario por ID

### POST `/api/user`

Crear nuevo usuario (requiere SuperAdmin)

### PUT `/api/user/:id`

Actualizar usuario

### DELETE `/api/user/:id`

Eliminar usuario

---

## 🏢 CRM - Clientes

### GET `/api/customers`

Obtener todos los clientes

**Headers:**

```
x-token: tu_token_jwt
```

**Query Params:**

- `limite`: Número de resultados (default: 10)
- `desde`: Offset para paginación (default: 0)

### GET `/api/customers/:id`

Obtener cliente por ID

### GET `/api/customers/rif/:rif`

Buscar cliente por RIF

### GET `/api/customers/correo/:correo`

Buscar cliente por correo

### POST `/api/customers`

Crear nuevo cliente (requiere SuperAdmin)

**Body - Persona:**

```json
{
  "nombre": "Juan Pérez",
  "tipo": "persona",
  "telefono": "+584241234567",
  "correo": "juan@example.com",
  "direccion": "Av. Principal, Caracas",
  "estado": "activo"
}
```

**Body - Empresa:**

```json
{
  "nombre": "Tech Corp",
  "tipo": "empresa",
  "telefono": "+582129876543",
  "correo": "contacto@techcorp.com",
  "direccion": "Torre Empresarial, Piso 10",
  "rif": "J-12345678-9",
  "razonSocial": "Tech Corp C.A.",
  "estado": "activo"
}
```

### PUT `/api/customers/:id`

Actualizar cliente (requiere SuperAdmin)

### DELETE `/api/customers/:id`

Eliminar cliente (requiere SuperAdmin)

---

## 🚗 CRM - Vehículos

### GET `/api/vehicles`

Obtener todos los vehículos

### GET `/api/vehicles/:id`

Obtener vehículo por ID

### GET `/api/vehicles/placa/:placa`

Buscar vehículo por placa

### GET `/api/vehicles/vin/:vin`

Buscar vehículo por VIN

### POST `/api/vehicles`

Crear nuevo vehículo

### PUT `/api/vehicles/:id`

Actualizar vehículo

### DELETE `/api/vehicles/:id`

Eliminar vehículo

---

### 🏷️ Marcas de Vehículos

#### GET `/api/vehicles/brands`

Obtener todas las marcas

#### POST `/api/vehicles/brands`

Crear nueva marca

#### PUT `/api/vehicles/brands/:id`

Actualizar marca

#### DELETE `/api/vehicles/brands/:id`

Eliminar marca

---

### 🔧 Modelos de Vehículos

#### GET `/api/vehicles/models`

Obtener todos los modelos

#### POST `/api/vehicles/models`

Crear nuevo modelo

#### PUT `/api/vehicles/models/:id`

Actualizar modelo

#### DELETE `/api/vehicles/models/:id`

Eliminar modelo

---

## 📦 Inventario

### 📋 Items

#### GET `/api/inventory/items`

Obtener todos los items

#### POST `/api/inventory/items`

Crear nuevo item

#### PUT `/api/inventory/items/:id`

Actualizar item

#### DELETE `/api/inventory/items/:id`

Eliminar item

---

### 📊 Stock

#### GET `/api/inventory/stock`

Consultar stock

#### POST `/api/inventory/stock`

Registrar movimiento de stock

---

### 🏭 Proveedores

#### GET `/api/inventory/suppliers`

Obtener proveedores

#### POST `/api/inventory/suppliers`

Crear proveedor

---

### 🏢 Almacenes

#### GET `/api/inventory/warehouses`

Obtener almacenes

#### POST `/api/inventory/warehouses`

Crear almacén

---

### 🔄 Movimientos

#### GET `/api/inventory/movements`

Obtener movimientos de inventario

#### POST `/api/inventory/movements`

Registrar movimiento

---

### 📦 Órdenes de Compra

#### GET `/api/inventory/purchaseOrders`

Obtener órdenes de compra

#### POST `/api/inventory/purchaseOrders`

Crear orden de compra

---

### 🏷️ Catálogos (Brands, Categories, Models, Units)

#### GET `/api/inventory/brands`

Obtener marcas

#### GET `/api/inventory/categories`

Obtener categorías

#### GET `/api/inventory/models`

Obtener modelos

#### GET `/api/inventory/units`

Obtener unidades de medida

---

## 🔧 Órdenes de Trabajo (Work Orders)

### GET `/api/work-orders`

Obtener todas las órdenes de trabajo

### POST `/api/work-orders`

Crear nueva orden de trabajo

### GET `/api/work-orders/:id`

Obtener orden por ID

### PUT `/api/work-orders/:id`

Actualizar orden

### DELETE `/api/work-orders/:id`

Eliminar orden

---

### 📄 Items de Orden

#### GET `/api/work-order-items`

Obtener items de órdenes

#### POST `/api/work-order-items`

Crear item de orden

---

### 🔄 Estados de Orden

#### GET `/api/work-order-statuses`

Obtener estados disponibles

---

### 🛠️ Servicios

#### GET `/api/services`

Obtener servicios disponibles

#### POST `/api/services`

Crear nuevo servicio

---

### 📑 Categorías y Subcategorías de Servicios

#### GET `/api/service-categories`

Obtener categorías de servicios

#### GET `/api/service-subcategories`

Obtener subcategorías

---

### 📜 Historial de Órdenes

#### GET `/api/work-order-history`

Obtener historial de cambios

---

## 💰 Facturación (Billing)

### GET `/api/invoices`

Obtener todas las facturas

### POST `/api/invoices`

Crear nueva factura

### GET `/api/invoices/:id`

Obtener factura por ID

### PUT `/api/invoices/:id`

Actualizar factura

### DELETE `/api/invoices/:id`

Eliminar factura

---

### 📋 Items de Factura

#### GET `/api/invoice-items`

Obtener items de facturas

#### POST `/api/invoice-items`

Crear item de factura

---

### 💳 Pagos

#### GET `/api/payments`

Obtener todos los pagos

#### POST `/api/payments`

Registrar nuevo pago

#### GET `/api/payments/:id`

Obtener pago por ID

---

## 🔍 Utilidades

### GET `/api/buscar/:coleccion/:termino`

Búsqueda general en colecciones

**Colecciones disponibles:**

- usuarios
- clientes
- vehiculos
- ordenes
- facturas

---

### GET `/api/historial/:coleccion/:id`

Obtener historial de cambios de un documento

---

### POST `/api/uploads/:coleccion/:id`

Subir archivos/imágenes

**Colecciones permitidas:**

- usuarios
- clientes
- vehiculos
- productos

---

### GET `/api/uploads/:coleccion/:archivo`

Obtener archivo subido

---

## 🔔 Notificaciones

### GET `/api/notification`

Obtener notificaciones del usuario

### POST `/api/notification`

Crear notificación

### PUT `/api/notification/:id`

Marcar notificación como leída

### DELETE `/api/notification/:id`

Eliminar notificación

---

### 📱 Firebase Cloud Messaging

#### POST `/api/send-notification`

Enviar notificación push

**Body:**

```json
{
  "token": "firebase_device_token",
  "title": "Título",
  "body": "Mensaje de la notificación"
}
```

#### POST `/api/save-token`

Guardar token de dispositivo FCM

---

## 🤖 Auto Sys

### GET `/api/autoSys`

Obtener configuraciones del sistema automático

### POST `/api/autoSys`

Crear configuración

### PUT `/api/autoSys/:id`

Actualizar configuración

---

## 📝 Notas Importantes

### Autenticación

Todas las rutas (excepto `/api/auth/login` y `/api/auth/register`) requieren el header:

```
x-token: tu_token_jwt_aqui
```

### Roles

Algunas operaciones requieren roles específicos:

- **SuperAdmin**: CRUD completo en todos los módulos
- **Admin**: Lectura y escritura limitada
- **User**: Solo lectura

### Paginación

Muchas rutas GET aceptan query params:

- `limite`: Número de resultados (default: 10)
- `desde`: Offset para paginación (default: 0)

**Ejemplo:**

```
GET /api/customers?limite=20&desde=40
```

### Formato de Respuestas

**Éxito:**

```json
{
  "ok": true,
  "data": { ... },
  "total": 100
}
```

**Error:**

```json
{
  "ok": false,
  "msg": "Mensaje de error",
  "errors": [ ... ]
}
```

---

## 🔧 Correcciones Aplicadas

### ✅ Estandarización de Importaciones

- Todos los módulos siguen el patrón: `index.js → routes/index.js → router`
- Eliminadas importaciones duplicadas
- Corregidas rutas de modelos (`../models/user` → `../features/user/user.models`)

### ✅ Rutas CRM

- **Customers**: Corregida ruta `/api/customers/customers` → `/api/customers`
- **Vehicles**: Estructura correcta con sub-rutas `/brands`, `/models`

### ✅ Módulos Workshop

- **Work Orders**: 7 rutas consolidadas en 1 índice
- **Billing**: 3 rutas consolidadas en 1 índice

---

**Última actualización:** Noviembre 2025
**Versión del servidor:** 1.0.0
