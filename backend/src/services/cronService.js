const cron = require('node-cron');
const { processAlerts } = require('../services/mailerService');

let cronTask = null;

/**
 * Inicializa la tarea programada (diariamente a las 08:00 AM)
 * En modo test no se ejecuta automáticamente.
 */
function initCron() {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  // Ejecución diaria a las 08:00 AM (0 8 * * *)
  const scheduleTime = process.env.CRON_SCHEDULE || '0 8 * * *';

  cronTask = cron.schedule(scheduleTime, async () => {
    console.log('[Cron] Ejecutando verificación diaria de suscripciones y trials...');
    try {
      const summary = await processAlerts();
      console.log(`[Cron] Verificación completada. Procesadas: ${summary.processed}, Enviadas: ${summary.sent}, Fallidas: ${summary.failed}`);
    } catch (err) {
      console.error('[Cron] Error en la ejecución de alertas:', err);
    }
  });

  console.log(`⏰ Servicio de alertas automáticas (node-cron) programado: "${scheduleTime}"`);
}

function stopCron() {
  if (cronTask) {
    cronTask.stop();
  }
}

module.exports = {
  initCron,
  stopCron
};
