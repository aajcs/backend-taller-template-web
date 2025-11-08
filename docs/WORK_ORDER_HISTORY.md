# WorkOrderHistory - Historial de Órdenes de Trabajo

## ¿Para qué sirve?

El **WorkOrderHistory** registra **todos los cambios y eventos** que ocurren en una orden de trabajo, proporcionando:

### 1. **Trazabilidad Completa** 🔍

- Saber **quién** hizo un cambio
- Saber **cuándo** se hizo
- Saber **qué** cambió
- Ver el **antes y después** de cada cambio

### 2. **Auditoría** 📋

- Cumplir con requisitos legales/normativos
- Resolver disputas con clientes
- Analizar tiempos de procesos
- Detectar problemas operativos

### 3. **Transparencia con el Cliente** 👥

- Mostrar al cliente el progreso de su vehículo
- Justificar cambios en costos o tiempos
- Demostrar profesionalismo

---

## Tipos de Eventos Registrados

```javascript
tipo: [
  "creacion_ot", // Orden creada
  "cambio_estado", // Cambio de estado (ej: Recibido → Diagnóstico)
  "asignacion_tecnico", // Técnico asignado/cambiado
  "agregado_item", // Servicio o repuesto agregado
  "modificado_item", // Item modificado (precio, cantidad)
  "eliminado_item", // Item eliminado
  "actualizacion_costos", // Costos actualizados
  "comentario", // Nota o comentario agregado
  "adjunto_archivo", // Foto, documento subido
  "aprobacion_cliente", // Cliente aprobó presupuesto
  "diagnostico", // Diagnóstico completado
  "completado_item", // Servicio/reparación completada
  "facturacion", // Orden facturada
  "cierre_ot", // Orden cerrada
];
```

---

## Ejemplo de Uso Real

### Escenario: Cliente pregunta "¿Por qué tardó tanto mi orden?"

**Consultando el historial:**

```http
GET /api/work-orders/123456/history
```

**Respuesta mostrará:**

```json
[
  {
    "tipo": "creacion_ot",
    "fecha": "2025-11-06T08:00:00Z",
    "usuario": { "nombre": "Juan Pérez" },
    "estadoNuevo": { "nombre": "Recibido", "color": "#3B82F6" }
  },
  {
    "tipo": "cambio_estado",
    "fecha": "2025-11-06T09:30:00Z",
    "usuario": { "nombre": "María López" },
    "estadoAnterior": { "nombre": "Recibido" },
    "estadoNuevo": { "nombre": "En Diagnóstico" },
    "notas": "Iniciando revisión general"
  },
  {
    "tipo": "cambio_estado",
    "fecha": "2025-11-06T11:00:00Z",
    "estadoAnterior": { "nombre": "En Diagnóstico" },
    "estadoNuevo": { "nombre": "Esperando Repuestos" },
    "notas": "Se necesita bomba de agua original - 3 días de espera"
  },
  {
    "tipo": "cambio_estado",
    "fecha": "2025-11-09T10:00:00Z",
    "estadoAnterior": { "nombre": "Esperando Repuestos" },
    "estadoNuevo": { "nombre": "En Reparación" },
    "notas": "Repuestos llegaron, iniciando reparación"
  }
]
```

**Ahora puedes demostrar al cliente:**

- ✅ El trabajo no se retrasó por negligencia
- ✅ Hubo una espera legítima de 3 días por repuestos
- ✅ Cada cambio está documentado con fecha y responsable

---

## Información que se Guarda Automáticamente

### Cuando cambias el estado:

```javascript
{
  workOrder: ObjectId,           // ID de la orden
  tipo: "cambio_estado",
  estadoAnterior: ObjectId,      // Estado previo (ref WorkOrderStatus)
  estadoNuevo: ObjectId,         // Nuevo estado (ref WorkOrderStatus)
  usuario: ObjectId,             // Quién hizo el cambio
  notas: "Razón del cambio",     // Opcional
  fecha: Date                    // Timestamp automático
}
```

### Campos Populados en Respuesta:

