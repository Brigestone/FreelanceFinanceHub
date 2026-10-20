const { body } = require('express-validator');
const { NAME_MIN, NAME_MAX, EMAIL_MAX, checkPassword } = require('../utils/passwordPolicy');

const emailRule = () =>
  body('email')
    .exists({ values: 'falsy' }).withMessage('El correo electrónico es obligatorio.').bail()
    .isString().withMessage('El correo electrónico debe ser texto.').bail()
    .trim()
    .isLength({ max: EMAIL_MAX }).withMessage(`El correo no puede superar ${EMAIL_MAX} caracteres.`).bail()
    .isEmail().withMessage('Ingresa un correo electrónico válido.').bail()
    // Solo minúsculas; no se usa normalizeEmail() porque altera direcciones (p. ej. puntos en Gmail).
    .customSanitizer((value) => value.toLowerCase());

const registerRules = [
  body('fullName')
    .exists({ values: 'falsy' }).withMessage('El nombre es obligatorio.').bail()
    .isString().withMessage('El nombre debe ser texto.').bail()
    .trim()
    .isLength({ min: NAME_MIN, max: NAME_MAX }).withMessage(`El nombre debe tener entre ${NAME_MIN} y ${NAME_MAX} caracteres.`).bail()
    .not().matches(/[<>]/).withMessage('El nombre contiene caracteres no permitidos.'),

  emailRule(),

  body('password')
    .custom((value) => {
      const problems = checkPassword(value);
      if (problems.length > 0) throw new Error(problems.join(' '));
      return true;
    })
];

const loginRules = [
  emailRule(),
  body('password')
    .exists({ values: 'falsy' }).withMessage('La contraseña es obligatoria.').bail()
    .isString().withMessage('La contraseña debe ser texto.').bail()
    // Evita que una cadena enorme se use para consumir CPU con bcrypt.
    .isLength({ max: 200 }).withMessage('La contraseña es demasiado larga.')
];

module.exports = { registerRules, loginRules };
