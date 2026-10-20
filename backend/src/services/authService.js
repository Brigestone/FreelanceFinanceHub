const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const config = require('../config/env');
const userModel = require('../models/userModel');
const AppError = require('../utils/AppError');
const { signToken } = require('../utils/jwt');

const INVALID_CREDENTIALS = 'Credenciales inválidas.';

// Hash señuelo: se compara cuando el email no existe para que la respuesta tarde
// lo mismo que con un email real (evita descubrir cuentas midiendo tiempos).
let dummyHashPromise = null;
function getDummyHash() {
  if (!dummyHashPromise) {
    dummyHashPromise = bcrypt.hash(crypto.randomBytes(16).toString('hex'), config.bcryptRounds);
  }
  return dummyHashPromise;
}

/** Hashea una contraseña con el costo configurado. */
function hashPassword(plain) {
  return bcrypt.hash(plain, config.bcryptRounds);
}

/**
 * Registra un usuario estándar (freelancer). El rol NUNCA proviene del cliente.
 * @param {{fullName: string, email: string, password: string}} data
 */
async function register({ fullName, email, password }) {
  const existing = await userModel.findByEmail(email);
  if (existing) {
    throw AppError.conflict('Ya existe una cuenta registrada con ese correo electrónico.');
  }

  const passwordHash = await hashPassword(password);
  const id = await userModel.createWithAlertSettings({ fullName, email, passwordHash, roleName: 'freelancer' });
  const user = userModel.toPublicUser(await userModel.findById(id));

  return { user, token: signToken(user) };
}

/**
 * Valida credenciales y emite un token.
 * @param {{email: string, password: string}} data
 */
async function login({ email, password }) {
  const row = await userModel.findAuthByEmail(email);

  if (!row) {
    await bcrypt.compare(password, await getDummyHash());
    throw AppError.unauthorized(INVALID_CREDENTIALS);
  }

  const passwordOk = await bcrypt.compare(password, row.password_hash);
  if (!passwordOk) {
    throw AppError.unauthorized(INVALID_CREDENTIALS);
  }

  // Se comprueba DESPUÉS de la contraseña para no revelar el estado a terceros.
  if (row.status !== 'active') {
    throw AppError.forbidden('Tu cuenta está suspendida. Contacta al administrador.');
  }

  const user = userModel.toPublicUser(row);
  return { user, token: signToken(user) };
}

/** Perfil público del usuario autenticado. */
async function getProfile(userId) {
  const row = await userModel.findById(userId);
  if (!row) throw AppError.notFound('Usuario no encontrado.');
  return userModel.toPublicUser(row);
}

module.exports = {
  register,
  login,
  getProfile,
  hashPassword,
  INVALID_CREDENTIALS
};
