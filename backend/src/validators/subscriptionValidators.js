const { body, param, query } = require('express-validator');

const subscriptionRules = [
  body('serviceName')
    .isString()
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('El nombre del servicio debe tener entre 2 y 150 caracteres.'),
  body('cost')
    .isFloat({ min: 0 })
    .withMessage('El costo debe ser un número mayor o igual a 0.'),
  body('currency')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('La moneda debe tener hasta 10 caracteres.'),
  body('billingCycle')
    .isIn(['monthly', 'quarterly', 'annual'])
    .withMessage('El ciclo de facturación debe ser monthly, quarterly o annual.'),
  body('startDate')
    .isISO8601()
    .withMessage('La fecha de inicio debe tener formato YYYY-MM-DD.'),
  body('renewalDate')
    .isISO8601()
    .withMessage('La fecha de renovación debe tener formato YYYY-MM-DD.'),
  body('isTrial')
    .isBoolean()
    .withMessage('isTrial debe ser un valor booleano.'),
  body('trialEndDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('La fecha de fin de prueba debe tener formato YYYY-MM-DD.'),
  body('status')
    .optional()
    .isIn(['active', 'trial', 'cancelled', 'paused'])
    .withMessage('El estado debe ser active, trial, cancelled o paused.'),
  body('categoryId')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('El ID de categoría debe ser un entero positivo.'),
  body('paymentMethod')
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 50 })
    .withMessage('El método de pago no debe exceder 50 caracteres.'),
  body('notes')
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Las notas no deben exceder 1000 caracteres.')
];

const subscriptionIdParamRule = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID de suscripción debe ser un entero válido.')
];

const subscriptionFilterRules = [
  query('search')
    .optional()
    .isString()
    .trim(),
  query('status')
    .optional()
    .isIn(['active', 'trial', 'cancelled', 'paused']),
  query('categoryId')
    .optional()
    .isInt({ min: 1 }),
  query('billingCycle')
    .optional()
    .isIn(['monthly', 'quarterly', 'annual']),
  query('sortBy')
    .optional()
    .isIn(['cost', 'renewal_date', 'trial_end_date', 'service_name', 'status', 'created_at']),
  query('sortOrder')
    .optional()
    .isIn(['ASC', 'DESC', 'asc', 'desc']),
  query('page')
    .optional()
    .isInt({ min: 1 }),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
];

module.exports = {
  subscriptionRules,
  subscriptionIdParamRule,
  subscriptionFilterRules
};
