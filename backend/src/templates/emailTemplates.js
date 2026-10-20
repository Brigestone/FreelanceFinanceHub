function renderTrialEndingTemplate({ userName, serviceName, cost, currency, daysLeft, trialEndDate }) {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0f19; color: #f9fafb; padding: 20px; }
        .box { max-width: 600px; margin: 0 auto; background: #111827; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 30px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; background: rgba(245, 158, 11, 0.2); color: #fcd34d; }
        .cost-card { background: #1f2937; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #f59e0b; }
        .btn { display: inline-block; background: #6366f1; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; margin-top: 15px; }
        .footer { font-size: 12px; color: #9ca3af; margin-top: 25px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px; }
      </style>
    </head>
    <body>
      <div class="box">
        <span class="badge">Alerta de Free Trial</span>
        <h2 style="color: #f9fafb; margin-top: 15px;">Tu prueba de ${serviceName} finalizará pronto</h2>
        <p>Hola <strong>${userName}</strong>,</p>
        <p>Te recordamos que tu periodo de prueba gratuito en <strong>${serviceName}</strong> finaliza en <strong>${daysLeft === 0 ? 'hoy' : `${daysLeft} día(s)`}</strong> (el ${trialEndDate}).</p>
        
        <div class="cost-card">
          <p style="margin: 0; font-size: 14px; color: #9ca3af;">Si no cancelas el servicio, se te cobrará automáticamente:</p>
          <h3 style="margin: 5px 0 0 0; color: #f59e0b; font-size: 24px;">$${Number(cost).toFixed(2)} ${currency}</h3>
        </div>

        <p>Si ya no planeas utilizar este servicio, te sugerimos cancelarlo antes de la fecha límite para evitar cargos no deseados en tu tarjeta.</p>
        <a href="http://localhost:3000/subscriptions" class="btn">Gestionar mis Suscripciones</a>

        <div class="footer">
          Mensaje automático generado por FreelanceFinanceHub para ayudarte a proteger tus finanzas profesionales.
        </div>
      </div>
    </body>
    </html>
  `;
}

function renderRenewalAlertTemplate({ userName, serviceName, cost, currency, daysLeft, renewalDate, billingCycle }) {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0b0f19; color: #f9fafb; padding: 20px; }
        .box { max-width: 600px; margin: 0 auto; background: #111827; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 30px; }
        .badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; background: rgba(99, 102, 241, 0.2); color: #a5b4fc; }
        .cost-card { background: #1f2937; border-radius: 8px; padding: 15px; margin: 20px 0; border-left: 4px solid #6366f1; }
        .btn { display: inline-block; background: #6366f1; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: bold; margin-top: 15px; }
        .footer { font-size: 12px; color: #9ca3af; margin-top: 25px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 15px; }
      </style>
    </head>
    <body>
      <div class="box">
        <span class="badge">Aviso de Renovación</span>
        <h2 style="color: #f9fafb; margin-top: 15px;">Próximo cobro de ${serviceName}</h2>
        <p>Hola <strong>${userName}</strong>,</p>
        <p>Tu suscripción a <strong>${serviceName}</strong> se renovará en <strong>${daysLeft === 0 ? 'hoy' : `${daysLeft} día(s)`}</strong> (el ${renewalDate}).</p>
        
        <div class="cost-card">
          <p style="margin: 0; font-size: 14px; color: #9ca3af;">Monto a debitar (${billingCycle}):</p>
          <h3 style="margin: 5px 0 0 0; color: #6366f1; font-size: 24px;">$${Number(cost).toFixed(2)} ${currency}</h3>
        </div>

        <a href="http://localhost:3000/subscriptions" class="btn">Ver en FreelanceFinanceHub</a>

        <div class="footer">
          Mensaje automático generado por FreelanceFinanceHub.
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = {
  renderTrialEndingTemplate,
  renderRenewalAlertTemplate
};
