# Vehicles Module (CRM)

Módulo para la gestión de vehículos en el sistema CRM básico.
Implementa los requerimientos funcionales RF-7, RF-8 y parte de RF-9/RF-10.

## 📋 Descripción

Este módulo maneja toda la lógica relacionada con los vehículos
de los clientes, incluyendo:

- **Catálogo de marcas y modelos** (sistema dinámico)
- **Registro de vehículos** asociados a clientes
- **Búsquedas rápidas** por placa y VIN
- **Historial de órdenes de trabajo** (preparado para integración futura)

## 🎯 Requerimientos Funcionales Cubiertos

- **RF-7**: Registrar vehículos asociados a clientes
  (Marca, Modelo, Año, Placa, VIN)
- **RF-8**: Búsquedas rápidas de vehículos (por placa y VIN)
- **RF-9**: Historial de órdenes de trabajo por vehículo
  _(estructura preparada)_
- **RF-10**: Historial de órdenes de trabajo por cliente
  _(estructura preparada)_

## 📁 Estructura del Módulo

```text
features/crm/vehicles/
├── controllers/                    # Controladores de negocio
│   ├── vehicleBrand.controller.js  # CRUD marcas
│   ├── vehicleModel.controller.js  # CRUD modelos
│   ├── vehicle.controller.js       # CRUD vehículos
│   └── index.js                    # Exportador controladores
├── helpers/                        # Helpers específicos
│   ├── vehicle-validators.js       # Validadores de BD
│   └── index.js                    # Exportador helpers
├── models/                         # Modelos de datos
│   ├── vehicleBrand.model.js       # Modelo Marca
│   ├── vehicleModel.model.js       # Modelo Modelo
│   ├── vehicle.model.js            # Modelo Vehículo
│   └── index.js                    # Exportador modelos
├── routes/                         # Definición de rutas API
│   ├── vehicleBrand.routes.js      # Rutas marcas
│   ├── vehicleModel.routes.js      # Rutas modelos
│   ├── vehicle.routes.js           # Rutas vehículos
│   └── index.js                    # Router principal
├── utils/                          # Utilidades auxiliares
└── README.md                       # Esta documentación
```

## 🗄️ Modelos de Datos

### VehicleBrand (Marca)

```javascript
{
  nombre: "TOYOTA",           // String, único, mayúsculas
  descripcion: "Marca japonesa líder",
  paisOrigen: "Japón",
  logo: "url_del_logo",       // Opcional
  estado: "activo",           // activo/inactivo
  eliminado: false,           // Eliminación lógica
  // Campos automáticos: createdAt, updatedAt, createdBy, historial
}
```

### VehicleModel (Modelo)

```javascript
{
  brand: ObjectId("brand_id"), // Referencia a VehicleBrand
  nombre: "Corolla",          // String
  descripcion: "Sedán compacto",
  tipo: "sedan",              // sedan, suv, pickup, hatchback, etc.
  motor: "gasolina",          // gasolina, diesel, electrico, hibrido
  yearInicio: 1997,           // Año inicio producción
  yearFin: 2024,              // Año fin producción (opcional)
  estado: "activo",           // activo/inactivo
  eliminado: false,           // Eliminación lógica
  // Campos automáticos: createdAt, updatedAt, createdBy, historial
}
```

### Vehicle (Vehículo)

```javascript
{
  customer: ObjectId("customer_id"), // Referencia al cliente
  model: ObjectId("model_id"),       // Referencia al modelo
  year: 2020,                        // Año del vehículo
  placa: "ABC123",                   // Placa (única, mayúsculas)
  vin: "1HGBH41JXMN109186",          // VIN (único, 17 caracteres)
  color: "Rojo",                     // Opcional
  kilometraje: 50000,                // Opcional
  estado: "activo",                  // activo/inactivo
  eliminado: false,                  // Eliminación lógica
  // Campos automáticos: createdAt, updatedAt, createdBy, historial
}
```

## 🔗 Relaciones

```text
Customer (Cliente)
    ↓
Vehicle (Vehículo) → VehicleModel (Modelo) → VehicleBrand (Marca)
```

