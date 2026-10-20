const calculatorService = require('../services/calculatorService');

/**
 * POST /api/v1/calculator/simulate
 * Simula el cálculo sin requerir persistencia en BD.
 */
async function simulate(req, res) {
  const result = calculatorService.simulateRate(req.body);
  res.status(200).json({
    success: true,
    data: result
  });
}

/**
 * GET /api/v1/calculator/profiles
 * Lista los perfiles guardados del usuario autenticado.
 */
async function getProfiles(req, res) {
  const profiles = await calculatorService.listProfiles(req.user.id);
  res.status(200).json({
    success: true,
    data: { profiles }
  });
}

/**
 * GET /api/v1/calculator/profiles/:id
 * Retorna el detalle completo de un perfil y su desglose.
 */
async function getProfileById(req, res) {
  const result = await calculatorService.getProfileDetail(Number(req.params.id), req.user.id);
  res.status(200).json({
    success: true,
    data: result
  });
}

/**
 * POST /api/v1/calculator/profiles
 * Guarda un nuevo perfil de cálculo y sus gastos.
 */
async function createProfile(req, res) {
  const result = await calculatorService.createNewProfile(req.user.id, req.body);
  res.status(201).json({
    success: true,
    message: 'Perfil de cálculo guardado exitosamente.',
    data: result
  });
}

/**
 * PUT /api/v1/calculator/profiles/:id
 * Actualiza un perfil existente y recalcula sus métricas.
 */
async function updateProfile(req, res) {
  const result = await calculatorService.updateExistingProfile(
    Number(req.params.id),
    req.user.id,
    req.body
  );
  res.status(200).json({
    success: true,
    message: 'Perfil de cálculo actualizado correctamente.',
    data: result
  });
}

/**
 * DELETE /api/v1/calculator/profiles/:id
 * Elimina un perfil guardado.
 */
async function deleteProfile(req, res) {
  await calculatorService.removeProfile(Number(req.params.id), req.user.id);
  res.status(200).json({
    success: true,
    message: 'Perfil eliminado con éxito.'
  });
}

module.exports = {
  simulate,
  getProfiles,
  getProfileById,
  createProfile,
  updateProfile,
  deleteProfile
};
