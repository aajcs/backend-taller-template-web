# 📦 Guía de Importaciones - Proyecto Backend Taller

## 🎯 Objetivo

Esta guía establece las mejores prácticas para las importaciones en el proyecto, haciendo el código más legible, mantenible y consistente.

---

## 📋 Principios Generales

### 1. **Orden de Importaciones**

Las importaciones deben seguir este orden:

```javascript
// 1. Librerías externas de Node.js
const { Router } = require("express");
const { check } = require("express-validator");

// 2. Middlewares globales
const { validarJWT, validarCampos } = require("../../../../middlewares");

// 3. Controllers del módulo actual
const { getItems, createItem } = require("../controllers/item.controller");

// 4. Validadores del módulo actual
const { existeItemPorId } = require("../helpers");

// 5. Validadores de otros módulos
const { existeUsuarioPorId } = require("../../../user/helpers");

// 6. Validadores globales
const { existeProductoPorId } = require("../../../../helpers");
```

### 2. **Comentarios Organizadores**

Usar comentarios para separar grupos de importaciones:

```javascript
// Middlewares globales
const { validarJWT } = require("../../../../middlewares");

// Controllers del módulo
const { getItems } = require("../controllers/item.controller");

// Validadores del módulo
const { existeItemPorId } = require("../helpers");
```

### 3. **Usar Archivos Index**

Cada módulo debe tener un archivo `index.js` en su carpeta `helpers/`:

```javascript
// features/workshop/billing/helpers/index.js
const billingValidators = require("./db-validators");

module.exports = {
  ...billingValidators,
};
```

Esto permite importar así:

```javascript
// ✅ CORRECTO - Más limpio
const { existeInvoicePorId } = require("../helpers");

// ❌ EVITAR - Más verboso
const { existeInvoicePorId } = require("../helpers/db-validators");
```

---

## 🏗️ Estructura de Módulos

### Módulo Work Orders

```
features/workshop/work-orders/
├── models/
│   └── index.js                    # Exporta todos los modelos
├── controllers/
│   └── *.controller.js
├── routes/
│   └── *.routes.js
└── helpers/
    ├── index.js                    # Exporta todos los validadores
    └── db-validators.js            # Define los validadores
```

### Módulo Billing

```
features/workshop/billing/
├── models/
│   └── index.js                    # Exporta Invoice, InvoiceItem, Payment, WorkOrder
├── controllers/
│   └── *.controller.js
├── routes/
│   └── *.routes.js
└── helpers/
    ├── index.js                    # Exporta todos los validadores
    └── db-validators.js            # Define los validadores
```

---

## ✅ Ejemplos de Buenas Prácticas

### Ejemplo 1: Route File (payment.routes.js)

```javascript
const { Router } = require("express");
const { check } = require("express-validator");

// Middlewares globales
const { validarJWT, validarCampos } = require("../../../../middlewares");

// Controllers del módulo
const {
  getInvoicePayments,
  createPayment,
  confirmPayment,
} = require("../controllers/payment.controller");

// Validadores del módulo
const { existeInvoicePorId } = require("../helpers");

const router = Router();
```

### Ejemplo 2: Validators File (db-validators.js)

```javascript
/**
 * Validadores para el módulo de Órdenes de Trabajo
 */

// Importaciones de modelos del mismo módulo
const { WorkOrder, WorkOrderStatus, Service } = require("../models");

const existeWorkOrderPorId = async (id) => {
  const workOrder = await WorkOrder.findById(id);
  if (!workOrder || workOrder.deleted) {
    throw new Error(`No existe una orden de trabajo con el id ${id}`);
  }
};

module.exports = {
  existeWorkOrderPorId,
};
```

### Ejemplo 3: Controller File

```javascript
const { response } = require("express");

// Modelos del módulo
const { Invoice, InvoiceItem, Payment, WorkOrder } = require("../models");

const getInvoices = async (req, res = response) => {
  // Implementación
};

module.exports = {
  getInvoices,
};
```

---

## 🚫 Anti-Patrones a Evitar

### ❌ Evitar require() dinámicos en helpers

```javascript
// ❌ MAL
const existeServicePorId = async (id) => {
  const service = await require("../../models").Service.findById(id);
  // ...
};

// ✅ BIEN
const { Service } = require("../models");

const existeServicePorId = async (id) => {
  const service = await Service.findById(id);
  // ...
};
```

### ❌ Evitar rutas relativas largas sin comentarios

```javascript
// ❌ MAL - No está claro qué estamos importando
const {
  existeInvoicePorId,
} = require("../../../../helpers/billing-validators");

// ✅ BIEN - Con comentario organizador
// Validadores del módulo billing
const { existeInvoicePorId } = require("../helpers");
```

### ❌ Evitar importaciones duplicadas

```javascript
// ❌ MAL
const Invoice = require("../models/Invoice");
const InvoiceItem = require("../models/InvoiceItem");
const Payment = require("../models/Payment");

// ✅ BIEN
const { Invoice, InvoiceItem, Payment } = require("../models");
```

---

## 🔄 Rutas Relativas - Guía Rápida

Desde un archivo de **routes**:

```javascript
"../controllers"; // Para controllers del mismo módulo
"../helpers"; // Para helpers del mismo módulo
"../models"; // Para modelos del mismo módulo
"../../other-module"; // Para otro módulo del mismo feature
"../../../../middlewares"; // Para middlewares globales
"../../../../helpers"; // Para helpers globales
```

Desde un archivo de **helpers**:

```javascript
"../models"; // Para modelos del mismo módulo
"../../models"; // Para índice de modelos del feature
"../../../user/helpers"; // Para helpers de otro feature
```

---

## 📝 Checklist de Revisión

Antes de hacer commit, verifica:

- [ ] Las importaciones están organizadas por tipo (librerías, middlewares, controllers, helpers)
- [ ] Hay comentarios que separan los grupos de importaciones
- [ ] Se usan archivos index cuando es posible
- [ ] No hay require() dinámicos innecesarios
- [ ] Las rutas relativas son correctas
- [ ] Los nombres de los archivos importados son consistentes (kebab-case)
- [ ] Se importan solo las funciones/objetos necesarios (destructuring)

---

## 🎓 Beneficios de Estas Prácticas

1. **Legibilidad**: Es más fácil entender qué importa cada archivo
2. **Mantenibilidad**: Los cambios en la estructura afectan menos archivos
3. **Debugging**: Es más fácil rastrear errores de importación
4. **Colaboración**: Todo el equipo sigue el mismo patrón
5. **Refactoring**: Es más fácil reorganizar el código

---

## 📚 Referencias

- Estructura de módulos: `/features/workshop/`
- Helpers globales: `/helpers/`
- Middlewares globales: `/middlewares/`
- Modelos principales: `/models/`

---

**Última actualización**: Noviembre 2025
**Autor**: Sistema de Backend Taller
