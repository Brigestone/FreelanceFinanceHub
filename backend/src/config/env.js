/**
 * Configuración centralizada y validada de la aplicación.
 *
 * Se carga una sola vez (antes que cualquier otro módulo) y detiene el
 * arranque con un mensaje claro si falta alguna variable crítica.
 */
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Valores conocidos e inseguros que nunca deben usarse como secreto real.
const FORBIDDEN_SECRETS = new Set([
  'tu_clave_secreta_aqui_cambiala_en_produccion',
  'super_secret_dev_key_ffh_2026_change_in_production',
  'CAMBIAR_EJECUTANDO_npm_run_secret:generate'
]);

const MIN_SECRET_LENGTH = 32;

/**
 * Convierte una duración como "8h", "30m", "7d" o "3600" (segundos) a milisegundos.
 * @param {string} value
 * @returns {number|null}
 */
function parseDurationMs(value) {
  const match = /^(\d+)\s*([smhd]?)$/i.exec(String(value).trim());
  if (!match) return null;
  const amount = parseInt(match[1], 10);
  const unit = (match[2] || 's').toLowerCase();
  const factors = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return amount * factors[unit];
}

class ConfigError extends Error {
  constructor(problems) {
    super(
      'Configuración inválida en el archivo .env:\n' +
        problems.map((p) => `  - ${p}`).join('\n') +
        '\nRevisa .env.example para ver el formato esperado.'
    );
    this.name = 'ConfigError';
    this.problems = problems;
  }
}

function buildConfig(env = process.env) {
  const problems = [];
  const nodeEnv = env.NODE_ENV || 'development';
  const isTest = nodeEnv === 'test';
  const isProduction = nodeEnv === 'production';

  const port = parseInt(env.PORT || '3000', 10);
  if (Number.isNaN(port) || port <= 0 || port > 65535) {
    problems.push('PORT debe ser un número entre 1 y 65535.');
  }

  // --- Base de datos -------------------------------------------------------
  const database = isTest ? env.DB_NAME_TEST : env.DB_NAME;
  if (!database) {
    problems.push(isTest ? 'DB_NAME_TEST es obligatorio para ejecutar las pruebas.' : 'DB_NAME es obligatorio.');
  }
  // Salvaguarda: las pruebas borran datos, así que solo pueden usar una base *_test.
  if (isTest && database && !database.endsWith('_test')) {
    problems.push(`DB_NAME_TEST ("${database}") debe terminar en "_test" para proteger tus datos reales.`);
  }

  // --- JWT -----------------------------------------------------------------
  const jwtSecret = env.JWT_SECRET || '';
  if (!jwtSecret) {
    problems.push('JWT_SECRET es obligatorio. Genera uno con: npm run secret:generate');
  } else if (FORBIDDEN_SECRETS.has(jwtSecret)) {
    problems.push('JWT_SECRET usa un valor de ejemplo inseguro. Genera uno con: npm run secret:generate');
  } else if (jwtSecret.length < MIN_SECRET_LENGTH) {
    problems.push(`JWT_SECRET debe tener al menos ${MIN_SECRET_LENGTH} caracteres.`);
  }

  const jwtExpiresIn = env.JWT_EXPIRES_IN || '8h';
  const sessionMaxAgeMs = parseDurationMs(jwtExpiresIn);
  if (!sessionMaxAgeMs) {
    problems.push('JWT_EXPIRES_IN debe tener formato como "8h", "30m" o "1d".');
  }

  // --- Orígenes permitidos (CORS + protección CSRF) -----------------------
  const allowedOrigins = (env.APP_ORIGIN || `http://localhost:${port}`)
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  if (problems.length > 0) {
    throw new ConfigError(problems);
  }

  return Object.freeze({
    env: nodeEnv,
    isProduction,
    isTest,
    isDevelopment: nodeEnv === 'development',
    port,
    allowedOrigins,
    db: Object.freeze({
      host: env.DB_HOST || 'localhost',
      port: parseInt(env.DB_PORT || '3306', 10),
      user: env.DB_USER || 'root',
      password: env.DB_PASSWORD || '',
      database
    }),
    jwt: Object.freeze({
      secret: jwtSecret,
      expiresIn: jwtExpiresIn,
      algorithm: 'HS256'
    }),
    cookie: Object.freeze({
      name: env.COOKIE_NAME || 'ffh_session',
      maxAgeMs: sessionMaxAgeMs
    }),
    // Costo de bcrypt: 12 en uso real; 4 en pruebas para que la suite sea rápida.
    bcryptRounds: isTest ? 4 : 12,
    rateLimit: Object.freeze({
      apiMax: parseInt(env.RATE_LIMIT_API_MAX || (isTest ? '100000' : '300'), 10),
      apiWindowMs: 15 * 60 * 1000,
      loginMax: parseInt(env.RATE_LIMIT_LOGIN_MAX || '5', 10),
      loginWindowMs: 15 * 60 * 1000,
      registerMax: parseInt(env.RATE_LIMIT_REGISTER_MAX || (isTest ? '1000' : '10'), 10),
      registerWindowMs: 60 * 60 * 1000
    })
  });
}

const config = buildConfig();

module.exports = config;
module.exports.buildConfig = buildConfig;
module.exports.parseDurationMs = parseDurationMs;
module.exports.ConfigError = ConfigError;
module.exports.FORBIDDEN_SECRETS = FORBIDDEN_SECRETS;
