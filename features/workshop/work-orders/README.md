# Work Orders Module (Núcleo de Taller)

Módulo para la gestión de Órdenes de Trabajo en el sistema de taller/refinería.
Implementa los requerimientos funcionales RF-11 a RF-17.

## 📋 Descripción

Este módulo maneja toda la lógica relacionada con las órdenes de trabajo del taller,
incluyendo:

- **Creación de OT** vinculadas a clientes y vehículos
- **Gestión de estados** del proceso de reparación
- **Asignación de repuestos y servicios**
- **Cálculo automático de costos**
- **Impresión de órdenes de trabajo**

## 🎯 Requerimientos Funcionales Cubiertos

- **RF-11**: Creación de OT vinculada a cliente y vehículo existentes
- **RF-12**: Información básica (fecha, motivo, kilometraje, técnico asignado)
- **RF-13**: Estados de la OT (Recibido, Diagnóstico, En Reparación, etc.)
- **RF-14**: Agregar repuestos desde el Módulo 2
- **RF-15**: Agregar servicios/mano de obra con costos
- **RF-16**: Cálculo automático del costo total
- **RF-17**: Impresión de OT en formato estandarizado

## 📁 Estructura del Módulo

```text
features/workshop/work-orders/
├── controllers/                    # Controladores de negocio
├── helpers/                        # Helpers específicos
├── models/                         # Modelos de datos
├── routes/                         # Definición de rutas API
├── utils/                          # Utilidades auxiliares
└── README.md                       # Esta documentación
```

## 🚀 Próximos Pasos

1. **Crear modelos de datos** (WorkOrder, WorkOrderItem, WorkOrderStatus)
2. **Implementar controladores CRUD**
3. **Definir rutas API** con validaciones
4. **Crear helpers de validación**
5. **Integrar con módulos existentes** (CRM, Inventory)
6. **Implementar lógica de costos**
7. **Agregar funcionalidad de impresión**

---

**Estado**: 📁 Estructura creada - Pendiente desarrollo
**Versión**: 0.1.0
**Última actualización**: Noviembre 2024
