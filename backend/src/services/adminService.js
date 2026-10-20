const adminModel = require('../models/adminModel');
const userModel = require('../models/userModel');
const AppError = require('../utils/AppError');

/**
 * Listar usuarios con filtros
 */
async function listUsers(filters) {
  return adminModel.findAllUsers(filters);
}

/**
 * Cambiar estado de usuario (active / suspended)
 */
async function changeUserStatus(adminUserId, targetUserId, newStatus) {
  if (adminUserId === targetUserId) {
    throw AppError.badRequest('Un administrador no puede suspender su propia cuenta.');
  }

  const target = await userModel.findById(targetUserId);
  if (!target) {
    throw AppError.notFound('Usuario no encontrado.');
  }

  await userModel.updateStatus(targetUserId, newStatus);
  return userModel.findById(targetUserId);
}

/**
 * Cambiar rol de usuario (admin / freelancer)
 */
async function changeUserRole(adminUserId, targetUserId, newRole) {
  if (adminUserId === targetUserId) {
    throw AppError.badRequest('No puedes cambiar tu propio rol de administrador.');
  }

  const target = await userModel.findById(targetUserId);
  if (!target) {
    throw AppError.notFound('Usuario no encontrado.');
  }

  await userModel.updateRole(targetUserId, newRole);
  return userModel.findById(targetUserId);
}

/**
 * Obtener métricas de plataforma
 */
async function getPlatformMetrics() {
  return adminModel.getGlobalMetrics();
}

/**
 * Obtener auditoría
 */
async function getAuditLogs() {
  return adminModel.getGlobalAuditLogs();
}

module.exports = {
  listUsers,
  changeUserStatus,
  changeUserRole,
  getPlatformMetrics,
  getAuditLogs
};
