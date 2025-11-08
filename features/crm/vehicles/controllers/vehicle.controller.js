// Importaciones necesarias
const { response, request } = require("express");
const { Vehicle, VehicleModel, VehicleBrand } = require("../models");

// Opciones de población para referencias en las consultas
const populateOptions = [
  {
    path: "customer",
    select: "nombre rif telefono correo",
  },
  {
    path: "model",
    populate: {
      path: "brand",
      select: "nombre paisOrigen logo",
    },
    select: "nombre tipo motor yearInicio yearFin",
  },
  { path: "createdBy", select: "nombre correo" },
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  },
];

// Controlador para obtener todos los vehículos no eliminados
const vehiclesGet = async (req = request, res = response, next) => {
  const query = { eliminado: false };

  // Filtros opcionales
  if (req.query.customer) {
    query.customer = req.query.customer;
  }
  if (req.query.model) {
    query.model = req.query.model;
  }
  if (req.query.placa) {
    query.placa = new RegExp(req.query.placa, "i"); // Búsqueda insensible a mayúsculas
  }
  if (req.query.estado) {
    query.estado = req.query.estado;
  }

  try {
    // Ejecuta ambas consultas en paralelo
    const [total, vehicles] = await Promise.all([
      Vehicle.countDocuments(query),
      Vehicle.find(query).sort({ placa: 1 }).populate(populateOptions),
    ]);

    // Ordenar historial por fecha descendente
    vehicles.forEach((vehicle) => {
      if (Array.isArray(vehicle.historial)) {
        vehicle.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });

    res.json({
      total,
      vehicles,
    });
  } catch (err) {
    next(err);
  }
};

// Controlador para obtener un vehículo específico por ID
const vehicleGetById = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const vehicle = await Vehicle.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions);

    if (!vehicle) {
      return res.status(404).json({
        msg: "Vehículo no encontrado",
      });
    }

    // Ordenar historial por fecha descendente
    if (Array.isArray(vehicle.historial)) {
      vehicle.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }

    res.json(vehicle);
  } catch (err) {
    next(err);
  }
};

// Controlador para buscar vehículo por placa (RF-8)
const vehicleGetByPlaca = async (req = request, res = response, next) => {
  const { placa } = req.params;

  try {
    const vehicle = await Vehicle.findOne({
      placa: placa.toUpperCase(),
      eliminado: false,
    }).populate(populateOptions);

    if (!vehicle) {
      return res.status(404).json({
        msg: "Vehículo no encontrado con la placa especificada",
      });
    }

    res.json(vehicle);
  } catch (err) {
    next(err);
  }
};

// Controlador para buscar vehículo por VIN (RF-8)
const vehicleGetByVin = async (req = request, res = response, next) => {
  const { vin } = req.params;

  try {
    const vehicle = await Vehicle.findOne({
      vin: vin.toUpperCase(),
      eliminado: false,
    }).populate(populateOptions);

    if (!vehicle) {
      return res.status(404).json({
        msg: "Vehículo no encontrado con el VIN especificado",
      });
    }

    res.json(vehicle);
  } catch (err) {
    next(err);
  }
};

// Controlador para crear un nuevo vehículo
const vehiclePost = async (req = request, res = response, next) => {
  const { customer, model, year, placa, vin, color, kilometraje } = req.body;

  try {
    // Verificar que el modelo existe y está activo
    const modelExists = await VehicleModel.findOne({
      _id: model,
      estado: "activo",
      eliminado: false,
    });

    if (!modelExists) {
      return res.status(400).json({
        msg: "El modelo especificado no existe o no está activo",
      });
    }

    // Verificar que el año esté dentro del rango del modelo
    if (modelExists.yearInicio && year < modelExists.yearInicio) {
      return res.status(400).json({
        msg: `El año ${year} es anterior al año de inicio del modelo (${modelExists.yearInicio})`,
      });
    }

    if (modelExists.yearFin && year > modelExists.yearFin) {
      return res.status(400).json({
        msg: `El año ${year} es posterior al año de fin del modelo (${modelExists.yearFin})`,
      });
    }

    // Crear nuevo vehículo
    const vehicle = new Vehicle({
      customer,
      model,
      year,
      placa: placa.toUpperCase(),
      vin: vin.toUpperCase(),
      color,
      kilometraje,
      createdBy: req.usuario.id,
    });

    // Guardar en base de datos
    await vehicle.save();

    // Poblar referencias para la respuesta
    await vehicle.populate(populateOptions);

    res.status(201).json({
      msg: "Vehículo creado exitosamente",
      vehicle,
    });
  } catch (err) {
    next(err);
  }
};

// Controlador para actualizar un vehículo existente
const vehiclePut = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { customer, model, year, placa, vin, color, kilometraje, estado } =
    req.body;

  try {
    const vehicle = await Vehicle.findOne({
      _id: id,
      eliminado: false,
    });

    if (!vehicle) {
      return res.status(404).json({
        msg: "Vehículo no encontrado",
      });
    }

    // Si se está cambiando el modelo, validar que existe y está activo
    if (model && model !== vehicle.model.toString()) {
      const modelExists = await VehicleModel.findOne({
        _id: model,
        estado: "activo",
        eliminado: false,
      });

      if (!modelExists) {
        return res.status(400).json({
          msg: "El modelo especificado no existe o no está activo",
        });
      }

      // Validar año con el nuevo modelo
      if (year || vehicle.year) {
        const checkYear = year || vehicle.year;
        if (modelExists.yearInicio && checkYear < modelExists.yearInicio) {
          return res.status(400).json({
            msg: `El año ${checkYear} es anterior al año de inicio del modelo (${modelExists.yearInicio})`,
          });
        }
        if (modelExists.yearFin && checkYear > modelExists.yearFin) {
          return res.status(400).json({
            msg: `El año ${checkYear} es posterior al año de fin del modelo (${modelExists.yearFin})`,
          });
        }
      }

      vehicle.model = model;
    }

    // Actualizar campos
    if (customer) vehicle.customer = customer;
    if (year) vehicle.year = year;
    if (placa) vehicle.placa = placa.toUpperCase();
    if (vin) vehicle.vin = vin.toUpperCase();
    if (color !== undefined) vehicle.color = color;
    if (kilometraje !== undefined) vehicle.kilometraje = kilometraje;
    if (estado) vehicle.estado = estado;

    // Guardar cambios
    await vehicle.save();

    // Poblar referencias para la respuesta
    await vehicle.populate(populateOptions);

    res.json({
      msg: "Vehículo actualizado exitosamente",
      vehicle,
    });
  } catch (err) {
    next(err);
  }
};

// Controlador para eliminar lógicamente un vehículo
const vehicleDelete = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const vehicle = await Vehicle.findOne({
      _id: id,
      eliminado: false,
    });

    if (!vehicle) {
      return res.status(404).json({
        msg: "Vehículo no encontrado",
      });
    }

    // Marcar como eliminado (eliminación lógica)
    vehicle.eliminado = true;
    await vehicle.save();

    res.json({
      msg: "Vehículo eliminado exitosamente",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  vehiclesGet,
  vehicleGetById,
  vehicleGetByPlaca,
  vehicleGetByVin,
  vehiclePost,
  vehiclePut,
  vehicleDelete,
};
