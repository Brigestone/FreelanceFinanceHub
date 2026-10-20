const { pool } = require('../config/db');

/**
 * Obtiene todos los perfiles de tarifas pertenecientes a un usuario.
 * @param {number} userId
 */
async function findProfilesByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT p.*,
            COUNT(e.id) AS total_expenses_count,
            COALESCE(SUM(CASE WHEN e.periodicity = 'annual' THEN e.amount ELSE e.amount * 12 END), 0) AS total_annual_expenses
       FROM hourly_rate_profiles p
  LEFT JOIN profile_expenses e ON e.profile_id = p.id
      WHERE p.user_id = ?
   GROUP BY p.id
   ORDER BY p.updated_at DESC`,
    [userId]
  );
  return rows;
}

/**
 * Obtiene un perfil específico por ID y asegura que pertenezca al usuario indicado.
 * Retorna además la lista de gastos desglosados (`profile_expenses`).
 * @param {number} profileId
 * @param {number} userId
 */
async function findProfileById(profileId, userId) {
  const [profiles] = await pool.execute(
    'SELECT * FROM hourly_rate_profiles WHERE id = ? AND user_id = ? LIMIT 1',
    [profileId, userId]
  );

  if (profiles.length === 0) return null;

  const profile = profiles[0];

  const [expenses] = await pool.execute(
    'SELECT id, name, amount, periodicity, expense_type, created_at FROM profile_expenses WHERE profile_id = ? ORDER BY id ASC',
    [profileId]
  );

  return {
    ...profile,
    expenses
  };
}

/**
 * Crea un perfil de cálculo con sus gastos asociados en UNA sola transacción atómica.
 * @param {number} userId
 * @param {Object} profileData
 * @param {Array<Object>} expenses
 * @param {Object} calculated
 */
async function createProfile(userId, profileData, expenses, calculated) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      `INSERT INTO hourly_rate_profiles (
        user_id, profile_name, target_monthly_income, working_days_per_week,
        hours_per_day, vacation_weeks_per_year, holidays_per_year,
        sick_leave_days_per_year, billable_percentage, tax_percentage,
        profit_margin_percentage, calculated_billable_hours_month,
        calculated_min_hourly_rate, calculated_recommended_hourly_rate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        profileData.profileName,
        profileData.targetMonthlyIncome,
        profileData.workingDaysPerWeek,
        profileData.hoursPerDay,
        profileData.vacationWeeksPerYear,
        profileData.holidaysPerYear,
        profileData.sickLeaveDaysPerYear,
        profileData.billablePercentage,
        profileData.taxPercentage,
        profileData.profitMarginPercentage,
        calculated.timeBreakdown.billableHoursMonth,
        calculated.rates.minHourlyRate,
        calculated.rates.recommendedHourlyRate
      ]
    );

    const profileId = result.insertId;

    if (Array.isArray(expenses) && expenses.length > 0) {
      for (const exp of expenses) {
        await connection.execute(
          'INSERT INTO profile_expenses (profile_id, name, amount, periodicity, expense_type) VALUES (?, ?, ?, ?, ?)',
          [
            profileId,
            exp.name,
            Number(exp.amount) || 0,
            exp.periodicity === 'annual' ? 'annual' : 'monthly',
            exp.expenseType === 'software' ? 'software' : 'fixed_cost'
          ]
        );
      }
    }

    await connection.commit();
    return profileId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Actualiza un perfil existente y sus gastos en una transacción.
 * @param {number} profileId
 * @param {number} userId
 * @param {Object} profileData
 * @param {Array<Object>} expenses
 * @param {Object} calculated
 */
async function updateProfile(profileId, userId, profileData, expenses, calculated) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Validar propiedad del perfil
    const [check] = await connection.execute(
      'SELECT id FROM hourly_rate_profiles WHERE id = ? AND user_id = ? LIMIT 1',
      [profileId, userId]
    );

    if (check.length === 0) {
      await connection.rollback();
      return false;
    }

    await connection.execute(
      `UPDATE hourly_rate_profiles SET
        profile_name = ?,
        target_monthly_income = ?,
        working_days_per_week = ?,
        hours_per_day = ?,
        vacation_weeks_per_year = ?,
        holidays_per_year = ?,
        sick_leave_days_per_year = ?,
        billable_percentage = ?,
        tax_percentage = ?,
        profit_margin_percentage = ?,
        calculated_billable_hours_month = ?,
        calculated_min_hourly_rate = ?,
        calculated_recommended_hourly_rate = ?
      WHERE id = ? AND user_id = ?`,
      [
        profileData.profileName,
        profileData.targetMonthlyIncome,
        profileData.workingDaysPerWeek,
        profileData.hoursPerDay,
        profileData.vacationWeeksPerYear,
        profileData.holidaysPerYear,
        profileData.sickLeaveDaysPerYear,
        profileData.billablePercentage,
        profileData.taxPercentage,
        profileData.profitMarginPercentage,
        calculated.timeBreakdown.billableHoursMonth,
        calculated.rates.minHourlyRate,
        calculated.rates.recommendedHourlyRate,
        profileId,
        userId
      ]
    );

    // Reemplazar gastos asociados
    await connection.execute('DELETE FROM profile_expenses WHERE profile_id = ?', [profileId]);

    if (Array.isArray(expenses) && expenses.length > 0) {
      for (const exp of expenses) {
        await connection.execute(
          'INSERT INTO profile_expenses (profile_id, name, amount, periodicity, expense_type) VALUES (?, ?, ?, ?, ?)',
          [
            profileId,
            exp.name,
            Number(exp.amount) || 0,
            exp.periodicity === 'annual' ? 'annual' : 'monthly',
            exp.expenseType === 'software' ? 'software' : 'fixed_cost'
          ]
        );
      }
    }

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Elimina un perfil y, por integridad referencial (ON DELETE CASCADE), sus gastos asociados.
 * @param {number} profileId
 * @param {number} userId
 */
async function deleteProfile(profileId, userId) {
  const [result] = await pool.execute(
    'DELETE FROM hourly_rate_profiles WHERE id = ? AND user_id = ?',
    [profileId, userId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  findProfilesByUserId,
  findProfileById,
  createProfile,
  updateProfile,
  deleteProfile
};
