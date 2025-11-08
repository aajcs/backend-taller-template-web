# Plan de Migración de Tests a API Real

## Resumen Ejecutivo

Actualmente tenemos **20 tests** que usan acceso directo a modelos de Mongoose. Necesitamos migrarlos para que usen los **controladores y endpoints reales del API** para validar el comportamiento real del sistema.

---

## ✅ Tests Ya Migrados (2)

### 1. test-customer-vehicles-api.js

- **Estado**: ✅ COMPLETADO
- **Usa API**: Sí
- **Endpoints probados**:
  - POST /api/auth/login
  - POST /api/vehicles/brands
  - POST /api/vehicles/models
  - POST /api/customers
  - POST /api/vehicles
  - GET /api/customers/:id
  - GET /api/customers
  - DELETE (todos los anteriores)

### 2. test-customer-vehicles.js

- **Estado**: ⚠️ MANTENER (Prueba interna del modelo)
- **Usa API**: No (usa Mongoose directo)
- **Propósito**: Validar el funcionamiento interno del modelo y virtuals
- **Decisión**: Mantener como test de integración de modelos

---

## 🔄 Tests Por Migrar (18)

### Prioridad ALTA - Módulo CRM

#### 3. test-autosys.js

- **Módulo**: AutoSys (Talleres/Refinerías)
- **Acciones actuales**: CRUD completo con Mongoose
- **Endpoints a usar**:
  - POST /api/autosys (crear taller)
  - GET /api/autosys/:id (leer taller)
  - PUT /api/autosys/:id (actualizar taller)
  - DELETE /api/autosys/:id (eliminar taller)
  - GET /api/autosys (listar talleres)
- **Validaciones actuales**:
  - ✓ Creación de taller
  - ✓ Lectura de taller
  - ✓ Actualización de taller
  - ✓ Eliminación lógica
  - ✓ Validaciones de campos requeridos
  - ✓ Validaciones de RIF único
  - ✓ Validaciones de capacidad
  - ✓ Filtros por estado
- **Complejidad**: MEDIA
- **Tiempo estimado**: 2-3 horas

**Plan detallado**:

```javascript
// Estructura del test migrado
1. Autenticación (superAdmin)
2. Crear taller vía POST /api/autosys
3. Leer taller vía GET /api/autosys/:id
4. Actualizar vía PUT /api/autosys/:id
5. Listar vía GET /api/autosys
6. Validar errores de campos requeridos
7. Validar RIF duplicado
8. Eliminar vía DELETE /api/autosys/:id
9. Limpieza
```

---

### Prioridad ALTA - Módulo Inventario

#### 4. test-inventory-adjustment.js

- **Módulo**: Ajustes de Inventario
- **Acciones actuales**: Ajustes de stock con Mongoose
- **Endpoints a usar**:
  - GET /api/items (obtener repuestos)
  - GET /api/stock/:id (obtener stock)
  - POST /api/stock/:id/adjust (ajustar stock)
  - GET /api/movements (verificar movimientos)
- **Validaciones**:
  - ✓ Ajuste positivo de stock
  - ✓ Ajuste negativo de stock
  - ✓ Registro de movimientos
  - ✓ Motivos de ajuste
- **Complejidad**: MEDIA
- **Tiempo estimado**: 2 horas

**Plan detallado**:

```javascript
1. Autenticación
2. Obtener stock actual vía GET
3. Realizar ajuste positivo vía POST
4. Validar nuevo stock
5. Realizar ajuste negativo
6. Verificar movimientos en historial
7. Limpieza
```

#### 5. test-movement-history.js

- **Módulo**: Historial de Movimientos
- **Acciones actuales**: Consultas de movimientos con Mongoose
- **Endpoints a usar**:
  - POST /api/items (crear items de prueba)
  - POST /api/movements (registrar movimientos)
  - GET /api/movements (listar con filtros)
  - GET /api/movements/:id (detalle)
- **Validaciones**:
  - ✓ Registro de entradas
  - ✓ Registro de salidas
  - ✓ Registro de ajustes
  - ✓ Filtros por tipo
  - ✓ Filtros por fecha
  - ✓ Filtros por item
- **Complejidad**: MEDIA
- **Tiempo estimado**: 2-3 horas

#### 6. test-minimum-stock-alert.js

- **Módulo**: Alertas de Stock Mínimo
- **Acciones actuales**: Verificación de alertas con Mongoose
- **Endpoints a usar**:
  - GET /api/stock/alerts (obtener alertas)
  - GET /api/stock/low-stock (items con stock bajo)
  - PUT /api/items/:id (actualizar stock mínimo)
- **Validaciones**:
  - ✓ Detección de stock bajo
  - ✓ Alertas de reorden
  - ✓ Umbral de stock crítico
- **Complejidad**: BAJA
- **Tiempo estimado**: 1-2 horas

#### 7. test-reports-statistics.js

- **Módulo**: Reportes y Estadísticas
- **Acciones actuales**: Agregaciones con Mongoose
- **Endpoints a usar**:
  - GET /api/reports/inventory-summary
  - GET /api/reports/movement-stats
  - GET /api/reports/stock-valuation
