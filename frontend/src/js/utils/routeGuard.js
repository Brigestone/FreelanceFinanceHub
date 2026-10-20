/**
 * Guard de rutas del frontend.
 * Comprueba sesión activa con el endpoint /api/v1/auth/me
 */
async function checkAuth(options = { requireAuth: true, redirectTo: '/login' }) {
  try {
    const response = await authApi.getMe();
    if (response.success && response.data?.user) {
      if (!options.requireAuth && options.redirectToIfAuth) {
        window.location.href = options.redirectToIfAuth;
      }
      return response.data.user;
    }
    throw new Error('No user data');
  } catch (err) {
    if (options.requireAuth) {
      window.location.href = options.redirectTo || '/login';
    }
    return null;
  }
}
