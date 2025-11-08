const { Router } = require("express");
const { check } = require("express-validator");

const { validarJWT, validarCampos } = require("../../../../middlewares");

const {
  getServiceCategories,
  getServiceCategoryById,
  createServiceCategory,
  updateServiceCategory,
  deleteServiceCategory,
  reorderServiceCategories,
} = require("../controllers/serviceCategory.controller");

// Helpers de validación
const {
  existeServiceCategoryPorId,
  existeServiceCategoryPorNombre,
} = require("../helpers/db-validators");

const router = Router();

/**
 * {{url}}/api/service-categories
 */

// Obtener todas las categorías de servicio - privado
router.get("/", [validarJWT, validarCampos], getServiceCategories);

// Obtener una categoría específica por ID - privado
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    check("id").custom(existeServiceCategoryPorId),
    validarCampos,
  ],
  getServiceCategoryById
);

// Crear una nueva categoría de servicio - privado
router.post(
  "/",
  [
    validarJWT,
    check("name", "El nombre es obligatorio").not().isEmpty(),
    check("name", "El nombre debe tener máximo 50 caracteres").isLength({
      max: 50,
    }),
    check("name").custom(existeServiceCategoryPorNombre),
    check("description", "La descripción debe tener máximo 200 caracteres")
      .optional()
      .isLength({ max: 200 }),
    check("color", "El color debe ser un código hexadecimal válido")
      .optional()
      .matches(/^#[0-9A-F]{6}$/i),
    check("icon", "El icono debe tener máximo 50 caracteres")
      .optional()
      .isLength({ max: 50 }),
    check("isActive", "El estado activo debe ser un booleano")
      .optional()
      .isBoolean(),
    check("order", "El orden debe ser un número entero positivo")
      .optional()
      .isInt({ min: 1 }),
    validarCampos,
  ],
  createServiceCategory
);

// Actualizar una categoría de servicio - privado
router.put(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    check("id").custom(existeServiceCategoryPorId),
    check("name", "El nombre debe tener máximo 50 caracteres")
      .optional()
      .isLength({ max: 50 }),
    check("name").optional().custom(existeServiceCategoryPorNombre),
    check("description", "La descripción debe tener máximo 200 caracteres")
      .optional()
      .isLength({ max: 200 }),
    check("color", "El color debe ser un código hexadecimal válido")
      .optional()
      .matches(/^#[0-9A-F]{6}$/i),
    check("icon", "El icono debe tener máximo 50 caracteres")
      .optional()
      .isLength({ max: 50 }),
    check("isActive", "El estado activo debe ser un booleano")
      .optional()
      .isBoolean(),
    check("order", "El orden debe ser un número entero positivo")
      .optional()
      .isInt({ min: 1 }),
    validarCampos,
  ],
  updateServiceCategory
);

// Reordenar categorías de servicio - privado
router.patch(
  "/reorder",
  [
    validarJWT,
    check("categories", "Las categorías son obligatorias").not().isEmpty(),
    check("categories", "Las categorías deben ser un array").isArray(),
    check(
      "categories.*.id",
      "Cada categoría debe tener un ID válido"
    ).isMongoId(),
    check("categories.*.id").custom(existeServiceCategoryPorId),
    check(
      "categories.*.order",
      "Cada categoría debe tener un orden válido"
    ).isInt({ min: 1 }),
    validarCampos,
  ],
  reorderServiceCategories
);

// Eliminar una categoría de servicio - privado
router.delete(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    check("id").custom(existeServiceCategoryPorId),
    validarCampos,
  ],
  deleteServiceCategory
);

module.exports = router;
