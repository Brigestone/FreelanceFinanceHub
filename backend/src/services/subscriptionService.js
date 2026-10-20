const subscriptionModel = require('../models/subscriptionModel');
const AppError = require('../utils/AppError');

/**
 * Listado con filtros, búsqueda y ordenamiento
 */
async function getSubscriptions(userId, filters) {
  return subscriptionModel.findSubscriptions(userId, filters);
}

/**
 * Detalle por ID
 */
async function getSubscriptionDetail(id, userId) {
  const sub = await subscriptionModel.findSubscriptionById(id, userId);
  if (!sub) {
    throw AppError.notFound('Suscripción no encontrada.');
  }
  return sub;
}

/**
 * Registro de nueva suscripción
 */
async function addSubscription(userId, data) {
  if (data.isTrial && !data.trialEndDate) {
    throw AppError.badRequest('Las suscripciones en periodo de prueba requieren indicar la fecha de fin de prueba.');
  }

  const id = await subscriptionModel.createSubscription(userId, data);
  return subscriptionModel.findSubscriptionById(id, userId);
}

/**
 * Actualización
 */
async function editSubscription(id, userId, data) {
  if (data.isTrial && !data.trialEndDate) {
    throw AppError.badRequest('Las suscripciones en periodo de prueba requieren indicar la fecha de fin de prueba.');
  }

  const updated = await subscriptionModel.updateSubscription(id, userId, data);
  if (!updated) {
    throw AppError.notFound('Suscripción no encontrada o no autorizada.');
  }
  return subscriptionModel.findSubscriptionById(id, userId);
}

/**
 * Eliminación
 */
async function removeSubscription(id, userId) {
  const deleted = await subscriptionModel.deleteSubscription(id, userId);
  if (!deleted) {
    throw AppError.notFound('Suscripción no encontrada o no autorizada.');
  }
  return true;
}

/**
 * Resumen de métricas
 */
async function getMetrics(userId) {
  return subscriptionModel.getSubscriptionMetrics(userId);
}

/**
 * Catálogo de categorías
 */
async function listCategories() {
  return subscriptionModel.getCategories();
}

module.exports = {
  getSubscriptions,
  getSubscriptionDetail,
  addSubscription,
  editSubscription,
  removeSubscription,
  getMetrics,
  listCategories
};
