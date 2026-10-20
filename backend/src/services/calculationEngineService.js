const AppError = require('../utils/AppError');

/**
 * Redondea un número a 2 decimales para precisión financiera.
 * @param {number} value
 * @returns {number}
 */
function roundCurrency(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
}

/**
 * Realiza el cálculo integral de la tarifa por hora a partir de las entradas.
 * 
 * @param {Object} input
 * @param {number} input.targetMonthlyIncome - Ingreso mensual neto deseado
 * @param {number} input.workingDaysPerWeek - Días laborales por semana (ej. 5)
 * @param {number} input.hoursPerDay - Horas trabajadas por día (ej. 8)
 * @param {number} input.vacationWeeksPerYear - Semanas de vacaciones al año (ej. 4)
 * @param {number} input.holidaysPerYear - Días festivos/feriados al año (ej. 12)
 * @param {number} input.sickLeaveDaysPerYear - Días de baja/enfermedad estimados al año (ej. 5)
 * @param {number} input.billablePercentage - Porcentaje de tiempo facturable (ej. 75 para 75%)
 * @param {number} input.taxPercentage - Tasa de impuestos estimada (ej. 20 para 20%)
 * @param {number} input.profitMarginPercentage - Margen de ganancia o colchón de seguridad (ej. 15 para 15%)
 * @param {Array<Object>} [input.expenses=[]] - Lista de gastos fijos y software
 *        [{ name: string, amount: number, periodicity: 'monthly'|'annual', expenseType: 'fixed_cost'|'software' }]
 * 
 * @returns {Object} Desglose completo de resultados calculados
 */
function calculateHourlyRate(input) {
  const targetMonthlyIncome = Number(input.targetMonthlyIncome) || 0;
  const workingDaysPerWeek = Number(input.workingDaysPerWeek) || 5;
  const hoursPerDay = Number(input.hoursPerDay) || 8;
  const vacationWeeksPerYear = Number(input.vacationWeeksPerYear) || 0;
  const holidaysPerYear = Number(input.holidaysPerYear) || 0;
  const sickLeaveDaysPerYear = Number(input.sickLeaveDaysPerYear) || 0;
  const billablePercentage = Number(input.billablePercentage) || 0;
  const taxPercentage = Number(input.taxPercentage) || 0;
  const profitMarginPercentage = Number(input.profitMarginPercentage) || 0;
  const expenses = Array.isArray(input.expenses) ? input.expenses : [];

  if (targetMonthlyIncome < 0) {
    throw AppError.badRequest('El ingreso mensual deseado no puede ser negativo.');
  }
  if (workingDaysPerWeek <= 0 || workingDaysPerWeek > 7) {
    throw AppError.badRequest('Los días laborales por semana deben estar entre 1 y 7.');
  }
  if (hoursPerDay <= 0 || hoursPerDay > 24) {
    throw AppError.badRequest('Las horas de trabajo por día deben estar entre 0.1 y 24.');
  }
  if (billablePercentage <= 0 || billablePercentage > 100) {
    throw AppError.badRequest('El porcentaje facturable debe ser mayor a 0 y menor o igual a 100.');
  }
  if (taxPercentage < 0 || taxPercentage >= 100) {
    throw AppError.badRequest('La tasa de impuestos debe estar entre 0 y 99.99%.');
  }
  if (profitMarginPercentage < 0) {
    throw AppError.badRequest('El margen de beneficio no puede ser negativo.');
  }

  // 1. Semanas netas de trabajo al año
  // 52 semanas - vacaciones - equivalencia en semanas de feriados y bajas por enfermedad
  const nonWorkingDays = holidaysPerYear + sickLeaveDaysPerYear;
  const nonWorkingWeeks = nonWorkingDays / workingDaysPerWeek;
  const netWorkingWeeksYear = Math.max(0, 52 - vacationWeeksPerYear - nonWorkingWeeks);

  // 2. Horas brutas anuales
  const grossHoursYear = netWorkingWeeksYear * (workingDaysPerWeek * hoursPerDay);

  // 3. Horas reales facturables al año y al mes
  const billableHoursYear = grossHoursYear * (billablePercentage / 100);
  const billableHoursMonth = billableHoursYear > 0 ? billableHoursYear / 12 : 0;

  if (billableHoursYear <= 0) {
    throw AppError.badRequest('Con los días libres y semanas de vacaciones indicadas, no quedan horas disponibles para trabajar en el año.');
  }

  // 4. Consolidar Gastos Anuales
  let annualFixedCosts = 0;
  let annualSoftwareCosts = 0;

  for (const exp of expenses) {
    const amt = Number(exp.amount) || 0;
    const factor = exp.periodicity === 'annual' ? 1 : 12;
    const annualizedAmount = amt * factor;

    if (exp.expenseType === 'software') {
      annualSoftwareCosts += annualizedAmount;
    } else {
      annualFixedCosts += annualizedAmount;
    }
  }

  const annualOperatingExpenses = annualFixedCosts + annualSoftwareCosts;
  const monthlyOperatingExpenses = annualOperatingExpenses / 12;

  // 5. Ingreso bruto requerido ajustado a impuestos
  // Ingreso Bruto Anual = Ingreso Neto Deseado Anual / (1 - (taxPercentage / 100))
  const targetNetAnnualIncome = targetMonthlyIncome * 12;
  const targetGrossAnnualIncome = taxPercentage > 0
    ? targetNetAnnualIncome / (1 - (taxPercentage / 100))
    : targetNetAnnualIncome;
  
  const estimatedAnnualTaxes = targetGrossAnnualIncome - targetNetAnnualIncome;

  // 6. Presupuesto anual requerido para operar y vivir
  const totalAnnualBudgetRequired = targetGrossAnnualIncome + annualOperatingExpenses;

  // 7. Tarifa mínima por hora (Break-even / Punto de equilibrio)
  const minHourlyRate = totalAnnualBudgetRequired / billableHoursYear;

  // 8. Tarifa recomendada (con margen de ganancia o colchón de seguridad)
  const recommendedHourlyRate = minHourlyRate * (1 + (profitMarginPercentage / 100));

  return {
    timeBreakdown: {
      netWorkingWeeksYear: roundCurrency(netWorkingWeeksYear),
      grossHoursYear: roundCurrency(grossHoursYear),
      billableHoursYear: roundCurrency(billableHoursYear),
      billableHoursMonth: roundCurrency(billableHoursMonth)
    },
    expensesBreakdown: {
      annualFixedCosts: roundCurrency(annualFixedCosts),
      annualSoftwareCosts: roundCurrency(annualSoftwareCosts),
      annualOperatingExpenses: roundCurrency(annualOperatingExpenses),
      monthlyOperatingExpenses: roundCurrency(monthlyOperatingExpenses)
    },
    incomeBreakdown: {
      targetNetMonthlyIncome: roundCurrency(targetMonthlyIncome),
      targetNetAnnualIncome: roundCurrency(targetNetAnnualIncome),
      estimatedAnnualTaxes: roundCurrency(estimatedAnnualTaxes),
      targetGrossAnnualIncome: roundCurrency(targetGrossAnnualIncome),
      totalAnnualBudgetRequired: roundCurrency(totalAnnualBudgetRequired)
    },
    rates: {
      minHourlyRate: roundCurrency(minHourlyRate),
      recommendedHourlyRate: roundCurrency(recommendedHourlyRate)
    }
  };
}

module.exports = {
  calculateHourlyRate,
  roundCurrency
};
