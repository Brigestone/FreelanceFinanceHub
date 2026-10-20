const { body, param } = require('express-validator');

const calculationInputRules = [
  body('targetMonthlyIncome')
    .isFloat({ min: 0 })
    .withMessage('El ingreso mensual deseado debe ser un número mayor o igual a 0.'),
  body('workingDaysPerWeek')
    .isInt({ min: 1, max: 7 })
    .withMessage('Los días laborales por semana deben ser un entero entre 1 y 7.'),
  body('hoursPerDay')
    .isFloat({ min: 0.1, max: 24 })
    .withMessage('Las horas de trabajo por día deben estar entre 0.1 y 24.'),
  body('vacationWeeksPerYear')
    .isInt({ min: 0, max: 50 })
    .withMessage('Las semanas de vacaciones al año deben estar entre 0 y 50.'),
  body('holidaysPerYear')
    .isInt({ min: 0, max: 100 })
    .withMessage('Los días festivos deben ser un entero positivo.'),
  body('sickLeaveDaysPerYear')
    .isInt({ min: 0, max: 100 })
    .withMessage('Los días de baja/enfermedad deben ser un entero positivo.'),
  body('billablePercentage')
    .isFloat({ min: 1, max: 100 })
    .withMessage('El porcentaje de tiempo facturable debe estar entre 1% y 100%.'),
  body('taxPercentage')
    .isFloat({ min: 0, max: 99.99 })
    .withMessage('El porcentaje de impuestos debe estar entre 0% y 99.99%.'),
  body('profitMarginPercentage')
    .isFloat({ min: 0, max: 500 })
    .withMessage('El margen de ganancia debe ser un porcentaje positivo.'),
  body('expenses')
    .optional()
    .isArray()
    .withMessage('La lista de gastos debe ser un arreglo de objetos.'),
  body('expenses.*.name')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('El nombre del gasto debe tener entre 1 y 100 caracteres.'),
  body('expenses.*.amount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('El monto del gasto debe ser un número positivo.'),
  body('expenses.*.periodicity')
    .optional()
    .isIn(['monthly', 'annual'])
    .withMessage('La periodicidad del gasto debe ser monthly o annual.'),
  body('expenses.*.expenseType')
    .optional()
    .isIn(['fixed_cost', 'software'])
    .withMessage('El tipo de gasto debe ser fixed_cost o software.')
];

const saveProfileRules = [
  body('profileName')
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre del perfil debe tener entre 2 y 100 caracteres.'),
  ...calculationInputRules
];

const profileIdParamRule = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('El ID del perfil debe ser un número entero válido.')
];

module.exports = {
  calculationInputRules,
  saveProfileRules,
  profileIdParamRule
};
