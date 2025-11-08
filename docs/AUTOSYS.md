# 🏢 Módulo AutoSys - Gestión de Talleres

## 📋 Descripción

El módulo **AutoSys** gestiona la información de talleres mecánicos o refinerías que procesan vehículos. Permite administrar talleres con su información legal, ubicación, capacidad de procesamiento y estado operativo.

---

## 🗂️ Estructura de Datos

### Modelo AutoSys

```javascript
{
  nombre: String,           // Nombre del taller (único, 3-50 caracteres)
  rif: String,             // RIF del taller (único, 5-20 caracteres)
  ubicacion: String,       // Dirección física (3-100 caracteres)
  telefono: String,        // Teléfono de contacto (opcional, 3-15 caracteres)
  procesamientoDia: Number, // Capacidad diaria en vehículos (≥ 0)
  legal: String,           // Representante legal (opcional, 3-50 caracteres)
  img: String,             // URL de imagen/logo (opcional)
  estado: String,          // Estado: "activo" | "inactivo" (default: "activo")
  eliminado: Boolean,      // Soft delete (default: false)
  createdAt: Date,         // Fecha de creación
  updatedAt: Date          // Fecha de última actualización
}
```

---

## ✅ Validaciones

### Campos Requeridos

- ✔️ **nombre**: Obligatorio, único
- ✔️ **rif**: Obligatorio, único
- ✔️ **ubicacion**: Obligatoria
- ✔️ **procesamientoDia**: Obligatorio, no negativo

### Campos Opcionales

- **telefono**: Opcional
- **legal**: Opcional
- **img**: Opcional

### Restricciones

- **nombre**: 3-50 caracteres, único en la base de datos
- **rif**: 5-20 caracteres, único en la base de datos
- **ubicacion**: 3-100 caracteres
- **telefono**: 3-15 caracteres
- **legal**: 3-50 caracteres
- **procesamientoDia**: Número entero ≥ 0
- **estado**: Solo valores "activo" o "inactivo"

---

## 📊 Casos de Uso

### 1. Registro de Nuevo Taller

```javascript
const nuevoTaller = await AutoSys.create({
  nombre: "AutoTaller Central",
  rif: "J-12345678-9",
  ubicacion: "Av. Principal, Centro Comercial Plaza, Local 5, Caracas",
  telefono: "+58-212-1234567",
  procesamientoDia: 15,
  legal: "Carlos García",
  estado: "activo",
});
```

**Respuesta:**

```json
{
  "_id": "690e4050a2b56f609ef67618",
  "nombre": "AutoTaller Central",
  "rif": "J-12345678-9",
  "ubicacion": "Av. Principal, Centro Comercial Plaza, Local 5, Caracas",
  "telefono": "+58-212-1234567",
  "procesamientoDia": 15,
  "legal": "Carlos García",
  "img": null,
  "estado": "activo",
  "eliminado": false,
  "createdAt": "2025-11-07T18:54:08.000Z",
  "updatedAt": "2025-11-07T18:54:08.000Z"
}
```

---

### 2. Consultar Talleres Activos

```javascript
const talleresActivos = await AutoSys.find({
  eliminado: false,
  estado: "activo",
}).sort({ nombre: 1 });
```

**Respuesta:**

```json
[
  {
    "_id": "690e3f4f0e8a1a2b3c4d5e6f",
    "nombre": "AutoTaller Central",
    "rif": "J-12345678-9",
    "ubicacion": "Av. Principal, Centro Comercial Plaza, Local 5, Caracas",
    "telefono": "+58-212-1234567",
    "procesamientoDia": 15,
    "estado": "activo"
  },
  {
    "_id": "690e3f4f0e8a1a2b3c4d5e70",
    "nombre": "Taller Mecánico Express",
    "rif": "J-98765432-1",
    "ubicacion": "Calle Los Mecánicos, Zona Industrial, Valencia",
    "telefono": "+58-241-9876543",
    "procesamientoDia": 20,
    "estado": "activo"
  }
]
```

---

### 3. Actualizar Información del Taller

