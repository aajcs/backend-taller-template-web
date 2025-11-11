const { Router } = require("express");
const { check } = require("express-validator");
const { validarCampos, validarJWT } = require("../../../../middlewares");
const {
  getServiceBays,
  getAvailableBays,
  getServiceBayById,
  createServiceBay,
  updateServiceBay,
  deleteServiceBay,
  // updateBayStatus,
} = require("../controllers");

const router = Router();

/**
 * GET /api/service-bays
 * Obtener todas las bahías
 */
router.get("/", [validarJWT, validarCampos], getServiceBays);

/**
 * GET /api/service-bays/available
 * Obtener bahías disponibles
 */
router.get("/available", [validarJWT, validarCampos], getAvailableBays);

/**
 * GET /api/service-bays/:id
 * Obtener una bahía por ID
 */
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido de MongoDB").isMongoId(),
    validarCampos,
  ],
  getServiceBayById
);

/**
 * POST /api/service-bays
 * Crear una nueva bahía
 */
router.post(
  "/",
  [
    validarJWT,
    check("name", "El nombre es obligatorio").notEmpty(),
    check("code", "El código es obligatorio").notEmpty(),
    check("area", "El área debe ser válida")
      .optional()
      .isIn([
        "mecanica",
        "electricidad",
        "pintura",
        "latoneria",
        "lavado",
        "diagnostico",
        "multiple",
      ]),
    check("capacity", "La capacidad debe ser válida")
      .optional()
      .isIn(["individual", "pequeña", "mediana", "grande", "multiple"]),
    check("maxTechnicians", "El máximo de técnicos debe ser un número")
      .optional()
      .isInt({ min: 1 }),
    validarCampos,
  ],
  createServiceBay
);

/**
 * PUT /api/service-bays/:id
 * Actualizar una bahía
 */
router.put(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido de MongoDB").isMongoId(),
    check("name", "El nombre debe ser válido").optional().notEmpty(),
    check("area", "El área debe ser válida")
      .optional()
      .isIn([
        "mecanica",
        "electricidad",
        "pintura",
        "latoneria",
        "lavado",
        "diagnostico",
        "multiple",
      ]),
    validarCampos,
  ],
  updateServiceBay
);

/**
 * DELETE /api/service-bays/:id
 * Eliminar una bahía (lógicamente)
 */
router.delete(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido de MongoDB").isMongoId(),
    validarCampos,
  ],
  deleteServiceBay
);

/**
 * PATCH /api/service-bays/:id/status
 * Cambiar estado de una bahía
 */
// router.patch(
//   "/:id/status",
//   [
//     validarJWT,
//     check("id", "No es un ID válido de MongoDB").isMongoId(),
//     check("status", "El estado es obligatorio").notEmpty(),
//     check("status", "El estado debe ser válido").isIn([
//       "disponible",
//       "ocupado",
//       "mantenimiento",
//       "fuera_servicio",
//     ]),
//     validarCampos,
//   ],
//   updateBayStatus
// );

module.exports = router;
