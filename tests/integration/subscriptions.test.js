process.env.NODE_ENV = 'test';
process.env.DB_NAME_TEST = 'freelancefinancehub_test';
process.env.RATE_LIMIT_REGISTER_MAX = '1000';
process.env.RATE_LIMIT_LOGIN_MAX = '1000';
process.env.RATE_LIMIT_API_MAX = '100000';

const request = require('supertest');
const app = require('../../backend/src/app');
const { pool, closePool } = require('../../backend/src/config/db');

describe('Fase 4 - Pruebas de Integración: API Organizador de Suscripciones', () => {
  let sessionCookie = '';
  let otherUserCookie = '';
  let createdSubId = null;
  let trialSubId = null;

  const testUser = {
    fullName: 'Suscripciones Tester',
    email: 'subs.tester@example.com',
    password: 'Password123'
  };

  const otherUser = {
    fullName: 'Otro Freelancer Subs',
    email: 'other.subs@example.com',
    password: 'Password123'
  };

  beforeAll(async () => {
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('TRUNCATE TABLE subscriptions');
    await pool.query('TRUNCATE TABLE alert_settings');
    await pool.query('TRUNCATE TABLE users');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    const res1 = await request(app).post('/api/v1/auth/register').send(testUser);
    sessionCookie = res1.headers['set-cookie'][0];

    const res2 = await request(app).post('/api/v1/auth/register').send(otherUser);
    otherUserCookie = res2.headers['set-cookie'][0];
  });

  afterAll(async () => {
    await closePool();
  });

  test('1. GET /api/v1/subscriptions/categories lista las categorías semilla', async () => {
    const res = await request(app)
      .get('/api/v1/subscriptions/categories')
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.categories.length).toBeGreaterThanOrEqual(5);
  });

  test('2. POST /api/v1/subscriptions registra una suscripción activa', async () => {
    const subData = {
      serviceName: 'Adobe Creative Cloud',
      cost: 54.99,
      currency: 'USD',
      billingCycle: 'monthly',
      startDate: '2026-01-15',
      renewalDate: '2026-11-15',
      isTrial: false,
      status: 'active',
      categoryId: 4, // Diseño & Creatividad
      paymentMethod: 'Tarjeta Visa *1234',
      notes: 'Plan completo para diseño gráfico y edición'
    };

    const res = await request(app)
      .post('/api/v1/subscriptions')
      .set('Cookie', sessionCookie)
      .send(subData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.subscription.service_name).toBe('Adobe Creative Cloud');
    expect(Number(res.body.data.subscription.cost)).toBe(54.99);

    createdSubId = res.body.data.subscription.id;
  });

  test('3. POST /api/v1/subscriptions registra un servicio en periodo de prueba (trial)', async () => {
    const trialData = {
      serviceName: 'Figma Organization Trial',
      cost: 45.00,
      currency: 'USD',
      billingCycle: 'monthly',
      startDate: '2026-10-18',
      renewalDate: '2026-11-01',
      isTrial: true,
      trialEndDate: '2026-10-25',
      status: 'trial',
      categoryId: 1, // Software & SaaS
      notes: 'Prueba gratuita de 14 días'
    };

    const res = await request(app)
      .post('/api/v1/subscriptions')
      .set('Cookie', sessionCookie)
      .send(trialData);

    expect(res.status).toBe(201);
    expect(res.body.data.subscription.is_trial).toBe(1);
    trialSubId = res.body.data.subscription.id;
  });

  test('4. GET /api/v1/subscriptions busca por texto (search)', async () => {
    const res = await request(app)
      .get('/api/v1/subscriptions?search=Adobe')
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.subscriptions.length).toBe(1);
    expect(res.body.data.subscriptions[0].service_name).toContain('Adobe');
  });

  test('5. GET /api/v1/subscriptions aplica al menos dos filtros combinables (status + categoryId)', async () => {
    // Filtro 1: status=trial, Filtro 2: categoryId=1
    const res = await request(app)
      .get('/api/v1/subscriptions?status=trial&categoryId=1')
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.subscriptions.length).toBe(1);
    expect(res.body.data.subscriptions[0].service_name).toBe('Figma Organization Trial');

    // Combinación que no coincida (status=trial & categoryId=4)
    const emptyRes = await request(app)
      .get('/api/v1/subscriptions?status=trial&categoryId=4')
      .set('Cookie', sessionCookie);

    expect(emptyRes.status).toBe(200);
    expect(emptyRes.body.data.subscriptions.length).toBe(0);
  });

  test('6. GET /api/v1/subscriptions aplica ordenamiento seguro (sortBy & sortOrder)', async () => {
    const res = await request(app)
      .get('/api/v1/subscriptions?sortBy=cost&sortOrder=DESC')
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    const subs = res.body.data.subscriptions;
    expect(subs.length).toBe(2);
    expect(Number(subs[0].cost)).toBeGreaterThanOrEqual(Number(subs[1].cost));
  });

  test('7. GET /api/v1/subscriptions/metrics/summary calcula gasto mensual y anual', async () => {
    const res = await request(app)
      .get('/api/v1/subscriptions/metrics/summary')
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const metrics = res.body.data.metrics;
    // Solo Adobe (54.99) está activo. Figma está en trial.
    expect(metrics.monthlyProjectedCost).toBe(54.99);
    expect(metrics.annualProjectedCost).toBe(Math.round(54.99 * 12 * 100) / 100);
    expect(metrics.activeSubscriptionsCount).toBe(1);
    expect(metrics.activeTrialsCount).toBe(1);
  });

  test('8. PUT /api/v1/subscriptions/:id actualiza datos de la suscripción', async () => {
    const updateData = {
      serviceName: 'Adobe Creative Cloud Pro',
      cost: 59.99,
      currency: 'USD',
      billingCycle: 'monthly',
      startDate: '2026-01-15',
      renewalDate: '2026-11-15',
      isTrial: false,
      status: 'active',
      categoryId: 4,
      paymentMethod: 'PayPal',
      notes: 'Actualizado a plan Pro'
    };

    const res = await request(app)
      .put(`/api/v1/subscriptions/${createdSubId}`)
      .set('Cookie', sessionCookie)
      .send(updateData);

    expect(res.status).toBe(200);
    expect(res.body.data.subscription.service_name).toBe('Adobe Creative Cloud Pro');
    expect(Number(res.body.data.subscription.cost)).toBe(59.99);
  });

  test('9. Aislamiento entre usuarios: usuario B no puede ver ni modificar suscripciones del usuario A', async () => {
    const resGet = await request(app)
      .get(`/api/v1/subscriptions/${createdSubId}`)
      .set('Cookie', otherUserCookie);

    expect(resGet.status).toBe(404);

    const resDel = await request(app)
      .delete(`/api/v1/subscriptions/${createdSubId}`)
      .set('Cookie', otherUserCookie);

    expect(resDel.status).toBe(404);
  });

  test('10. DELETE /api/v1/subscriptions/:id elimina la suscripción', async () => {
    const res = await request(app)
      .delete(`/api/v1/subscriptions/${createdSubId}`)
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);

    const [rows] = await pool.query('SELECT * FROM subscriptions WHERE id = ?', [createdSubId]);
    expect(rows.length).toBe(0);
  });
});
