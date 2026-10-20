const subscriptionService = require('../services/subscriptionService');

/**
 * GET /api/v1/subscriptions
 */
async function getAll(req, res) {
  const result = await subscriptionService.getSubscriptions(req.user.id, req.query);
  res.status(200).json({
    success: true,
    data: result
  });
}

/**
 * GET /api/v1/subscriptions/:id
 */
async function getById(req, res) {
  const sub = await subscriptionService.getSubscriptionDetail(Number(req.params.id), req.user.id);
  res.status(200).json({
    success: true,
    data: { subscription: sub }
  });
}

/**
 * POST /api/v1/subscriptions
 */
async function create(req, res) {
  const sub = await subscriptionService.addSubscription(req.user.id, req.body);
  res.status(201).json({
    success: true,
    message: 'Suscripción registrada correctamente.',
    data: { subscription: sub }
  });
}

/**
 * PUT /api/v1/subscriptions/:id
 */
async function update(req, res) {
  const sub = await subscriptionService.editSubscription(Number(req.params.id), req.user.id, req.body);
  res.status(200).json({
    success: true,
    message: 'Suscripción actualizada exitosamente.',
    data: { subscription: sub }
  });
}

/**
 * DELETE /api/v1/subscriptions/:id
 */
async function remove(req, res) {
  await subscriptionService.removeSubscription(Number(req.params.id), req.user.id);
  res.status(200).json({
    success: true,
    message: 'Suscripción eliminada con éxito.'
  });
}

/**
 * GET /api/v1/subscriptions/metrics/summary
 */
async function getMetrics(req, res) {
  const metrics = await subscriptionService.getMetrics(req.user.id);
  res.status(200).json({
    success: true,
    data: { metrics }
  });
}

/**
 * GET /api/v1/subscriptions/categories
 */
async function getCategories(req, res) {
  const categories = await subscriptionService.listCategories();
  res.status(200).json({
    success: true,
    data: { categories }
  });
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getMetrics,
  getCategories
};
