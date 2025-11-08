const { Router } = require("express");
const { check } = require("express-validator");

const {
  validarCampos,
  validarJWT,
  esSuperAdminRole,
  tieneRole,
} = require("../../middlewares");

const { existeAutoSysPorId } = require("../../helpers/db-validators");

const {
  autoSysGet,
  autoSysGetById,
  autoSysPost,
  autoSysPut,
  autoSysDelete,
  autoSysPatch,
} = require("./autoSys.controllers");

const router = Router();

// Obtener todos los talleres
router.get("/", [validarJWT], autoSysGet);

// Obtener un taller por ID
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un id de Mongo válido").isMongoId(),
    validarCampos,
  ],
  autoSysGetById
);

// Actualizar un taller
router.put(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeAutoSysPorId),
    validarCampos,
  ],
  autoSysPut
);

// Crear un nuevo taller
router.post(
  "/",
  [
    validarJWT,
    esSuperAdminRole,
    check("ubicacion", "La ubicación es obligatoria").not().isEmpty(),
    check("nombre", "El nombre del taller es obligatorio").not().isEmpty(),
    check("rif", "El RIF es obligatorio").not().isEmpty(),
    check("img", "El logotipo del taller es obligatorio").not().isEmpty(),
    validarCampos,
  ],
  autoSysPost
);

// Eliminar (lógicamente) un taller
router.delete(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    tieneRole("superAdmin", "admin"),
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeAutoSysPorId),
    validarCampos,
  ],
  autoSysDelete
);

// PATCH no implementado
router.patch("/", autoSysPatch);

module.exports = router;
