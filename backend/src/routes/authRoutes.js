const express = require('express');
const authController = require('../controllers/authController');
const { requireAuth } = require('../middlewares/authMiddleware');
const { loginLimiter, registerLimiter } = require('../middlewares/rateLimiter');
const validate = require('../middlewares/validationMiddleware');
const { registerRules, loginRules } = require('../validators/authValidators');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

/**
 * @route  POST /api/v1/auth/register
 * @access Público (rate limit por IP)
 * @body   { fullName, email, password }
 */
router.post('/register', registerLimiter, registerRules, validate, asyncHandler(authController.register));

/**
 * @route  POST /api/v1/auth/login
 * @access Público (rate limit por IP + email, solo intentos fallidos)
 * @body   { email, password }
 */
router.post('/login', loginLimiter, loginRules, validate, asyncHandler(authController.login));

/**
 * @route  POST /api/v1/auth/logout
 * @access Público e idempotente: limpia la cookie aunque la sesión ya haya expirado.
 */
router.post('/logout', authController.logout);

/**
 * @route  GET /api/v1/auth/me
 * @access Autenticado
 */
router.get('/me', requireAuth, authController.me);

module.exports = router;
