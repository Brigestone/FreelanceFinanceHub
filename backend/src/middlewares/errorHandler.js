const config = require('../config/env');

/**
 * Middleware centralizado de manejo de errores.
 *
 * - Errores operacionales (AppError): se devuelve su mensaje y código.
 * - Errores inesperados: 500 genérico. El detalle solo va al log del servidor
 *   (el stack se incluye en la respuesta únicamente en development).
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  // Errores del parser JSON de Express
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'El cuerpo de la solicitud no es un JSON válido.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ success: false, message: 'El cuerpo de la solicitud es demasiado grande.' });
  }

  const isOperational = err.isOperational === true;
  const statusCode = isOperational ? err.statusCode : 500;

  if (!isOperational) {
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err);
  }

  const response = {
    success: false,
    message: isOperational ? err.message : 'Error interno del servidor.'
  };
  if (isOperational && err.errors) response.errors = err.errors;
  if (!isOperational && config.isDevelopment) response.stack = err.stack;

  return res.status(statusCode).json(response);
}

module.exports = errorHandler;
