# Implementación Frontend: Cambio de Estado de Órdenes de Trabajo

## Descripción General

Esta guía explica cómo implementar en el frontend la funcionalidad para cambiar el estado de una orden de trabajo usando la ruta PATCH `/work-orders/:id/status`.

## API Endpoints Requeridos

### 1. Obtener Estados Disponibles

```http
GET /api/work-order-statuses
Authorization: Bearer {token} o x-token: {token}
```

**Respuesta exitosa (200):**

```json
{
  "data": [
    {
      "codigo": "RECIBIDO",
      "nombre": "Recibido",
      "tipo": "inicial",
      "activo": true,
      "transicionesPermitidas": ["DIAGNOSTICO"]
    },
    {
      "codigo": "DIAGNOSTICO",
      "nombre": "En Diagnóstico",
      "tipo": "intermedio",
      "activo": true,
      "transicionesPermitidas": ["LISTO_ENTREGA"]
    },
    {
      "codigo": "LISTO_ENTREGA",
      "nombre": "Listo para Entrega",
      "tipo": "intermedio",
      "activo": true,
      "transicionesPermitidas": ["CERRADA_FACTURADA"]
    },
    {
      "codigo": "CERRADA_FACTURADA",
      "nombre": "Cerrada y Facturada",
      "tipo": "final",
      "activo": true,
      "transicionesPermitidas": []
    }
  ]
}
```

### 2. Cambiar Estado de Orden de Trabajo

```http
PATCH /api/work-orders/:id/status
Authorization: Bearer {token} o x-token: {token}
Content-Type: application/json

{
  "newStatus": "DIAGNOSTICO",
  "notes": "Notas del cambio de estado"
}
```

**Respuesta exitosa (200):**

```json
{
  "msg": "Estado de la orden de trabajo actualizado exitosamente",
  "data": {
    "_id": "orden_id",
    "estado": {
      "codigo": "DIAGNOSTICO",
      "nombre": "En Diagnóstico"
    }
  },
  "estadoAnterior": {
    "codigo": "RECIBIDO",
    "nombre": "Recibido"
  },
  "estadoNuevo": {
    "codigo": "DIAGNOSTICO",
    "nombre": "En Diagnóstico"
  }
}
```

## Implementación en JavaScript/React

### 1. Servicio para Estados de Trabajo

```javascript
// services/workOrderStatusService.js
class WorkOrderStatusService {
  constructor(baseURL = "/api") {
    this.baseURL = baseURL;
  }

  async getStatuses() {
    const token = localStorage.getItem("token"); // o desde tu estado de auth

    const response = await fetch(`${this.baseURL}/work-order-statuses`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-token": token, // o 'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error("Error al obtener estados de trabajo");
    }

    const data = await response.json();
    return data.data || data.statuses || [];
  }

  async changeWorkOrderStatus(workOrderId, newStatus, notes = "") {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${this.baseURL}/work-orders/${workOrderId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-token": token,
        },
        body: JSON.stringify({
          newStatus,
          notes,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.msg || "Error al cambiar estado");
    }

    return await response.json();
  }
}

export default new WorkOrderStatusService();
```

### 2. Hook Personalizado para Estados

```javascript
// hooks/useWorkOrderStatuses.js
import { useState, useEffect } from "react";
import workOrderStatusService from "../services/workOrderStatusService";

export const useWorkOrderStatuses = () => {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    try {
      setLoading(true);
      const data = await workOrderStatusService.getStatuses();
      setStatuses(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getValidTransitions = (currentStatusCode) => {
    const currentStatus = statuses.find((s) => s.codigo === currentStatusCode);
    if (!currentStatus || !currentStatus.transicionesPermitidas) {
      return [];
    }
    return statuses.filter((s) =>
      currentStatus.transicionesPermitidas.includes(s.codigo)
    );
  };

  return {
    statuses,
    loading,
    error,
    getValidTransitions,
    reloadStatuses: loadStatuses,
  };
};
```

