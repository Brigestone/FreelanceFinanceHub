process.env.NODE_ENV = 'test';
process.env.DB_NAME_TEST = 'freelancefinancehub_test';
process.env.RATE_LIMIT_REGISTER_MAX = '1000';
process.env.RATE_LIMIT_LOGIN_MAX = '1000';
process.env.RATE_LIMIT_API_MAX = '100000';

const request = require('supertest');
const app = require('../../backend/src/app');
const { pool, closePool } = require('../../backend/src/config/db');

describe('Fase 5 - Pruebas de Integración: Servicio de Alertas Automáticas y Notificaciones', () => {
  let sessionCookie = '';
  let userId = null;
  let expiringTrialSubId = null;

  const testUser = {
    fullName: 'Alertas Tester',
    email: 'alertas.tester@example.com',
    password: 'Password123'
  };

  beforeAll(async () => {
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('TRUNCATE TABLE notification_logs');
    await pool.query('TRUNCATE TABLE subscriptions');
    await pool.query('TRUNCATE TABLE alert_settings');
    await pool.query('TRUNCATE TABLE users');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    const res = await request(app).post('/api/v1/auth/register').send(testUser);
    sessionCookie = res.headers['set-cookie'][0];
    userId = res.body.data.user.id;
  });

  afterAll(async () => {
    await closePool();
  });

  test('1. GET /api/v1/alerts/settings obtiene la configuración por defecto del usuario', async () => {
    const res = await request(app)
      .get('/api/v1/alerts/settings')
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.settings.trial_alert_days_before).toBe(3);
    expect(res.body.data.settings.renewal_alert_days_before).toBe(5);
    expect(res.body.data.settings.email_enabled).toBe(1);
  });

  test('2. PUT /api/v1/alerts/settings actualiza los días de anticipación de alertas', async () => {
    const res = await request(app)
      .put('/api/v1/alerts/settings')
      .set('Cookie', sessionCookie)
      .send({
        trialAlertDaysBefore: 5,
        renewalAlertDaysBefore: 7,
        emailEnabled: true
      });

    expect(res.status).toBe(200);
    expect(res.body.data.settings.trial_alert_days_before).toBe(5);
    expect(res.body.data.settings.renewal_alert_days_before).toBe(7);
  });

  test('3. Crear suscripción en periodo de prueba (trial) con fin en 2 días', async () => {
    const dateIn2Days = new Date();
    dateIn2Days.setDate(dateIn2Days.getDate() + 2);
    const trialEndDate = dateIn2Days.toISOString().split('T')[0];

    const res = await request(app)
      .post('/api/v1/subscriptions')
      .set('Cookie', sessionCookie)
      .send({
        serviceName: 'SaaS Tool Trial Urgente',
        cost: 29.99,
        currency: 'USD',
        billingCycle: 'monthly',
        startDate: '2026-10-01',
        renewalDate: trialEndDate,
        isTrial: true,
        trialEndDate: trialEndDate,
        status: 'trial',
        categoryId: 1
      });

    expect(res.status).toBe(201);
    expiringTrialSubId = res.body.data.subscription.id;
  });

  test('4. POST /api/v1/alerts/trigger-check detecta la prueba por vencer y envía la alerta', async () => {
    const res = await request(app)
      .post('/api/v1/alerts/trigger-check')
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sent).toBeGreaterThanOrEqual(1);

    // Verificar en BD que quedó registrado en notification_logs
    const [logs] = await pool.query(
      'SELECT * FROM notification_logs WHERE user_id = ? AND subscription_id = ?',
      [userId, expiringTrialSubId]
    );

    expect(logs.length).toBe(1);
    expect(logs[0].status).toBe('sent');
    expect(logs[0].notification_type).toBe('trial_ending');
    expect(logs[0].recipient_email).toBe(testUser.email);
  });

  test('5. Idempotencia: una segunda ejecución inmediata NO duplica el correo ni el log', async () => {
    const res = await request(app)
      .post('/api/v1/alerts/trigger-check')
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.processed).toBe(0);
    expect(res.body.data.sent).toBe(0);

    const [logs] = await pool.query(
      'SELECT * FROM notification_logs WHERE user_id = ? AND subscription_id = ?',
      [userId, expiringTrialSubId]
    );

    expect(logs.length).toBe(1); // Sigue siendo solo 1
  });

  test('6. GET /api/v1/alerts/history retorna la bitácora de alertas enviadas', async () => {
    const res = await request(app)
      .get('/api/v1/alerts/history')
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.logs.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.logs[0].service_name).toBe('SaaS Tool Trial Urgente');
  });
});
