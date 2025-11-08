# Feature: Inventory (Inventario)

Este README documenta la estructura, convenciones y uso rápido del feature `features/inventory`.

Contenido rápido

- `features/inventory/models/` : modelos canónicos agrupados por subfeature (items, stock, movements, orders, suppliers, warehouses, reservations, catalogs).
- Cada subfeature sigue la estructura: `model`, `controllers`, `routes`, `services` donde aplique.
- `features/inventory/models/index.js`: índice que re-exporta los modelos canónicos. Usar este índice facilita imports consistentes.
- En la raíz del feature pueden existir wrappers (re-exports) para compatibilidad hacia atrás.

Dónde se exponen las rutas

El feature está montado en el servidor en: `/api/inventory` (ver `models/server.js`).
Endpoints disponibles (principales):

- /api/inventory/items
- /api/inventory/stock
- /api/inventory/movements
- /api/inventory/purchaseOrders
- /api/inventory/suppliers
- /api/inventory/warehouses
- /api/inventory/reservations

Catalogs (añadidos recientemente):

- /api/inventory/brands (Marca)
- /api/inventory/categories (Categoría)
- /api/inventory/models (Modelo de artículo)

Nota: las rutas de catalogs están protegidas por autenticación (`validarJWT`) y algunas acciones requieren roles (`tieneRole`).

Convenciones y notas importantes

- Modelos: nombres en singular (p. ej. `Item`, `Brand`) y archivos `item.models.js` ubicados en `features/inventory/items/`.
- Controllers y routes: archivos en plural (p. ej. `items.controllers.js`, `items.routes.js`).
- Para evitar rutas relativas largas, usa `require('../models')` dentro del feature: `const { Item, Brand } = require('../models');`.
- Soft-delete: los recursos usan `eliminado: Boolean` (no se borran físicamente). Filtrar por `eliminado: false` en queries públicas.
- Auditoría: muchos esquemas aplican un plugin de auditoría que mantiene `historial` y metadatos.

Populate / relaciones

- `Item` ahora referencia `Brand`, `ItemModel` y `Category` mediante `ObjectId`.
- En los endpoints principales de `items` las relaciones vienen pobladas por defecto (por ejemplo GET /api/inventory/items devuelve `marca`, `modelo`, `categoria` como objetos, no solo ids).

Ejemplos de uso (curl)

Obtener lista de marcas (requiere JWT):

```bash
curl -H "Authorization: Bearer <TOKEN>" \
  https://tu-servidor.example.com/api/inventory/brands
```

Crear una marca:

```bash
curl -X POST -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"nombre":"Marca A"}' \
  https://tu-servidor.example.com/api/inventory/brands
```

Crear un modelo de artículo (relacionado a marca):

```bash
curl -X POST -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"nombre":"Modelo X","marca":"<brandId>"}' \
  https://tu-servidor.example.com/api/inventory/models
```

Crear un item referenciando los catalogs (POST /api/inventory/items):

```bash
curl -X POST -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"nombre":"Filtro aceite","marca":"<brandId>","modelo":"<modelId>","categoria":"<categoryId>", "precioCosto":5.5}' \
  https://tu-servidor.example.com/api/inventory/items
```

Cuando creas o consultas un `Item`, la API devuelve los objetos `marca`, `modelo` y `categoria` ya poblados (si existen), por ejemplo:

```json
{
  "id": "64e...abc",
  "nombre": "Filtro aceite",
  "marca": { "id": "br1", "nombre": "Marca A" },
  "modelo": { "id": "m1", "nombre": "Modelo X", "marca": "br1" },
  "categoria": { "id": "c1", "nombre": "Filtros" }
}
```

TypeScript — ejemplos de interfaces (copiar a `src/types/inventory.ts`)

```ts
export interface Brand {
  id?: string;
  nombre: string;
  eliminado?: boolean;
}
export interface Category {
  id: string;
  nombre: string;
  eliminado?: boolean;
}
export interface ItemModel {
  id: string;
  nombre: string;
  marca?: string | Brand;
  eliminado?: boolean;
}

export interface Item {
  id: string;
  sku?: string;
  codigo?: string;
  nombre: string;
  descripcion?: string;
  marca?: string | Brand;
  modelo?: string | ItemModel;
  categoria?: string | Category;
  unidad?: string;
  precioCosto?: number;
  precioVenta?: number;
  stockMinimo?: number;
  stockMaximo?: number;
  imagenes?: string[];
  estado?: "activo" | "inactivo";
  eliminado?: boolean;
  createdBy?: string;
  historial?: any[];
  createdAt?: string;
  updatedAt?: string;
}
```

Buenas prácticas y migración

- Si tu frontend espera `marca`, `modelo`, `categoria` como strings (ids), acepta tanto id como objetos. El backend devuelve objetos poblados para comodidad del cliente.
- Si tienes integraciones antiguas con archivos de modelo en la raíz del feature, el código mantiene re-exports para compatibilidad. Para nuevas implementaciones importa desde `features/inventory/models`.

Qué puedo hacer a continuación (opciones)

- Generar automáticamente `src/types/inventory.ts` dentro del repo (frontend) con las interfaces.
- Crear ejemplos Postman / colección con requests para CRUD de catalogs y items.
- Ejecutar pruebas rápidas (smoke tests) contra el servidor para verificar que los endpoints de catalogs y `items` devuelven datos poblados.

Si quieres que haga alguna de estas acciones, dime cuál y la implemento.
