const { pool } = require('../config/db');

/**
 * Consulta todos los usuarios para el panel de administración con búsqueda, filtros y paginación.
 */
async function findAllUsers(filters = {}) {
  const { search, role, status, page = 1, limit = 20 } = filters;

  let query = `
    SELECT u.id,
           u.full_name,
           u.email,
           u.status,
           u.created_at,
           u.updated_at,
           r.name AS role,
           (SELECT COUNT(*) FROM hourly_rate_profiles p WHERE p.user_id = u.id) AS total_profiles,
           (SELECT COUNT(*) FROM subscriptions s WHERE s.user_id = u.id) AS total_subscriptions
      FROM users u
      JOIN roles r ON r.id = u.role_id
     WHERE 1 = 1
  `;

  const params = [];

  if (search && search.trim()) {
    query += ' AND (u.full_name LIKE ? OR u.email LIKE ?)';
    const term = `%${search.trim()}%`;
    params.push(term, term);
  }

  if (role && ['admin', 'freelancer'].includes(role)) {
    query += ' AND r.name = ?';
    params.push(role);
  }

  if (status && ['active', 'suspended'].includes(status)) {
    query += ' AND u.status = ?';
    params.push(status);
  }

  const countQuery = `SELECT COUNT(*) AS total FROM (${query}) AS sub`;
  const [countRows] = await pool.query(countQuery, params);
  const totalItems = countRows[0].total;

  query += ' ORDER BY u.created_at DESC';

  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
  const offset = (safePage - 1) * safeLimit;

  query += ' LIMIT ? OFFSET ?';
  params.push(safeLimit, offset);

  const [rows] = await pool.query(query, params);

  return {
    users: rows,
    pagination: {
      totalItems,
      currentPage: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(totalItems / safeLimit)
    }
  };
}

/**
 * Recopila estadísticas globales de la plataforma.
 */
async function getGlobalMetrics() {
  const [userStats] = await pool.query(`
    SELECT 
      COUNT(*) AS total_users,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_users,
      SUM(CASE WHEN status = 'suspended' THEN 1 ELSE 0 END) AS suspended_users
    FROM users
  `);

  const [subStats] = await pool.query(`
    SELECT 
      COUNT(*) AS total_subscriptions,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_subscriptions,
      SUM(CASE WHEN status = 'trial' THEN 1 ELSE 0 END) AS trial_subscriptions,
      COALESCE(SUM(CASE 
        WHEN status = 'active' AND billing_cycle = 'monthly' THEN cost
        WHEN status = 'active' AND billing_cycle = 'annual' THEN cost / 12
        WHEN status = 'active' AND billing_cycle = 'quarterly' THEN cost / 3
        ELSE 0 
      END), 0) AS total_monthly_managed_cost
    FROM subscriptions
  `);

  const [calcStats] = await pool.query(`
    SELECT 
      COUNT(*) AS total_calculation_profiles,
      COALESCE(AVG(calculated_recommended_hourly_rate), 0) AS avg_recommended_rate,
      COALESCE(AVG(calculated_min_hourly_rate), 0) AS avg_min_rate
    FROM hourly_rate_profiles
  `);

  const [notifStats] = await pool.query(`
    SELECT 
      COUNT(*) AS total_notifications_sent,
      SUM(CASE WHEN notification_type = 'trial_ending' THEN 1 ELSE 0 END) AS trial_alerts_count,
      SUM(CASE WHEN notification_type = 'renewal_upcoming' THEN 1 ELSE 0 END) AS renewal_alerts_count
    FROM notification_logs
    WHERE status = 'sent'
  `);

  return {
    users: {
      total: userStats[0].total_users || 0,
      active: Number(userStats[0].active_users) || 0,
      suspended: Number(userStats[0].suspended_users) || 0
    },
    subscriptions: {
      total: subStats[0].total_subscriptions || 0,
      active: Number(subStats[0].active_subscriptions) || 0,
      trial: Number(subStats[0].trial_subscriptions) || 0,
      totalMonthlyManagedCost: Math.round(Number(subStats[0].total_monthly_managed_cost) * 100) / 100
    },
    calculator: {
      totalProfiles: calcStats[0].total_calculation_profiles || 0,
      avgRecommendedRate: Math.round(Number(calcStats[0].avg_recommended_rate) * 100) / 100,
      avgMinRate: Math.round(Number(calcStats[0].avg_min_rate) * 100) / 100
    },
    notifications: {
      totalSent: notifStats[0].total_notifications_sent || 0,
      trialAlerts: Number(notifStats[0].trial_alerts_count) || 0,
      renewalAlerts: Number(notifStats[0].renewal_alerts_count) || 0
    }
  };
}

/**
 * Consulta la bitácora global de auditoría para el administrador.
 */
async function getGlobalAuditLogs(limit = 100) {
  const [rows] = await pool.execute(
    `SELECT nl.*, u.full_name AS user_name, u.email AS user_email, s.service_name
       FROM notification_logs nl
       JOIN users u ON u.id = nl.user_id
  LEFT JOIN subscriptions s ON s.id = nl.subscription_id
   ORDER BY nl.sent_at DESC
      LIMIT ?`,
    [limit]
  );
  return rows;
}

module.exports = {
  findAllUsers,
  getGlobalMetrics,
  getGlobalAuditLogs
};
