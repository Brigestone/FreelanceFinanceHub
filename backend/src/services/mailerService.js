const notificationLogModel = require('../models/notificationLogModel');
const { sendMail } = require('../config/mailer');
const { renderTrialEndingTemplate, renderRenewalAlertTemplate } = require('../templates/emailTemplates');

/**
 * Procesa y despacha todas las alertas pendientes (Free trials y renovaciones).
 * Garantiza idempotencia mediante notificationLogModel.
 * @returns {Promise<{processed: number, sent: number, failed: number}>}
 */
async function processAlerts() {
  const pending = await notificationLogModel.findPendingAlerts();

  let sent = 0;
  let failed = 0;

  for (const item of pending) {
    const isTrialEnding = item.is_trial === 1 && item.status === 'trial';
    const notificationType = isTrialEnding ? 'trial_ending' : 'renewal_upcoming';
    const alertForDate = isTrialEnding ? item.trial_end_date : item.renewal_date;
    const daysLeft = isTrialEnding ? item.days_to_trial_end : item.days_to_renewal;

    let subject = '';
    let html = '';

    if (isTrialEnding) {
      subject = `⚠️ Alerta: Tu prueba de ${item.service_name} finaliza en ${daysLeft === 0 ? 'hoy' : `${daysLeft} días`}`;
      html = renderTrialEndingTemplate({
        userName: item.user_name,
        serviceName: item.service_name,
        cost: item.cost,
        currency: item.currency,
        daysLeft,
        trialEndDate: String(item.trial_end_date).split('T')[0]
      });
    } else {
      subject = `🔔 Recordatorio: Renovación de ${item.service_name} en ${daysLeft === 0 ? 'hoy' : `${daysLeft} días`}`;
      html = renderRenewalAlertTemplate({
        userName: item.user_name,
        serviceName: item.service_name,
        cost: item.cost,
        currency: item.currency,
        daysLeft,
        renewalDate: String(item.renewal_date).split('T')[0],
        billingCycle: item.billing_cycle
      });
    }

    try {
      await sendMail({
        to: item.user_email,
        subject,
        html
      });

      await notificationLogModel.logNotification({
        userId: item.user_id,
        subscriptionId: item.subscription_id,
        notificationType,
        alertForDate,
        status: 'sent',
        recipientEmail: item.user_email
      });

      sent++;
    } catch (error) {
      console.error(`[Mailer] Error al enviar alerta para ${item.user_email}:`, error.message);

      await notificationLogModel.logNotification({
        userId: item.user_id,
        subscriptionId: item.subscription_id,
        notificationType,
        alertForDate,
        status: 'failed',
        recipientEmail: item.user_email,
        errorMessage: error.message
      });

      failed++;
    }
  }

  return {
    processed: pending.length,
    sent,
    failed
  };
}

module.exports = {
  processAlerts
};
