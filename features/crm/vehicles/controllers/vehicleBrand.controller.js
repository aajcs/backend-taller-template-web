// Importaciones necesarias
const { response, request } = require("express");
const { VehicleBrand } = require("../models");

// Opciones de población para referencias en las consultas
const populateOptions = [
  { path: "createdBy", select: "nombre correo" },
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  },
];

// Controlador para obtener todas las marcas no eliminadas
const vehicleBrandsGet = async (req = request, res = response, next) => {
  const query = { eliminado: false };

  try {
    // Ejecuta ambas consultas en paralelo
    const [total, vehicleBrands] = await Promise.all([
      VehicleBrand.countDocuments(query),
      VehicleBrand.find(query).sort({ nombre: 1 }).populate(populateOptions),
    ]);

    // Ordenar historial por fecha descendente
    vehicleBrands.forEach((brand) => {
      if (Array.isArray(brand.historial)) {
        brand.historial.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
      }
    });

    res.json({
      total,
      vehicleBrands,
    });
  } catch (err) {
    next(err);
  }
};

// Controlador para obtener una marca específica por ID
const vehicleBrandGetById = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const vehicleBrand = await VehicleBrand.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions);

    if (!vehicleBrand) {
      return res.status(404).json({
        msg: "Marca de vehículo no encontrada",
      });
    }

    // Ordenar historial por fecha descendente
    if (Array.isArray(vehicleBrand.historial)) {
      vehicleBrand.historial.sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha)
      );
    }

    res.json(vehicleBrand);
  } catch (err) {
    next(err);
  }
};

// Controlador para crear una nueva marca
const vehicleBrandPost = async (req = request, res = response, next) => {
  const { nombre, descripcion, paisOrigen, logo } = req.body;

  try {
    // Crear nueva marca
    const vehicleBrand = new VehicleBrand({
      nombre: nombre.toUpperCase(), // Convertir a mayúsculas
      descripcion,
      paisOrigen,
      logo,
      createdBy: req.usuario.id, // Usuario que crea el registro
    });

    // Guardar en base de datos
    await vehicleBrand.save();

    // Poblar referencias para la respuesta
    await vehicleBrand.populate(populateOptions);

    res.status(201).json({
      msg: "Marca de vehículo creada exitosamente",
      vehicleBrand,
    });
  } catch (err) {
    next(err);
  }
};

// Controlador para actualizar una marca existente
const vehicleBrandPut = async (req = request, res = response, next) => {
  const { id } = req.params;
  const { nombre, descripcion, paisOrigen, logo, estado } = req.body;

  try {
    const vehicleBrand = await VehicleBrand.findOne({
      _id: id,
      eliminado: false,
    });

    if (!vehicleBrand) {
      return res.status(404).json({
        msg: "Marca de vehículo no encontrada",
      });
    }

    // Actualizar campos
    if (nombre) vehicleBrand.nombre = nombre.toUpperCase();
    if (descripcion !== undefined) vehicleBrand.descripcion = descripcion;
    if (paisOrigen !== undefined) vehicleBrand.paisOrigen = paisOrigen;
    if (logo !== undefined) vehicleBrand.logo = logo;
    if (estado) vehicleBrand.estado = estado;

    // Guardar cambios
    await vehicleBrand.save();

    // Poblar referencias para la respuesta
    await vehicleBrand.populate(populateOptions);

    res.json({
      msg: "Marca de vehículo actualizada exitosamente",
      vehicleBrand,
    });
  } catch (err) {
    next(err);
  }
};

// Controlador para eliminar lógicamente una marca
const vehicleBrandDelete = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const vehicleBrand = await VehicleBrand.findOne({
      _id: id,
      eliminado: false,
    });

    if (!vehicleBrand) {
      return res.status(404).json({
        msg: "Marca de vehículo no encontrada",
      });
    }

    // Verificar si hay modelos asociados a esta marca
    const { VehicleModel } = require("../models");
    const modelosAsociados = await VehicleModel.countDocuments({
      brand: id,
      eliminado: false,
    });

    if (modelosAsociados > 0) {
      return res.status(400).json({
        msg: `No se puede eliminar la marca porque tiene ${modelosAsociados} modelo(s) asociado(s)`,
      });
    }

    // Marcar como eliminado (eliminación lógica)
    vehicleBrand.eliminado = true;
    await vehicleBrand.save();

    res.json({
      msg: "Marca de vehículo eliminada exitosamente",
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  vehicleBrandsGet,
  vehicleBrandGetById,
  vehicleBrandPost,
  vehicleBrandPut,
  vehicleBrandDelete,
};
