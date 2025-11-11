const { Router } = require("express");
const { check } = require("express-validator");

const { validarJWT, validarCampos } = require("../../../../middlewares");

const {
  getServiceSubcategories,
  getServiceSubcategoryById,
  createServiceSubcategory,
  updateServiceSubcategory,
  deleteServiceSubcategory,
  reorderServiceSubcategories,
} = require("../controllers/serviceSubcategory.controller");

// Helpers de validación
const {
  existeServiceSubcategoryPorId,
  existeServiceSubcategoryPorNombre,
  existeServiceCategoryPorId,
} = require("../helpers/db-validators");

const router = Router();

/**
 * {{url}}/api/service-subcategories
 */

// Obtener todas las subcategorías de servicio - privado
router.get("/", [validarJWT, validarCampos], getServiceSubcategories);

// Obtener una subcategoría específica por ID - privado
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    check("id").custom(existeServiceSubcategoryPorId),
    validarCampos,
  ],
  getServiceSubcategoryById
);

// Crear una nueva subcategoría de servicio - privado
router.post(
  "/",
  [
    validarJWT,
    check("nombre", "El nombre es obligatorio").not().isEmpty(),
    check("nombre", "El nombre debe tener máximo 50 caracteres").isLength({
      max: 50,
    }),
    check("nombre").custom(existeServiceSubcategoryPorNombre),
    check("description", "La descripción debe tener máximo 200 caracteres")
      .optional()
      .isLength({ max: 200 }),
    check("categoria", "La categoría es obligatoria").not().isEmpty(),
    check(
      "categoria",
      "La categoría debe ser un ID de Mongo válido"
    ).isMongoId(),
    check("categoria").custom(existeServiceCategoryPorId),
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
  createServiceSubcategory
);

// Actualizar una subcategoría de servicio - privado
router.put(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    check("id").custom(existeServiceSubcategoryPorId),
    check("nombre", "El nombre debe tener máximo 50 caracteres")
      .optional()
      .isLength({ max: 50 }),
    check("nombre").optional().custom(existeServiceSubcategoryPorNombre),
    check("description", "La descripción debe tener máximo 200 caracteres")
      .optional()
      .isLength({ max: 200 }),
    check("categoria", "La categoría debe ser un ID de Mongo válido")
      .optional()
      .isMongoId(),
    check("categoria").optional().custom(existeServiceCategoryPorId),
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
  updateServiceSubcategory
);

// Reordenar subcategorías de servicio - privado
router.patch(
  "/reorder",
  [
    validarJWT,
    check("subcategories", "Las subcategorías son obligatorias")
      .not()
      .isEmpty(),
    check("subcategories", "Las subcategorías deben ser un array").isArray(),
    check(
      "subcategories.*.id",
      "Cada subcategoría debe tener un ID válido"
    ).isMongoId(),
    check("subcategories.*.id").custom(existeServiceSubcategoryPorId),
    check(
      "subcategories.*.order",
      "Cada subcategoría debe tener un orden válido"
    ).isInt({ min: 1 }),
    validarCampos,
  ],
  reorderServiceSubcategories
);

// Eliminar una subcategoría de servicio - privado
router.delete(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    check("id").custom(existeServiceSubcategoryPorId),
    validarCampos,
  ],
  deleteServiceSubcategory
);

module.exports = router;
