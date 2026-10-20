const express = require('express');
const adminController = require('../controllers/adminController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const asyncHandler = require('../utils/asyncHandler');
const { body, param, query } = require('express-validator');
const validate = require('../middlewares/validationMiddleware');

const router = express.Router();

// Todas las rutas administrativas exigen autenticación y rol de admin
router.use(requireAuth, requireRole('admin'));

/**
 * @route   GET /api/v1/admin/ping
 * @desc    Comprobación rápida de acceso
 */
router.get('/ping', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Acceso de administrador verificado.',
    data: { admin: { id: req.user.id, email: req.user.email } }
  });
});

/**
 * @route   GET /api/v1/admin/metrics
 * @desc    Métricas consolidadas de la plataforma
 */
router.get(
  '/metrics',
  asyncHandler(adminController.getMetrics)
);

/**
 * @route   GET /api/v1/admin/users
 * @desc    Listar usuarios con filtros y búsqueda
 */
router.get(
  '/users',
  [
    query('search').optional().isString().trim(),
    query('role').optional().isIn(['admin', 'freelancer']),
    query('status').optional().isIn(['active', 'suspended']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 })
  ],
  validate,
  asyncHandler(adminController.getUsers)
);

/**
 * @route   PATCH /api/v1/admin/users/:id/status
 * @desc    Suspender o reactivar cuenta
 */
router.patch(
  '/users/:id/status',
  [
    param('id').isInt({ min: 1 }),
    body('status').isIn(['active', 'suspended']).withMessage("El estado debe ser 'active' o 'suspended'.")
  ],
  validate,
  asyncHandler(adminController.updateUserStatus)
);

/**
 * @route   PATCH /api/v1/admin/users/:id/role
 * @desc    Cambiar rol (admin / freelancer)
 */
router.patch(
  '/users/:id/role',
  [
    param('id').isInt({ min: 1 }),
    body('role').isIn(['admin', 'freelancer']).withMessage("El rol debe ser 'admin' o 'freelancer'.")
  ],
  validate,
  asyncHandler(adminController.updateUserRole)
);

/**
 * @route   GET /api/v1/admin/audit-logs
 * @desc    Bitácora de auditoría global
 */
router.get(
  '/audit-logs',
  asyncHandler(adminController.getAuditLogs)
);

module.exports = router;
