/**
 * Error operacional con código HTTP. Su mensaje es seguro para mostrarse al cliente.
 */
class AppError extends Error {
  /**
   * @param {string} message   Mensaje para el cliente.
   * @param {number} statusCode Código HTTP (4xx/5xx).
   * @param {Array<{field: string, message: string}>} [errors] Detalle por campo.
   */
  constructor(message, statusCode = 500, errors = undefined) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
  }

  static badRequest(msg = 'Solicitud inválida', errors) { return new AppError(msg, 400, errors); }
  static unauthorized(msg = 'Autenticación requerida') { return new AppError(msg, 401); }
  static forbidden(msg = 'No tienes permiso para realizar esta acción') { return new AppError(msg, 403); }
  static notFound(msg = 'Recurso no encontrado') { return new AppError(msg, 404); }
  static conflict(msg = 'El recurso ya existe') { return new AppError(msg, 409); }
  static unprocessable(msg = 'Datos inválidos', errors) { return new AppError(msg, 422, errors); }
}

module.exports = AppError;
