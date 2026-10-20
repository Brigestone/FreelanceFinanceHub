const AppError = require('../utils/AppError');

/**
 * Restringe una ruta a uno o más roles. Debe usarse DESPUÉS de requireAuth.
 * @example router.get('/ping', requireAuth, requireRole('admin'), handler)
 * @param {...string} allowedRoles
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized('Debes iniciar sesión para continuar.'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden('No tienes permiso para acceder a este recurso.'));
    }
    return next();
  };
}

module.exports = { requireRole };
