const notificationLogModel = require('../models/notificationLogModel');
const { processAlerts } = require('../services/mailerService');

/**
 * GET /api/v1/alerts/settings
 */
async function getSettings(req, res) {
  const settings = await notificationLogModel.getSettingsByUserId(req.user.id);
  res.status(200).json({
    success: true,
    data: { settings }
  });
}

/**
 * PUT /api/v1/alerts/settings
 */
async function updateSettings(req, res) {
  const { trialAlertDaysBefore, renewalAlertDaysBefore, emailEnabled } = req.body;

  await notificationLogModel.updateSettings(req.user.id, {
    trialAlertDaysBefore: parseInt(trialAlertDaysBefore, 10),
    renewalAlertDaysBefore: parseInt(renewalAlertDaysBefore, 10),
    emailEnabled: Boolean(emailEnabled)
  });

  const updated = await notificationLogModel.getSettingsByUserId(req.user.id);
  res.status(200).json({
    success: true,
    message: 'Preferencias de alerta actualizadas.',
    data: { settings: updated }
  });
}

/**
 * GET /api/v1/alerts/history
 */
async function getHistory(req, res) {
  const logs = await notificationLogModel.getNotificationLogsByUserId(req.user.id);
  res.status(200).json({
    success: true,
    data: { logs }
  });
}

/**
 * POST /api/v1/alerts/trigger-check
 * Dispara la verificación de alertas manualmente (útil para pruebas o ejecuciones bajo demanda).
 */
async function triggerCheck(req, res) {
  const summary = await processAlerts();
  res.status(200).json({
    success: true,
    message: 'Verificación de alertas ejecutada exitosamente.',
    data: summary
  });
}

module.exports = {
  getSettings,
  updateSettings,
  getHistory,
  triggerCheck
};