### 3. Componente para Cambiar Estado

```javascript
// components/ChangeWorkOrderStatus.jsx
import React, { useState } from "react";
import { useWorkOrderStatuses } from "../hooks/useWorkOrderStatuses";
import workOrderStatusService from "../services/workOrderStatusService";

const ChangeWorkOrderStatus = ({ workOrder, onStatusChanged }) => {
  const {
    statuses,
    loading: statusesLoading,
    getValidTransitions,
  } = useWorkOrderStatuses();
  const [selectedStatus, setSelectedStatus] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const currentStatusCode = workOrder.estado?.codigo || workOrder.estado;
  const validTransitions = getValidTransitions(currentStatusCode);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedStatus) {
      setError("Debes seleccionar un nuevo estado");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await workOrderStatusService.changeWorkOrderStatus(
        workOrder._id,
        selectedStatus,
        notes
      );

      // Notificar al componente padre
      if (onStatusChanged) {
        onStatusChanged(result);
      }

      // Resetear formulario
      setSelectedStatus("");
      setNotes("");

      alert("Estado cambiado exitosamente");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (statusesLoading) {
    return <div>Cargando estados...</div>;
  }

  return (
    <div className="change-status-form">
      <h3>Cambiar Estado de Orden de Trabajo</h3>

      <div className="current-status">
        <strong>Estado Actual:</strong>{" "}
        {workOrder.estado?.nombre || workOrder.estado}
      </div>

      {validTransitions.length === 0 ? (
        <div className="no-transitions">
          No hay transiciones disponibles desde el estado actual
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="newStatus">Nuevo Estado:</label>
            <select
              id="newStatus"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              required
            >
              <option value="">Seleccionar estado...</option>
              {validTransitions.map((status) => (
                <option key={status.codigo} value={status.codigo}>
                  {status.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notas (opcional):</label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Describe el motivo del cambio de estado..."
              rows={3}
            />
          </div>

          {error && (
            <div
              className="error-message"
              style={{ color: "red", marginBottom: "10px" }}
            >
              {error}
            </div>
          )}

          <button type="submit" disabled={loading || !selectedStatus}>
            {loading ? "Cambiando..." : "Cambiar Estado"}
          </button>
        </form>
      )}
    </div>
  );
};

export default ChangeWorkOrderStatus;
```

### 4. Uso en un Componente de Detalle de Orden

```javascript
// components/WorkOrderDetail.jsx
import React, { useState, useEffect } from "react";
import ChangeWorkOrderStatus from "./ChangeWorkOrderStatus";

const WorkOrderDetail = ({ workOrderId }) => {
  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkOrder();
  }, [workOrderId]);

  const loadWorkOrder = async () => {
    // Cargar datos de la orden de trabajo
    // ...
  };

  const handleStatusChanged = (result) => {
    // Actualizar el estado local de la orden
    setWorkOrder((prev) => ({
      ...prev,
      estado: result.data.estado,
    }));

    // Opcional: recargar toda la orden
    // loadWorkOrder();
  };

  if (loading) return <div>Cargando...</div>;
  if (!workOrder) return <div>Orden no encontrada</div>;

  return (
    <div className="work-order-detail">
      <h2>Orden de Trabajo #{workOrder._id}</h2>

      <div className="work-order-info">
        <p>
          <strong>Cliente:</strong> {workOrder.customer?.nombre}
        </p>
        <p>
          <strong>Estado:</strong> {workOrder.estado?.nombre}
        </p>
        {/* Otros campos... */}
      </div>

      <ChangeWorkOrderStatus
        workOrder={workOrder}
        onStatusChanged={handleStatusChanged}
      />
    </div>
  );
};

export default WorkOrderDetail;
```

## Implementación en Vue.js

### Servicio para Estados

