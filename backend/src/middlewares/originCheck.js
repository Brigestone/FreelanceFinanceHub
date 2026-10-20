const config = require('../config/env');
const AppError = require('../utils/AppError');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Protección CSRF complementaria a la cookie SameSite=Strict.
 *
 * Para métodos que modifican datos (POST/PUT/PATCH/DELETE), si la petición
 * viene de un navegador (trae Origin o Referer), ese origen debe estar en
 * APP_ORIGIN. Las peticiones sin Origin ni Referer (PowerShell, curl, pruebas)
 * se permiten: no son un vector CSRF, porque no llevan automáticamente las
 * cookies del navegador de la víctima.
 */
function originCheck(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();

  let source = req.get('origin');
  if (!source) {
    const referer = req.get('referer');
    if (referer) {
      try {
        source = new URL(referer).origin;
      } catch {
        source = 'invalid';
      }
    }
  }

  if (!source) return next();
  if (config.allowedOrigins.includes(source)) return next();

  return next(AppError.forbidden('Origen de la solicitud no permitido.'));
}

module.exports = originCheck;
