# 🧪 Tests del Sistema de Inventario y Reservas

## 📋 Tests Disponibles

### 1. **test-reservation-flow.js** ✅

**Escenario:** Flujo completo de reserva y entrega de un repuesto

**Pasos:**

1. Asesor consulta repuestos disponibles
2. Sistema crea reserva en estado "activo"
3. Almacenista genera orden de salida (estado → "pendiente_retiro")
4. Almacenista entrega repuesto al técnico
5. Sistema marca reserva como "consumido"
6. Sistema crea movimiento de salida
7. Sistema descuenta el stock

**Resultado:**

- Stock inicial: 292 → Stock final: 290 (-2)
- ✅ Flujo completo funcionando

**Ejecutar:**

```bash
node tests/test-reservation-flow.js
```

---

### 2. **test-cancel-order.js** ✅

**Escenario:** Cancelación de orden y liberación de reservas

**Pasos:**

1. Sistema crea reserva activa (4 bujías)
2. Orden de trabajo se cancela
3. Reserva se libera automáticamente (estado → "liberado")
4. Stock NO fue descontado (quedó intacto)

**Resultado:**

- Stock: 50 unidades (sin cambios)
- ✅ Reserva liberada correctamente
- ✅ Stock disponible para otras órdenes

**Ejecutar:**

```bash
node tests/test-cancel-order.js
```

---

### 3. **test-insufficient-stock.js** ✅

**Escenario:** Validación de stock insuficiente

**Pasos:**

1. Sistema identifica stock disponible (8 unidades)
2. Intenta reservar cantidad excesiva (18 unidades)
3. Sistema BLOQUEA la reserva ❌
4. Intenta reservar cantidad válida (2 unidades)
5. Sistema PERMITE la reserva ✅
6. Crea múltiples reservas hasta agotar stock

**Resultado:**

- ❌ Stock insuficiente: BLOQUEADO
- ✅ Stock suficiente: PERMITIDO
- ✅ 3 reservas creadas correctamente
- Stock restante: 2 unidades

**Ejecutar:**

```bash
node tests/test-insufficient-stock.js
```

---

### 4. **test-multiple-items.js** ✅

**Escenario:** Orden de trabajo con múltiples repuestos

**Pasos:**

1. Seleccionar 3 tipos de repuestos (Filtro aceite, Filtro aire, Bujías)
2. Crear 3 reservas simultáneas
3. Generar 3 órdenes de salida
4. Entregar todos los repuestos
5. Verificar stocks actualizados

**Resultado:**

- 3 repuestos procesados correctamente
- Subtotal: $97,012
- 6 unidades totales entregadas
- ✅ Todos los stocks actualizados

**Tabla de stocks:**

```
Repuesto              | Antes | Después | Diff | Estado
--------------------------------------------------------
Filtro Aceite         |   290 |     289 |   -1 | ✅
Filtro de Aire Bosch  |    15 |      14 |   -1 | ✅
Bujía NGK             |    50 |      46 |   -4 | ✅
```

**Ejecutar:**

```bash
node tests/test-multiple-items.js
```

---

## 🚀 Ejecutar Todos los Tests

```bash
# Test 1: Flujo completo
node tests/test-reservation-flow.js

# Test 2: Cancelación
node tests/test-cancel-order.js

# Test 3: Stock insuficiente
node tests/test-insufficient-stock.js

# Test 4: Múltiples repuestos
node tests/test-multiple-items.js
```

---

## 📊 Cobertura de Tests

| Escenario                         | Test | Estado  |
| --------------------------------- | ---- | ------- |
| Flujo normal de reserva y entrega | ✅   | Pasando |
| Cancelación de orden              | ✅   | Pasando |
| Validación de stock insuficiente  | ✅   | Pasando |
| Múltiples repuestos en una orden  | ✅   | Pasando |
| Liberación de reservas            | ✅   | Pasando |
| Descuento de stock correcto       | ✅   | Pasando |
| Creación de movimientos           | ✅   | Pasando |
| Estados de reserva                | ✅   | Pasando |

---

## 🎯 Casos de Uso Cubiertos

### ✅ **Casos Exitosos**

1. Reservar repuesto con stock suficiente
2. Generar orden de salida
3. Entregar repuesto y descontar stock
4. Cancelar orden y liberar reserva
5. Procesar múltiples repuestos simultáneamente
6. Registrar movimientos de inventario

### ❌ **Casos de Error**

1. Intentar reservar sin stock suficiente → BLOQUEADO
2. Intentar entregar sin orden de salida → BLOQUEADO (estado debe ser "pendiente_retiro")
3. Stock ya descontado → No se puede reversar sin movimiento

---

## 🔄 Estados de Reserva Validados

| Estado               | Descripción                          | Test                        |
| -------------------- | ------------------------------------ | --------------------------- |
| **activo**           | Reserva creada, stock no descontado  | ✅ test-reservation-flow.js |
| **pendiente_retiro** | Orden de salida generada             | ✅ test-reservation-flow.js |
| **consumido**        | Repuesto entregado, stock descontado | ✅ test-reservation-flow.js |
| **liberado**         | Reserva cancelada, stock disponible  | ✅ test-cancel-order.js     |

---

## 📝 Próximos Tests Sugeridos

### Test 5: **Devolución de Repuesto**

- Repuesto no utilizado regresa al almacén
- Crear movimiento de "entrada"
- Verificar stock incrementado

### Test 6: **Transferencia entre Almacenes**

- Mover repuestos de un almacén a otro
- Crear movimiento de "transferencia"
- Verificar stock en ambos almacenes

### Test 7: **Ajuste de Inventario**

- Corrección de stock por diferencia física
- Crear movimiento de "ajuste"
- Registrar motivo del ajuste

### Test 8: **Repuestos en Múltiples Órdenes**

- Mismo repuesto reservado en 2+ órdenes
- Verificar que no se sobrepase el stock
- Gestionar prioridades

### Test 9: **Historial de Movimientos**

- Consultar todos los movimientos de un repuesto
- Filtrar por fecha, tipo, almacén
- Generar reportes

### Test 10: **Alertas de Stock Mínimo**

- Repuesto llega a stock mínimo
- Sistema genera alerta
- Sugerir orden de compra

---

## 🛠️ Comandos Útiles

### Ver Stock Actual

```bash
# Desde MongoDB
db.stocks.find({ cantidad: { $lt: 10 } }).pretty()
```

### Ver Reservas Activas

```bash
# Desde MongoDB
db.reservations.find({ estado: "activo", eliminado: false }).pretty()
```

### Ver Movimientos Recientes

```bash
# Desde MongoDB
db.movements.find().sort({ createdAt: -1 }).limit(10).pretty()
```

---

## 📖 Recursos Adicionales

- **Documentación del flujo:** `features/inventory/reservations/README_FLUJO.md`
- **Ejemplos HTTP:** `tests/inventory-flow-example.http`
- **Seeder de inventario:** `seeds/inventorySeeder.js`

---

## ✅ Resultados de Ejecución

Todos los tests ejecutados el **06/11/2025**:

```
✅ test-reservation-flow.js     - PASADO (Stock: 292 → 290)
✅ test-cancel-order.js          - PASADO (Stock: 50 → 50)
✅ test-insufficient-stock.js    - PASADO (3 reservas creadas)
✅ test-multiple-items.js        - PASADO (3 repuestos entregados)
```

**Total: 4/4 tests pasando** 🎉
