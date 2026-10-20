process.env.NODE_ENV = 'test';
process.env.DB_NAME_TEST = 'freelancefinancehub_test';
process.env.RATE_LIMIT_REGISTER_MAX = '1000';
process.env.RATE_LIMIT_LOGIN_MAX = '1000';
process.env.RATE_LIMIT_API_MAX = '100000';

const request = require('supertest');
const app = require('../../backend/src/app');
const { pool, closePool } = require('../../backend/src/config/db');

describe('Fase 3 - Pruebas de Integración: API Calculadora de Tarifas', () => {
  let sessionCookie = '';
  let otherUserCookie = '';
  let createdProfileId = null;

  const testUser = {
    fullName: 'Calculadora Tester',
    email: 'calc.tester@example.com',
    password: 'Password123'
  };

  const otherUser = {
    fullName: 'Otro Freelancer',
    email: 'other.freelancer@example.com',
    password: 'Password123'
  };

  beforeAll(async () => {
    await pool.query('SET FOREIGN_KEY_CHECKS = 0');
    await pool.query('TRUNCATE TABLE profile_expenses');
    await pool.query('TRUNCATE TABLE hourly_rate_profiles');
    await pool.query('TRUNCATE TABLE alert_settings');
    await pool.query('TRUNCATE TABLE users');
    await pool.query('SET FOREIGN_KEY_CHECKS = 1');

    // Registrar y loguear testUser
    const res1 = await request(app).post('/api/v1/auth/register').send(testUser);
    sessionCookie = res1.headers['set-cookie'][0];

    // Registrar y loguear otherUser para probar aislamiento entre usuarios
    const res2 = await request(app).post('/api/v1/auth/register').send(otherUser);
    otherUserCookie = res2.headers['set-cookie'][0];
  });

  afterAll(async () => {
    await closePool();
  });

  test('1. POST /api/v1/calculator/simulate sin autenticación retorna 401 Unauthorized', async () => {
    const res = await request(app)
      .post('/api/v1/calculator/simulate')
      .send({ targetMonthlyIncome: 2000 });

    expect(res.status).toBe(401);
  });

  test('2. POST /api/v1/calculator/simulate con datos válidos retorna desglose de tarifas sin persistir en BD', async () => {
    const simulationData = {
      targetMonthlyIncome: 2500,
      workingDaysPerWeek: 5,
      hoursPerDay: 8,
      vacationWeeksPerYear: 3,
      holidaysPerYear: 10,
      sickLeaveDaysPerYear: 4,
      billablePercentage: 70,
      taxPercentage: 22,
      profitMarginPercentage: 20,
      expenses: [
        { name: 'Licencia Adobe', amount: 55, periodicity: 'monthly', expenseType: 'software' },
        { name: 'Seguro médico', amount: 1200, periodicity: 'annual', expenseType: 'fixed_cost' }
      ]
    };

    const res = await request(app)
      .post('/api/v1/calculator/simulate')
      .set('Cookie', sessionCookie)
      .send(simulationData);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rates.minHourlyRate).toBeGreaterThan(0);
    expect(res.body.data.rates.recommendedHourlyRate).toBeGreaterThan(res.body.data.rates.minHourlyRate);
    expect(res.body.data.timeBreakdown.billableHoursYear).toBeGreaterThan(0);

    // Verificar que nada se guardó en la base de datos
    const [rows] = await pool.query('SELECT COUNT(*) AS total FROM hourly_rate_profiles');
    expect(rows[0].total).toBe(0);
  });

  test('3. POST /api/v1/calculator/profiles guarda un nuevo perfil y sus gastos', async () => {
    const newProfile = {
      profileName: 'Tarifa Estándar 2026',
      targetMonthlyIncome: 2000,
      workingDaysPerWeek: 5,
      hoursPerDay: 8,
      vacationWeeksPerYear: 4,
      holidaysPerYear: 10,
      sickLeaveDaysPerYear: 5,
      billablePercentage: 75,
      taxPercentage: 20,
      profitMarginPercentage: 15,
      expenses: [
        { name: 'Internet y celular', amount: 60, periodicity: 'monthly', expenseType: 'fixed_cost' },
        { name: 'Suscripción IDE JetBrains', amount: 150, periodicity: 'annual', expenseType: 'software' }
      ]
    };

    const res = await request(app)
      .post('/api/v1/calculator/profiles')
      .set('Cookie', sessionCookie)
      .send(newProfile);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.profileId).toBeDefined();

    createdProfileId = res.body.data.profileId;

    // Verificar en BD
    const [profiles] = await pool.query('SELECT * FROM hourly_rate_profiles WHERE id = ?', [createdProfileId]);
    expect(profiles.length).toBe(1);
    expect(profiles[0].profile_name).toBe('Tarifa Estándar 2026');

    const [expenses] = await pool.query('SELECT * FROM profile_expenses WHERE profile_id = ?', [createdProfileId]);
    expect(expenses.length).toBe(2);
  });

  test('4. GET /api/v1/calculator/profiles lista los perfiles del usuario autenticado', async () => {
    const res = await request(app)
      .get('/api/v1/calculator/profiles')
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.profiles.length).toBe(1);
    expect(res.body.data.profiles[0].profile_name).toBe('Tarifa Estándar 2026');
  });

  test('5. GET /api/v1/calculator/profiles/:id obtiene detalle completo', async () => {
    const res = await request(app)
      .get(`/api/v1/calculator/profiles/${createdProfileId}`)
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.profile.expenses.length).toBe(2);
    expect(res.body.data.breakdown.rates.minHourlyRate).toBeDefined();
  });

  test('6. Aislamiento entre usuarios: otro usuario no puede acceder al perfil ajeno (404)', async () => {
    const res = await request(app)
      .get(`/api/v1/calculator/profiles/${createdProfileId}`)
      .set('Cookie', otherUserCookie);

    expect(res.status).toBe(404);
  });

  test('7. PUT /api/v1/calculator/profiles/:id actualiza perfil y gastos', async () => {
    const updateData = {
      profileName: 'Tarifa Actualizada 2026',
      targetMonthlyIncome: 3000,
      workingDaysPerWeek: 5,
      hoursPerDay: 7,
      vacationWeeksPerYear: 5,
      holidaysPerYear: 12,
      sickLeaveDaysPerYear: 5,
      billablePercentage: 70,
      taxPercentage: 25,
      profitMarginPercentage: 20,
      expenses: [
        { name: 'Hosting cloud', amount: 40, periodicity: 'monthly', expenseType: 'software' }
      ]
    };

    const res = await request(app)
      .put(`/api/v1/calculator/profiles/${createdProfileId}`)
      .set('Cookie', sessionCookie)
      .send(updateData);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const [profiles] = await pool.query('SELECT * FROM hourly_rate_profiles WHERE id = ?', [createdProfileId]);
    expect(profiles[0].profile_name).toBe('Tarifa Actualizada 2026');
    expect(Number(profiles[0].target_monthly_income)).toBe(3000);

    const [expenses] = await pool.query('SELECT * FROM profile_expenses WHERE profile_id = ?', [createdProfileId]);
    expect(expenses.length).toBe(1);
    expect(expenses[0].name).toBe('Hosting cloud');
  });

  test('8. DELETE /api/v1/calculator/profiles/:id elimina el perfil y sus gastos (cascade)', async () => {
    const res = await request(app)
      .delete(`/api/v1/calculator/profiles/${createdProfileId}`)
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);

    const [profiles] = await pool.query('SELECT * FROM hourly_rate_profiles WHERE id = ?', [createdProfileId]);
    expect(profiles.length).toBe(0);

    const [expenses] = await pool.query('SELECT * FROM profile_expenses WHERE profile_id = ?', [createdProfileId]);
    expect(expenses.length).toBe(0);
  });
});
