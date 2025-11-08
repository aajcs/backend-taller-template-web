const { response, request } = require("express");
const { ServiceSubcategory, ServiceCategory, Service } = require("../models");
const { validationResult } = require("express-validator");

// Obtener subcategorías (todas o por categoría)
const getServiceSubcategories = async (req = request, res = response) => {
  try {
    const { categoryId } = req.params;
    const { category, activo, sortBy = "orden", sortOrder = "asc" } = req.query;

    // Si viene categoryId en params o category en query, verificar que existe
    const filterCategoryId = categoryId || category;

    if (filterCategoryId) {
      const categoryExists = await ServiceCategory.findById(filterCategoryId);
      if (!categoryExists || categoryExists.eliminado) {
        return res.status(404).json({
          success: false,
          message: "Categoría no encontrada",
        });
      }
    }

    const filters = {
      $or: [{ eliminado: false }, { eliminado: { $exists: false } }],
    };

    // Filtrar por categoría si se proporciona
    if (filterCategoryId) {
      filters.categoria = filterCategoryId;
    }

    // Filtrar por activo si se proporciona
    if (activo !== undefined && activo !== "all") {
      filters.activo = activo === "true" || activo === true;
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const subcategories = await ServiceSubcategory.find(filters)
      .populate("categoria", "nombre codigo color")
      .sort(sortOptions);

    res.json({
      success: true,
      data: subcategories,
    });
  } catch (error) {
    console.error("Error al obtener subcategorías:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Obtener una subcategoría por ID
const getServiceSubcategoryById = async (req = request, res = response) => {
  try {
    const { id } = req.params;

    const subcategory = await ServiceSubcategory.findById(id).populate(
      "categoria",
      "nombre codigo descripcion color icono"
    );

    if (!subcategory || subcategory.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Subcategoría no encontrada",
      });
    }

    // Contar servicios en esta subcategoría
    const servicesCount = await Service.countDocuments({
      subcategoria: id,
      eliminado: false,
      activo: true,
    });

    const subcategoryWithDetails = {
      ...subcategory.toObject(),
      servicesCount,
    };

    res.json({
      success: true,
      data: subcategoryWithDetails,
    });
  } catch (error) {
    console.error("Error al obtener subcategoría:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Crear una nueva subcategoría
const createServiceSubcategory = async (req = request, res = response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Datos de entrada inválidos",
        errors: errors.array(),
      });
    }

    const { nombre, descripcion, codigo, categoria, orden } = req.body;

    // Verificar que la categoría existe
    const categoryDoc = await ServiceCategory.findById(categoria);
    if (!categoryDoc || categoryDoc.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada",
      });
    }

    // Verificar código único dentro de la categoría
    const existingSubcategory = await ServiceSubcategory.findOne({
      codigo: codigo.toUpperCase(),
      categoria,
      eliminado: false,
    });

    if (existingSubcategory) {
      return res.status(400).json({
        success: false,
        message: "Ya existe una subcategoría con ese código en esta categoría",
      });
    }

    const subcategory = new ServiceSubcategory({
      nombre,
      descripcion,
      codigo: codigo.toUpperCase(),
      categoria,
      orden,
      createdBy: req.usuario._id,
    });

    await subcategory.save();

    // Poblar datos para respuesta
    await subcategory.populate("categoria", "nombre codigo color");

    res.status(201).json({
      success: true,
      message: "Subcategoría creada exitosamente",
      data: subcategory,
    });
  } catch (error) {
    console.error("Error al crear subcategoría:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Actualizar una subcategoría
const updateServiceSubcategory = async (req = request, res = response) => {
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

    const subcategory = await ServiceSubcategory.findById(id);
    if (!subcategory || subcategory.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Subcategoría no encontrada",
      });
    }

    // Verificar categoría si se está cambiando
    if (
      updateData.categoria &&
      updateData.categoria !== subcategory.categoria.toString()
    ) {
      const categoryDoc = await ServiceCategory.findById(updateData.categoria);
      if (!categoryDoc || categoryDoc.eliminado) {
        return res.status(404).json({
          success: false,
          message: "Categoría no encontrada",
        });
      }
    }

    // Verificar código único si se está cambiando
    if (
      updateData.codigo &&
      updateData.codigo.toUpperCase() !== subcategory.codigo
    ) {
      const categoriaId = updateData.categoria || subcategory.categoria;

      const existingSubcategory = await ServiceSubcategory.findOne({
        codigo: updateData.codigo.toUpperCase(),
        categoria: categoriaId,
        eliminado: false,
        _id: { $ne: id },
      });

      if (existingSubcategory) {
        return res.status(400).json({
          success: false,
          message:
            "Ya existe una subcategoría con ese código en esta categoría",
        });
      }
    }

    // Actualizar campos permitidos
    const allowedFields = [
      "nombre",
      "descripcion",
      "codigo",
      "categoria",
      "orden",
      "activo",
    ];

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        if (field === "codigo") {
          subcategory[field] = updateData[field].toUpperCase();
        } else {
          subcategory[field] = updateData[field];
        }
      }
    });

    subcategory.updatedBy = req.usuario._id;
    subcategory.updatedAt = new Date();

    await subcategory.save();

    // Poblar datos actualizados
    await subcategory.populate("categoria", "nombre codigo color");

    res.json({
      success: true,
      message: "Subcategoría actualizada exitosamente",
      data: subcategory,
    });
  } catch (error) {
    console.error("Error al actualizar subcategoría:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Activar/desactivar una subcategoría
const toggleServiceSubcategory = async (req = request, res = response) => {
  try {
    const { id } = req.params;

    const subcategory = await ServiceSubcategory.findById(id);
    if (!subcategory || subcategory.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Subcategoría no encontrada",
      });
    }

    subcategory.activo = !subcategory.activo;
    subcategory.updatedBy = req.usuario._id;
    subcategory.updatedAt = new Date();

    await subcategory.save();

    res.json({
      success: true,
      message: `Subcategoría ${subcategory.activo ? "activada" : "desactivada"} exitosamente`,
      data: subcategory,
    });
  } catch (error) {
    console.error("Error al cambiar estado de la subcategoría:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Eliminar una subcategoría (soft delete)
const deleteServiceSubcategory = async (req = request, res = response) => {
  try {
    const { id } = req.params;

    const subcategory = await ServiceSubcategory.findById(id);
    if (!subcategory || subcategory.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Subcategoría no encontrada",
      });
    }

    // Verificar si hay servicios activos en esta subcategoría
    const activeServices = await Service.countDocuments({
      subcategoria: id,
      eliminado: false,
    });

    if (activeServices > 0) {
      return res.status(400).json({
        success: false,
        message:
          "No se puede eliminar una subcategoría que tiene servicios activos",
      });
    }

    subcategory.eliminado = true;

    await subcategory.save();

    res.json({
      success: true,
      message: "Subcategoría eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar subcategoría:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Reordenar subcategorías dentro de una categoría
const reorderServiceSubcategories = async (req = request, res = response) => {
  try {
    const { categoryId } = req.params;
    const { subcategories } = req.body; // Array de { id, orden }

    if (!Array.isArray(subcategories)) {
      return res.status(400).json({
        success: false,
        message:
          "Debe proporcionar un array de subcategorías con sus nuevos órdenes",
      });
    }

    // Verificar que la categoría existe
    const category = await ServiceCategory.findById(categoryId);
    if (!category || category.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada",
      });
    }

    // Actualizar el orden de cada subcategoría
    const updatePromises = subcategories.map(({ id, orden }) =>
      ServiceSubcategory.findOneAndUpdate(
        { _id: id, categoria: categoryId },
        {
          orden,
          updatedBy: req.usuario._id,
          updatedAt: new Date(),
        }
      )
    );

    await Promise.all(updatePromises);

    // Obtener subcategorías actualizadas
    const updatedSubcategories = await ServiceSubcategory.find({
      categoria: categoryId,
      eliminado: false,
      activo: true,
    })
      .populate("categoria", "nombre codigo")
      .sort({ orden: 1 });

    res.json({
      success: true,
      message: "Subcategorías reordenadas exitosamente",
      data: updatedSubcategories,
    });
  } catch (error) {
    console.error("Error al reordenar subcategorías:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getServiceSubcategories,
  getServiceSubcategoryById,
  createServiceSubcategory,
  updateServiceSubcategory,
  toggleServiceSubcategory,
  deleteServiceSubcategory,
  reorderServiceSubcategories,
};