- **estadoAnterior**: `{ codigo: "RECIBIDO", nombre: "Recibido", color: "#3B82F6" }`
- **estadoNuevo**: `{ codigo: "DIAGNOSTICO", nombre: "En Diagnóstico", color: "#F59E0B" }`
- **usuario**: `{ nombre: "Juan", apellido: "Pérez", email: "juan@taller.com" }`

---

## Endpoints Disponibles

### 1. Obtener historial completo de una orden

```http
GET /api/work-orders/:workOrderId/history
```

**Query params:**

- `page` - Número de página (default: 1)
- `limit` - Registros por página (default: 20)
- `tipo` - Filtrar por tipo de evento
- `sortBy` - Campo para ordenar (default: "createdAt")
- `sortOrder` - "asc" o "desc" (default: "desc")

**Ejemplo:**

```http
GET /api/work-orders/690cb1d05a39dbd8fc818c77/history?tipo=cambio_estado&limit=50
```

### 2. Obtener un registro específico

```http
GET /api/work-orders/history/:historyId
```

---

## Cómo se Genera Automáticamente

El historial se crea automáticamente cuando llamas al método `cambiarEstado`:

```javascript
// En workOrder.model.js - método cambiarEstado()
await WorkOrderHistory.create({
  workOrder: this._id,
  tipo: "cambio_estado",
  estadoAnterior: estadoActual._id,
  estadoNuevo: nuevoEstado._id,
  usuario: usuarioId,
  notas,
  fecha: new Date(),
});
```

**No necesitas crear registros manualmente** - el sistema lo hace por ti cada vez que:

- Se cambia el estado de una orden
- (Puedes extenderlo para items, costos, etc.)

---

## Beneficios para tu Negocio

### 📊 Análisis de Tiempos

```sql
-- ¿Cuánto tiempo promedio en cada estado?
-- Puedes hacer queries para optimizar procesos
```

### 🛡️ Protección Legal

- Prueba de que el trabajo se hizo correctamente
- Evidencia de aprobaciones del cliente
- Registro de cambios solicitados

### 💼 Confianza del Cliente

- Portal web donde el cliente ve el progreso en tiempo real
- Notificaciones automáticas de cambios de estado
- Transparencia total del proceso

### 🔧 Mejora Continua

- Identificar cuellos de botella
- Ver qué técnicos son más rápidos/lentos
- Detectar patrones de problemas

---

## Próximos Pasos Recomendados

1. **Extender el historial** para registrar también:
   - Agregado de items (servicios/repuestos)
   - Cambios de costos
   - Comentarios/notas
2. **Crear endpoint de timeline** para el cliente:

   ```http
   GET /api/work-orders/:id/timeline
   ```

   Versión simplificada para mostrar en portal del cliente

3. **Notificaciones automáticas**:
   - Email/SMS cuando cambia el estado
   - Basado en configuración de WorkOrderStatus.notificarCliente

---

## Ejemplo de Implementación Completa

```javascript
// Cambiar estado de una orden
POST /api/work-orders/:id/change-status
{
  "newStatus": "EN_REPARACION",
  "notes": "Iniciando cambio de frenos"
}

// Respuesta incluye:
{
  "success": true,
  "message": "Estado cambiado de 'En Diagnóstico' a 'En Reparación'",
  "data": { /* orden actualizada */ },
  "estadoAnterior": { "nombre": "En Diagnóstico", "color": "#F59E0B" },
  "estadoNuevo": { "nombre": "En Reparación", "color": "#F97316" }
}

// Automáticamente se creó en WorkOrderHistory:
// - Registro del cambio de estado
// - Con quién lo hizo
// - Cuándo lo hizo
// - Las notas del cambio
```

---

## Resumen

✅ **WorkOrderHistory** es tu "caja negra" del taller  
✅ **Registra todo** automáticamente  
✅ **Protege** tu negocio legalmente  
✅ **Mejora** la confianza del cliente  
✅ **Permite** análisis y optimización

**Ya está implementado y funcionando** - cada cambio de estado se registra automáticamente 🎉
