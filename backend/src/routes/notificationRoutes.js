const express = require('express');
const notificationController = require('../controllers/notificationController');
const { requireAuth } = require('../middlewares/authMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const { body } = require('express-validator');
const validate = require('../middlewares/validationMiddleware');

const router = express.Router();

router.use(requireAuth);

/**
 * @route   GET /api/v1/alerts/settings
 * @desc    Obtener configuración de días de anticipación de alertas
 */
router.get(
  '/settings',
  asyncHandler(notificationController.getSettings)
);

/**
 * @route   PUT /api/v1/alerts/settings
 * @desc    Actualizar días de anticipación
 */
router.put(
  '/settings',
  [
    body('trialAlertDaysBefore').isInt({ min: 1, max: 30 }),
    body('renewalAlertDaysBefore').isInt({ min: 1, max: 30 }),
    body('emailEnabled').isBoolean()
  ],
  validate,
  asyncHandler(notificationController.updateSettings)
);

/**
 * @route   GET /api/v1/alerts/history
 * @desc    Historial de alertas enviadas (notification_logs)
 */
router.get(
  '/history',
  asyncHandler(notificationController.getHistory)
);

/**
 * @route   POST /api/v1/alerts/trigger-check
 * @desc    Disparar procesamiento manual de alertas
 */
router.post(
  '/trigger-check',
  asyncHandler(notificationController.triggerCheck)
);

module.exports = router;
