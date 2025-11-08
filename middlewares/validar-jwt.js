const { response, request } = require("express");
const jwt = require("jsonwebtoken");

const Usuario = require("../features/user/user.models");

const validarJWT = async (req = request, res = response, next) => {
  const token = req.header("x-token");

  if (!token) {
    return res.status(401).json({
      msg: "No hay token en la petición",
      logout: true,
    });
  }

  try {
    const { id } = jwt.verify(token, process.env.SECRETORPRIVATEKEY);

    // leer el usuario que corresponde al id
    const user = await Usuario.findById(id);

    if (!user) {
      return res.status(401).json({
        msg: "Token no válido - usuario no existe DB",
        logout: true,
      });
    }

    // Verificar si el uid tiene estado true
    // if ( !user.estado ) {
    //     return res.status(401).json({
    //         msg: 'Token no válido - usuario con estado: false'
    //     })
    // }
    req.usuario = user;
    next();
  } catch (error) {
    // console.log(error);
    res.status(401).json({
      msg: "Token no válido",
      logout: true,
    });
  }
};

module.exports = {
  validarJWT,
};
