process.env.NODE_ENV = 'test';
process.env.DB_NAME_TEST = 'freelancefinancehub_test';
process.env.RATE_LIMIT_REGISTER_MAX = '1000';
process.env.RATE_LIMIT_LOGIN_MAX = '1000';
process.env.RATE_LIMIT_API_MAX = '100000';

const request = require('supertest');
const app = require('../../backend/src/app');
const { pool, closePool } = require('../../backend/src/config/db');

describe('Fase 2 - Pruebas de Autenticación, RBAC y Seguridad', () => {
  beforeAll(async () => {
    // Limpiar usuarios de prueba anteriores en la base _test
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('TRUNCATE TABLE notification_logs');
    await pool.query('TRUNCATE TABLE subscriptions');
    await pool.query('TRUNCATE TABLE alert_settings');
    await pool.query('TRUNCATE TABLE profile_expenses');
    await pool.query('TRUNCATE TABLE hourly_rate_profiles');
    await pool.query('TRUNCATE TABLE users');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');
  });

  afterAll(async () => {
    await closePool();
  });

  const testUser = {
    fullName: 'Freelancer de Prueba',
    email: 'freelancer.test@example.com',
    password: 'Password123'
  };

  let sessionCookie = '';

  test('1. Registro exitoso de un freelancer crea usuario y alert_settings en BD', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user.role).toBe('freelancer');
    expect(res.body.data.user.password_hash).toBeUndefined();

    // Comprobar cookie de sesión
    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toMatch(/ffh_session=/);
    expect(cookies[0]).toMatch(/HttpOnly/i);

    // Verificar en BD que alert_settings fue creado
    const [alerts] = await pool.query('SELECT * FROM alert_settings WHERE user_id = ?', [res.body.data.user.id]);
    expect(alerts.length).toBe(1);

    // Verificar que la contraseña no se guardó en texto plano
    const [dbUser] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [res.body.data.user.id]);
    expect(dbUser[0].password_hash).toMatch(/^\$2[aby]\$/);
    expect(dbUser[0].password_hash).not.toBe(testUser.password);
  });

  test('2. Registro con email duplicado devuelve 409 Conflict', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('3. Registro con contraseña débil devuelve 422 Unprocessable Entity', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Debil User',
        email: 'debil@example.com',
        password: '123'
      });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  test('4. Login exitoso con credenciales correctas devuelve 200 y cookie', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    sessionCookie = cookies[0];
  });

  test('5. Login con contraseña incorrecta devuelve 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testUser.email,
        password: 'PasswordIncorrecta999'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Credenciales inválidas.');
  });

  test('6. GET /api/v1/auth/me sin sesión devuelve 401 Unauthorized', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });

  test('7. GET /api/v1/auth/me con sesión válida devuelve datos del usuario', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.user.role).toBe('freelancer');
  });

  test('8. RBAC: Usuario freelancer intentando acceder a /api/v1/admin/ping recibe 403 Forbidden', async () => {
    const res = await request(app)
      .get('/api/v1/admin/ping')
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('9. RBAC: Si el usuario es admin, /api/v1/admin/ping responde 200 OK', async () => {
    // Promover usuario a admin en BD
    await pool.query("UPDATE users SET role_id = (SELECT id FROM roles WHERE name = 'admin') WHERE email = ?", [testUser.email]);

    const res = await request(app)
      .get('/api/v1/admin/ping')
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toContain('Acceso de administrador verificado');
  });

  test('10. Usuario suspendido recibe 403 Forbidden inmediato aunque su token siga vigente', async () => {
    // Suspender usuario en BD
    await pool.query("UPDATE users SET status = 'suspended' WHERE email = ?", [testUser.email]);

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(403);
    expect(res.body.message).toContain('cuenta está suspendida');
  });

  test('11. Logout limpia la cookie de sesión', async () => {
    const res = await request(app).post('/api/v1/auth/logout');
    expect(res.status).toBe(200);
    const cookies = res.headers['set-cookie'];
    expect(cookies[0]).toMatch(/ffh_session=;/);
  });
});
