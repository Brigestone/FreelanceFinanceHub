const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const config = require('../config/env');

function tooMany(message) {
  return (req, res /* , next, options */) => {
    res.status(429).json({ success: false, message });
  };
}

/** Límite general para toda la API, por IP. */
const apiLimiter = rateLimit({
  windowMs: config.rateLimit.apiWindowMs,
  limit: config.rateLimit.apiMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: tooMany('Demasiadas solicitudes. Intenta de nuevo en unos minutos.')
});

/**
 * Login: máximo N intentos FALLIDOS cada 15 min por combinación IP + email.
 * - skipSuccessfulRequests: un login correcto no consume intentos.
 * - Clave IP+email: un atacante no bloquea a todos los usuarios de una misma red,
 *   pero sí se frena la fuerza bruta contra una cuenta concreta.
 */
const loginLimiter = rateLimit({
  windowMs: config.rateLimit.loginWindowMs,
  limit: config.rateLimit.loginMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    return `${ipKeyGenerator(req.ip)}|${email}`;
  },
  handler: tooMany('Demasiados intentos fallidos de inicio de sesión. Intenta de nuevo en 15 minutos.')
});

/** Registro: máximo N cuentas por hora por IP (anti-spam). */
const registerLimiter = rateLimit({
  windowMs: config.rateLimit.registerWindowMs,
  limit: config.rateLimit.registerMax,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: tooMany('Demasiados registros desde esta red. Intenta de nuevo más tarde.')
});

module.exports = { apiLimiter, loginLimiter, registerLimiter };
