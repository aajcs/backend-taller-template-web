# Sistema de Bahías de Servicio (Service Bay System)

## 📋 Descripción General

Sistema completo para gestión de **puestos de trabajo/bahías de servicio** en talleres mecánicos. Permite:

- ✅ Gestionar bahías físicas del taller
- ✅ Asignar múltiples técnicos por bahía
- ✅ Registrar entrada/salida con cálculo automático de horas
- ✅ Tracking en tiempo real del estado del taller
- ✅ Reportes de productividad y utilización
- ✅ Historial completo de ocupación

---

## 🏗️ Arquitectura del Sistema

### Modelos de Datos

#### 1. ServiceBay (Bahía de Servicio)

```javascript
{
  name: "Bahía 1",
  code: "BAY-01",
  area: "mecanica",                    // mecanica | electricidad | pintura | latoneria | lavado | diagnostico | multiple
  status: "disponible",                // disponible | ocupado | mantenimiento | fuera_servicio
  capacity: "multiple",                // sedan | suv | pickup | camion | multiple
  equipment: ["elevador", "compresor"],
  currentWorkOrder: ObjectId,
  currentTechnicians: [{
    technician: ObjectId,
    role: "principal",                 // principal | asistente
    entryTime: Date
  }],
  occupiedSince: Date,
  estimatedEndTime: Date,
  maxTechnicians: 2,
  isActive: true,
  order: 1
}
```

#### 2. WorkOrderAssignment (Asignación de Técnico)

```javascript
{
  workOrder: ObjectId,
  technician: ObjectId,
  serviceBay: ObjectId,
  role: "principal",                   // principal | asistente
  entryTime: Date,
  exitTime: Date,
  hoursWorked: 3.25,                   // Calculado automáticamente
  status: "activo",                    // activo | completado | cancelado
  entryNotes: String,
  exitNotes: String,
  assignedBy: ObjectId
}
```

#### 3. BayOccupancyHistory (Historial)

```javascript
{
  serviceBay: ObjectId,
  workOrder: ObjectId,
  vehicle: ObjectId,
  customer: ObjectId,
  entryTime: Date,
  exitTime: Date,
  duration: 4.5,                       // horas
  technicians: [{
    technician: ObjectId,
    role: String,
    hoursWorked: Number
  }],
  totalTechnicianHours: 9.0,          // Suma de todos
  services: [],
  exitReason: "completado"
}
```

#### 4. WorkOrder (Modificaciones)

```javascript
// Campos agregados:
{
  serviceBay: ObjectId,               // Bahía actual
  assignments: [ObjectId],            // Referencias a asignaciones
  totalHoursWorked: 6.5              // Total horas de todos los técnicos
}
```

---

## 📋 API Endpoints

### **Bahías de Servicio**

#### GET `/api/service-bays`

Listar todas las bahías.

**Query Parameters:**

- `status` - Filtrar por estado
- `area` - Filtrar por área
- `isActive` - Solo activas (default: true)
- `sortBy` - Campo de ordenamiento (default: order)
- `sortOrder` - asc | desc

**Response:**

```json
{
  "ok": true,
  "bays": [
    {
      "_id": "...",
      "name": "Bahía 1",
      "code": "BAY-01",
      "area": "mecanica",
      "status": "disponible",
      "currentTechnicianCount": 0
    }
  ],
  "total": 8
}
```

---

#### GET `/api/service-bays/available`

Obtener bahías disponibles.

**Query Parameters:**

- `area` - Filtrar por área
- `capacity` - Filtrar por capacidad

**Response:**

```json
{
  "ok": true,
  "bays": [...],
  "total": 3
}
```

---

#### GET `/api/service-bays/:id`

Obtener detalle de una bahía.

**Response:**