## 🌐 Endpoints API

### Marcas de Vehículos: `/api/vehicles/brands`

| Método | Endpoint                   | Descripción             | Auth             |
| ------ | -------------------------- | ----------------------- | ---------------- |
| GET    | `/api/vehicles/brands`     | Listar todas las marcas | JWT              |
| GET    | `/api/vehicles/brands/:id` | Obtener marca por ID    | JWT              |
| POST   | `/api/vehicles/brands`     | Crear nueva marca       | JWT + SuperAdmin |
| PUT    | `/api/vehicles/brands/:id` | Actualizar marca        | JWT + SuperAdmin |
| DELETE | `/api/vehicles/brands/:id` | Eliminar marca          | JWT + SuperAdmin |

### Modelos de Vehículos: `/api/vehicles/models`

| Método | Endpoint                   | Descripción              | Auth             |
| ------ | -------------------------- | ------------------------ | ---------------- |
| GET    | `/api/vehicles/models`     | Listar todos los modelos | JWT              |
| GET    | `/api/vehicles/models/:id` | Obtener modelo por ID    | JWT              |
| POST   | `/api/vehicles/models`     | Crear nuevo modelo       | JWT + SuperAdmin |
| PUT    | `/api/vehicles/models/:id` | Actualizar modelo        | JWT + SuperAdmin |
| DELETE | `/api/vehicles/models/:id` | Eliminar modelo          | JWT + SuperAdmin |

### Vehículos: `/api/vehicles`

| Método | Endpoint                     | Descripción                 | Auth             |
| ------ | ---------------------------- | --------------------------- | ---------------- |
| GET    | `/api/vehicles`              | Listar todos los vehículos  | JWT              |
| GET    | `/api/vehicles/:id`          | Obtener vehículo por ID     | JWT              |
| GET    | `/api/vehicles/placa/:placa` | **Buscar por placa (RF-8)** | JWT              |
| GET    | `/api/vehicles/vin/:vin`     | **Buscar por VIN (RF-8)**   | JWT              |
| POST   | `/api/vehicles`              | Crear nuevo vehículo        | JWT + SuperAdmin |
| PUT    | `/api/vehicles/:id`          | Actualizar vehículo         | JWT + SuperAdmin |
| DELETE | `/api/vehicles/:id`          | Eliminar vehículo           | JWT + SuperAdmin |

## 📝 Ejemplos de Uso

### Crear una Marca

```bash
POST /api/vehicles/brands
Authorization: Bearer <token>
Content-Type: application/json

{
  "nombre": "TOYOTA",
  "descripcion": "Marca japonesa líder en automóviles",
  "paisOrigen": "Japón",
  "logo": "https://example.com/toyota-logo.png"
}
```

### Crear un Modelo

```bash
POST /api/vehicles/models
Authorization: Bearer <token>
Content-Type: application/json

{
  "brand": "64f1b2c3d4e5f6789abc123",
  "nombre": "Corolla",
  "descripcion": "Sedán compacto confiable",
  "tipo": "sedan",
  "motor": "gasolina",
  "yearInicio": 1997,
  "yearFin": 2024
}
```

### Crear un Vehículo

```bash
POST /api/vehicles
Authorization: Bearer <token>
Content-Type: application/json

{
  "customer": "64f1b2c3d4e5f6789abc456",
  "model": "64f1b2c3d4e5f6789def789",
  "year": 2020,
  "placa": "ABC123",
  "vin": "1HGBH41JXMN109186",
  "color": "Rojo",
  "kilometraje": 45000
}
```

### Buscar por Placa (RF-8)

```bash
GET /api/vehicles/placa/ABC123
Authorization: Bearer <token>
```

### Buscar por VIN (RF-8)

```bash
GET /api/vehicles/vin/1HGBH41JXMN109186
Authorization: Bearer <token>
```

## 🔍 Filtros y Búsquedas

### Vehículos con filtros

```bash
GET /api/vehicles?customer=cliente_id&model=modelo_id&placa=ABC&estado=activo
```

### Modelos con filtros

