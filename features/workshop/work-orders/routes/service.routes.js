const { Router } = require("express");
const { check } = require("express-validator");

const { validarJWT, validarCampos } = require("../../../../middlewares");

const {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
  searchServices,
} = require("../controllers/service.controller");

// Helpers de validación
const {
  existeServicePorId,
  existeServicePorNombre,
  existeServiceCategoryPorId,
  existeServiceSubcategoryPorId,
} = require("../helpers/db-validators");

const router = Router();

/**
 * {{url}}/api/services
 */

// Obtener todos los servicios - privado
router.get("/", [validarJWT, validarCampos], getServices);

// Buscar servicios con filtros - privado
router.get(
  "/search",
  [
    validarJWT,
    check("category", "La categoría debe ser un ID de Mongo válido")
      .optional()
      .isMongoId(),
    check("category").optional().custom(existeServiceCategoryPorId),
    check("subcategory", "La subcategoría debe ser un ID de Mongo válido")
      .optional()
      .isMongoId(),
    check("subcategory").optional().custom(existeServiceSubcategoryPorId),
    check("name", "El nombre de búsqueda debe ser texto").optional().isString(),
    check("isActive", "El estado activo debe ser un booleano")
      .optional()
      .isBoolean(),
    validarCampos,
  ],
  searchServices
);

// Obtener un servicio específico por ID - privado
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    check("id").custom(existeServicePorId),
    validarCampos,
  ],
  getServiceById
);

// Crear un nuevo servicio - privado
router.post(
  "/",
  [
    validarJWT,
    check("name", "El nombre es obligatorio").not().isEmpty(),
    check("name", "El nombre debe tener máximo 100 caracteres").isLength({
      max: 100,
    }),
    check("name").custom(existeServicePorNombre),
    check("description", "La descripción debe tener máximo 500 caracteres")
      .optional()
      .isLength({ max: 500 }),
    check("category", "La categoría es obligatoria").not().isEmpty(),
    check(
      "category",
      "La categoría debe ser un ID de Mongo válido"
    ).isMongoId(),
    check("category").custom(existeServiceCategoryPorId),
    check("subcategory", "La subcategoría debe ser un ID de Mongo válido")
      .optional()
      .isMongoId(),
    check("subcategory").optional().custom(existeServiceSubcategoryPorId),
    check("basePrice", "El precio base debe ser un número positivo")
      .optional()
      .isFloat({ min: 0 }),
    check("estimatedHours", "Las horas estimadas deben ser un número positivo")
      .optional()
      .isFloat({ min: 0 }),
    check("difficulty", "La dificultad debe ser válida")
      .optional()
      .isIn(["baja", "media", "alta"]),
    check("isActive", "El estado activo debe ser un booleano")
      .optional()
      .isBoolean(),
    check("tags", "Los tags deben ser un array de strings")
      .optional()
      .isArray(),
    check("tags.*", "Cada tag debe ser texto").optional().isString(),
    validarCampos,
  ],
  createService
);

// Actualizar un servicio - privado
router.put(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    check("id").custom(existeServicePorId),
    check("name", "El nombre debe tener máximo 100 caracteres")
      .optional()
      .isLength({ max: 100 }),
    check("name").optional().custom(existeServicePorNombre),
    check("description", "La descripción debe tener máximo 500 caracteres")
      .optional()
      .isLength({ max: 500 }),
    check("category", "La categoría debe ser un ID de Mongo válido")
      .optional()
      .isMongoId(),
    check("category").optional().custom(existeServiceCategoryPorId),
    check("subcategory", "La subcategoría debe ser un ID de Mongo válido")
      .optional()
      .isMongoId(),
    check("subcategory").optional().custom(existeServiceSubcategoryPorId),
    check("basePrice", "El precio base debe ser un número positivo")
      .optional()
      .isFloat({ min: 0 }),
    check("estimatedHours", "Las horas estimadas deben ser un número positivo")
      .optional()
      .isFloat({ min: 0 }),
    check("difficulty", "La dificultad debe ser válida")
      .optional()
      .isIn(["baja", "media", "alta"]),
    check("isActive", "El estado activo debe ser un booleano")
      .optional()
      .isBoolean(),
    check("tags", "Los tags deben ser un array de strings")
      .optional()
      .isArray(),
    check("tags.*", "Cada tag debe ser texto").optional().isString(),
    validarCampos,
  ],
  updateService
);

// Eliminar un servicio - privado
router.delete(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID de Mongo válido").isMongoId(),
    check("id").custom(existeServicePorId),
    validarCampos,
  ],
  deleteService
);

module.exports = router;
