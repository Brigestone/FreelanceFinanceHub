const config = require('../config/env');
const userModel = require('../models/userModel');
const AppError = require('../utils/AppError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyToken } = require('../utils/jwt');

/**
 * Exige una sesión válida.
 *
 * Además de verificar el JWT, recarga el usuario desde la BD en cada petición:
 *  - Si fue eliminado → 401.
 *  - Si fue suspendido → 403 inmediato, aunque su token siga vigente.
 *  - El rol se toma de la BD (no del token), así un cambio de rol aplica al instante.
 */
const requireAuth = asyncHandler(async (req, res, next) => {
  const token = req.cookies ? req.cookies[config.cookie.name] : undefined;
  if (!token) {
    throw AppError.unauthorized('Debes iniciar sesión para continuar.');
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw AppError.unauthorized('Tu sesión expiró. Inicia sesión de nuevo.');
    }
    throw AppError.unauthorized('Sesión inválida. Inicia sesión de nuevo.');
  }

  const userId = Number(payload.sub);
  if (!Number.isInteger(userId) || userId <= 0) {
    throw AppError.unauthorized('Sesión inválida. Inicia sesión de nuevo.');
  }

  const row = await userModel.findById(userId);
  if (!row) {
    throw AppError.unauthorized('Sesión inválida. Inicia sesión de nuevo.');
  }
  if (row.status !== 'active') {
    throw AppError.forbidden('Tu cuenta está suspendida. Contacta al administrador.');
  }

  req.user = userModel.toPublicUser(row);
  next();
});

module.exports = { requireAuth };
