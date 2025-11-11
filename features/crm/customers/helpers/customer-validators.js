/**
 * Customers Helpers - Validadores específicos para el módulo de customers
 */

// Validar que existe un cliente por ID
const existeCustomerPorId = async (id = "") => {
  const { Customer } = require("../models");
  const customer = await Customer.findOne({
    _id: id,
    eliminado: false,
  });

  if (!customer) {
    throw new Error(`El cliente con ID ${id} no existe`);
  }
};

// Validar que existe un cliente por correo
const existeCustomerPorCorreo = async (correo = "", { req } = {}) => {
  const { Customer } = require("../models");
  
  // Construir query: buscar por correo pero excluir el ID actual si es un PUT
  const query = {
    correo: correo.toLowerCase(),
    eliminado: false,
  };
  
  // Si viene un ID en los params (PUT), excluirlo de la búsqueda
  if (req?.params?.id) {
    query._id = { $ne: req.params.id };
  }
  
  const customer = await Customer.findOne(query);

  if (customer) {
    throw new Error(`Ya existe un cliente con el correo ${correo}`);
  }
};

// Validar que existe un cliente por RIF
const existeCustomerPorRif = async (rif = "", { req } = {}) => {
  const { Customer } = require("../models");
  
  // Construir query: buscar por RIF pero excluir el ID actual si es un PUT
  const query = {
    rif: rif.toUpperCase(),
    eliminado: false,
  };
  
  // Si viene un ID en los params (PUT), excluirlo de la búsqueda
  if (req?.params?.id) {
    query._id = { $ne: req.params.id };
  }
  
  const customer = await Customer.findOne(query);

  if (customer) {
    throw new Error(`Ya existe un cliente con el RIF ${rif}`);
  }
};

// Validar formato de teléfono venezolano
const esTelefonoValido = (telefono = "") => {
  const telefonoRegex = /^\+58\d{10}$/;
  if (!telefonoRegex.test(telefono)) {
    throw new Error("El teléfono debe tener el formato +584241234567");
  }
  return true;
};

// Validar formato de RIF venezolano
const esRifValido = (rif = "") => {
  const rifRegex = /^[JVG]-?\d{8}-?\d{1}$/;
  if (!rifRegex.test(rif)) {
    throw new Error(
      "El RIF debe tener el formato J-12345678-9, V-12345678-9 o G-12345678-9"
    );
  }
  return true;
};

// Validar que el tipo de cliente sea válido
const esTipoClienteValido = (tipo = "") => {
  const tiposValidos = ["persona", "empresa"];
  if (!tiposValidos.includes(tipo)) {
    throw new Error("El tipo de cliente debe ser: persona o empresa");
  }
  return true;
};

// Validar que el estado sea válido
const esEstadoValido = (estado = "") => {
  const estadosValidos = ["activo", "inactivo"];
  if (!estadosValidos.includes(estado)) {
    throw new Error("El estado debe ser: activo o inactivo");
  }
  return true;
};

module.exports = {
  existeCustomerPorId,
  existeCustomerPorCorreo,
  existeCustomerPorRif,
  esTelefonoValido,
  esRifValido,
  esTipoClienteValido,
  esEstadoValido,
};
