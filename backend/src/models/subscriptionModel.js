const { pool } = require('../config/db');

// Lista blanca de columnas seguras para ordenamiento (previene SQL injection)
const ALLOWED_SORT_COLUMNS = {
  cost: 's.cost',
  renewal_date: 's.renewal_date',
  trial_end_date: 's.trial_end_date',
  service_name: 's.service_name',
  status: 's.status',
  created_at: 's.created_at'
};

/**
 * Consulta suscripciones con búsqueda, filtros combinables, ordenamiento y paginación.
 */
async function findSubscriptions(userId, filters = {}) {
  const {
    search,
    status,
    categoryId,
    billingCycle,
    isTrial,
    sortBy = 'renewal_date',
    sortOrder = 'ASC',
    page = 1,
    limit = 20
  } = filters;

  let query = `
    SELECT s.*,
           c.name AS category_name,
           c.color_hex AS category_color,
           DATEDIFF(s.renewal_date, CURDATE()) AS days_until_renewal,
           CASE 
             WHEN s.is_trial = 1 AND s.trial_end_date IS NOT NULL 
             THEN DATEDIFF(s.trial_end_date, CURDATE())
             ELSE NULL 
           END AS days_until_trial_end
      FROM subscriptions s
 LEFT JOIN subscription_categories c ON c.id = s.category_id
     WHERE s.user_id = ?
  `;

  const params = [userId];

  // Búsqueda por texto (nombre del servicio, método de pago o notas)
  if (search && search.trim()) {
    query += ' AND (s.service_name LIKE ? OR s.notes LIKE ? OR s.payment_method LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term, term);
  }

  // Filtro 1: Por estado (active, trial, cancelled, paused)
  if (status && ['active', 'trial', 'cancelled', 'paused'].includes(status)) {
    query += ' AND s.status = ?';
    params.push(status);
  }

  // Filtro 2: Por categoría
  if (categoryId) {
    query += ' AND s.category_id = ?';
    params.push(Number(categoryId));
  }

  // Filtro 3 (adicional): Por ciclo de facturación
  if (billingCycle && ['monthly', 'quarterly', 'annual'].includes(billingCycle)) {
    query += ' AND s.billing_cycle = ?';
    params.push(billingCycle);
  }

  // Filtro 4: Solo trials
  if (typeof isTrial === 'boolean' || isTrial === 'true' || isTrial === '1') {
    query += ' AND s.is_trial = 1';
  }

  // Consulta de conteo total para paginación
  const countQuery = `SELECT COUNT(*) AS total FROM (${query}) AS filtered_sub`;
  const [countRows] = await pool.query(countQuery, params);
  const totalItems = countRows[0].total;

  // Ordenamiento seguro mediante lista blanca
  const safeSortColumn = ALLOWED_SORT_COLUMNS[sortBy] || ALLOWED_SORT_COLUMNS.renewal_date;
  const safeOrder = String(sortOrder).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
  query += ` ORDER BY ${safeSortColumn} ${safeOrder}`;

  // Paginación
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const offset = (safePage - 1) * safeLimit;

  query += ' LIMIT ? OFFSET ?';
  params.push(safeLimit, offset);

  const [rows] = await pool.query(query, params);

  return {
    subscriptions: rows,
    pagination: {
      totalItems,
      currentPage: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(totalItems / safeLimit)
    }
  };
}

/**
 * Obtiene una suscripción por su ID garantizando pertenencia al usuario.
 */
async function findSubscriptionById(id, userId) {
  const [rows] = await pool.execute(
    `SELECT s.*,
            c.name AS category_name,
            c.color_hex AS category_color,
            DATEDIFF(s.renewal_date, CURDATE()) AS days_until_renewal,
            CASE 
              WHEN s.is_trial = 1 AND s.trial_end_date IS NOT NULL 
              THEN DATEDIFF(s.trial_end_date, CURDATE())
              ELSE NULL 
            END AS days_until_trial_end
       FROM subscriptions s
  LEFT JOIN subscription_categories c ON c.id = s.category_id
      WHERE s.id = ? AND s.user_id = ?
      LIMIT 1`,
    [id, userId]
  );
  return rows[0] || null;
}

/**
 * Inserta una nueva suscripción.
 */