```bash
GET /api/vehicles/models?brand=marca_id
```

## ✅ Validaciones

### Campos Obligatorios

- **Marcas**: `nombre`
- **Modelos**: `brand`, `nombre`
- **Vehículos**: `customer`, `model`, `year`, `placa`, `vin`

### Reglas de Negocio

- ✅ Nombres de marcas únicos
- ✅ Una marca no puede tener modelos con nombres duplicados
- ✅ Placas únicas en todo el sistema
- ✅ VINs únicos (17 caracteres)
- ✅ Año del vehículo debe estar dentro del rango del modelo
- ✅ Eliminación lógica protege integridad referencial

### Permisos

- **Lectura**: Usuarios autenticados
- **Escritura**: Solo SuperAdmin
- **Eliminación**: Solo SuperAdmin (con validaciones)

## 🔧 Integración con el Sistema

### Dependencias

- **Customer Model**: Para asociar vehículos a clientes
- **Auth Middleware**: Para autenticación JWT
- **Audit Plugin**: Para seguimiento de cambios

### Próximas Integraciones

- **Work Orders**: Para historial de órdenes de trabajo (RF-9, RF-10)
- **Inventory**: Para piezas utilizadas en mantenimientos
- **Notifications**: Para alertas de mantenimiento

## 🧪 Testing

Los tests deben cubrir:

- ✅ CRUD completo para marcas, modelos y vehículos
- ✅ Validaciones de campos obligatorios
- ✅ Unicidad de placas y VINs
- ✅ Reglas de negocio (rangos de años)
- ✅ Permisos por roles
- ✅ Eliminación lógica y protección referencial
- ✅ Búsquedas por placa y VIN (RF-8)

## 🌱 Seeding de Datos

El módulo incluye scripts para poblar la base de datos con datos iniciales de marcas y modelos de vehículos.

### Datos Incluidos

- **20 marcas principales** del mercado venezolano
- **133 modelos** distribuidos entre las marcas
- **Cobertura completa**: Sedanes, SUVs, Pickups, Hatchbacks
- **Información detallada**: Años de producción, tipos de motor, países de origen

### Scripts Disponibles

#### Poblar Base de Datos

```bash
# Desde la raíz del proyecto
node database/seeds/vehicle-seeder.js
```

**Funciones:**

- ✅ Crea marcas si no existen
- ✅ Crea modelos asociados a las marcas
- ✅ Evita duplicados
- ✅ Reporta progreso en tiempo real

#### Verificar Datos

```bash
# Verificar integridad de los datos
node database/seeds/vehicle-verifier.js
```

**Verificaciones:**

- ✅ Conteo total de marcas y modelos
- ✅ Integridad de referencias
- ✅ Estadísticas por tipo de vehículo
- ✅ Muestra de datos insertados

#### Limpiar Datos

```bash
# Limpiar todos los datos (solo desarrollo)
node database/seeds/vehicle-seeder.js --clean
```

### Archivos de Datos

- `database/seeds/vehicle-seed-data.js`: Datos estructurados de marcas y modelos
- `database/seeds/vehicle-seeder.js`: Script principal de seeding
- `database/seeds/vehicle-verifier.js`: Script de verificación

### Ejemplo de Datos

```javascript
// Estructura de datos de seeding
{
  brands: [
    {
      nombre: "TOYOTA",
      descripcion: "Marca japonesa líder",
      paisOrigen: "Japón",
      modelos: [
        {
          nombre: "Corolla",
          tipo: "sedan",
          motor: "gasolina",
          yearInicio: 1997,
        },
        // ... más modelos
      ],
    },
    // ... más marcas
  ];
}
```

## 🚀 Próximos Pasos

1. **Integrar con servidor principal** (agregar rutas al app.js)
2. **Crear módulo de clientes** (customers) para completar CRM
3. **Implementar órdenes de trabajo** para RF-9 y RF-10
4. **Agregar reportes y estadísticas**
5. **Implementar notificaciones de mantenimiento**

---

**Estado**: ✅ Implementado y listo para integración
**Versión**: 1.0.0
**Última actualización**: Noviembre 2025
