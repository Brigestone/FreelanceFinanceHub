/**
 * Cliente API para Alertas y Notificaciones
 */
const alertsApi = {
  getSettings: () => apiRequest('/api/v1/alerts/settings', { method: 'GET' }),
  updateSettings: (data) => apiRequest('/api/v1/alerts/settings', { method: 'PUT', body: data }),
  getHistory: () => apiRequest('/api/v1/alerts/history', { method: 'GET' }),
  triggerCheck: () => apiRequest('/api/v1/alerts/trigger-check', { method: 'POST' })
};