- **Validaciones**:
  - ✓ Resumen de inventario
  - ✓ Estadísticas de movimientos
  - ✓ Valoración de stock
- **Complejidad**: ALTA
- **Tiempo estimado**: 3-4 horas

---

### Prioridad ALTA - Módulo Órdenes

#### 8. test-sales-orders.js

- **Módulo**: Órdenes de Venta
- **Acciones actuales**: CRUD de órdenes con Mongoose
- **Endpoints a usar**:
  - POST /api/sales-orders (crear orden)
  - GET /api/sales-orders/:id (obtener orden)
  - PUT /api/sales-orders/:id (actualizar orden)
  - POST /api/sales-orders/:id/complete (completar orden)
  - DELETE /api/sales-orders/:id (cancelar orden)
- **Validaciones**:
  - ✓ Creación de orden
  - ✓ Reserva de stock
  - ✓ Completar orden
  - ✓ Liberar stock al cancelar
  - ✓ Estados de orden
- **Complejidad**: ALTA
- **Tiempo estimado**: 3-4 horas

#### 9. test-purchase-orders.js

- **Módulo**: Órdenes de Compra
- **Acciones actuales**: CRUD de compras con Mongoose
- **Endpoints a usar**:
  - POST /api/purchase-orders (crear orden)
  - GET /api/purchase-orders/:id
  - PUT /api/purchase-orders/:id
  - POST /api/purchase-orders/:id/receive (recibir mercancía)
  - DELETE /api/purchase-orders/:id
- **Validaciones**:
  - ✓ Creación de orden de compra
  - ✓ Recepción de mercancía
  - ✓ Actualización de stock
  - ✓ Cancelación
- **Complejidad**: ALTA
- **Tiempo estimado**: 3-4 horas

---

### Prioridad MEDIA - Módulo Reservas

#### 10. test-reservation-flow.js

- **Módulo**: Flujo de Reservas
- **Acciones actuales**: Gestión de reservas con Mongoose
- **Endpoints a usar**:
  - POST /api/reservations (crear reserva)
  - GET /api/reservations/:id
  - PUT /api/reservations/:id/confirm (confirmar)
  - DELETE /api/reservations/:id (cancelar)
- **Validaciones**:
  - ✓ Crear reserva
  - ✓ Verificar disponibilidad
  - ✓ Confirmar reserva
  - ✓ Cancelar y liberar stock
- **Complejidad**: ALTA
- **Tiempo estimado**: 3 horas

#### 11. test-concurrent-reservations.js

- **Módulo**: Reservas Concurrentes
- **Acciones actuales**: Pruebas de concurrencia con Mongoose
- **Endpoints a usar**:
  - POST /api/reservations (múltiples simultáneas)
  - GET /api/stock/:id (verificar stock)
- **Validaciones**:
  - ✓ Manejo de concurrencia
  - ✓ Prevención de sobreventa
  - ✓ Integridad de stock
- **Complejidad**: MUY ALTA
- **Tiempo estimado**: 4-5 horas

---

### Prioridad MEDIA - Módulo Devoluciones

#### 12. test-return-item.js

- **Módulo**: Devoluciones
- **Acciones actuales**: Gestión de devoluciones con Mongoose
- **Endpoints a usar**:
  - POST /api/returns (crear devolución)
  - GET /api/returns/:id
  - POST /api/returns/:id/approve (aprobar)
  - POST /api/returns/:id/reject (rechazar)
- **Validaciones**:
  - ✓ Crear devolución
  - ✓ Aprobar y actualizar stock
  - ✓ Rechazar devolución
- **Complejidad**: MEDIA
- **Tiempo estimado**: 2-3 horas

---

### Prioridad MEDIA - Órdenes Complejas

#### 13. test-cancel-order.js

- **Módulo**: Cancelación de Órdenes
- **Endpoints a usar**:
  - DELETE /api/sales-orders/:id
  - GET /api/reservations (verificar liberación)
  - GET /api/stock/:id (verificar stock restaurado)
- **Complejidad**: MEDIA
- **Tiempo estimado**: 2 horas

#### 14. test-multiple-items.js

- **Módulo**: Órdenes Multi-Item
- **Endpoints a usar**:
  - POST /api/sales-orders (con múltiples items)
  - GET /api/sales-orders/:id
- **Complejidad**: MEDIA
- **Tiempo estimado**: 2 horas

---

### Prioridad BAJA - Integraciones Complejas

#### 15. test-full-integration.js

- **Módulo**: Integración Completa
- **Descripción**: Flujo end-to-end completo
- **Endpoints**: Múltiples módulos
- **Complejidad**: MUY ALTA
- **Tiempo estimado**: 5-6 horas

#### 16. test-warehouse-transfer.js

- **Módulo**: Transferencias entre Almacenes
- **Endpoints a usar**:
  - POST /api/transfers
  - GET /api/transfers/:id
  - POST /api/transfers/:id/complete
- **Complejidad**: ALTA
- **Tiempo estimado**: 3 horas

