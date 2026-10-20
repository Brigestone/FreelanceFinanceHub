const express = require('express');
const calculatorController = require('../controllers/calculatorController');
const { requireAuth } = require('../middlewares/authMiddleware');
const validate = require('../middlewares/validationMiddleware');
const {
  calculationInputRules,
  saveProfileRules,
  profileIdParamRule
} = require('../validators/calculatorValidators');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

// Todas las rutas de cálculo requieren autenticación
router.use(requireAuth);

/**
 * @route   POST /api/v1/calculator/simulate
 * @desc    Simulación interactiva sin guardar
 */
router.post(
  '/simulate',
  calculationInputRules,
  validate,
  asyncHandler(calculatorController.simulate)
);

/**
 * @route   GET /api/v1/calculator/profiles
 * @desc    Listado de perfiles guardados del usuario
 */
router.get(
  '/profiles',
  asyncHandler(calculatorController.getProfiles)
);

/**
 * @route   GET /api/v1/calculator/profiles/:id
 * @desc    Detalle de un perfil específico
 */
router.get(
  '/profiles/:id',
  profileIdParamRule,
  validate,
  asyncHandler(calculatorController.getProfileById)
);

/**
 * @route   POST /api/v1/calculator/profiles
 * @desc    Guardar un nuevo perfil de cálculo
 */
router.post(
  '/profiles',
  saveProfileRules,
  validate,
  asyncHandler(calculatorController.createProfile)
);

/**
 * @route   PUT /api/v1/calculator/profiles/:id
 * @desc    Actualizar un perfil existente
 */
router.put(
  '/profiles/:id',
  [...profileIdParamRule, ...saveProfileRules],
  validate,
  asyncHandler(calculatorController.updateProfile)
);

/**
 * @route   DELETE /api/v1/calculator/profiles/:id
 * @desc    Eliminar un perfil
 */
router.delete(
  '/profiles/:id',
  profileIdParamRule,
  validate,
  asyncHandler(calculatorController.deleteProfile)
);

module.exports = router;
