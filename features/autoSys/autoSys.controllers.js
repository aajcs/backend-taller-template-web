// Importaciones necesarias
const { response, request } = require("express");
const AutoSys = require("./autoSys.models");

// Opciones de población para referencias en las consultas
const populateOptions = [
  { path: "createdBy", select: "nombre correo" },
  {
    path: "historial",
    populate: { path: "modificadoPor", select: "nombre correo" },
  },
];

// Controlador para obtener todos los talleres no eliminados
const autoSysGet = async (req = request, res = response, next) => {
  const query = { eliminado: false };

  try {
    // Ejecuta ambas consultas en paralelo
    const [total, autoSys] = await Promise.all([
      AutoSys.countDocuments(query),
      AutoSys.find(query).sort({ nombre: 1 }).populate(populateOptions),
    ]);

    // Ordenar historial por fecha descendente
    autoSys.forEach((autoSysItem) => {
      if (Array.isArray(autoSysItem.historial)) {
        autoSysItem.historial.sort(
          (a, b) => new Date(b.fecha) - new Date(a.fecha)
        );
      }
    });

    res.json({
      total,
      autoSys,
    });
  } catch (err) {
    next(err);
  }
};

// Controlador para obtener un taller específico por ID
const autoSysGetById = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    const autoSysItem = await AutoSys.findOne({
      _id: id,
      eliminado: false,
    }).populate(populateOptions);

    if (!autoSysItem) {
      return res.status(404).json({ msg: "Taller no encontrado" });
    }

    // Ordenar historial por fecha descendente
    if (Array.isArray(autoSysItem.historial)) {
      autoSysItem.historial.sort(
        (a, b) => new Date(b.fecha) - new Date(a.fecha)
      );
    }

    res.json(autoSysItem);
  } catch (err) {
    next(err);
  }
};

// Controlador para crear un nuevo taller
const autoSysPost = async (req = request, res = response, next) => {
  const { ubicacion, procesamientoDia, nombre, legal, telefono, rif, img } =
    req.body;

  try {
    // Crear nueva instancia del taller
    const newAutoSys = new AutoSys({
      ubicacion,
      procesamientoDia,
      nombre,
      legal,
      telefono,
      rif,
      img,
      createdBy: req.usuario?._id, // Usuario que crea el registro
    });

    // Guardar en la base de datos
    await newAutoSys.save();

    res.status(201).json(newAutoSys);
  } catch (err) {
    next(err);
  }
};

// Controlador para actualizar un taller existente
const autoSysPut = async (req = request, res = response, next) => {
  const { id } = req.params;
  const {
    ubicacion,
    procesamientoDia,
    nombre,
    legal,
    telefono,
    rif,
    img,
    estado,
  } = req.body;

  try {
    // Buscar el taller existente
    const autoSysItem = await AutoSys.findOne({ _id: id, eliminado: false });

    if (!autoSysItem) {
      return res.status(404).json({ msg: "Taller no encontrado" });
    }

    // Actualizar campos
    const updatedData = {
      ubicacion,
      procesamientoDia,
      nombre,
      legal,
      telefono,
      rif,
      img,
      estado,
    };

    // Filtrar campos undefined
    Object.keys(updatedData).forEach(
      (key) => updatedData[key] === undefined && delete updatedData[key]
    );

    // Actualizar el taller
    const autoSysActualizado = await AutoSys.findByIdAndUpdate(
      id,
      updatedData,
      {
        new: true, // Devuelve el documento actualizado
        runValidators: true, // Ejecuta validaciones del schema
      }
    ).populate(populateOptions);

    res.json(autoSysActualizado);
  } catch (err) {
    next(err);
  }
};

// Controlador para eliminar lógicamente un taller
const autoSysDelete = async (req = request, res = response, next) => {
  const { id } = req.params;

  try {
    // Buscar el taller
    const autoSysItem = await AutoSys.findById(id);

    if (!autoSysItem) {
      return res.status(404).json({ msg: "Taller no encontrado" });
    }

    if (autoSysItem.eliminado) {
      return res.status(400).json({ msg: "El taller ya fue eliminado" });
    }

    // Marcar como eliminado
    autoSysItem.eliminado = true;
    await autoSysItem.save();

    res.json({ msg: "Taller eliminado correctamente", autoSys: autoSysItem });
  } catch (err) {
    next(err);
  }
};

// Controlador para PATCH (método no implementado)
const autoSysPatch = (req = request, res = response) => {
  res.status(501).json({
    msg: "Método PATCH no implementado",
  });
};

// Exportar todos los controladores
module.exports = {
  autoSysGet,
  autoSysGetById,
  autoSysPost,
  autoSysPut,
  autoSysDelete,
  autoSysPatch,
};
