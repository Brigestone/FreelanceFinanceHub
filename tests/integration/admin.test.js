process.env.NODE_ENV = 'test';
process.env.DB_NAME_TEST = 'freelancefinancehub_test';
process.env.RATE_LIMIT_REGISTER_MAX = '1000';
process.env.RATE_LIMIT_LOGIN_MAX = '1000';
process.env.RATE_LIMIT_API_MAX = '100000';

const request = require('supertest');
const app = require('../../backend/src/app');
const { pool, closePool } = require('../../backend/src/config/db');

describe('Fase 6 - Pruebas de Integración: Panel de Administración y Auditoría', () => {
  let adminCookie = '';
  let freelancerCookie = '';
  let adminUserId = null;
  let targetFreelancerId = null;

  const adminData = {
    fullName: 'Admin Principal',
    email: 'admin.fase6@example.com',
    password: 'Password123'
  };

  const freelancerData = {
    fullName: 'Freelancer Objetivo',
    email: 'freelancer.target@example.com',
    password: 'Password123'
  };

  beforeAll(async () => {
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('TRUNCATE TABLE notification_logs');
    await pool.query('TRUNCATE TABLE subscriptions');
    await pool.query('TRUNCATE TABLE hourly_rate_profiles');
    await pool.query('TRUNCATE TABLE alert_settings');
    await pool.query('TRUNCATE TABLE users');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    // Registrar admin y promoverlo directamente en BD
    const resAdmin = await request(app).post('/api/v1/auth/register').send(adminData);
    adminCookie = resAdmin.headers['set-cookie'][0];
    adminUserId = resAdmin.body.data.user.id;
    await pool.query("UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'admin') WHERE id = ?", [adminUserId]);

    // Registrar freelancer
    const resFree = await request(app).post('/api/v1/auth/register').send(freelancerData);
    freelancerCookie = resFree.headers['set-cookie'][0];
    targetFreelancerId = resFree.body.data.user.id;
  });

  afterAll(async () => {
    await closePool();
  });

  test('1. Freelancer estándar no puede acceder a las rutas de administración (403 Forbidden)', async () => {
    const resUsers = await request(app)
      .get('/api/v1/admin/users')
      .set('Cookie', freelancerCookie);

    expect(resUsers.status).toBe(403);

    const resMetrics = await request(app)
      .get('/api/v1/admin/metrics')
      .set('Cookie', freelancerCookie);

    expect(resMetrics.status).toBe(403);
  });

  test('2. GET /api/v1/admin/metrics retorna métricas globales de la plataforma', async () => {
    const res = await request(app)
      .get('/api/v1/admin/metrics')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const m = res.body.data.metrics;
    expect(m.users.total).toBe(2);
    expect(m.users.active).toBe(2);
    expect(m.subscriptions).toBeDefined();
    expect(m.calculator).toBeDefined();
    expect(m.notifications).toBeDefined();
  });

  test('3. GET /api/v1/admin/users lista todos los usuarios con filtros', async () => {
    const res = await request(app)
      .get('/api/v1/admin/users?role=freelancer')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.users.length).toBe(1);
    expect(res.body.data.users[0].email).toBe(freelancerData.email);
  });

  test('4. PATCH /api/v1/admin/users/:id/status suspende la cuenta de un usuario', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/users/${targetFreelancerId}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'suspended' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.status).toBe('suspended');

    // Verificar que el usuario suspendido ya no puede hacer peticiones autenticadas
    const checkRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', freelancerCookie);

    expect(checkRes.status).toBe(403);
    expect(checkRes.body.message).toContain('cuenta está suspendida');
  });

  test('5. PATCH /api/v1/admin/users/:id/status reactiva la cuenta del usuario', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/users/${targetFreelancerId}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'active' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.status).toBe('active');

    // El usuario puede acceder de nuevo
    const checkRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', freelancerCookie);

    expect(checkRes.status).toBe(200);
  });

  test('6. Regla de seguridad: un administrador no puede suspender su propia cuenta (400 Bad Request)', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/users/${adminUserId}/status`)
      .set('Cookie', adminCookie)
      .send({ status: 'suspended' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('no puede suspender su propia cuenta');
  });

  test('7. PATCH /api/v1/admin/users/:id/role cambia el rol a admin', async () => {
    const res = await request(app)
      .patch(`/api/v1/admin/users/${targetFreelancerId}/role`)
      .set('Cookie', adminCookie)
      .send({ role: 'admin' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.role).toBe('admin');
  });

  test('8. GET /api/v1/admin/audit-logs retorna la bitácora global', async () => {
    const res = await request(app)
      .get('/api/v1/admin/audit-logs')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.logs).toBeDefined();
  });
});