```json
{
  "ok": true,
  "bay": {
    "_id": "...",
    "name": "Bahía 1",
    "code": "BAY-01",
    "status": "ocupado",
    "currentWorkOrder": {
      "numeroOrden": "WO-001",
      "vehicle": { "marca": "Toyota", "modelo": "Camry" },
      "customer": { "nombre": "Juan", "apellido": "Pérez" }
    },
    "currentTechnicians": [
      {
        "technician": {
          "nombre": "Carlos",
          "apellido": "Ruiz"
        },
        "role": "principal",
        "entryTime": "2025-11-08T10:00:00Z"
      }
    ],
    "occupiedSince": "2025-11-08T10:00:00Z",
    "estimatedEndTime": "2025-11-08T14:00:00Z"
  }
}
```

---

#### POST `/api/service-bays`

Crear nueva bahía.

**Body:**

```json
{
  "name": "Bahía 5",
  "code": "BAY-05",
  "area": "mecanica",
  "capacity": "multiple",
  "equipment": ["Elevador 4 columnas", "Compresor", "Scanner OBD2"],
  "maxTechnicians": 2,
  "isActive": true,
  "order": 5
}
```

**Response:**

```json
{
  "ok": true,
  "bay": { ... },
  "msg": "Bahía de servicio creada exitosamente"
}
```

---

#### PUT `/api/service-bays/:id`

Actualizar bahía.

**Body:** Campos a actualizar (excepto currentWorkOrder, currentTechnicians, occupiedSince)

---

#### DELETE `/api/service-bays/:id`

Eliminar bahía (lógicamente). No permite eliminar bahías ocupadas.

---

#### PATCH `/api/service-bays/:id/status`

Cambiar estado manualmente.

**Body:**

```json
{
  "status": "mantenimiento",
  "notes": "Reparación de elevador"
}
```

---

### **Asignaciones de Técnicos**

#### POST `/api/work-orders/:workOrderId/enter-bay`

Asignar técnico(s) a bahía y registrar entrada.

**Body (Un técnico):**

```json
{
  "serviceBay": "690bay001...",
  "technician": "690tech001...",
  "role": "principal",
  "entryNotes": "Iniciando reparación de frenos",
  "estimatedHours": 2.5
}
```

**Body (Múltiples técnicos):**

```json
{
  "serviceBay": "690bay001...",
  "technicians": [
    {
      "technician": "690tech001...",
      "role": "principal"
    },
    {
      "technician": "690tech002...",
      "role": "asistente"
    }
  ],
  "entryNotes": "Trabajo en equipo para cambio de motor",
  "estimatedHours": 8
}
```

**Response:**

```json
{
  "ok": true,
  "message": "1 técnico(s) asignado(s) a bahía exitosamente",
  "assignments": [
    {
      "_id": "691asg001...",
      "workOrder": "690wo001...",
      "technician": {
        "nombre": "Carlos",
        "apellido": "Ruiz"
      },
      "serviceBay": "690bay001...",
      "role": "principal",
      "entryTime": "2025-11-08T10:00:00Z",
      "status": "activo"
    }
  ],
  "bay": {
    "name": "Bahía 1",
    "code": "BAY-01",
    "status": "ocupado",
    "occupiedSince": "2025-11-08T10:00:00Z",
    "estimatedEndTime": "2025-11-08T12:30:00Z",
    "currentTechnicianCount": 1
  }
}
```

---

#### POST `/api/work-orders/:workOrderId/exit-bay`

Registrar salida de técnico(s).

**Body (Un técnico):**

```json
{
  "technician": "690tech001...",
  "exitNotes": "Cambio de pastillas completado",
  "exitReason": "completado"
}
```

**Body (Múltiples técnicos):**

```json
{
  "technicians": ["690tech001...", "690tech002..."],
  "exitNotes": "Motor instalado exitosamente",
  "exitReason": "completado"
}
```

**exitReason opciones:**

- `completado` - Trabajo terminado
- `movido_otra_bahia` - Movido a otra bahía
- `cancelado` - Trabajo cancelado
- `espera_repuestos` - Esperando repuestos
- `fin_jornada` - Fin de jornada laboral

