const express = require('express');
const subscriptionController = require('../controllers/subscriptionController');
const { requireAuth } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const {
  subscriptionRules,
  subscriptionIdParamRule,
  subscriptionFilterRules
} = require('../validators/subscriptionValidators');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.use(requireAuth);

/**
 * @route   GET /api/v1/subscriptions/metrics/summary
 * @desc    Resumen financiero de suscripciones
 */
router.get(
  '/metrics/summary',
  asyncHandler(subscriptionController.getMetrics)
);

/**
 * @route   GET /api/v1/subscriptions/categories
 * @desc    Catálogo de categorías
 */
router.get(
  '/categories',
  asyncHandler(subscriptionController.getCategories)
);

/**
 * @route   GET /api/v1/subscriptions
 * @desc    Listar suscripciones con búsqueda, filtros combinables, ordenamiento y paginación
 */
router.get(
  '/',
  subscriptionFilterRules,
  validate,
  asyncHandler(subscriptionController.getAll)
);

/**
 * @route   POST /api/v1/subscriptions
 * @desc    Crear nueva suscripción
 */
router.post(
  '/',
  subscriptionRules,
  validate,
  asyncHandler(subscriptionController.create)
);

/**
 * @route   GET /api/v1/subscriptions/:id
 * @desc    Detalle de suscripción
 */
router.get(
  '/:id',
  subscriptionIdParamRule,
  validate,
  asyncHandler(subscriptionController.getById)
);

/**
 * @route   PUT /api/v1/subscriptions/:id
 * @desc    Actualizar suscripción
 */
router.put(
  '/:id',
  [...subscriptionIdParamRule, ...subscriptionRules],
  validate,
  asyncHandler(subscriptionController.update)
);

/**
 * @route   DELETE /api/v1/subscriptions/:id
 * @desc    Eliminar suscripción
 */
router.delete(
  '/:id',
  subscriptionIdParamRule,
  validate,
  asyncHandler(subscriptionController.remove)
);

module.exports = router;
