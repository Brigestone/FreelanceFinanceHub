const adminService = require('../services/adminService');

/**
 * GET /api/v1/admin/users
 */
async function getUsers(req, res) {
  const result = await adminService.listUsers(req.query);
  res.status(200).json({
    success: true,
    data: result
  });
}

/**
 * PATCH /api/v1/admin/users/:id/status
 */
async function updateUserStatus(req, res) {
  const updatedUser = await adminService.changeUserStatus(
    req.user.id,
    Number(req.params.id),
    req.body.status
  );
  res.status(200).json({
    success: true,
    message: `Estado de usuario actualizado a '${req.body.status}'.`,
    data: { user: updatedUser }
  });
}

/**
 * PATCH /api/v1/admin/users/:id/role
 */
async function updateUserRole(req, res) {
  const updatedUser = await adminService.changeUserRole(
    req.user.id,
    Number(req.params.id),
    req.body.role
  );
  res.status(200).json({
    success: true,
    message: `Rol de usuario actualizado a '${req.body.role}'.`,
    data: { user: updatedUser }
  });
}

/**
 * GET /api/v1/admin/metrics
 */
async function getMetrics(req, res) {
  const metrics = await adminService.getPlatformMetrics();
  res.status(200).json({
    success: true,
    data: { metrics }
  });
}

/**
 * GET /api/v1/admin/audit-logs
 */
async function getAuditLogs(req, res) {
  const logs = await adminService.getAuditLogs();
  res.status(200).json({
    success: true,
    data: { logs }
  });
}

module.exports = {
  getUsers,
  updateUserStatus,
  updateUserRole,
  getMetrics,
  getAuditLogs
};