**Response:**

```json
{
  "ok": true,
  "message": "Salida de 1 técnico(s) registrada exitosamente",
  "assignments": [
    {
      "_id": "691asg001...",
      "technician": {
        "nombre": "Carlos",
        "apellido": "Ruiz"
      },
      "role": "principal",
      "entryTime": "2025-11-08T10:00:00Z",
      "exitTime": "2025-11-08T13:15:00Z",
      "hoursWorked": 3.25,
      "duration": {
        "hours": 3,
        "minutes": 15,
        "formatted": "3h 15min",
        "total": 3.25
      }
    }
  ],
  "workOrder": {
    "_id": "690wo001...",
    "numeroOrden": "WO-001",
    "totalHoursWorked": 3.25,
    "serviceBay": null
  },
  "bay": {
    "status": "disponible",
    "currentTechnicianCount": 0
  }
}
```

---

#### GET `/api/work-orders/:workOrderId/assignments`

Obtener asignaciones de una orden.

**Query Parameters:**

- `status` - Filtrar por estado (activo | completado | cancelado)

---

#### GET `/api/work-orders/technicians/:technicianId/current-assignment`

Obtener asignación actual de un técnico (¿dónde está trabajando ahora?).

**Response:**

```json
{
  "ok": true,
  "assignment": {
    "workOrder": {
      "numeroOrden": "WO-001",
      "vehicle": "Toyota Camry - ABC123"
    },
    "serviceBay": {
      "name": "Bahía 1",
      "code": "BAY-01"
    },
    "entryTime": "2025-11-08T10:00:00Z"
  },
  "currentHoursWorked": 2.5
}
```

---

#### GET `/api/work-orders/technicians/:technicianId/assignments`

Historial de asignaciones de un técnico.

**Query Parameters:**

- `startDate` - Fecha inicio (ISO 8601)
- `endDate` - Fecha fin (ISO 8601)
- `status` - Filtrar por estado

**Response:**

```json
{
  "ok": true,
  "assignments": [...],
  "total": 28,
  "totalHoursWorked": 187.5
}
```

---

### **Dashboard y Reportes**

#### GET `/api/dashboard/taller-status`

Estado del taller en tiempo real.

**Response:**

```json
{
  "ok": true,
  "timestamp": "2025-11-08T15:00:00Z",
  "summary": {
    "totalBays": 8,
    "occupiedBays": 6,
    "availableBays": 2,
    "maintenanceBays": 0,
    "utilizationRate": 75.0
  },
  "activeBays": [
    {
      "bay": {
        "name": "Bahía 1",
        "code": "BAY-01",
        "area": "mecanica"
      },
      "status": "ocupado",
      "workOrder": {
        "numeroOrden": "WO-001",
        "motivo": "Cambio de frenos",
        "vehicle": "Toyota Camry 2020 - ABC123",
        "customer": "Juan Pérez"
      },
      "technicians": [
        {
          "name": "Carlos Ruiz",
          "role": "principal",
          "entryTime": "2025-11-08T10:00:00Z"
        }
      ],
      "occupiedSince": "2025-11-08T10:00:00Z",
      "estimatedCompletion": "2025-11-08T16:00:00Z",
      "hoursInBay": 5.0
    }
  ],
  "technicians": {
    "active": 8
  }
}
```

---

#### GET `/api/reports/technician-hours`

Reporte de horas trabajadas por técnico.

**Query Parameters:**

- `technician` - ID específico (opcional)
- `startDate` - Fecha inicio
- `endDate` - Fecha fin

**Response (Sin técnico específico):**

```json
{
  "ok": true,
  "period": {
    "startDate": "2025-11-01",
    "endDate": "2025-11-08"
  },
  "report": [
    {
      "technician": {
        "nombre": "Juan",
        "apellido": "Pérez",
        "email": "juan@example.com"
      },
      "summary": {
        "totalAssignments": 28,
        "totalHoursWorked": 187.5,
        "averageHoursPerAssignment": 6.7
      },
      "recentAssignments": [...]
    }
  ],
  "totalTechnicians": 12
}
```

