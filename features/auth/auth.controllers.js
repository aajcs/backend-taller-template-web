// Importaciones necesarias
const { response } = require("express"); // Objeto de Express para manejar respuestas
const bcryptjs = require("bcryptjs"); // Librería para encriptar y comparar contraseñas

const Usuario = require("../user/user.models"); // Modelo Usuario para interactuar con la base de datos

const { generarJWT } = require("../../helpers/generar-jwt"); // Helper para generar tokens JWT
const { googleVerify } = require("../../helpers/google-verify"); // Helper para verificar tokens de Google

// Controlador para el inicio de sesión
const login = async (req, res = response, next) => {
  const { correo, password } = req.body; // Extrae el correo y la contraseña del cuerpo de la solicitud

  try {
    // Verificar si el correo existe
    const usuario = await Usuario.findOne({ correo }).populate("nombre"); // Busca el usuario por correo y popula la refinería
    if (!usuario) {
      return res.status(400).json({
        msg: "Usuario / Password no son correctos - correo", // Error si el correo no existe
      });
    }

    // Verificar si el usuario está activo
    if (!usuario.estado) {
      return res.status(400).json({
        msg: "Usuario / Password no son correctos - estado: false", // Error si el usuario está inactivo
      });
    }

    // Verificar la contraseña
    const validPassword = bcryptjs.compareSync(password, usuario.password);
    if (!validPassword) {
      return res.status(400).json({
        msg: "Usuario / Password no son correctos - password", // Error si la contraseña no coincide
      });
    }

    // Generar el JWT
    const token = await generarJWT(usuario.id);

    // Respuesta exitosa
    res.json({
      usuario,
      token,
    });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};

// Controlador para el inicio de sesión con Google
const googleSignin = async (req, res = response, next) => {
  const { id_token } = req.body; // Extrae el token de Google del cuerpo de la solicitud

  try {
    // Verificar el token de Google y obtener los datos del usuario
    const { correo, nombre, img } = await googleVerify(id_token);
    // Si el usuario existe pero no tiene imagen, actualizamos con la de Google

    let usuario = await Usuario.findOne({ correo });

    if (usuario && (!usuario.img || usuario.img.trim() === "")) {
      usuario.img = img;
      await usuario.save();
    }
    // Si el usuario no existe, se crea uno nuevo
    if (!usuario) {
      const data = {
        nombre,
        correo,
        password: ":P", // Contraseña temporal
        img,
        google: true, // Indica que el usuario fue creado con Google
      };

      usuario = new Usuario(data);
      await usuario.save();
    }

    // Verificar si el usuario está activo
    if (!usuario.estado) {
      return res.status(401).json({
        msg: "Hable con el administrador, usuario bloqueado", // Error si el usuario está bloqueado
      });
    }

    // Generar el JWT
    const token = await generarJWT(usuario.id);

    // Respuesta exitosa
    res.json({
      usuario,
      token,
    });
  } catch (err) {
    next(err); // Propaga el error al middleware
  }
};
// Controlador para crear un nuevo usuario
const register = async (req, res = response, next) => {
  // Extrae los datos del cuerpo de la solicitud
  const {
    nombre,
    correo,
    password,
    rol,
    estado,
    acceso,

    departamento,
    telefono,
  } = req.body;

  // Crea una nueva instancia del modelo Usuario con los datos proporcionados
  const usuario = new Usuario({
    nombre,
    correo,
    password,
    rol,
    acceso,
    estado,
    departamento,
    telefono,
    // createdBy: req.usuario._id, // ID del usuario que creó el tanque
  });

  try {
    const correoLower = correo.toLowerCase();
    const existeCorreo = await Usuario.findOne({ correo: correoLower });
    usuario.correo = correoLower;
    if (existeCorreo) {
      const error = new Error("El correo ya está registrado");
      error.status = 409;
      return next(error);
    }
    // Encripta la contraseña antes de guardarla en la base de datos
    const salt = bcryptjs.genSaltSync(); // Genera un "salt" para la encriptación
    usuario.password = bcryptjs.hashSync(password, salt); // Encripta la contraseña

    // Guarda el usuario en la base de datos
    await usuario.save();
    // await usuario.populate(populateOptions);
    // Genera un token JWT para el usuario recién creado
    const token = await generarJWT(usuario.id);

    // Responde con los datos del usuario y el token generado
    res.json({
      usuario,
      token,
    });
  } catch (err) {
    console.log("Error al registrar usuario:", err); // Muestra el error en la consola
    next(err); // Propaga el error al middleware
  }
};
// Controlador para validar y renovar el token de un usuario
const validarTokenUsuario = async (req, res = response) => {
  // Generar un nuevo JWT
  const token = await generarJWT(req.usuario._id);

  // Respuesta exitosa con el usuario y el nuevo token
  res.json({
    usuario: req.usuario,
    token,
  });
};

// Exporta los controladores para que puedan ser utilizados en las rutas
module.exports = {
  login, // Inicio de sesión
  googleSignin, // Inicio de sesión con Google
  validarTokenUsuario, // Validar y renovar el token de un usuario
  register, // Registro de un nuevo usuario
};
