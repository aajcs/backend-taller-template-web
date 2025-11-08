/**
 * Customer Controller
 * Controlador para la gestión de clientes en el módulo CRM
 */

// Importaciones necesarias
const { response, request } = require("express");
const { Customer } = require("../models");

// Opciones de población para referencias en las consultas
const populateOptions = [
  // Virtual field para vehículos asociados
  {
    path: "vehicles",
    select: "placa year color kilometraje estado model",
    populate: {
      path: "model",
      select: "nombre tipo motor",
      populate: {
        path: "brand",
        select: "nombre",
      },
    },
  },
];

/**
 * Obtener todos los clientes
 * GET /api/customers
 */
const customersGet = async (req = request, res = response) => {
  try {
    const {
      limite = 10,
      desde = 0,
      tipo,
      estado = "activo",
      nombre,
      correo,
    } = req.query;

    // Construir filtro de búsqueda
    let filtro = { eliminado: false };

    // Filtros opcionales
    if (tipo) filtro.tipo = tipo;
    if (estado) filtro.estado = estado;
    if (nombre) filtro.nombre = new RegExp(nombre, "i");
    if (correo) filtro.correo = new RegExp(correo, "i");

    // Ejecutar consulta con paginación
    const [total, customers] = await Promise.all([
      Customer.countDocuments(filtro),
      Customer.find(filtro)
        .populate(populateOptions)
        .skip(Number(desde))
        .limit(Number(limite))
        .sort({ createdAt: -1 }),
    ]);

    res.json({
      ok: true,
      total,
      customers,
    });
  } catch (error) {
    console.error("Error en customersGet:", error);
    res.status(500).json({
      ok: false,
      msg: "Error interno del servidor",
    });
  }
};

/**
 * Obtener un cliente por ID con vehículos asociados
 * GET /api/customers/:id
 */
const customerGet = async (req = request, res = response) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id).populate(populateOptions);

    if (!customer || customer.eliminado) {
      return res.status(404).json({
        ok: false,
        msg: "Cliente no encontrado",
      });
    }

    res.json({
      ok: true,
      customer,
    });
  } catch (error) {
    console.error("Error en customerGet:", error);
    res.status(500).json({
      ok: false,
      msg: "Error interno del servidor",
    });
  }
};

/**
 * Buscar cliente por RIF
 * GET /api/customers/rif/:rif
 */
const customerGetByRif = async (req = request, res = response) => {
  try {
    const { rif } = req.params;

    const customer = await Customer.findByRif(rif).populate(populateOptions);

    if (!customer) {
      return res.status(404).json({
        ok: false,
        msg: "Cliente no encontrado con ese RIF",
      });
    }

    res.json({
      ok: true,
      customer,
    });
  } catch (error) {
    console.error("Error en customerGetByRif:", error);
    res.status(500).json({
      ok: false,
      msg: "Error interno del servidor",
    });
  }
};

/**
 * Buscar cliente por correo
 * GET /api/customers/correo/:correo
 */
const customerGetByCorreo = async (req = request, res = response) => {
  try {
    const { correo } = req.params;

    const customer =
      await Customer.findByCorreo(correo).populate(populateOptions);

    if (!customer) {
      return res.status(404).json({
        ok: false,
        msg: "Cliente no encontrado con ese correo",
      });
    }

    res.json({
      ok: true,
      customer,
    });
  } catch (error) {
    console.error("Error en customerGetByCorreo:", error);
    res.status(500).json({
      ok: false,
      msg: "Error interno del servidor",
    });
  }
};

/**
 * Crear un nuevo cliente
 * POST /api/customers
 */
