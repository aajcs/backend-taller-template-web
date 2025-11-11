const { Router } = require("express");
const { check } = require("express-validator");
const { validarCampos, validarJWT } = require("../../../../middlewares");
const {
  enterBay,
  exitBay,
  getWorkOrderAssignments,
  getTechnicianCurrentAssignment,
  getTechnicianAssignments,
} = require("../controllers");

const router = Router();

/**
 * POST /api/work-orders/:workOrderId/enter-bay
 * Asignar técnico(s) a una bahía y registrar entrada
 */
router.post(
  "/:workOrderId/enter-bay",
  [
    validarJWT,
    check("workOrderId", "No es un ID válido de MongoDB").isMongoId(),
    check("serviceBay", "La bahía de servicio es obligatoria").notEmpty(),
    check("serviceBay", "No es un ID válido de MongoDB").isMongoId(),
    check("technician")
      .if((value, { req }) => !req.body.technicians)
      .notEmpty()
      .withMessage("Debe proporcionar al menos un técnico"),
    check("technician")
      .if((value, { req }) => !req.body.technicians)
      .isMongoId()
      .withMessage("No es un ID válido de MongoDB"),
    check("technicians")
      .optional()
      .isArray()
      .withMessage("Los técnicos deben ser un array"),
    check("role", "El rol debe ser válido")
      .optional()
      .isIn(["principal", "asistente"]),
    validarCampos,
  ],
  enterBay
);

/**
 * POST /api/work-orders/:workOrderId/exit-bay
 * Registrar salida de técnico(s) de la bahía
 */
router.post(
  "/:workOrderId/exit-bay",
  [
    validarJWT,
    check("workOrderId", "No es un ID válido de MongoDB").isMongoId(),
    check("technician")
      .if((value, { req }) => !req.body.technicians)
      .notEmpty()
      .withMessage("Debe proporcionar al menos un técnico"),
    check("technician")
      .if((value, { req }) => !req.body.technicians)
      .isMongoId()
      .withMessage("No es un ID válido de MongoDB"),
    check("technicians")
      .optional()
      .isArray()
      .withMessage("Los técnicos deben ser un array"),
    check("exitReason", "La razón de salida debe ser válida")
      .optional()
      .isIn([
        "completado",
        "movido_otra_bahia",
        "cancelado",
        "espera_repuestos",
        "fin_jornada",
      ]),
    validarCampos,
  ],
  exitBay
);

/**
 * GET /api/work-orders/:workOrderId/assignments
 * Obtener asignaciones de una orden de trabajo
 */
router.get(
  "/:workOrderId/assignments",
  [
    validarJWT,
    check("workOrderId", "No es un ID válido de MongoDB").isMongoId(),
    validarCampos,
  ],
  getWorkOrderAssignments
);

/**
 * GET /api/technicians/:technicianId/current-assignment
 * Obtener asignación actual de un técnico
 */
router.get(
  "/technicians/:technicianId/current-assignment",
  [
    validarJWT,
    check("technicianId", "No es un ID válido de MongoDB").isMongoId(),
    validarCampos,
  ],
  getTechnicianCurrentAssignment
);

/**
 * GET /api/technicians/:technicianId/assignments
 * Obtener historial de asignaciones de un técnico
 */
router.get(
  "/technicians/:technicianId/assignments",
  [
    validarJWT,
    check("technicianId", "No es un ID válido de MongoDB").isMongoId(),
    check("startDate", "La fecha de inicio debe ser válida")
      .optional()
      .isISO8601(),
    check("endDate", "La fecha de fin debe ser válida").optional().isISO8601(),
    validarCampos,
  ],
  getTechnicianAssignments
);

module.exports = router;
