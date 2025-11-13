# Features - Estructura Modular por Dominio

Esta carpeta organiza la aplicación por **features/dominios** para mejorar mantenibilidad y escalabilidad.

## Principios de organización

### 1. Estructura por feature

Cada carpeta en `features/` representa un módulo o dominio de negocio autocontenido:

```
features/
  ├── auth/              # Autenticación (login, registro, tokens)
  ├── user/              # Gestión de usuarios
  ├── workshop/           # Gestión de talleres/refinerías
  ├── inventory/         # Inventario por taller
  ├── finance/           # Módulo financiero (facturas, balance, costos)
  └── ...
```

### 2. Contenido típico de cada feature

```
feature-name/
  ├── index.js                    # Exporta router (punto de entrada)
  ├── feature-name.routes.js      # Rutas Express
  ├── feature-name.controllers.js # Lógica de control
  ├── feature-name.models.js      # Modelos Mongoose (opcional)
  ├── feature-name.services.js    # Lógica de negocio reutilizable
  └── tests/                      # Tests del feature
      └── feature-name.test.js
```

### 3. Convenciones de nombres

- **Carpetas**: singular (`user`, `workshop`, `inventory`)
- **Archivos**: `feature.tipo.js` (ej: `user.routes.js`, `inventory.controller.js`)
- **Rutas públicas**: plural (`/api/users`, `/api/autoSys`, `/api/inventory`)
- **Modelos**: singular con mayúscula (`User`, `Workshop`, `InventoryItem`)

### 4. Exportación en `index.js`

Cada feature debe exportar su router en `index.js`:

```javascript
// features/user/index.js
module.exports = require("./user.routes");
```

Esto permite montar en `server.js` de forma limpia:

```javascript
this.app.use("/api/users", require("../features/user"));
```

## Features Core vs Features de Negocio

### Core Features (cross-cutting)

- `auth/` - Autenticación y autorización
- `user/` - Gestión de usuarios (usado por todos los módulos)

### Features de Negocio (específicos de taller)

- `workshop/` - Gestión de talleres
- `inventory/` - Inventario
- `finance/` - Finanzas
- `workorder/` - Órdenes de trabajo
- etc.

## Multi-tenancy (Talleres)

Los features de negocio trabajan con datos filtrados por `tallerId`:

1. **Middleware `tenantResolver`**: Valida y resuelve el taller activo
2. **Request context**: `req.taller.id` disponible en controllers
3. **Queries**: Filtran automáticamente por `tallerId`

Ejemplo de uso:

```javascript
// En routes
const { tenantResolver } = require("../../core/middleware");
router.get("/", tenantResolver, inventoryController.list);

// En controller
const list = async (req, res) => {
  const tallerId = req.taller?.id;
  const items = await Inventory.find({ tallerId });
  res.json(items);
};
```

## Migración Gradual

Los wrappers permiten migrar sin romper el código existente:

```javascript
// features/inventory/index.js (wrapper temporal)
module.exports = require("../../routes/inventario");
```

Cuando migres el código:

1. Copia archivos a la carpeta del feature
2. Actualiza imports internos
3. Reemplaza el wrapper por el nuevo router
4. Elimina archivos antiguos

## Testing

Cada feature puede tener sus tests aislados:

```
features/user/tests/
  ├── user.routes.test.js
  ├── user.service.test.js
  └── user.integration.test.js
```

## Recursos Compartidos

Para código compartido entre features:

- **Middleware**: `core/middleware/`
- **Utils**: `core/utils/`
- **Helpers**: `helpers/` (mantener hasta migrar a core)

## Próximos Pasos

1. Migrar `controllers/usuarios.js` → `features/user/user.controllers.js`
2. Migrar rutas de inventario, finanzas, etc.
3. Aplicar `tenantResolver` a features de taller
4. Eliminar carpetas globales `controllers/`, `routes/` cuando todo esté migrado
