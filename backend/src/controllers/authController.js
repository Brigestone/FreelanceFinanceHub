const { matchedData } = require('express-validator');
const config = require('../config/env');
const authService = require('../services/authService');

/** Opciones de la cookie de sesión. */
function cookieOptions() {
  return {
    httpOnly: true, // inaccesible desde JavaScript del navegador (mitiga robo por XSS)
    secure: config.isProduction, // solo HTTPS en producción
    sameSite: 'strict', // no se envía en peticiones originadas en otros sitios (CSRF)
    path: '/'
  };
}

function setSessionCookie(res, token) {
  res.cookie(config.cookie.name, token, { ...cookieOptions(), maxAge: config.cookie.maxAgeMs });
}

/**
 * POST /api/v1/auth/register
 * matchedData() devuelve SOLO los campos validados: si el cliente envía
 * "role": "admin" u otros campos extra, se ignoran (protección de asignación masiva).
 */
async function register(req, res) {
  const { fullName, email, password } = matchedData(req, { locations: ['body'] });
  const { user, token } = await authService.register({ fullName, email, password });
  setSessionCookie(res, token);
  res.status(201).json({ success: true, message: 'Cuenta creada correctamente.', data: { user } });
}

/** POST /api/v1/auth/login */
async function login(req, res) {
  const { email, password } = matchedData(req, { locations: ['body'] });
  const { user, token } = await authService.login({ email, password });
  setSessionCookie(res, token);
  res.status(200).json({ success: true, message: 'Sesión iniciada.', data: { user } });
}

/** POST /api/v1/auth/logout — idempotente: siempre limpia la cookie. */
function logout(req, res) {
  res.clearCookie(config.cookie.name, cookieOptions());
  res.status(200).json({ success: true, message: 'Sesión cerrada.' });
}

/** GET /api/v1/auth/me */
function me(req, res) {
  res.status(200).json({ success: true, data: { user: req.user } });
}

module.exports = { register, login, logout, me, cookieOptions };
