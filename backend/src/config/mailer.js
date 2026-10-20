const nodemailer = require('nodemailer');
const config = require('./env');

let transporter = null;

/**
 * Obtiene o inicializa el transporte de correo.
 * En modo test utiliza un transporte simulado en memoria (nodemailer-mock o jsonTransport)
 * para evitar llamadas de red y agilizar las pruebas.
 */
function getTransporter() {
  if (transporter) return transporter;

  if (process.env.NODE_ENV === 'test') {
    transporter = nodemailer.createTransport({
      jsonTransport: true
    });
    return transporter;
  }

  // Configuración de SMTP (Ethereal / Mailtrap / Producción)
  const host = process.env.SMTP_HOST || 'smtp.ethereal.email';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  if (!user || !pass) {
    // Si no hay credenciales configuradas en desarrollo, usar un transporte de consola/JSON seguro
    transporter = nodemailer.createTransport({
      jsonTransport: true
    });
    return transporter;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass
    }
  });

  return transporter;
}

/**
 * Envía un correo electrónico formateado.
 * @param {Object} options
 * @param {string} options.to - Destinatario
 * @param {string} options.subject - Asunto
 * @param {string} options.html - Contenido HTML
 * @param {string} [options.text] - Contenido texto plano alternativo
 */
async function sendMail({ to, subject, html, text }) {
  const mailer = getTransporter();
  const from = process.env.EMAIL_FROM || 'FreelanceFinanceHub <no-reply@freelancefinancehub.local>';

  return mailer.sendMail({
    from,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]+>/g, '')
  });
}

module.exports = {
  getTransporter,
  sendMail
};
