/**
 * Cliente API para el Panel Administrativo
 */
const adminApi = {
  getMetrics: () => apiRequest('/api/v1/admin/metrics', { method: 'GET' }),
  getUsers: (params = {}) => {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        qs.append(k, v);
      }
    });
    return apiRequest(`/api/v1/admin/users${qs.toString() ? '?' + qs.toString() : ''}`, { method: 'GET' });
  },
  updateUserStatus: (id, status) => apiRequest(`/api/v1/admin/users/${id}/status`, { method: 'PATCH', body: { status } }),
  updateUserRole: (id, role) => apiRequest(`/api/v1/admin/users/${id}/role`, { method: 'PATCH', body: { role } }),
  getAuditLogs: () => apiRequest('/api/v1/admin/audit-logs', { method: 'GET' })
};
