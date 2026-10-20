/**
 * Módulo para manejo de vistas de login y registro
 */
function setupLoginForm() {
  const form = document.getElementById('loginForm');
  const alertEl = document.getElementById('loginAlert');
  const submitBtn = document.getElementById('submitBtn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertEl.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Iniciando sesión...';

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      await authApi.login({ email, password });
      window.location.href = '/dashboard';
    } catch (error) {
      alertEl.textContent = error.message;
      alertEl.className = 'alert alert-danger';
      alertEl.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Iniciar Sesión';
    }
  });
}

function setupRegisterForm() {
  const form = document.getElementById('registerForm');
  const alertEl = document.getElementById('registerAlert');
  const submitBtn = document.getElementById('submitBtn');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    alertEl.style.display = 'none';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creando cuenta...';

    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (password !== confirmPassword) {
      alertEl.textContent = 'Las contraseñas no coinciden.';
      alertEl.className = 'alert alert-danger';
      alertEl.style.display = 'block';
      submitBtn.disabled = false;
      submitBtn.textContent = 'Crear Cuenta';
      return;
    }

    try {
      await authApi.register({ fullName, email, password });
      window.location.href = '/dashboard';
    } catch (error) {
      let msg = error.message;
      if (error.data?.errors && error.data.errors.length > 0) {
        msg = error.data.errors.map((e) => e.message).join(' ');
      }
      alertEl.textContent = msg;
      alertEl.className = 'alert alert-danger';
      alertEl.style.display = 'block';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Crear Cuenta';
    }
  });
}