```javascript
// services/workOrderStatusService.js
class WorkOrderStatusService {
  constructor(baseURL = "/api") {
    this.baseURL = baseURL;
  }

  async getStatuses() {
    const token = localStorage.getItem("token");

    const response = await fetch(`${this.baseURL}/work-order-statuses`, {
      headers: {
        "x-token": token,
      },
    });

    if (!response.ok) throw new Error("Error al obtener estados");
    const data = await response.json();
    return data.data || data.statuses || [];
  }

  async changeWorkOrderStatus(workOrderId, newStatus, notes = "") {
    const token = localStorage.getItem("token");

    const response = await fetch(
      `${this.baseURL}/work-orders/${workOrderId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-token": token,
        },
        body: JSON.stringify({ newStatus, notes }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.msg || "Error al cambiar estado");
    }

    return await response.json();
  }
}

export default new WorkOrderStatusService();
```

### Componente Vue para Cambiar Estado

```vue
<template>
  <div class="change-status-form">
    <h3>Cambiar Estado de Orden de Trabajo</h3>

    <div class="current-status">
      <strong>Estado Actual:</strong>
      {{ workOrder.estado?.nombre || workOrder.estado }}
    </div>

    <div v-if="validTransitions.length === 0" class="no-transitions">
      No hay transiciones disponibles desde el estado actual
    </div>

    <form v-else @submit.prevent="changeStatus">
      <div class="form-group">
        <label for="newStatus">Nuevo Estado:</label>
        <select id="newStatus" v-model="selectedStatus" required>
          <option value="">Seleccionar estado...</option>
          <option
            v-for="status in validTransitions"
            :key="status.codigo"
            :value="status.codigo"
          >
            {{ status.nombre }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="notes">Notas (opcional):</label>
        <textarea
          id="notes"
          v-model="notes"
          placeholder="Describe el motivo del cambio de estado..."
          rows="3"
        />
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <button type="submit" :disabled="loading || !selectedStatus">
        {{ loading ? "Cambiando..." : "Cambiar Estado" }}
      </button>
    </form>
  </div>
</template>

<script>
import workOrderStatusService from "../services/workOrderStatusService";

export default {
  name: "ChangeWorkOrderStatus",
  props: {
    workOrder: {
      type: Object,
      required: true,
    },
  },
  emits: ["statusChanged"],
  data() {
    return {
      statuses: [],
      selectedStatus: "",
      notes: "",
      loading: false,
      error: null,
    };
  },
  computed: {
    currentStatusCode() {
      return this.workOrder.estado?.codigo || this.workOrder.estado;
    },
    validTransitions() {
      const currentStatus = this.statuses.find(
        (s) => s.codigo === this.currentStatusCode
      );
      if (!currentStatus || !currentStatus.transicionesPermitidas) {
        return [];
      }
      return this.statuses.filter((s) =>
        currentStatus.transicionesPermitidas.includes(s.codigo)
      );
    },
  },
  async mounted() {
    await this.loadStatuses();
  },
  methods: {
    async loadStatuses() {
      try {
        this.statuses = await workOrderStatusService.getStatuses();
      } catch (error) {
        this.error = error.message;
      }
    },
    async changeStatus() {
      if (!this.selectedStatus) {
        this.error = "Debes seleccionar un nuevo estado";
        return;
      }

      try {
        this.loading = true;
        this.error = null;

        const result = await workOrderStatusService.changeWorkOrderStatus(
          this.workOrder._id,
          this.selectedStatus,
          this.notes
        );

        this.$emit("statusChanged", result);

        // Reset form
        this.selectedStatus = "";
        this.notes = "";

        alert("Estado cambiado exitosamente");
      } catch (error) {
        this.error = error.message;
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.change-status-form {
  max-width: 500px;
  margin: 20px 0;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

button {
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover:not(:disabled) {
  background-color: #0056b3;
}

button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.error-message {
  color: red;
  margin-bottom: 10px;
}

.no-transitions {
  color: #666;
  font-style: italic;
}
</style>
```

## Manejo de Errores

### Errores Comunes

1. **401 Unauthorized**: Token de autenticación inválido o expirado
2. **403 Forbidden**: Usuario sin permisos para cambiar estados
3. **400 Bad Request**: Estado inválido o transición no permitida
4. **404 Not Found**: Orden de trabajo no existe
5. **500 Internal Server Error**: Error del servidor

### Manejo de Errores en el Frontend

```javascript
const handleApiError = (error) => {
  if (error.message.includes("401") || error.message.includes("Unauthorized")) {
    // Redirigir a login
    redirectToLogin();
  } else if (
    error.message.includes("403") ||
    error.message.includes("Forbidden")
  ) {
    showError("No tienes permisos para realizar esta acción");
  } else if (error.message.includes("400")) {
    showError("Transición de estado no válida");
  } else if (error.message.includes("404")) {
    showError("Orden de trabajo no encontrada");
  } else {
    showError("Error inesperado. Inténtalo de nuevo.");
  }
};
```

## Consideraciones de Seguridad

1. **Validación en Frontend**: Siempre validar transiciones permitidas en el frontend
2. **Validación en Backend**: El backend siempre valida las transiciones (defensa en profundidad)
3. **Auditoría**: Los cambios de estado se registran en el historial
4. **Permisos**: Verificar que el usuario tenga permisos para cambiar estados

## Testing

Para probar la implementación, puedes usar herramientas como:

- **Postman/Insomnia**: Para probar los endpoints directamente
- **Jest + React Testing Library**: Para tests unitarios de componentes
- **Cypress**: Para tests end-to-end

### Ejemplo de Test con Jest

```javascript
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ChangeWorkOrderStatus from "./ChangeWorkOrderStatus";

// Mock del servicio
jest.mock("../services/workOrderStatusService");

test("cambia estado exitosamente", async () => {
  const mockWorkOrder = {
    _id: "123",
    estado: { codigo: "RECIBIDO", nombre: "Recibido" },
  };

  const mockStatuses = [
    {
      codigo: "RECIBIDO",
      nombre: "Recibido",
      transicionesPermitidas: ["DIAGNOSTICO"],
    },
    {
      codigo: "DIAGNOSTICO",
      nombre: "En Diagnóstico",
      transicionesPermitidas: [],
    },
  ];

  // Configurar mocks
  workOrderStatusService.getStatuses.mockResolvedValue(mockStatuses);
  workOrderStatusService.changeWorkOrderStatus.mockResolvedValue({
    data: { estado: { codigo: "DIAGNOSTICO", nombre: "En Diagnóstico" } },
  });

  render(<ChangeWorkOrderStatus workOrder={mockWorkOrder} />);

  // Esperar que carguen los estados
  await waitFor(() => {
    expect(screen.getByDisplayValue("En Diagnóstico")).toBeInTheDocument();
  });

  // Seleccionar nuevo estado
  fireEvent.change(screen.getByLabelText(/nuevo estado/i), {
    target: { value: "DIAGNOSTICO" },
  });

  // Enviar formulario
  fireEvent.click(screen.getByText("Cambiar Estado"));

  // Verificar que se llamó al servicio
  await waitFor(() => {
    expect(workOrderStatusService.changeWorkOrderStatus).toHaveBeenCalledWith(
      "123",
      "DIAGNOSTICO",
      ""
    );
  });
});
```

## Conclusión

Esta implementación proporciona una forma segura y eficiente de cambiar el estado de las órdenes de trabajo, con validación tanto en frontend como en backend, manejo adecuado de errores, y una buena experiencia de usuario.

Los puntos clave son:

- Obtener estados disponibles al cargar el componente
- Validar transiciones permitidas en el frontend
- Usar PATCH con autenticación
- Manejar errores apropiadamente
- Actualizar la UI después del cambio</content>
  <parameter name="filePath">/Users/alfredocastillo/Documents/GitHub/backend-taller-template-web/FRONTEND_IMPLEMENTATION.md
