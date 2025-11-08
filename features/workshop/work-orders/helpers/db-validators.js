/**
 * Validadores para el módulo de Órdenes de Trabajo
 */

// Importaciones de modelos
const {
  WorkOrder,
  WorkOrderStatus,
  Service,
  ServiceCategory,
  ServiceSubcategory,
  WorkOrderItem,
} = require("../models");

// Validador para usuarios (importado desde helpers globales)
const existeUsuarioPorId = async (id) => {
  const Usuario = require("../../../user/user.models");
  const usuario = await Usuario.findById(id);
  if (!usuario) {
    throw new Error(`No existe un usuario con el id ${id}`);
  }
  if (!usuario.estado) {
    throw new Error(`El usuario con id ${id} está inactivo`);
  }
};

const existeWorkOrderPorId = async (id) => {
  const workOrder = await WorkOrder.findById(id);
  if (!workOrder || workOrder.deleted) {
    throw new Error(`No existe una orden de trabajo con el id ${id}`);
  }
};

const existeWorkOrderStatusPorId = async (id) => {
  const status = await WorkOrderStatus.findById(id);
  if (!status || status.deleted) {
    throw new Error(`No existe un estado de orden de trabajo con el id ${id}`);
  }
};

const existeServicePorId = async (id) => {
  const service = await Service.findById(id);
  if (!service || service.deleted) {
    throw new Error(`No existe un servicio con el id ${id}`);
  }
};

const existeServiceCategoryPorId = async (id) => {
  const category = await ServiceCategory.findById(id);
  if (!category || category.deleted) {
    throw new Error(`No existe una categoría de servicio con el id ${id}`);
  }
};

const existeServiceSubcategoryPorId = async (id) => {
  const subcategory = await ServiceSubcategory.findById(id);
  if (!subcategory || subcategory.deleted) {
    throw new Error(`No existe una subcategoría de servicio con el id ${id}`);
  }
};

const existeWorkOrderItemPorId = async (id) => {
  const item = await WorkOrderItem.findById(id);
  if (!item || item.deleted) {
    throw new Error(`No existe un item de orden de trabajo con el id ${id}`);
  }
};

// Validadores adicionales para unicidad
const existeWorkOrderStatusPorNombre = async (name, { req }) => {
  const status = await WorkOrderStatus.findOne({
    name: name.toLowerCase(),
    deleted: false,
  });

  if (status && status._id.toString() !== req?.params?.id) {
    throw new Error(`Ya existe un estado con el nombre '${name}'`);
  }
};

const existeServicePorNombre = async (name, { req }) => {
  const service = await Service.findOne({
    name: name.toLowerCase(),
    deleted: false,
  });

  if (service && service._id.toString() !== req?.params?.id) {
    throw new Error(`Ya existe un servicio con el nombre '${name}'`);
  }
};

const existeServiceCategoryPorNombre = async (name, { req }) => {
  const category = await ServiceCategory.findOne({
    name: name.toLowerCase(),
    deleted: false,
  });

  if (category && category._id.toString() !== req?.params?.id) {
    throw new Error(`Ya existe una categoría con el nombre '${name}'`);
  }
};

const existeServiceSubcategoryPorNombre = async (name, { req }) => {
  const subcategory = await ServiceSubcategory.findOne({
    name: name.toLowerCase(),
    deleted: false,
  });

  if (subcategory && subcategory._id.toString() !== req?.params?.id) {
    throw new Error(`Ya existe una subcategoría con el nombre '${name}'`);
  }
};

// Validador para productos/items del inventario
const existeProductoPorId = async (id) => {
  const Item = require("../../../../features/inventory/items/item.model");
  const item = await Item.findById(id);
  if (!item || item.eliminado) {
    throw new Error(`No existe un item de inventario con el id ${id}`);
  }
};

module.exports = {
  existeUsuarioPorId,
  existeWorkOrderPorId,
  existeWorkOrderStatusPorId,
  existeServicePorId,
  existeServiceCategoryPorId,
  existeServiceSubcategoryPorId,
  existeWorkOrderItemPorId,
  existeWorkOrderStatusPorNombre,
  existeServicePorNombre,
  existeServiceCategoryPorNombre,
  existeServiceSubcategoryPorNombre,
  existeProductoPorId, // Agregado
};