**Response (Con técnico específico):**

```json
{
  "ok": true,
  "technician": { ... },
  "period": { ... },
  "summary": {
    "totalAssignments": 28,
    "totalHoursWorked": 187.5,
    "averageHoursPerAssignment": 6.7
  },
  "assignments": [
    {
      "workOrder": "WO-001",
      "bay": "Bahía 1 (BAY-01)",
      "role": "principal",
      "entryTime": "...",
      "exitTime": "...",
      "hoursWorked": 3.25,
      "duration": {
        "hours": 3,
        "minutes": 15,
        "formatted": "3h 15min"
      }
    }
  ]
}
```

---

#### GET `/api/reports/bay-utilization`

Reporte de utilización de bahías.

**Query Parameters:**

- `serviceBay` - ID específico (opcional)
- `startDate` - Fecha inicio
- `endDate` - Fecha fin

**Response:**

```json
{
  "ok": true,
  "period": { ... },
  "report": [
    {
      "bay": {
        "name": "Bahía 1",
        "code": "BAY-01",
        "area": "mecanica"
      },
      "metrics": {
        "totalOrders": 23,
        "occupiedHours": 148.5,
        "totalTechnicianHours": 189.0,
        "averageOrderDuration": 6.5
      },
      "recentOrders": [...]
    }
  ],
  "totalBays": 8
}
```

---

#### GET `/api/service-bays/:id/history`

Historial de ocupación de una bahía.

**Query Parameters:**

- `startDate` - Fecha inicio
- `endDate` - Fecha fin
- `limit` - Número de registros (default: 50)

**Response:**

```json
{
  "ok": true,
  "history": [
    {
      "workOrder": {
        "numeroOrden": "WO-001"
      },
      "vehicle": "Toyota Camry - ABC123",
      "customer": "Juan Pérez",
      "entryTime": "...",
      "exitTime": "...",
      "duration": 4.5,
      "technicians": [
        {
          "technician": "Carlos Ruiz",
          "role": "principal",
          "hoursWorked": 4.5
        }
      ],
      "totalTechnicianHours": 4.5,
      "exitReason": "completado"
    }
  ],
  "summary": {
    "totalOrders": 45,
    "totalHours": 287.5,
    "averageDuration": 6.4
  }
}
```

---

## 🎯 Flujo de Trabajo Completo

### Escenario: Cambio de frenos (un técnico)

```
1. Cliente llega
   → Se crea WorkOrder (estado: recibido)

2. Coordinador asigna bahía y técnico
   POST /api/work-orders/WO-001/enter-bay
   {
     "serviceBay": "BAY-01",
     "technician": "TECH-001",
     "role": "principal",
     "estimatedHours": 2
   }

   Resultado:
   - ServiceBay.status = "ocupado"
   - ServiceBay.currentWorkOrder = WO-001
   - ServiceBay.occupiedSince = NOW
   - WorkOrderAssignment creado con status="activo"
   - WorkOrder.serviceBay = BAY-01

3. Técnico trabaja 3 horas...

4. Técnico completa trabajo
   POST /api/work-orders/WO-001/exit-bay
   {
     "technician": "TECH-001",
     "exitNotes": "Trabajo completado",
     "exitReason": "completado"
   }

   Resultado:
   - WorkOrderAssignment.exitTime = NOW
   - WorkOrderAssignment.hoursWorked = 3.0 (calculado automáticamente)
   - WorkOrderAssignment.status = "completado"
   - ServiceBay.status = "disponible"
   - ServiceBay.currentWorkOrder = null
   - WorkOrder.totalHoursWorked = 3.0
   - BayOccupancyHistory creado
```

### Escenario: Cambio de motor (múltiples técnicos)

