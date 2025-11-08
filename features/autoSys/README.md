# AutoSys Feature

Feature para la gestión de talleres/refinerías en el sistema.

## Descripción

Este módulo maneja toda la lógica relacionada con los talleres (autoSys/refinerías), que son las entidades principales del sistema de multi-tenancy. Cada usuario puede tener acceso a uno o varios talleres dependiendo de su nivel de permisos.

## Estructura

```
features/autoSys/
├── autoSys.models.js      # Modelo Mongoose para AutoSys
├── autoSys.controllers.js # Controladores (lógica de negocio)
├── autoSys.routes.js      # Rutas Express
├── index.js               # Exporta el router
└── README.md              # Esta documentación
```

## Modelo AutoSys

### Campos principales:

- **nombre**: Nombre del taller (único, obligatorio)
- **rif**: Número de Identificación Tributaria (único, obligatorio)
- **ubicacion**: Dirección física del taller
- **telefono**: Teléfono de contacto
- **procesamientoDia**: Capacidad de procesamiento diario
- **legal**: Representante legal
- **img**: Logo del taller (URL)
- **estado**: Estado del taller (activo/inactivo)
- **eliminado**: Flag para eliminación lógica

### Campos de auditoría (automáticos):

- **createdBy**: Usuario que creó el registro
- **createdAt**: Fecha de creación
- **updatedAt**: Fecha de última actualización
- **historial**: Array con historial de modificaciones

## Endpoints

### `GET /api/autoSys`

Obtiene todos los talleres no eliminados.

**Autenticación**: Requerida (JWT)

**Respuesta**:

```json
{
  "total": 10,
  "autoSys": [
    {
      "_id": "...",
      "nombre": "Taller Central",
      "rif": "123456789",
      "ubicacion": "Calle Principal 123",
      "procesamientoDia": 5000,
      "estado": "activo",
      ...
    }
  ]
}
```

### `GET /api/autoSys/:id`

Obtiene un autoSys específico por ID.

**Autenticación**: Requerida (JWT)

**Parámetros**: `id` - MongoDB ObjectId del autoSys

**Respuesta**: Objeto autoSys con historial y relaciones populadas

### `POST /api/autoSys`

Crea un nuevo autoSys.

**Autenticación**: Requerida (JWT + Rol SuperAdmin)

**Body**:

```json
{
  "nombre": "Taller Nuevo",
  "rif": "987654321",
  "ubicacion": "Avenida 456",
  "telefono": "1234567890",
  "procesamientoDia": 3000,
  "legal": "Juan Pérez",
  "img": "https://example.com/logo.png"
}
```

**Validaciones**:

- `ubicacion`: Obligatorio
- `nombre`: Obligatorio
- `rif`: Obligatorio
- `img`: Obligatorio

### `PUT /api/autoSys/:id`

Actualiza un autoSys existente.

**Autenticación**: Requerida (JWT + Rol SuperAdmin)

**Parámetros**: `id` - MongoDB ObjectId del autoSys

**Body**: Campos a actualizar (parcial)

### `DELETE /api/autoSys/:id`

Elimina lógicamente un autoSys (marca `eliminado: true`).

**Autenticación**: Requerida (JWT + Rol SuperAdmin/Admin)

**Parámetros**: `id` - MongoDB ObjectId del autoSys

## Multi-tenancy

El modelo AutoSys es la base del sistema multi-tenant:

1. Cada usuario tiene un campo `idRefineria` que referencia a uno o más talleres
2. Los usuarios con `acceso: 'limitado'` solo pueden ver datos de su taller asignado
3. Los usuarios con `acceso: 'completo'` pueden ver todos los talleres
4. El middleware `tenantResolver` valida y resuelve el taller activo en cada request

## Permisos

| Acción | Roles permitidos     |
| ------ | -------------------- |
| GET    | Todos (autenticados) |
| POST   | SuperAdmin           |
| PUT    | SuperAdmin           |
| DELETE | SuperAdmin, Admin    |

## Relaciones

El modelo AutoSys se relaciona con:

- **User**: Usuarios asignados al taller (`idRefineria`)
- **Tanque**: Tanques del taller
- **Torre**: Torres del taller
- **Bomba**: Bombas del taller
- **Inventario**: Inventario del taller
- **Recepción**: Recepciones del taller
- **Despacho**: Despachos del taller
- **Refinación**: Procesos de refinación
- Y otros módulos operacionales

## Migraciones

### Compatibilidad con código existente

Se creó un wrapper en `models/autoSys.js` que re-exporta el modelo desde `features/autoSys/autoSys.models.js`. Esto permite:

1. Usar `require('../models/autoSys')` en código existente
2. Usar `require('../features/autoSys/autoSys.models')` en código nuevo
3. Migración gradual sin romper funcionalidad

### Relación con modelo Refineria

El modelo `AutoSys` reemplaza progresivamente al modelo `Refineria`:

- `Refineria` es el nombre antiguo (en español)
- `AutoSys` es el nombre nuevo (en inglés, siguiendo convenciones)
- Ambos modelos coexisten durante la migración
- El objetivo es consolidar todo en `AutoSys`

## Uso en código

### Importar el modelo:

```javascript
// Forma nueva (recomendada)
const AutoSys = require("../features/autoSys/autoSys.models");

// Forma compatible
const AutoSys = require("../models/autoSys");
```

### Ejemplo de uso en controller:

```javascript
const { tenantResolver } = require("../../core/middleware");

router.get("/inventario", tenantResolver, async (req, res) => {
  const tallerId = req.taller.id; // Resuelto por tenantResolver

  const items = await Inventario.find({
    idRefineria: tallerId,
    eliminado: false,
  });

  res.json(items);
});
```

## Testing

Los tests deben cubrir:

- ✅ CRUD completo
- ✅ Validaciones de campos obligatorios
- ✅ Unicidad de nombre y RIF
- ✅ Permisos por rol
- ✅ Eliminación lógica
- ✅ Auditoría (createdBy, historial)

## Próximos pasos

1. Migrar código que usa `models/refineria` a `models/autoSys`
2. Actualizar referencias en controllers existentes
3. Crear tests para el feature
4. Deprecar el modelo `Refineria` una vez completada la migración
