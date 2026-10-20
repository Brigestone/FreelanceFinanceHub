/**
 * Política de contraseñas compartida por el registro (express-validator)
 * y el script de creación de administradores.
 */
const PASSWORD_MIN = 8;
const PASSWORD_MAX_BYTES = 72; // bcrypt ignora todo lo que exceda 72 bytes

const NAME_MIN = 2;
const NAME_MAX = 100;
const EMAIL_MAX = 150;

/**
 * Devuelve la lista de reglas incumplidas (vacía si la contraseña es válida).
 * @param {string} password
 * @returns {string[]}
 */
function checkPassword(password) {
  const problems = [];
  if (typeof password !== 'string' || password.length === 0) {
    return ['La contraseña es obligatoria.'];
  }
  if (password.length < PASSWORD_MIN) problems.push(`Debe tener al menos ${PASSWORD_MIN} caracteres.`);
  if (Buffer.byteLength(password, 'utf8') > PASSWORD_MAX_BYTES) problems.push(`No puede superar ${PASSWORD_MAX_BYTES} bytes.`);
  if (!/[a-z]/.test(password)) problems.push('Debe incluir al menos una letra minúscula.');
  if (!/[A-Z]/.test(password)) problems.push('Debe incluir al menos una letra mayúscula.');
  if (!/\d/.test(password)) problems.push('Debe incluir al menos un número.');
  if (/^\s|\s$/.test(password)) problems.push('No puede empezar ni terminar con espacios.');
  return problems;
}

module.exports = {
  PASSWORD_MIN,
  PASSWORD_MAX_BYTES,
  NAME_MIN,
  NAME_MAX,
  EMAIL_MAX,
  checkPassword
};
