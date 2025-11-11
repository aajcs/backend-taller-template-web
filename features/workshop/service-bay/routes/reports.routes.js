const { Router } = require("express");
const { check } = require("express-validator");
const { validarCampos, validarJWT } = require("../../../../middlewares");
const {
  getTallerStatus,
  getTechnicianHoursReport,
  getBayUtilizationReport,
  getBayHistory,
} = require("../controllers");

const router = Router();

/**
 * GET /api/dashboard/taller-status
 * Obtener estado del taller en tiempo real
 */
router.get("/taller-status", [validarJWT, validarCampos], getTallerStatus);

/**
 * GET /api/reports/technician-hours
 * Reporte de horas trabajadas por técnico
 */
router.get(
  "/technician-hours",
  [
    validarJWT,
    check("technician", "No es un ID válido de MongoDB").optional().isMongoId(),
    check("startDate", "La fecha de inicio debe ser válida")
      .optional()
      .isISO8601(),
    check("endDate", "La fecha de fin debe ser válida").optional().isISO8601(),
    validarCampos,
  ],
  getTechnicianHoursReport
);

/**
 * GET /api/reports/bay-utilization
 * Reporte de utilización de bahías
 */
router.get(
  "/bay-utilization",
  [
    validarJWT,
    check("serviceBay", "No es un ID válido de MongoDB").optional().isMongoId(),
    check("startDate", "La fecha de inicio debe ser válida")
      .optional()
      .isISO8601(),
    check("endDate", "La fecha de fin debe ser válida").optional().isISO8601(),
    validarCampos,
  ],
  getBayUtilizationReport
);

/**
 * GET /api/service-bays/:id/history
 * Historial de ocupación de una bahía
 */
router.get(
  "/bays/:id/history",
  [
    validarJWT,
    check("id", "No es un ID válido de MongoDB").isMongoId(),
    check("startDate", "La fecha de inicio debe ser válida")
      .optional()
      .isISO8601(),
    check("endDate", "La fecha de fin debe ser válida").optional().isISO8601(),
    validarCampos,
  ],
  getBayHistory
);

module.exports = router;
