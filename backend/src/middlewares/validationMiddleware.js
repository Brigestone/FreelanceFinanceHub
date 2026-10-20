const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Agrupa los errores de express-validator y responde 422 con detalle por campo:
 * { success: false, message, errors: [{ field, message }] }
 */
function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array({ onlyFirstError: true }).map((e) => ({
    field: e.path,
    message: e.msg
  }));

  return next(AppError.unprocessable('Revisa los datos del formulario.', errors));
}

module.exports = validate;
