/**
 * Cliente API centralizado que utiliza credenciales (cookies HttpOnly)
 */
async function apiRequest(endpoint, options = {}) {
  const defaultHeaders = {
    'Accept': 'application/json'
  };

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers
    },
    credentials: 'same-origin'
  };

  const response = await fetch(endpoint, config);
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || 'Error en la petición');
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

const authApi = {
  login: (credentials) => apiRequest('/api/v1/auth/login', { method: 'POST', body: credentials }),
  register: (userData) => apiRequest('/api/v1/auth/register', { method: 'POST', body: userData }),
  logout: () => apiRequest('/api/v1/auth/logout', { method: 'POST' }),
  getMe: () => apiRequest('/api/v1/auth/me', { method: 'GET' })
};
