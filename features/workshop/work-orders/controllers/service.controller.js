const { response, request } = require("express");
const { Service, ServiceCategory, ServiceSubcategory } = require("../models");
const { validationResult } = require("express-validator");

// Obtener todos los servicios con filtros y paginación
const getServices = async (req = request, res = response) => {
  try {
    const {
      page = 1,
      limit = 10,
      categoria,
      subcategoria,
      requiereEspecialista,
      dificultad,
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    // Construir filtros
    const filters = { eliminado: false };

    if (categoria) filters.categoria = categoria;
    if (subcategoria) filters.subcategoria = subcategoria;
    if (requiereEspecialista !== undefined)
      filters.requiereEspecialista = requiereEspecialista === "true";
    if (dificultad) filters.dificultad = dificultad;

    // Búsqueda por texto
    if (search) {
      filters.$or = [
        { nombre: new RegExp(search, "i") },
        { descripcion: new RegExp(search, "i") },
        { codigo: new RegExp(search, "i") },
      ];
    }

    // Configurar ordenamiento
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Configurar paginación con populate
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: sortOptions,
      populate: [
        { path: "categoria", select: "nombre codigo color icono" },
        { path: "subcategoria", select: "nombre codigo" },
      ],
    };

    const services = await Service.paginate(filters, options);

    res.json({
      success: true,
      data: services.docs,
      pagination: {
        total: services.totalDocs,
        page: services.page,
        pages: services.totalPages,
        limit: services.limit,
        hasNext: services.hasNextPage,
        hasPrev: services.hasPrevPage,
      },
    });
  } catch (error) {
    console.error("Error al obtener servicios:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Obtener un servicio por ID
const getServiceById = async (req = request, res = response) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id)
      .populate("categoria", "nombre codigo descripcion color icono")
      .populate("subcategoria", "nombre codigo");

    if (!service || service.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Servicio no encontrado",
      });
    }

    res.json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error("Error al obtener servicio:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Obtener servicios por categoría
const getServicesByCategory = async (req = request, res = response) => {
  try {
    const { categoryId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verificar que la categoría existe
    const category = await ServiceCategory.findById(categoryId);
    if (!category || category.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada",
      });
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { nombre: 1 },
      populate: [
        { path: "categoria", select: "nombre codigo" },
        { path: "subcategoria", select: "nombre codigo" },
      ],
    };

    const services = await Service.paginate(
      { categoria: categoryId, eliminado: false },
      options
    );

    res.json({
      success: true,
      data: services.docs,
      pagination: {
        total: services.totalDocs,
        page: services.page,
        pages: services.totalPages,
        limit: services.limit,
      },
    });
  } catch (error) {
    console.error("Error al obtener servicios por categoría:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Buscar servicios por nombre o código
const searchServices = async (req = request, res = response) => {
  try {
    const { q: searchTerm, limit = 20 } = req.query;

    if (!searchTerm || searchTerm.length < 2) {
      return res.status(400).json({
        success: false,
        message:
          "Debe proporcionar un término de búsqueda de al menos 2 caracteres",
      });
    }

    const services = await Service.find({
      eliminado: false,
      $or: [
        { nombre: new RegExp(searchTerm, "i") },
        { codigo: new RegExp(searchTerm, "i") },
        { descripcion: new RegExp(searchTerm, "i") },
      ],
    })
      .populate("categoria", "nombre codigo color")
      .populate("subcategoria", "nombre codigo")
      .sort({ nombre: 1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error("Error al buscar servicios:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Crear un nuevo servicio
const createService = async (req = request, res = response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Datos de entrada inválidos",
        errors: errors.array(),
      });
    }

    const {
      nombre,
      descripcion,
      codigo,
      categoria,
      subcategoria,
      precioBase,
      tiempoEstimadoMinutos,
      unidadTiempo,
      costoHoraAdicional,
      requiereEspecialista,
      dificultad,
      herramientasRequeridas,
      garantiaMeses,
      instrucciones,
    } = req.body;

    // Verificar código único
    const existingService = await Service.findOne({
      codigo: codigo.toUpperCase(),
      eliminado: false,
    });

    if (existingService) {
      return res.status(400).json({
        success: false,
        message: "Ya existe un servicio con ese código",
      });
    }

    // Validar que la categoría y subcategoría existan y sean válidas
    const categoryDoc = await ServiceCategory.findById(categoria);
    if (!categoryDoc || categoryDoc.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada",
      });
    }

    const subcategoryDoc = await ServiceSubcategory.findById(subcategoria);
    if (!subcategoryDoc || subcategoryDoc.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Subcategoría no encontrada",
      });
    }

    // Validar que la subcategoría pertenece a la categoría
    if (subcategoryDoc.categoria.toString() !== categoria) {
      return res.status(400).json({
        success: false,
        message: "La subcategoría no pertenece a la categoría seleccionada",
      });
    }

    const service = new Service({
      nombre,
      descripcion,
      codigo: codigo.toUpperCase(),
      categoria,
      subcategoria,
      precioBase,
      tiempoEstimadoMinutos,
      unidadTiempo,
      costoHoraAdicional,
      requiereEspecialista,
      dificultad,
      herramientasRequeridas,
      garantiaMeses,
      instrucciones,
      createdBy: req.usuario._id,
    });

    await service.save();

    // Poblar datos para respuesta
    await service.populate([
      { path: "categoria", select: "nombre codigo color" },
      { path: "subcategoria", select: "nombre codigo" },
    ]);

    res.status(201).json({
      success: true,
      message: "Servicio creado exitosamente",
      data: service,
    });
  } catch (error) {
    console.error("Error al crear servicio:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Actualizar un servicio
const updateService = async (req = request, res = response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Datos de entrada inválidos",
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    const service = await Service.findById(id);
    if (!service || service.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Servicio no encontrado",
      });
    }

    // Verificar código único si se está cambiando
    if (
      updateData.codigo &&
      updateData.codigo.toUpperCase() !== service.codigo
    ) {
      const existingService = await Service.findOne({
        codigo: updateData.codigo.toUpperCase(),
        eliminado: false,
        _id: { $ne: id },
      });

      if (existingService) {
        return res.status(400).json({
          success: false,
          message: "Ya existe un servicio con ese código",
        });
      }
    }

    // Validar categoría y subcategoría si se están actualizando
    if (updateData.categoria || updateData.subcategoria) {
      const categoriaId = updateData.categoria || service.categoria;
      const subcategoriaId = updateData.subcategoria || service.subcategoria;

      const categoryDoc = await ServiceCategory.findById(categoriaId);
      if (!categoryDoc || categoryDoc.eliminado) {
        return res.status(404).json({
          success: false,
          message: "Categoría no encontrada",
        });
      }

      const subcategoryDoc = await ServiceSubcategory.findById(subcategoriaId);
      if (!subcategoryDoc || subcategoryDoc.eliminado) {
        return res.status(404).json({
          success: false,
          message: "Subcategoría no encontrada",
        });
      }

      if (subcategoryDoc.categoria.toString() !== categoriaId.toString()) {
        return res.status(400).json({
          success: false,
          message: "La subcategoría no pertenece a la categoría seleccionada",
        });
      }
    }

    // Actualizar campos permitidos
    const allowedFields = [
      "nombre",
      "descripcion",
      "codigo",
      "categoria",
      "subcategoria",
      "precioBase",
      "tiempoEstimadoMinutos",
      "unidadTiempo",
      "costoHoraAdicional",
      "requiereEspecialista",
      "dificultad",
      "herramientasRequeridas",
      "garantiaMeses",
      "instrucciones",
      "activo",
    ];

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        if (field === "codigo") {
          service[field] = updateData[field].toUpperCase();
        } else {
          service[field] = updateData[field];
        }
      }
    });

    service.updatedBy = req.usuario._id;
    service.updatedAt = new Date();

    await service.save();

    // Poblar datos actualizados
    await service.populate([
      { path: "categoria", select: "nombre codigo color" },
      { path: "subcategoria", select: "nombre codigo" },
    ]);

    res.json({
      success: true,
      message: "Servicio actualizado exitosamente",
      data: service,
    });
  } catch (error) {
    console.error("Error al actualizar servicio:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Activar/desactivar un servicio
const toggleService = async (req = request, res = response) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);
    if (!service || service.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Servicio no encontrado",
      });
    }

    service.activo = !service.activo;
    service.updatedBy = req.usuario._id;
    service.updatedAt = new Date();

    await service.save();

    res.json({
      success: true,
      message: `Servicio ${service.activo ? "activado" : "desactivado"} exitosamente`,
      data: service,
    });
  } catch (error) {
    console.error("Error al cambiar estado del servicio:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Eliminar un servicio (soft delete)
const deleteService = async (req = request, res = response) => {
  try {
    const { id } = req.params;

    const service = await Service.findById(id);
    if (!service || service.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Servicio no encontrado",
      });
    }

    // Verificar si el servicio está siendo usado en órdenes activas
    const activeWorkOrders =
      await require("../models").WorkOrder.countDocuments({
        "items.service": id,
        "items.status": { $nin: ["completado", "cancelado"] },
        eliminado: false,
      });

    if (activeWorkOrders > 0) {
      return res.status(400).json({
        success: false,
        message:
          "No se puede eliminar un servicio que está siendo usado en órdenes activas",
      });
    }

    service.eliminado = true;

    await service.save();

    res.json({
      success: true,
      message: "Servicio eliminado exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar servicio:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getServices,
  getServiceById,
  getServicesByCategory,
  searchServices,
  createService,
  updateService,
  toggleService,
  deleteService,
};