async function createSubscription(userId, data) {
  const [result] = await pool.execute(
    `INSERT INTO subscriptions (
      user_id, category_id, service_name, cost, currency,
      billing_cycle, start_date, renewal_date, is_trial,
      trial_end_date, status, payment_method, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      data.categoryId || null,
      data.serviceName,
      data.cost,
      data.currency || 'USD',
      data.billingCycle || 'monthly',
      data.startDate,
      data.renewalDate,
      data.isTrial ? 1 : 0,
      data.isTrial ? data.trialEndDate : null,
      data.status || (data.isTrial ? 'trial' : 'active'),
      data.paymentMethod || null,
      data.notes || null
    ]
  );
  return result.insertId;
}

/**
 * Actualiza una suscripción existente.
 */
async function updateSubscription(id, userId, data) {
  const [result] = await pool.execute(
    `UPDATE subscriptions SET
      category_id = ?,
      service_name = ?,
      cost = ?,
      currency = ?,
      billing_cycle = ?,
      start_date = ?,
      renewal_date = ?,
      is_trial = ?,
      trial_end_date = ?,
      status = ?,
      payment_method = ?,
      notes = ?
    WHERE id = ? AND user_id = ?`,
    [
      data.categoryId || null,
      data.serviceName,
      data.cost,
      data.currency || 'USD',
      data.billingCycle || 'monthly',
      data.startDate,
      data.renewalDate,
      data.isTrial ? 1 : 0,
      data.isTrial ? data.trialEndDate : null,
      data.status,
      data.paymentMethod || null,
      data.notes || null,
      id,
      userId
    ]
  );
  return result.affectedRows > 0;
}

/**
 * Elimina una suscripción.
 */
async function deleteSubscription(id, userId) {
  const [result] = await pool.execute(
    'DELETE FROM subscriptions WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return result.affectedRows > 0;
}

/**
 * Calcula métricas financieras consolidadas de las suscripciones activas del usuario.
 */
async function getSubscriptionMetrics(userId) {
  const [rows] = await pool.execute(
    `SELECT cost, billing_cycle, is_trial, trial_end_date, renewal_date, status
       FROM subscriptions
      WHERE user_id = ?`,
    [userId]
  );

  let monthlyProjectedCost = 0;
  let annualProjectedCost = 0;
  let activeSubscriptionsCount = 0;
  let activeTrialsCount = 0;
  let trialsExpiringIn7Days = 0;
  let renewalsIn7Days = 0;

  const now = new Date();
  const next7Days = new Date();
  next7Days.setDate(now.getDate() + 7);

  for (const sub of rows) {
    if (sub.status === 'cancelled') continue;

    const cost = Number(sub.cost) || 0;

    // Normalización de gasto a mensual y anual
    let normalizedMonthly = 0;
    if (sub.billing_cycle === 'annual') {
      normalizedMonthly = cost / 12;
    } else if (sub.billing_cycle === 'quarterly') {
      normalizedMonthly = cost / 3;
    } else {
      normalizedMonthly = cost;
    }

    if (sub.status === 'active') {
      monthlyProjectedCost += normalizedMonthly;
      annualProjectedCost += normalizedMonthly * 12;
      activeSubscriptionsCount++;
    }

    if (sub.is_trial && sub.status === 'trial') {
      activeTrialsCount++;
      if (sub.trial_end_date) {
        const trialEnd = new Date(sub.trial_end_date);
        if (trialEnd >= now && trialEnd <= next7Days) {
          trialsExpiringIn7Days++;
        }
      }
    }

    if (sub.renewal_date) {
      const renewal = new Date(sub.renewal_date);
      if (renewal >= now && renewal <= next7Days) {
        renewalsIn7Days++;
      }
    }
  }

  return {
    monthlyProjectedCost: Math.round(monthlyProjectedCost * 100) / 100,
    annualProjectedCost: Math.round(annualProjectedCost * 100) / 100,
    activeSubscriptionsCount,
    activeTrialsCount,
    trialsExpiringIn7Days,
    renewalsIn7Days,
    totalRegistered: rows.length
  };
}

/**
 * Retorna las categorías disponibles.
 */
async function getCategories() {
  const [rows] = await pool.query('SELECT id, name, color_hex FROM subscription_categories ORDER BY name ASC');
  return rows;
}

module.exports = {
  findSubscriptions,
  findSubscriptionById,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  getSubscriptionMetrics,
  getCategories,
  ALLOWED_SORT_COLUMNS
};
