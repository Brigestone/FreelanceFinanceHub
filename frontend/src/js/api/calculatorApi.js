/**
 * Endpoints de la API para la calculadora de tarifas por hora
 */
const calculatorApi = {
  simulate: (data) => apiRequest('/api/v1/calculator/simulate', { method: 'POST', body: data }),
  getProfiles: () => apiRequest('/api/v1/calculator/profiles', { method: 'GET' }),
  getProfileById: (id) => apiRequest(`/api/v1/calculator/profiles/${id}`, { method: 'GET' }),
  createProfile: (data) => apiRequest('/api/v1/calculator/profiles', { method: 'POST', body: data }),
  updateProfile: (id, data) => apiRequest(`/api/v1/calculator/profiles/${id}`, { method: 'PUT', body: data }),
  deleteProfile: (id) => apiRequest(`/api/v1/calculator/profiles/${id}`, { method: 'DELETE' })
};
