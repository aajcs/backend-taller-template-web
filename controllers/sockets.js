// Importación del modelo User
const Usuario = require("../features/user/user.models");

// Función para marcar un usuario como conectado
const userConnected = async (id) => {
  // Busca al usuario por su ID en la base de datos
  const user = await Usuario.findById(id);
  if (!user) {
    return false; // Retorna false si el usuario no existe
  }

  // Marca al usuario como conectado (online)
  user.online = true;
  await user.save(); // Guarda los cambios en la base de datos

  return user; // Retorna el usuario actualizado
};

// Función para marcar un usuario como desconectado
const userDisconnected = async (id) => {
  // Busca al usuario por su ID en la base de datos
  const user = await Usuario.findById(id);
  if (!user) {
    return false; // Retorna false si el usuario no existe
  }

  // Marca al usuario como desconectado (offline)
  user.online = false;
  await user.save(); // Guarda los cambios en la base de datos

  return user; // Retorna el usuario actualizado
};

// Función para obtener todos los usuarios ordenados por su estado (online primero)
const getUsers = async () => {
  // Busca todos los usuarios y los ordena por el campo "online" en orden descendente
  const users = await Usuario.find().sort("-online");

  return users; // Retorna la lista de usuarios
};

// (Comentado) Función para grabar un mensaje en la base de datos
// const grabarMensaje = async( payload ) => {
//     try {
//         // Crea una nueva instancia del modelo Mensaje con los datos proporcionados
//         const mensaje = new Mensaje( payload );
//         await mensaje.save(); // Guarda el mensaje en la base de datos
//         return mensaje; // Retorna el mensaje guardado
//     } catch (error) {
//         console.log(error); // Muestra el error en la consola
//         return false; // Retorna false si ocurre un error
//     }
// }

// Exporta las funciones para que puedan ser utilizadas en otros módulos
module.exports = {
  userConnected, // Marca un usuario como conectado
  userDisconnected, // Marca un usuario como desconectado
  getUsers, // Obtiene todos los usuarios ordenados por estado
  // grabarMensaje // (Comentado) Función para grabar mensajes
};