```javascript
const tallerActualizado = await AutoSys.findByIdAndUpdate(
  "690e4050a2b56f609ef67618",
  {
    telefono: "+58-212-8888888",
    procesamientoDia: 20,
    ubicacion: "Nueva Av. Principal, Local 10",
  },
  { new: true, runValidators: true }
);
```

**Respuesta:**

```json
{
  "_id": "690e4050a2b56f609ef67618",
  "nombre": "AutoTaller Central",
  "rif": "J-12345678-9",
  "ubicacion": "Nueva Av. Principal, Local 10",
  "telefono": "+58-212-8888888",
  "procesamientoDia": 20,
  "estado": "activo",
  "updatedAt": "2025-11-07T19:10:30.000Z"
}
```

---

### 4. Cambiar Estado del Taller

**Desactivar:**

```javascript
const tallerInactivo = await AutoSys.findByIdAndUpdate(
  "690e4050a2b56f609ef67618",
  { estado: "inactivo" },
  { new: true }
);
```

**Reactivar:**

```javascript
const tallerActivo = await AutoSys.findByIdAndUpdate(
  "690e4050a2b56f609ef67618",
  { estado: "activo" },
  { new: true }
);
```

---

### 5. Eliminación Lógica

```javascript
// Marcar como eliminado (soft delete)
const tallerEliminado = await AutoSys.findByIdAndUpdate(
  "690e4050a2b56f609ef67618",
  { eliminado: true },
  { new: true }
);

// Los talleres eliminados no aparecen en consultas normales
const talleres = await AutoSys.find({ eliminado: false });
```

---

### 6. Estadísticas de Capacidad

```javascript
// Total de talleres activos
const totalActivos = await AutoSys.countDocuments({
  eliminado: false,
  estado: "activo",
});

// Capacidad total de procesamiento
const talleres = await AutoSys.find({
  eliminado: false,
  estado: "activo",
});

const capacidadTotal = talleres.reduce(
  (sum, taller) => sum + taller.procesamientoDia,
  0
);

const capacidadPromedio = capacidadTotal / talleres.length;

console.log({
  totalTalleres: talleres.length,
  capacidadTotal: capacidadTotal, // vehículos/día
  capacidadPromedio: capacidadPromedio, // vehículos/día por taller
});
```

**Respuesta:**

```json
{
  "totalTalleres": 7,
  "capacidadTotal": 108,
  "capacidadPromedio": 15.4
}
```

---

## 🧪 Testing

### Ejecutar Seeder

```bash
node database/seeds/autosys-seeder.js
```

Este comando crea 8 talleres de ejemplo:

- 7 talleres activos
- 1 taller inactivo
- Capacidad total: 113 vehículos/día

### Ejecutar Tests

```bash
node tests/test-autosys.js
```

**Tests incluidos:**

1. ✅ Crear taller
2. ✅ Leer taller
3. ✅ Actualizar taller
4. ✅ Cambiar estado (activo/inactivo)
5. ✅ Validar campos únicos (RIF y Nombre)
6. ✅ Validar longitudes de campos
7. ✅ Validar campos requeridos
8. ✅ Validar capacidad no negativa
9. ✅ Eliminación lógica
10. ✅ Listar talleres (activos e inactivos)
11. ✅ Estadísticas del sistema

---

## 📂 Archivos Relacionados

```
features/autoSys/
├── autoSys.models.js           # Modelo Mongoose
├── autoSys.controllers.js      # Controladores HTTP (si existen)
└── autoSys.routes.js           # Rutas de API (si existen)

database/seeds/
└── autosys-seeder.js           # Datos de ejemplo

tests/
└── test-autosys.js             # Tests automatizados

docs/
└── AUTOSYS.md                  # Esta documentación
```

---

## 🔧 Mantenimiento

### Limpiar Talleres de Prueba

Si necesitas eliminar todos los talleres:

```javascript
// Solo los de prueba
await AutoSys.deleteMany({ rif: /^J-TEST-/ });

// Todos (¡CUIDADO!)
await AutoSys.deleteMany({});
```

### Restaurar Datos de Ejemplo