const customerPost = async (req = request, res = response) => {
  try {
    const {
      nombre,
      tipo,
      telefono,
      correo,
      direccion,
      rif,
      razonSocial,
      notas,
    } = req.body;

    // Crear instancia del cliente
    const customer = new Customer({
      nombre,
      tipo,
      telefono,
      correo,
      direccion,
      rif,
      razonSocial,
      notas,
    });

    // Guardar en base de datos
    await customer.save();

    // Poblar referencias si existen
    await customer.populate(populateOptions);

    res.status(201).json({
      ok: true,
      msg: "Cliente creado exitosamente",
      customer,
    });
  } catch (error) {
    console.error("Error en customerPost:", error);

    // Manejar errores de validación de Mongoose
    if (error.name === "ValidationError") {
      const errores = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        ok: false,
        msg: "Datos de entrada inválidos",
        errores,
      });
    }

    // Manejar errores de duplicados
    if (error.code === 11000) {
      const campo = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        ok: false,
        msg: `El ${campo} ya está registrado en el sistema`,
      });
    }

    res.status(500).json({
      ok: false,
      msg: "Error interno del servidor",
    });
  }
};

/**
 * Actualizar un cliente
 * PUT /api/customers/:id
 */
const customerPut = async (req = request, res = response) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      tipo,
      telefono,
      correo,
      direccion,
      rif,
      razonSocial,
      notas,
      estado,
    } = req.body;

    // Verificar que el cliente existe
    const customerExistente = await Customer.findById(id);
    if (!customerExistente || customerExistente.eliminado) {
      return res.status(404).json({
        ok: false,
        msg: "Cliente no encontrado",
      });
    }

    // Preparar datos de actualización
    const datosActualizacion = {
      nombre,
      tipo,
      telefono,
      correo,
      direccion,
      rif,
      razonSocial,
      notas,
      estado,
    };

    // Actualizar cliente
    const customer = await Customer.findByIdAndUpdate(id, datosActualizacion, {
      new: true,
      runValidators: true,
    }).populate(populateOptions);

    res.json({
      ok: true,
      msg: "Cliente actualizado exitosamente",
      customer,
    });
  } catch (error) {
    console.error("Error en customerPut:", error);

    // Manejar errores de validación
    if (error.name === "ValidationError") {
      const errores = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        ok: false,
        msg: "Datos de entrada inválidos",
        errores,
      });
    }

    // Manejar errores de duplicados
    if (error.code === 11000) {
      const campo = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        ok: false,
        msg: `El ${campo} ya está registrado en el sistema`,
      });
    }

    res.status(500).json({
      ok: false,
      msg: "Error interno del servidor",
    });
  }
};

/**
 * Eliminar un cliente (eliminación lógica)
 * DELETE /api/customers/:id
 */
const customerDelete = async (req = request, res = response) => {
  try {
    const { id } = req.params;

    // Verificar que el cliente existe
    const customer = await Customer.findById(id);
    if (!customer || customer.eliminado) {
      return res.status(404).json({
        ok: false,
        msg: "Cliente no encontrado",
      });
    }

    // Verificar si tiene vehículos asociados (si implementamos esa relación)
    // const vehiculosAsociados = await Vehicle.countDocuments({ customer: id, eliminado: false });
    // if (vehiculosAsociados > 0) {
    //   return res.status(400).json({
    //     ok: false,
    //     msg: "No se puede eliminar el cliente porque tiene vehículos asociados",
    //   });
    // }

    // Realizar eliminación lógica
    await Customer.findByIdAndUpdate(id, { eliminado: true });

    res.json({
      ok: true,
      msg: "Cliente eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error en customerDelete:", error);
    res.status(500).json({
      ok: false,
      msg: "Error interno del servidor",
    });
  }
};

/**
 * Obtener vehículos asociados a un cliente
 * GET /api/customers/:id/vehicles
 */
const customerVehiclesGet = async (req = request, res = response) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findById(id);

    if (!customer || customer.eliminado) {
      return res.status(404).json({
        ok: false,
        msg: "Cliente no encontrado",
      });
    }

    // Obtener vehículos del cliente con población completa
    const vehicles = await customer.getVehicles();

    res.json({
      ok: true,
      customer: {
        id: customer._id,
        nombre: customer.nombre,
        tipo: customer.tipo,
      },
      vehicles,
      total: vehicles.length,
    });
  } catch (error) {
    console.error("Error en customerVehiclesGet:", error);
    res.status(500).json({
      ok: false,
      msg: "Error interno del servidor",
    });
  }
};

module.exports = {
  customersGet,
  customerGet,
  customerGetByRif,
  customerGetByCorreo,
  customerPost,
  customerPut,
  customerDelete,
  customerVehiclesGet,
};
