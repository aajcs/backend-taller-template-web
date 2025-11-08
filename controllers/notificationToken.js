// controllers/notificationToken.js
const Usuario = require("../features/user/user.models");

// Controlador para guardar o actualizar tokens de notificación push
const saveToken = async (req, res, next) => {
  try {
    const userId = req.usuario._id; // ID del usuario autenticado
    const { token } = req.body;

    // Validar que se reciba un token
    if (!token) {
      return res.status(400).json({ success: false, error: "Token inválido" });
    }

    // Asegurar que el usuario tenga el array fcmTokens inicializado
    const user = await Usuario.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: "Usuario no encontrado" });
    }
    if (!Array.isArray(user.fcmTokens)) {
      user.fcmTokens = [];
    }
    // Añadir el token si no existe
    if (!user.fcmTokens.includes(token)) {
      user.fcmTokens.push(token);
      await user.save();
    }

    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  saveToken,
};