```bash
# Limpiar y volver a crear
node database/seeds/autosys-seeder.js
```

---

## 📊 Ejemplo de Salida del Seeder

```
============================================================
🌱 SEEDER: AUTOSYS (TALLERES)
============================================================

🧹 PASO 1: Verificar datos existentes
------------------------------------------------------------
ℹ️  Talleres existentes: 0

🏢 PASO 2: Crear Talleres
------------------------------------------------------------
✅ AutoTaller Central - J-12345678-9 (15 vehículos/día)
✅ Taller Mecánico Express - J-98765432-1 (20 vehículos/día)
✅ ServiFrenos Premium - J-55566677-8 (10 vehículos/día)
✅ TallerTech Pro - J-11122233-4 (25 vehículos/día)
✅ Automotriz Los Primos - J-99988877-6 (12 vehículos/día)
✅ Taller Especializado Diesel - J-44455566-2 (8 vehículos/día)
✅ Centro Automotriz 360 - J-77788899-0 (18 vehículos/día)
✅ Taller El Rápido (Inactivo) - J-33344455-5 (5 vehículos/día)

============================================================
📊 RESUMEN DEL SEEDER
============================================================

    ✅ Total Talleres: 8
    ✅ Talleres Activos: 7
    ⚠️  Talleres Inactivos: 1
    📊 Capacidad Total: 113 vehículos/día
```

---

## 📊 Ejemplo de Salida del Test

```
============================================================
🧪 TEST: AUTOSYS (TALLERES)
============================================================

📝 PASO 1: CREAR taller
------------------------------------------------------------
✅ Taller creado exitosamente

🔍 PASO 2: LEER taller
------------------------------------------------------------
✅ Taller leído exitosamente

✏️  PASO 3: ACTUALIZAR taller
------------------------------------------------------------
✅ Taller actualizado

🔄 PASO 4: CAMBIAR estado del taller
------------------------------------------------------------
✅ Estado cambiado

🔒 PASO 5: VALIDAR campos únicos (RIF y Nombre)
------------------------------------------------------------
✅ Validación de RIF único funcionando correctamente
✅ Validación de nombre único funcionando correctamente

📏 PASO 6: VALIDAR longitudes de campos
------------------------------------------------------------
✅ Validación de longitud mínima de nombre
✅ Validación de longitud máxima de nombre

✔️  PASO 7: VALIDAR campos requeridos
------------------------------------------------------------
✅ Campo "nombre" es requerido correctamente
✅ Campo "rif" es requerido correctamente
✅ Campo "ubicacion" es requerido correctamente
✅ Campo "procesamientoDia" es requerido correctamente

🔢 PASO 8: VALIDAR capacidad no negativa
------------------------------------------------------------
✅ Validación de capacidad no negativa

🗑️  PASO 9: ELIMINACIÓN lógica
------------------------------------------------------------
✅ Taller marcado como eliminado
✅ El taller eliminado NO aparece en consultas normales

📋 PASO 10: LISTAR talleres
------------------------------------------------------------
   🟢 Talleres ACTIVOS: 7
   🔴 Talleres INACTIVOS: 1

📊 PASO 11: ESTADÍSTICAS
------------------------------------------------------------
   - Total talleres: 8
   - Activos: 7 (87.5%)
   - Inactivos: 1 (12.5%)
   - Capacidad total: 108 vehículos/día
   - Capacidad promedio: 15.4 vehículos/día por taller

============================================================
🎉 TEST COMPLETADO EXITOSAMENTE
============================================================
```

---

## 🚀 Conclusión

El módulo AutoSys proporciona una gestión completa de talleres con:

- ✅ Validaciones robustas de datos
- ✅ Control de unicidad (RIF y nombre)
- ✅ Gestión de estados (activo/inactivo)
- ✅ Eliminación lógica
- ✅ Capacidad de procesamiento configurable
- ✅ Tests automatizados completos
- ✅ Datos de ejemplo para desarrollo

Para más información sobre otros módulos, consulta:

- [Inventario](./INVENTARIO.md)
- [Stock Mínimo](./STOCK-MINIMO.md)
