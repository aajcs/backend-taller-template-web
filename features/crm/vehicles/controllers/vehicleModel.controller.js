// Importaciones necesarias
const { response, request } = require("express");
const { VehicleModel, VehicleBrand } = require("../models");

// Opciones de población para referencias en las consultas
const populateOptions = [
  {
    path: "brand",
    select: "nombre descripcion paisOrigen logo estado",
  },
  { path: "createdBy", select: "nombre correo" },
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  },
];

// Controlador para obtener todos los modelos no eliminados
const vehicleModelsGet = async (req = request, res = response, next) => {
  const query = { eliminado: false };

  // Filtro opcional por marca
  if (req.query.brand) {
    query.brand = req.query.brand;
  }

  try {
    // Ejecuta ambas consultas en paralelo
    const [total, vehicleModels] = await Promise.all([
      VehicleModel.countDocuments(query),
      VehicleModel.find(query).sort({ nombre: 1 }).populate(populateOptions),
    ]);

    // Ordenar historial por fecha descendente
    vehicleModels.forEach((model) => {
      if (Array.isArray(model.historial)) {
        model.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });

    res.json({
      total,
      vehicleModels,
    });
  } catch (err) {
    next(err);
  }
};

// Controlador para obtener un modelo específico por ID
const vehicleModelGetById = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const vehicleModel = await VehicleModel.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions);

    if (!vehicleModel) {
      return res.status(404).json({
        msg: "Modelo de vehículo no encontrado",
      });
    }

    // Ordenar historial por fecha descendente
    if (Array.isArray(vehicleModel.historial)) {
      vehicleModel.historial.sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha)
      );
    }

    res.json(vehicleModel);
  } catch (err) {
    next(err);
  }
};

// Controlador para crear un nuevo modelo
const vehicleModelPost = async (req = request, res = response, next) => {
  const { brand, nombre, descripcion, tipo, motor, yearInicio, yearFin } =
    req.body;

  try {
    // Verificar que la marca existe y está activa
    const brandExists = await VehicleBrand.findOne({
      _id: brand,
      estado: "activo",
      eliminado: false,
    });

    if (!brandExists) {
      return res.status(400).json({
        msg: "La marca especificada no existe o no está activa",
      });
    }

    // Crear nuevo modelo
    const vehicleModel = new VehicleModel({
      brand,
      nombre,
      descripcion,
      tipo,
      motor,
      yearInicio,
      yearFin,
      createdBy: req.usuario.id, // Usuario que crea el registro
    });

    // Guardar en base de datos
    await vehicleModel.save();

    // Poblar referencias para la respuesta
    await vehicleModel.populate(populateOptions);

    res.status(201).json({
      msg: "Modelo de vehículo creado exitosamente",
      vehicleModel,
    });
  } catch (err) {
    next(err);
  }
};

// Controlador para actualizar un modelo existente
const vehicleModelPut = async (req = request, res = response, next) => {
  const { id } = req.params;
  const {
    brand,
    nombre,
    descripcion,
    tipo,
    motor,
    yearInicio,
    yearFin,
    estado,
  } = req.body;

  try {
    const vehicleModel = await VehicleModel.findOne({
      _id: id,
      eliminado: false,
    });

    if (!vehicleModel) {
      return res.status(404).json({
        msg: "Modelo de vehículo no encontrado",
      });
    }

    // Si se está cambiando la marca, verificar que existe y está activa
    if (brand && brand !== vehicleModel.brand.toString()) {
      const brandExists = await VehicleBrand.findOne({
        _id: brand,
        estado: "activo",
        eliminado: false,
      });

      if (!brandExists) {
        return res.status(400).json({
          msg: "La marca especificada no existe o no está activa",
        });
      }
      vehicleModel.brand = brand;
    }

    // Actualizar campos
    if (nombre) vehicleModel.nombre = nombre;
    if (descripcion !== undefined) vehicleModel.descripcion = descripcion;
    if (tipo) vehicleModel.tipo = tipo;
    if (motor) vehicleModel.motor = motor;
    if (yearInicio !== undefined) vehicleModel.yearInicio = yearInicio;
    if (yearFin !== undefined) vehicleModel.yearFin = yearFin;
    if (estado) vehicleModel.estado = estado;

    // Guardar cambios
    await vehicleModel.save();

    // Poblar referencias para la respuesta
    await vehicleModel.populate(populateOptions);

    res.json({
      msg: "Modelo de vehículo actualizado exitosamente",
      vehicleModel,
    });
  } catch (err) {
    next(err);
  }
};

// Controlador para eliminar lógicamente un modelo
const vehicleModelDelete = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const vehicleModel = await VehicleModel.findOne({
      _id: id,
      eliminado: false,
    });

    if (!vehicleModel) {
      return res.status(404).json({
        msg: "Modelo de vehículo no encontrado",
      });
    }

    // Verificar si hay vehículos asociados a este modelo
    const { Vehicle } = require("../models");
    const vehiculosAsociados = await Vehicle.countDocuments({
      model: id,
      eliminado: false,
    });

    if (vehiculosAsociados > 0) {
      return res.status(400).json({
        msg: `No se puede eliminar el modelo porque tiene ${vehiculosAsociados} vehículo(s) asociado(s)`,
      });
    }

    // Marcar como eliminado (eliminación lógica)
    vehicleModel.eliminado = true;
    await vehicleModel.save();

    res.json({
      msg: "Modelo de vehículo eliminado exitosamente",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  vehicleModelsGet,
  vehicleModelGetById,
  vehicleModelPost,
  vehicleModelPut,
  vehicleModelDelete,
};
