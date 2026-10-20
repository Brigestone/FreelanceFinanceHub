/**
 * Envuelve un handler async de Express para enviar los errores al errorHandler.
 * (Express 4 no captura automáticamente las promesas rechazadas.)
 */
module.exports = function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
};
