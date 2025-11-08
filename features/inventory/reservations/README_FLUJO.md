# 📦 Flujo Completo de Reservas y Entregas de Repuestos

## 🔄 Flujo Correcto de Estados

```
1. ACTIVO → Repuesto reservado para OT (stock reservado)
2. PENDIENTE_RETIRO → Orden de salida generada (preparando para entrega)
3. CONSUMIDO → Repuesto entregado físicamente (stock descontado)
4. LIBERADO → Reserva cancelada/liberada (stock disponible nuevamente)
```

## � Roles Involucrados

| Rol                    | Responsabilidad                                        |
| ---------------------- | ------------------------------------------------------ |
| **Asesor de Servicio** | Crea la orden de trabajo y agrega repuestos necesarios |
| **Almacenista**        | Genera orden de salida y prepara el repuesto           |
| **Técnico/Mecánico**   | Recibe el repuesto y lo instala en el vehículo         |

## �📋 Proceso Paso a Paso

### Paso 1: Agregar Repuesto a Orden de Trabajo

**Quién:** Asesor de Servicio  
**Endpoint:** `POST /api/work-orders/:workOrderId/items`

```json
{
  "type": "part",
  "part": "67xxxxx", // ID del repuesto
  "quantity": 2,
  "unitPrice": 150000
}
```

**Resultado:**

- ✅ Se verifica stock disponible
- ✅ Se crea WorkOrderItem
- ✅ Se crea Reserva con estado **"activo"**
- ❌ NO se descuenta del stock todavía (solo reservado)

---

### Paso 2: Generar Orden de Salida

**Quién:** Almacenista  
**Endpoint:** `POST /api/inventory/reservations/:reservaId/generar-orden-salida`

**Resultado:**

- ✅ Cambia estado de reserva a **"pendiente_retiro"**
- ✅ Genera número de orden de salida
- ✅ El almacenista prepara físicamente el repuesto
- ❌ NO se descuenta del stock todavía

**Respuesta:**

```json
{
  "success": true,
  "message": "Orden de salida generada correctamente",
  "data": {
    "ordenSalida": {
      "numero": "SAL-ABC12345",
      "fecha": "2025-11-06T...",
      "almacen": "Almacén Principal",
      "repuesto": "Filtro de aceite Bosch",
      "cantidad": 2,
      "ordenTrabajo": "OT-2025-001",
      "estado": "Pendiente de retiro"
    }
  }
}
```

---

### Paso 3: Entregar Repuesto Físicamente

**Quién:** Almacenista entrega → Técnico recibe  
**Endpoint:** `POST /api/inventory/reservations/:reservaId/entregar`

```json
{
  "recibidoPor": "67xxxxx", // ID del técnico que recibe
  "notas": "Entregado para instalación en vehículo ABC-123"
}
```

**Resultado:**

- ✅ Cambia estado de reserva a **"consumido"**
- ✅ Crea movimiento de **"salida"** en inventario
- ✅ **DESCUENTA el stock** del almacén
- ✅ Registra fecha de entrega, quién entrega (usuario autenticado) y quién recibe (técnico)

---

### Paso 4: Cerrar Orden de Trabajo

**Endpoint:** `PUT /api/work-orders/:id/cambiar-estado`

```json
{
  "nuevoEstado": "CERRADA_FACTURADA"
}
```

**Resultado:**

- ✅ Verifica que todas las reservas estén consumidas
- ⚠️ Advierte si hay reservas no entregadas
- ✅ Genera factura automáticamente
- ❌ NO consume reservas (ya fueron consumidas en el Paso 3)

---

## 🔍 Consultas Útiles

### Ver Reservas Activas (sin orden de salida)

```http
GET /api/inventory/reservations/activas
```

### Ver Órdenes de Salida Pendientes

```http
GET /api/inventory/reservations/pendientes
```

### Ver Historial de Movimientos

```http
GET /api/inventory/movements?tipo=salida&referenciaTipo=workOrder
```

### Ver Stock con Reservas

```http
GET /api/inventory/stock/:itemId
```

---

## 🚨 Casos Especiales

### Cancelar Orden de Trabajo

Si se cancela la OT, las reservas activas se liberan automáticamente:

```
Estado: ACTIVO → LIBERADO
```

### Devolver Repuesto al Almacén

Si el repuesto no se usa, crear movimiento de entrada:

```json
POST /api/inventory/movements
{
  "tipo": "entrada",
  "item": "67xxxxx",
  "cantidad": 1,
  "warehouseTo": "67xxxxx",
  "motivo": "Devolución de repuesto no utilizado"
}
```

---

## 📊 Resumen de Estados

| Estado               | Significado                   | Stock Afectado                | Puede Revertir            |
| -------------------- | ----------------------------- | ----------------------------- | ------------------------- |
| **activo**           | Reservado para OT             | ❌ No (solo reservado)        | ✅ Sí (liberar)           |
| **pendiente_retiro** | Orden de salida generada      | ❌ No (solo reservado)        | ✅ Sí (cancelar)          |
| **consumido**        | Entregado y stock descontado  | ✅ Sí (descontado)            | ❌ No (movimiento creado) |
| **liberado**         | Reserva cancelada             | ❌ No (devuelto a disponible) | ❌ No                     |
| **cancelado**        | Cancelado administrativamente | ❌ No                         | ❌ No                     |

---

## 🎯 Ventajas de Este Flujo

1. **Trazabilidad completa:** Cada paso queda registrado
2. **Control de almacén:** El stock solo se descuenta cuando se entrega físicamente
3. **Órdenes de salida:** Facilita el control de entregas
4. **Auditoría:** Se registra quién entrega, quién recibe y cuándo
5. **Conciliación:** Stock físico = Stock sistema
