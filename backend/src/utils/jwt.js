const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Firma un JWT de sesión. Solo incluye el id del usuario (sub) y su rol:
 * nada de datos personales, porque el payload de un JWT no está cifrado.
 * @param {{id: number, role: string}} user
 * @returns {string}
 */
function signToken(user) {
  return jwt.sign({ role: user.role }, config.jwt.secret, {
    subject: String(user.id),
    expiresIn: config.jwt.expiresIn,
    algorithm: config.jwt.algorithm
  });
}

/**
 * Verifica firma y expiración. Solo se acepta el algoritmo configurado,
 * lo que evita ataques de tipo "alg: none" o confusión de algoritmos.
 * @param {string} token
 * @returns {{sub: string, role: string, iat: number, exp: number}}
 * @throws {jwt.JsonWebTokenError|jwt.TokenExpiredError}
 */
function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret, { algorithms: [config.jwt.algorithm] });
}

module.exports = { signToken, verifyToken };
