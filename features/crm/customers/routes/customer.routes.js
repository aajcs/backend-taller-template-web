const { Router } = require("express");
const { check } = require("express-validator");

const {
  validarCampos,
  validarJWT,
  esSuperAdminRole,
  tieneRole,
} = require("../../../../middlewares");

const {
  customersGet,
  customerGet,
  customerGetByRif,
  customerGetByCorreo,
  customerPost,
  customerPut,
  customerDelete,
  customerVehiclesGet,
  customerEstadisticasCompras,
  customerHistorialOrdenes,
} = require("../controllers/customer.controller");

const {
  existeCustomerPorId,
  existeCustomerPorCorreo,
  existeCustomerPorRif,
  esTelefonoValido,
  esRifValido,
  esTipoClienteValido,
  esEstadoValido,
} = require("../helpers/customer-validators");

const router = Router();

/**
 * Rutas para la gestión de clientes
 */

// Obtener todos los clientes - Requiere autenticación
router.get("/", [validarJWT], customersGet);

// Obtener cliente por ID - Requiere autenticación
router.get(
  "/:id",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeCustomerPorId),
    validarCampos,
  ],
  customerGet
);

// Obtener vehículos de un cliente - Requiere autenticación
router.get(
  "/:id/vehicles",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeCustomerPorId),
    validarCampos,
  ],
  customerVehiclesGet
);

// Obtener estadísticas de compras de un cliente - Requiere autenticación
router.get(
  "/:id/estadisticas-compras",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeCustomerPorId),
    validarCampos,
  ],
  customerEstadisticasCompras
);

// Obtener historial de órdenes de un cliente - Requiere autenticación
router.get(
  "/:id/historial-ordenes",
  [
    validarJWT,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeCustomerPorId),
    validarCampos,
  ],
  customerHistorialOrdenes
);

// Buscar cliente por RIF - Requiere autenticación
router.get(
  "/rif/:rif",
  [validarJWT, check("rif").custom(esRifValido), validarCampos],
  customerGetByRif
);

// Buscar cliente por correo - Requiere autenticación
router.get(
  "/correo/:correo",
  [
    validarJWT,
    check("correo", "El correo no tiene un formato válido").isEmail(),
    validarCampos,
  ],
  customerGetByCorreo
);

// Crear nuevo cliente - Requiere SuperAdmin
router.post(
  "/",
  [
    validarJWT,
    esSuperAdminRole,
    check("nombre", "El nombre es obligatorio").not().isEmpty(),
    check("nombre", "El nombre debe tener máximo 100 caracteres").isLength({
      max: 100,
    }),
    check("tipo").custom(esTipoClienteValido),
    check("telefono").custom(esTelefonoValido),
    check("correo", "El correo no tiene un formato válido").isEmail(),
    check("correo").custom(existeCustomerPorCorreo),
    check("direccion", "La dirección debe tener máximo 200 caracteres")
      .optional()
      .isLength({ max: 200 }),
    // Validaciones condicionales para empresas
    check("rif")
      .optional()
      .custom((value, { req }) => {
        if (req.body.tipo === "empresa") {
          if (!value) throw new Error("El RIF es obligatorio para empresas");
          esRifValido(value);
          return existeCustomerPorRif(value);
        }
        return true;
      }),
    check("razonSocial")
      .optional()
      .custom((value, { req }) => {
        if (req.body.tipo === "empresa") {
          if (!value)
            throw new Error("La razón social es obligatoria para empresas");
          if (value.length > 150)
            throw new Error("La razón social debe tener máximo 150 caracteres");
        }
        return true;
      }),
    check("notas", "Las notas deben tener máximo 500 caracteres")
      .optional()
      .isLength({ max: 500 }),
    check("estado").optional().custom(esEstadoValido),
    validarCampos,
  ],
  customerPost
);

// Actualizar cliente - Requiere SuperAdmin
router.put(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeCustomerPorId),
    check("nombre", "El nombre es obligatorio").optional().not().isEmpty(),
    check("nombre", "El nombre debe tener máximo 100 caracteres")
      .optional()
      .isLength({
        max: 100,
      }),
    check("tipo").optional().custom(esTipoClienteValido),
    check("telefono").optional().custom(esTelefonoValido),
    check("correo", "El correo no tiene un formato válido")
      .optional()
      .isEmail(),
    check("correo").optional().custom(existeCustomerPorCorreo),
    check("direccion", "La dirección debe tener máximo 200 caracteres")
      .optional()
      .isLength({ max: 200 }),
    // Validaciones condicionales para empresas
    check("rif")
      .optional()
      .custom((value, { req }) => {
        if (
          req.body.tipo === "empresa" ||
          (req.body.tipo === undefined && value)
        ) {
          esRifValido(value);
          return existeCustomerPorRif(value, { req });
        }
        return true;
      }),
    check("razonSocial")
      .optional()
      .custom((value, { req }) => {
        if (
          req.body.tipo === "empresa" ||
          (req.body.tipo === undefined && value)
        ) {
          if (value.length > 150)
            throw new Error("La razón social debe tener máximo 150 caracteres");
        }
        return true;
      }),
    check("notas", "Las notas deben tener máximo 500 caracteres")
      .optional()
      .isLength({ max: 500 }),
    check("estado").optional().custom(esEstadoValido),
    validarCampos,
  ],
  customerPut
);

// Eliminar cliente - Requiere SuperAdmin
router.delete(
  "/:id",
  [
    validarJWT,
    esSuperAdminRole,
    check("id", "No es un ID válido").isMongoId(),
    check("id").custom(existeCustomerPorId),
    validarCampos,
  ],
  customerDelete
);

module.exports = router;