#### 17. test-insufficient-stock.js

- **Módulo**: Validación de Stock Insuficiente
- **Endpoints**: Órdenes con stock insuficiente
- **Complejidad**: MEDIA
- **Tiempo estimado**: 2 horas

#### 18. test-performance-stress.js

- **Módulo**: Pruebas de Rendimiento
- **Descripción**: Carga y estrés del sistema
- **Endpoints**: Múltiples endpoints
- **Complejidad**: MUY ALTA
- **Tiempo estimado**: 6-8 horas

#### 19. test-role-permissions.js

- **Módulo**: Permisos y Roles
- **Endpoints a usar**:
  - Todos los endpoints con diferentes roles
- **Validaciones**:
  - ✓ Acceso superAdmin
  - ✓ Acceso admin
  - ✓ Acceso operador
  - ✓ Denegación de acceso
- **Complejidad**: ALTA
- **Tiempo estimado**: 4 horas

---

## 📋 Resumen de Prioridades

### Prioridad ALTA (9 tests - 22-27 horas)

1. ✅ test-customer-vehicles-api.js (COMPLETADO)
2. test-autosys.js
3. test-inventory-adjustment.js
4. test-movement-history.js
5. test-minimum-stock-alert.js
6. test-reports-statistics.js
7. test-sales-orders.js
8. test-purchase-orders.js
9. test-reservation-flow.js

### Prioridad MEDIA (5 tests - 11-14 horas)

10. test-concurrent-reservations.js
11. test-return-item.js
12. test-cancel-order.js
13. test-multiple-items.js
14. test-role-permissions.js

### Prioridad BAJA (4 tests - 16-20 horas)

15. test-full-integration.js
16. test-warehouse-transfer.js
17. test-insufficient-stock.js
18. test-performance-stress.js

---

## 🛠️ Plantilla Estándar para Migración

Cada test migrado debe seguir esta estructura:

```javascript
/**
 * Test: [Nombre del Módulo] - API
 * Prueba los endpoints reales del API
 */

require("dotenv").config();
const http = require("http");

// Configuración
const API_HOST = "localhost";
const API_PORT = 4000;
const API_BASE = "/api";

// Variables globales
let authToken = "";
let testData = {};

/**
 * Función HTTP helper
 */
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: API_PORT,
      path: `${API_BASE}${path}`,
      method: method,
      headers: { "Content-Type": "application/json" },
    };
    if (token) options.headers["x-token"] = token;

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: JSON.parse(body),
          });
        } catch (error) {
          reject(new Error(`Error parsing: ${body}`));
        }
      });
    });

    req.on("error", reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

/**
 * Test principal
 */
const test[NombreModulo]API = async () => {
  try {
    console.log("=" repeat(60));
    console.log("🧪 TEST: [NOMBRE MÓDULO] - API");
    console.log("=".repeat(60));

    // 1. Autenticación
    const loginRes = await makeRequest("POST", "/auth/login", {
      correo: "superadmin@taller.com",
      password: "SuperAdmin123!",
    });
    authToken = loginRes.data.token;
    console.log("✅ Autenticado");

    // 2. Tests específicos del módulo
    // ...

    // 3. Limpieza
    // ...

    console.log("\n✅ TODOS LOS TESTS PASARON");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    // Limpieza en caso de error
    process.exit(1);
  }
};

test[NombreModulo]API();
```

---

## 📊 Estimación Total

- **Tests a migrar**: 18
- **Tiempo estimado total**: 49-61 horas
- **Tiempo por sprint (2 semanas)**: ~20 horas
- **Sprints necesarios**: 3 sprints

### Sprint 1 (Tests 2-6): ~11-14 horas

- test-autosys.js
- test-inventory-adjustment.js
- test-movement-history.js
- test-minimum-stock-alert.js
- test-reports-statistics.js

### Sprint 2 (Tests 7-11): ~13-17 horas

- test-sales-orders.js
- test-purchase-orders.js
- test-reservation-flow.js
- test-concurrent-reservations.js
- test-return-item.js

### Sprint 3 (Tests 12-19): ~25-30 horas

- test-cancel-order.js
- test-multiple-items.js
- test-role-permissions.js
- test-full-integration.js
- test-warehouse-transfer.js
- test-insufficient-stock.js
- test-performance-stress.js

---

## ✅ Beneficios de la Migración

1. **Validación Real**: Los tests validan el comportamiento real del API, no solo los modelos
2. **Detección de Errores**: Identifica problemas en controladores, middlewares, validaciones
3. **Documentación Viva**: Los tests sirven como ejemplos de uso del API
4. **Regresión**: Previene que cambios rompan funcionalidad existente
5. **Confianza**: Mayor seguridad al hacer cambios en el código

---

## 🎯 Próximos Pasos Inmediatos

1. ✅ Completar migración de test-customer-vehicles-api.js (HECHO)
2. 🔄 Migrar test-autosys.js (SIGUIENTE)
3. 🔄 Migrar test-inventory-adjustment.js
4. 🔄 Continuar con prioridad ALTA

---

**Última actualización**: 7 de noviembre de 2025
