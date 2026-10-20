/**
 * API client para Suscripciones
 */
const subscriptionApi = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        qs.append(k, v);
      }
    });
    const url = `/api/v1/subscriptions${qs.toString() ? '?' + qs.toString() : ''}`;
    return apiRequest(url, { method: 'GET' });
  },
  getById: (id) => apiRequest(`/api/v1/subscriptions/${id}`, { method: 'GET' }),
  create: (data) => apiRequest('/api/v1/subscriptions', { method: 'POST', body: data }),
  update: (id, data) => apiRequest(`/api/v1/subscriptions/${id}`, { method: 'PUT', body: data }),
  delete: (id) => apiRequest(`/api/v1/subscriptions/${id}`, { method: 'DELETE' }),
  getMetrics: () => apiRequest('/api/v1/subscriptions/metrics/summary', { method: 'GET' }),
  getCategories: () => apiRequest('/api/v1/subscriptions/categories', { method: 'GET' })
};
