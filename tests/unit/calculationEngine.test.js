const { calculateHourlyRate } = require('../../backend/src/services/calculationEngineService');

describe('Módulo 1 - Motor Matemático de Cálculo de Tarifas por Hora', () => {
  test('1. Caso base típico con 5 días/semana, 8 hrs/día, 4 sem vacaciones, 75% facturable', () => {
    const input = {
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
        { name: 'Coworking / Oficina', amount: 200, periodicity: 'monthly', expenseType: 'fixed_cost' },
        { name: 'Internet y teléfono', amount: 50, periodicity: 'monthly', expenseType: 'fixed_cost' },
        { name: 'Licencias IDE y Adobe', amount: 600, periodicity: 'annual', expenseType: 'software' }
      ]
    };

    const result = calculateHourlyRate(input);

    expect(result.rates.minHourlyRate).toBeGreaterThan(0);
    expect(result.rates.recommendedHourlyRate).toBeGreaterThan(result.rates.minHourlyRate);

    // Gastos anuales:
    // Fijos: (200 + 50) * 12 = 3000
    // Software: 600
    // Total operativo anual: 3600
    expect(result.expensesBreakdown.annualFixedCosts).toBe(3000);
    expect(result.expensesBreakdown.annualSoftwareCosts).toBe(600);
    expect(result.expensesBreakdown.annualOperatingExpenses).toBe(3600);
    expect(result.expensesBreakdown.monthlyOperatingExpenses).toBe(300);

    // Ingresos:
    // Neto anual = 2000 * 12 = 24000
    // Con 20% impuestos: Bruto anual = 24000 / 0.8 = 30000
    // Presupuesto total = 30000 + 3600 = 33600
    expect(result.incomeBreakdown.targetNetAnnualIncome).toBe(24000);
    expect(result.incomeBreakdown.targetGrossAnnualIncome).toBe(30000);
    expect(result.incomeBreakdown.totalAnnualBudgetRequired).toBe(33600);

    // Semanas no laborables por días = (10 + 5) / 5 = 3 semanas
    // Semanas netas = 52 - 4 (vacaciones) - 3 = 45 semanas
    expect(result.timeBreakdown.netWorkingWeeksYear).toBe(45);
    // Horas brutas = 45 * 40 = 1800 horas
    expect(result.timeBreakdown.grossHoursYear).toBe(1800);
    // Horas facturables = 1800 * 0.75 = 1350 horas
    expect(result.timeBreakdown.billableHoursYear).toBe(1350);
    expect(result.timeBreakdown.billableHoursMonth).toBe(112.5);

    // Tarifa mínima = 33600 / 1350 = 24.89
    expect(result.rates.minHourlyRate).toBe(24.89);
    // Tarifa recomendada (+15%) = 24.8888... * 1.15 = 28.62
    expect(result.rates.recommendedHourlyRate).toBe(28.62);
  });

  test('2. Sin impuestos ni gastos fijos adicionales', () => {
    const input = {
      targetMonthlyIncome: 1000,
      workingDaysPerWeek: 5,
      hoursPerDay: 8,
      vacationWeeksPerYear: 0,
      holidaysPerYear: 0,
      sickLeaveDaysPerYear: 0,
      billablePercentage: 100,
      taxPercentage: 0,
      profitMarginPercentage: 0,
      expenses: []
    };

    const result = calculateHourlyRate(input);
    // 52 semanas * 40 horas = 2080 horas
    // 12000 / 2080 = 5.77
    expect(result.timeBreakdown.billableHoursYear).toBe(2080);
    expect(result.incomeBreakdown.targetGrossAnnualIncome).toBe(12000);
    expect(result.rates.minHourlyRate).toBe(5.77);
    expect(result.rates.recommendedHourlyRate).toBe(5.77);
  });

  test('3. Rechaza parámetros inválidos o fuera de rango', () => {
    expect(() => calculateHourlyRate({ targetMonthlyIncome: -500 })).toThrow();
    expect(() => calculateHourlyRate({ workingDaysPerWeek: 8 })).toThrow();
    expect(() => calculateHourlyRate({ hoursPerDay: 0 })).toThrow();
    expect(() => calculateHourlyRate({ billablePercentage: 0 })).toThrow();
    expect(() => calculateHourlyRate({ taxPercentage: 100 })).toThrow();
  });

  test('4. Detecta imposibilidad de cálculo si no quedan horas netas en el año', () => {
    expect(() => calculateHourlyRate({
      workingDaysPerWeek: 5,
      hoursPerDay: 8,
      vacationWeeksPerYear: 52, // 52 semanas de vacaciones
      billablePercentage: 100
    })).toThrow();
  });
});
