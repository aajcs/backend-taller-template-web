/**
 * Tenant Resolver Middleware
 * Resuelve el taller (autoSys) activo para la request y valida permisos
 * Uso: app.use('/api/inventory', tenantResolver, require('../features/autoSys'));
 */

const Usuario = require("../../models/user");

/**
 * Middleware que valida y resuelve el taller/autoSys del usuario
 * Lee del header 'x-taller-id' o del JWT (req.usuario.idRefineria)
 * Inyecta req.taller para uso en controllers/services
 */
const tenantResolver = async (req, res, next) => {
  try {
    // El middleware validar-jwt ya debería haber puesto req.usuario
    if (!req.usuario) {
      return res.status(401).json({
        msg: "Token no válido - usuario no autenticado",
      });
    }

    // Obtener tallerId desde header o desde el usuario autenticado
    let tallerId = req.header("x-taller-id");

    // Si no viene en header, usar el idRefineria del usuario (campo actual en tu modelo)
    if (!tallerId && req.usuario.idRefineria) {
      tallerId = req.usuario.idRefineria.toString();
    }

    // Si el usuario tiene acceso completo y no se especifica taller, permitir
    // (útil para admins que pueden ver todos los talleres)
    if (!tallerId && req.usuario.acceso === "completo") {
      req.taller = null; // Indica acceso global
      return next();
    }

    if (!tallerId) {
      return res.status(400).json({
        msg: "Se requiere especificar un taller (x-taller-id header o idRefineria en usuario)",
      });
    }

    // Validar que el usuario tiene acceso a este taller
    // Si el acceso es limitado, verificar que idRefineria coincida
    if (req.usuario.acceso === "limitado") {
      const userTallerId = req.usuario.idRefineria?.toString();
      if (userTallerId !== tallerId) {
        return res.status(403).json({
          msg: "No tienes permisos para acceder a este taller",
        });
      }
    }

    // Inyectar contexto del taller en la request
    req.taller = {
      id: tallerId,
      // Aquí podrías cargar más info del taller si necesitas
      // const tallerInfo = await Refineria.findById(tallerId);
      // nombre: tallerInfo?.nombre
    };

    next();
  } catch (error) {
    console.error("Error en tenantResolver:", error);
    return res.status(500).json({
      msg: "Error al resolver el contexto del taller",
    });
  }
};

module.exports = tenantResolver;
