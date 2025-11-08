# Customers Module (CRM)

Módulo para la gestión de clientes en el sistema CRM básico.
Implementa los requerimientos funcionales RF-6 y prepara la estructura para RF-9/RF-10.

## 📋 Descripción

Este módulo maneja toda la lógica relacionada con los clientes del taller, incluyendo:

- **Registro de clientes** con información básica y de contacto
- **Gestión de datos** personales y empresariales
- **Historial de vehículos** asociados al cliente
- **Historial de órdenes de trabajo** (preparado para integración futura)

## 🎯 Requerimientos Funcionales Cubiertos

- **RF-6**: Gestión completa de clientes (registro, consulta, actualización)
- **RF-9**: Historial de órdenes de trabajo por cliente _(estructura preparada)_
- **RF-10**: Historial de órdenes de trabajo por vehículo _(estructura preparada)_

## 📁 Estructura del Módulo

```text
features/crm/customers/
├── controllers/                    # Controladores de negocio
│   ├── customer.controller.js      # CRUD clientes
│   └── index.js                    # Exportador controladores
├── helpers/                        # Helpers específicos
│   ├── customer-validators.js      # Validadores de BD
│   └── index.js                    # Exportador helpers
├── models/                         # Modelos de datos
│   ├── customer.model.js           # Modelo Cliente
│   └── index.js                    # Exportador modelos
├── routes/                         # Definición de rutas API
│   ├── customer.routes.js          # Rutas clientes
│   └── index.js                    # Router principal
├── utils/                          # Utilidades auxiliares
└── README.md                       # Esta documentación
```

## 🗄️ Modelo de Datos

### Customer (Cliente)

```javascript
{
  // Información básica
  nombre: "Juan Pérez",             // String, requerido
  tipo: "persona",                  // persona/empresa

  // Información de contacto
  telefono: "+584241234567",        // String, requerido
  correo: "juan@email.com",         // String, único, requerido
  direccion: "Calle 123, Ciudad",   // String, opcional

  // Información empresarial (solo para tipo empresa)
  rif: "J-12345678-9",              // String, único (para empresas)
  razonSocial: "Empresa XYZ C.A.", // String (para empresas)

  // Información adicional
  notas: "Cliente preferencial",    // String, opcional

  // Estado y auditoría
  estado: "activo",                 // activo/inactivo
  eliminado: false,                 // Eliminación lógica
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

### Clientes: `/api/customers`

| Método | Endpoint                        | Descripción        | Auth             |
| ------ | ------------------------------- | ------------------ | ---------------- |
| GET    | `/api/customers`                | Listar clientes    | JWT              |
| GET    | `/api/customers/:id`            | Obtener por ID     | JWT              |
| GET    | `/api/customers/rif/:rif`       | Buscar por RIF     | JWT              |
| GET    | `/api/customers/correo/:correo` | Por email          | JWT              |
| POST   | `/api/customers`                | Crear cliente      | JWT + SuperAdmin |
| PUT    | `/api/customers/:id`            | Actualizar cliente | JWT + SuperAdmin |
| DELETE | `/api/customers/:id`            | Eliminar cliente   | JWT + SuperAdmin |

## 📝 Ejemplos de Uso

### Crear un Cliente Persona

```bash
POST /api/customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "nombre": "Juan Pérez",
  "tipo": "persona",
  "telefono": "+584241234567",
  "correo": "juan@email.com",
  "direccion": "Calle 123, Caracas",
  "notas": "Cliente regular"
}
```

### Crear un Cliente Empresa

```bash
POST /api/customers
Authorization: Bearer <token>
Content-Type: application/json

{
  "nombre": "María González",
  "tipo": "empresa",
  "telefono": "+584241234568",
  "correo": "contacto@empresa.com",
  "direccion": "Av. Principal, Centro Empresarial",
  "rif": "J-12345678-9",
  "razonSocial": "Empresa XYZ C.A.",
  "notas": "Cliente corporativo"
}
```

### Buscar por RIF

```bash
GET /api/customers/rif/J-12345678-9
Authorization: Bearer <token>
```

## ✅ Validaciones

### Campos Obligatorios

- **Todos los clientes**: `nombre`, `tipo`, `telefono`, `correo`
- **Empresas**: `rif`, `razonSocial` (adicionales)

### Reglas de Negocio

- ✅ Correos únicos en todo el sistema
- ✅ RIF únicos (solo para empresas)
- ✅ Teléfonos válidos (formato venezolano)
- ✅ Eliminación lógica protege integridad referencial

### Permisos

- **Lectura**: Usuarios autenticados
- **Escritura**: Solo SuperAdmin
- **Eliminación**: Solo SuperAdmin (con validaciones)

## 🔧 Integración con el Sistema

### Dependencias

- **Auth Middleware**: Para autenticación JWT
- **Audit Plugin**: Para seguimiento de cambios
- **Vehicles Module**: Para asociar vehículos a clientes

### Próximas Integraciones

- **Work Orders**: Para historial de órdenes de trabajo (RF-9, RF-10)
- **Vehicles**: Asociación bidireccional cliente-vehículo
- **Notifications**: Para comunicaciones con clientes

## 🚀 Próximos Pasos

1. **Integrar con servidor principal** ✅ Completado
2. **Crear módulo work-orders** para completar RF-9/RF-10
3. **Implementar relaciones** cliente-vehículo
4. **Agregar reportes y estadísticas**
5. **Implementar notificaciones de clientes**

---

**Estado**: ✅ Implementado y listo para integración
**Versión**: 1.0.0
**Última actualización**: Noviembre 2025