```
1. Asignar técnicos en equipo
   POST /api/work-orders/WO-002/enter-bay
   {
     "serviceBay": "BAY-02",
     "technicians": [
       { "technician": "TECH-001", "role": "principal" },
       { "technician": "TECH-002", "role": "asistente" }
     ],
     "estimatedHours": 8
   }

   Resultado:
   - 2 WorkOrderAssignments creados
   - Ambos técnicos en ServiceBay.currentTechnicians

2. Técnicos trabajan juntos 8 horas...

3. Ambos salen al terminar
   POST /api/work-orders/WO-002/exit-bay
   {
     "technicians": ["TECH-001", "TECH-002"],
     "exitNotes": "Motor instalado",
     "exitReason": "completado"
   }

   Resultado:
   - 2 asignaciones completadas
   - TECH-001: 8h trabajadas
   - TECH-002: 8h trabajadas
   - WorkOrder.totalHoursWorked = 16.0
   - ServiceBay liberada
```

---

## ⚠️ Validaciones Importantes

### Al entrar a bahía:

- ✅ Bahía debe existir y estar activa
- ✅ Bahía no puede estar en mantenimiento/fuera de servicio
- ✅ No exceder maxTechnicians de la bahía
- ✅ Técnico debe existir
- ✅ Orden de trabajo debe existir

### Al salir de bahía:

- ✅ Debe existir asignación activa
- ✅ Calcular horas automáticamente (exitTime - entryTime)
- ✅ Si no quedan técnicos, liberar bahía
- ✅ Crear historial de ocupación
- ✅ Actualizar total de horas en la orden

### Al eliminar bahía:

- ❌ No permitir si está ocupada

---

## 📊 Métricas Calculadas

### Por Asignación:

- `hoursWorked` = (exitTime - entryTime) en horas decimales
- `duration` = { hours, minutes, formatted }

### Por Bahía:

- `duration` = tiempo ocupada (exitTime - entryTime)
- `totalTechnicianHours` = suma de horas de todos los técnicos

### Por Orden de Trabajo:

- `totalHoursWorked` = suma de hoursWorked de todas las asignaciones

### Por Taller:

- `utilizationRate` = (occupiedBays / totalBays) \* 100

---

## 🧪 Testing

Ejecutar tests completos:

```bash
node tests/test-service-bay-system.js
```

Tests incluidos:

1. ✅ Autenticación
2. ✅ Crear bahía
3. ✅ Obtener bahías disponibles
4. ✅ Obtener técnicos
5. ✅ Asignar técnico a bahía (entrada)
6. ✅ Dashboard en tiempo real
7. ✅ Simular trabajo (espera 5 seg)
8. ✅ Registrar salida y calcular horas
9. ✅ Historial de técnico
10. ✅ Reporte de horas
11. ✅ Limpieza de datos de prueba

---

## 📝 Notas Técnicas

1. **Cálculo de Horas**: Automático al registrar salida, con 2 decimales de precisión
2. **Múltiples Técnicos**: Soportado tanto en entrada como en salida
3. **Historial**: Se crea automáticamente cuando todos los técnicos salen
4. **Borrado Lógico**: Todos los modelos usan `eliminado: true`
5. **Índices**: Optimizados para queries frecuentes
6. **Populate**: Todos los endpoints populan referencias necesarias

---

## 🚀 Próximos Pasos (Opcionales)

- [ ] Asignación automática de bahía según tipo de servicio
- [ ] Alertas de bahías inactivas por mucho tiempo
- [ ] Predicción de tiempos basada en histórico
- [ ] Integración con sistema de notificaciones
- [ ] Reportes en PDF/Excel
- [ ] Gráficos de utilización
- [ ] App móvil para técnicos (check-in/check-out)

---

## 📞 Soporte

Para dudas o problemas, revisar:

- Logs del servidor
- Tests de integración
- Validaciones en modelos
- Documentación de endpoints
