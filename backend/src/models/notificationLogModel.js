const { pool } = require('../config/db');

/**
 * Obtiene la configuración de alertas de un usuario.
 */
async function getSettingsByUserId(userId) {
  const [rows] = await pool.execute(
    'SELECT * FROM alert_settings WHERE user_id = ? LIMIT 1',
    [userId]
  );
  return rows[0] || null;
}

/**
 * Actualiza la configuración de alertas del usuario.
 */
async function updateSettings(userId, settings) {
  const [result] = await pool.execute(
    `UPDATE alert_settings SET
      trial_alert_days_before = ?,
      renewal_alert_days_before = ?,
      email_enabled = ?
    WHERE user_id = ?`,
    [
      settings.trialAlertDaysBefore,
      settings.renewalAlertDaysBefore,
      settings.emailEnabled ? 1 : 0,
      userId
    ]
  );
  return result.affectedRows > 0;
}

/**
 * Busca suscripciones que requieren alerta hoy y que aún no han recibido notificación
 * para la fecha objetivo (garantía de idempotencia).
 */
async function findPendingAlerts() {
  const query = `
    SELECT s.id AS subscription_id,
           s.service_name,
           s.cost,
           s.currency,
           s.billing_cycle,
           s.is_trial,
           s.trial_end_date,
           s.renewal_date,
           s.status,
           u.id AS user_id,
           u.full_name AS user_name,
           u.email AS user_email,
           ast.trial_alert_days_before,
           ast.renewal_alert_days_before,
           ast.email_enabled,
           DATEDIFF(s.trial_end_date, CURDATE()) AS days_to_trial_end,
           DATEDIFF(s.renewal_date, CURDATE()) AS days_to_renewal
      FROM subscriptions s
      JOIN users u ON u.id = s.user_id
      JOIN alert_settings ast ON ast.user_id = u.id
     WHERE u.status = 'active'
       AND ast.email_enabled = 1
       AND (
         -- Caso 1: Periodo de prueba finalizando
         (
           s.is_trial = 1 
           AND s.status = 'trial' 
           AND s.trial_end_date IS NOT NULL 
           AND DATEDIFF(s.trial_end_date, CURDATE()) BETWEEN 0 AND ast.trial_alert_days_before
           AND NOT EXISTS (
             SELECT 1 FROM notification_logs nl 
              WHERE nl.user_id = u.id 
                AND nl.subscription_id = s.id 
                AND nl.notification_type = 'trial_ending' 
                AND nl.alert_for_date = s.trial_end_date
                AND nl.status = 'sent'
           )
         )
         OR
         -- Caso 2: Renovación de suscripción activa próxima
         (
           s.status = 'active' 
           AND s.renewal_date IS NOT NULL 
           AND DATEDIFF(s.renewal_date, CURDATE()) BETWEEN 0 AND ast.renewal_alert_days_before
           AND NOT EXISTS (
             SELECT 1 FROM notification_logs nl 
              WHERE nl.user_id = u.id 
                AND nl.subscription_id = s.id 
                AND nl.notification_type = 'renewal_upcoming' 
                AND nl.alert_for_date = s.renewal_date
                AND nl.status = 'sent'
           )
         )
       )
  `;

  const [rows] = await pool.query(query);
  return rows;
}

/**
 * Registra un intento de envío en la bitácora de auditoría.
 */
async function logNotification({ userId, subscriptionId, notificationType, alertForDate, status, recipientEmail, errorMessage = null }) {
  const [result] = await pool.execute(
    `INSERT INTO notification_logs (
      user_id, subscription_id, notification_type, alert_for_date, status, recipient_email, error_message
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      subscriptionId,
      notificationType,
      alertForDate,
      status,
      recipientEmail,
      errorMessage
    ]
  );
  return result.insertId;
}

/**
 * Obtiene el historial de alertas enviadas a un usuario.
 */
async function getNotificationLogsByUserId(userId, limit = 50) {
  const [rows] = await pool.execute(
    `SELECT nl.*, s.service_name 
       FROM notification_logs nl
  LEFT JOIN subscriptions s ON s.id = nl.subscription_id
      WHERE nl.user_id = ?
   ORDER BY nl.sent_at DESC
      LIMIT ?`,
    [userId, limit]
  );
  return rows;
}

module.exports = {
  getSettingsByUserId,
  updateSettings,
  findPendingAlerts,
  logNotification,
  getNotificationLogsByUserId
};
