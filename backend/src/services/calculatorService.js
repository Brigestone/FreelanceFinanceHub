const calculationModel = require('../models/calculationModel');
const { calculateHourlyRate } = require('../services/calculationEngineService');
const AppError = require('../utils/AppError');

/**
 * Simula el cálculo en tiempo real sin persistir en base de datos.
 */
function simulateRate(data) {
  return calculateHourlyRate(data);
}

/**
 * Obtiene todos los perfiles de un usuario.
 */
async function listProfiles(userId) {
  return calculationModel.findProfilesByUserId(userId);
}

/**
 * Obtiene el detalle de un perfil con desglose recalculado actualizado.
 */
async function getProfileDetail(profileId, userId) {
  const profile = await calculationModel.findProfileById(profileId, userId);
  if (!profile) {
    throw AppError.notFound('Perfil de cálculo no encontrado.');
  }

  // Recalcular métricas en vivo para devolver desglose completo
  const calculated = calculateHourlyRate({
    targetMonthlyIncome: profile.target_monthly_income,
    workingDaysPerWeek: profile.working_days_per_week,
    hoursPerDay: profile.hours_per_day,
    vacationWeeksPerYear: profile.vacation_weeks_per_year,
    holidaysPerYear: profile.holidays_per_year,
    sickLeaveDaysPerYear: profile.sick_leave_days_per_year,
    billablePercentage: profile.billable_percentage,
    taxPercentage: profile.tax_percentage,
    profitMarginPercentage: profile.profit_margin_percentage,
    expenses: profile.expenses.map((e) => ({
      name: e.name,
      amount: e.amount,
      periodicity: e.periodicity,
      expenseType: e.expense_type
    }))
  });

  return {
    profile,
    breakdown: calculated
  };
}

/**
 * Crea un nuevo perfil de tarifas.
 */
async function createNewProfile(userId, body) {
  const { profileName, expenses, ...rateParams } = body;

  const calculated = calculateHourlyRate({
    ...rateParams,
    expenses
  });

  const profileId = await calculationModel.createProfile(
    userId,
    {
      profileName,
      ...rateParams
    },
    expenses,
    calculated
  );

  return {
    profileId,
    breakdown: calculated
  };
}

/**
 * Actualiza un perfil existente.
 */
async function updateExistingProfile(profileId, userId, body) {
  const { profileName, expenses, ...rateParams } = body;

  const calculated = calculateHourlyRate({
    ...rateParams,
    expenses
  });

  const updated = await calculationModel.updateProfile(
    profileId,
    userId,
    {
      profileName,
      ...rateParams
    },
    expenses,
    calculated
  );

  if (!updated) {
    throw AppError.notFound('Perfil de cálculo no encontrado o no autorizado.');
  }

  return {
    profileId,
    breakdown: calculated
  };
}

/**
 * Elimina un perfil.
 */
async function removeProfile(profileId, userId) {
  const deleted = await calculationModel.deleteProfile(profileId, userId);
  if (!deleted) {
    throw AppError.notFound('Perfil de cálculo no encontrado o no autorizado.');
  }
  return true;
}

module.exports = {
  simulateRate,
  listProfiles,
  getProfileDetail,
  createNewProfile,
  updateExistingProfile,
  removeProfile
};
