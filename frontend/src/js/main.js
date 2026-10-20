// ==========================================================================
// FreelanceFinanceHub - Script Inicial de Comprobación
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
  const checkHealthBtn = document.getElementById('checkHealthBtn');
  const healthResult = document.getElementById('healthResult');

  if (checkHealthBtn && healthResult) {
    checkHealthBtn.addEventListener('click', async () => {
      healthResult.style.display = 'block';
      healthResult.textContent = 'Consultando endpoint /api/v1/health...';

      try {
        const response = await fetch('/api/v1/health');
        const data = await response.json();

        healthResult.textContent = JSON.stringify(data, null, 2);
        if (response.ok && data.database && data.database.connected) {
          healthResult.style.borderLeft = '4px solid #10b981';
        } else {
          healthResult.style.borderLeft = '4px solid #f59e0b';
        }
      } catch (error) {
        healthResult.style.borderLeft = '4px solid #ef4444';
        healthResult.textContent = `Error al consultar la API: ${error.message}\nVerifica que el servidor Node.js esté en ejecución.`;
      }
    });
  }
});
