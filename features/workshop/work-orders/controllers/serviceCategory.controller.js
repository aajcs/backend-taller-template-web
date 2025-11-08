const { response, request } = require("express");
const { ServiceCategory, ServiceSubcategory, Service } = require("../models");
const { validationResult } = require("express-validator");

// Obtener todas las categorías de servicios
const getServiceCategories = async (req = request, res = response) => {
  try {
    const {
      activo,
      sortBy = "orden",
      sortOrder = "asc",
      includeSubcategories = "true",
    } = req.query;

    const filters = { eliminado: false };
    // Solo filtrar por activo si se especifica explícitamente en el query
    if (activo !== undefined) {
      filters.activo = activo === "true";
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "desc" ? -1 : 1;

    const categories = await ServiceCategory.find(filters).sort(sortOptions);

    // Si se solicita incluir subcategorías
    if (includeSubcategories === "true") {
      const categoriesWithSubcategories = await Promise.all(
        categories.map(async (category) => {
          // Obtener subcategorías de esta categoría
          const subcategories = await ServiceSubcategory.find({
            categoria: category._id,
            eliminado: false,
          }).sort({ nombre: 1 });

          // Contar servicios en esta categoría
          const servicesCount = await Service.countDocuments({
            categoria: category._id,
            eliminado: false,
          });

          return {
            ...category.toObject(),
            subcategories,
            servicesCount,
          };
        })
      );

      return res.json({
        success: true,
        data: categoriesWithSubcategories,
      });
    }

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error al obtener categorías:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Obtener una categoría por ID con sus subcategorías
const getServiceCategoryById = async (req = request, res = response) => {
  try {
    const { id } = req.params;

    const category = await ServiceCategory.findById(id);
    if (!category || category.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada",
      });
    }

    // Obtener subcategorías de esta categoría
    const subcategories = await ServiceSubcategory.find({
      categoria: id,
      eliminado: false,
      activo: true,
    }).sort({ nombre: 1 });

    // Contar servicios en esta categoría
    const servicesCount = await Service.countDocuments({
      categoria: id,
      eliminado: false,
      activo: true,
    });

    const categoryWithDetails = {
      ...category.toObject(),
      subcategories,
      servicesCount,
    };

    res.json({
      success: true,
      data: categoryWithDetails,
    });
  } catch (error) {
    console.error("Error al obtener categoría:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Crear una nueva categoría
const createServiceCategory = async (req = request, res = response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: "Datos de entrada inválidos",
        errors: errors.array(),
      });
    }

    const { nombre, descripcion, codigo, color, icono, orden } = req.body;

    // Verificar código único
    const existingCategory = await ServiceCategory.findOne({
      codigo: codigo.toUpperCase(),
      eliminado: false,
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Ya existe una categoría con ese código",
      });
    }

    const category = new ServiceCategory({
      nombre,
      descripcion,
      codigo: codigo.toUpperCase(),
      color,
      icono,
      orden,
      createdBy: req.usuario._id,
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: "Categoría creada exitosamente",
      data: category,
    });
  } catch (error) {
    console.error("Error al crear categoría:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Actualizar una categoría
const updateServiceCategory = async (req = request, res = response) => {
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

    const category = await ServiceCategory.findById(id);
    if (!category || category.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada",
      });
    }

    // Verificar código único si se está cambiando
    if (
      updateData.codigo &&
      updateData.codigo.toUpperCase() !== category.codigo
    ) {
      const existingCategory = await ServiceCategory.findOne({
        codigo: updateData.codigo.toUpperCase(),
        eliminado: false,
        _id: { $ne: id },
      });

      if (existingCategory) {
        return res.status(400).json({
          success: false,
          message: "Ya existe una categoría con ese código",
        });
      }
    }

    // Actualizar campos permitidos
    const allowedFields = [
      "nombre",
      "descripcion",
      "codigo",
      "color",
      "icono",
      "orden",
      "activo",
    ];

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        if (field === "codigo") {
          category[field] = updateData[field].toUpperCase();
        } else {
          category[field] = updateData[field];
        }
      }
    });

    category.updatedBy = req.usuario._id;
    category.updatedAt = new Date();

    await category.save();

    res.json({
      success: true,
      message: "Categoría actualizada exitosamente",
      data: category,
    });
  } catch (error) {
    console.error("Error al actualizar categoría:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Activar/desactivar una categoría
const toggleServiceCategory = async (req = request, res = response) => {
  try {
    const { id } = req.params;

    const category = await ServiceCategory.findById(id);
    if (!category || category.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada",
      });
    }

    category.activo = !category.activo;
    category.updatedBy = req.usuario._id;
    category.updatedAt = new Date();

    await category.save();

    res.json({
      success: true,
      message: `Categoría ${category.activo ? "activada" : "desactivada"} exitosamente`,
      data: category,
    });
  } catch (error) {
    console.error("Error al cambiar estado de la categoría:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Eliminar una categoría (soft delete)
const deleteServiceCategory = async (req = request, res = response) => {
  try {
    const { id } = req.params;

    const category = await ServiceCategory.findById(id);
    if (!category || category.eliminado) {
      return res.status(404).json({
        success: false,
        message: "Categoría no encontrada",
      });
    }

    // Verificar si hay subcategorías activas
    const activeSubcategories = await ServiceSubcategory.countDocuments({
      categoria: id,
      eliminado: false,
    });

    if (activeSubcategories > 0) {
      return res.status(400).json({
        success: false,
        message:
          "No se puede eliminar una categoría que tiene subcategorías activas",
      });
    }

    // Verificar si hay servicios activos en esta categoría
    const activeServices = await Service.countDocuments({
      categoria: id,
      eliminado: false,
    });

    if (activeServices > 0) {
      return res.status(400).json({
        success: false,
        message:
          "No se puede eliminar una categoría que tiene servicios activos",
      });
    }

    category.eliminado = true;

    await category.save();

    res.json({
      success: true,
      message: "Categoría eliminada exitosamente",
    });
  } catch (error) {
    console.error("Error al eliminar categoría:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// Reordenar categorías
const reorderServiceCategories = async (req = request, res = response) => {
  try {
    const { categories } = req.body; // Array de { id, orden }

    if (!Array.isArray(categories)) {
      return res.status(400).json({
        success: false,
        message:
          "Debe proporcionar un array de categorías con sus nuevos órdenes",
      });
    }

    // Actualizar el orden de cada categoría
    const updatePromises = categories.map(({ id, orden }) =>
      ServiceCategory.findByIdAndUpdate(id, {
        orden,
        updatedBy: req.usuario._id,
        updatedAt: new Date(),
      })
    );

    await Promise.all(updatePromises);

    // Obtener categorías actualizadas
    const updatedCategories = await ServiceCategory.find({
      eliminado: false,
      activo: true,
    }).sort({ orden: 1 });

    res.json({
      success: true,
      message: "Categorías reordenadas exitosamente",
      data: updatedCategories,
    });
  } catch (error) {
    console.error("Error al reordenar categorías:", error);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  getServiceCategories,
  getServiceCategoryById,
  createServiceCategory,
  updateServiceCategory,
  toggleServiceCategory,
  deleteServiceCategory,
  reorderServiceCategories,
};
