function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  const parts = dateStr.split('T')[0].split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
}

async function loadAdminMetrics() {
  try {
    const res = await adminApi.getMetrics();
    const m = res.data?.metrics;
    if (!m) return;

    document.getElementById('metricTotalUsers').textContent = m.users.total;
    document.getElementById('metricActiveUsers').textContent = `${m.users.active} activos (${m.users.suspended} susp.)`;
    document.getElementById('metricTotalSubs').textContent = m.subscriptions.total;
    document.getElementById('metricTotalSubsMonthly').textContent = `$${m.subscriptions.totalMonthlyManagedCost.toFixed(2)}/mes`;
    document.getElementById('metricTotalProfiles').textContent = m.calculator.totalProfiles;
    document.getElementById('metricAvgRate').textContent = `$${m.calculator.avgRecommendedRate.toFixed(2)}/h`;
    document.getElementById('metricAlertsSent').textContent = m.notifications.totalSent;
    document.getElementById('metricAlertsDetail').textContent = `${m.notifications.trialAlerts} trials, ${m.notifications.renewalAlerts} renov.`;
  } catch (err) {
    console.error('Error al cargar métricas:', err);
  }
}

async function loadUsersTable() {
  const container = document.getElementById('usersTableBody');
  if (!container) return;

  const search = document.getElementById('searchUserInput')?.value.trim();
  const role = document.getElementById('filterUserRole')?.value;
  const status = document.getElementById('filterUserStatus')?.value;

  container.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">Cargando usuarios...</td></tr>';

  try {
    const res = await adminApi.getUsers({ search, role, status });
    const users = res.data?.users || [];

    if (users.length === 0) {
      container.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">No se encontraron usuarios.</td></tr>';
      return;
    }

    container.innerHTML = users.map((u) => `
      <tr style="border-bottom: 1px solid var(--border-color);">
        <td style="padding: 1rem 0.75rem;">
          <strong style="color: var(--text-main); font-size: 0.95rem;">${escapeHtml(u.full_name)}</strong>
          <div style="color: var(--text-muted); font-size: 0.8rem;">${escapeHtml(u.email)}</div>
        </td>
        <td style="padding: 1rem 0.75rem;">
          <span class="badge ${u.role === 'admin' ? 'badge-admin' : ''}">${escapeHtml(u.role)}</span>
        </td>
        <td style="padding: 1rem 0.75rem;">
          <span class="badge" style="background: ${u.status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; color: ${u.status === 'active' ? '#6ee7b7' : '#fca5a5'};">
            ${u.status === 'active' ? 'Activo' : 'Suspendido'}
          </span>
        </td>
        <td style="padding: 1rem 0.75rem; font-size: 0.85rem; color: var(--text-muted);">
          ${u.total_profiles} perfil(es) | ${u.total_subscriptions} suscripción(es)
        </td>
        <td style="padding: 1rem 0.75rem; font-size: 0.85rem; color: var(--text-muted);">
          ${formatDate(u.created_at)}
        </td>
        <td style="padding: 1rem 0.75rem; text-align: right;">
          <button class="btn btn-secondary toggle-status-btn" data-id="${u.id}" data-status="${u.status}" style="width: auto; padding: 0.3rem 0.6rem; font-size: 0.8rem; margin-right: 0.25rem;">
            ${u.status === 'active' ? 'Suspender' : 'Reactivar'}
          </button>
          <button class="btn btn-secondary toggle-role-btn" data-id="${u.id}" data-role="${u.role}" style="width: auto; padding: 0.3rem 0.6rem; font-size: 0.8rem;">
            Hacer ${u.role === 'admin' ? 'Freelancer' : 'Admin'}
          </button>
        </td>
      </tr>
    `).join('');

    container.querySelectorAll('.toggle-status-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const current = btn.getAttribute('data-status');
        const nextStatus = current === 'active' ? 'suspended' : 'active';
        if (!confirm(`¿Deseas cambiar el estado del usuario a "${nextStatus}"?`)) return;

        try {
          await adminApi.updateUserStatus(id, nextStatus);
          await loadUsersTable();
          await loadAdminMetrics();
        } catch (err) {
          alert('Error: ' + err.message);
        }
      });
    });

    container.querySelectorAll('.toggle-role-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const current = btn.getAttribute('data-role');
        const nextRole = current === 'admin' ? 'freelancer' : 'admin';
        if (!confirm(`¿Deseas cambiar el rol del usuario a "${nextRole}"?`)) return;

        try {
          await adminApi.updateUserRole(id, nextRole);
          await loadUsersTable();
          await loadAdminMetrics();
        } catch (err) {
          alert('Error: ' + err.message);
        }
      });
    });
  } catch (err) {
    container.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--color-danger); padding: 1.5rem;">Error al cargar usuarios: ${escapeHtml(err.message)}</td></tr>`;
  }
}

async function loadAuditLogsTable() {
  const container = document.getElementById('auditLogsTableBody');
  if (!container) return;

  try {
    const res = await adminApi.getAuditLogs();
    const logs = res.data?.logs || [];

    if (logs.length === 0) {
      container.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">Sin registros de auditoría aún.</td></tr>';
      return;
    }

    container.innerHTML = logs.map((l) => `
      <tr style="border-bottom: 1px solid var(--border-color); font-size: 0.85rem;">
        <td style="padding: 0.75rem;">${formatDate(l.sent_at)}</td>
        <td style="padding: 0.75rem;">
          <strong>${escapeHtml(l.user_name)}</strong>
          <div style="color: var(--text-muted); font-size: 0.75rem;">${escapeHtml(l.recipient_email)}</div>
        </td>
        <td style="padding: 0.75rem;">${escapeHtml(l.service_name || '-')}</td>
        <td style="padding: 0.75rem;">
          <span class="badge" style="font-size: 0.75rem;">
            ${l.notification_type === 'trial_ending' ? 'Fin de Trial' : 'Renovación'}
          </span>
        </td>
        <td style="padding: 0.75rem;">
          <span class="badge" style="background: ${l.status === 'sent' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; color: ${l.status === 'sent' ? '#6ee7b7' : '#fca5a5'}; font-size: 0.75rem;">
            ${escapeHtml(l.status)}
          </span>
        </td>
      </tr>
    `).join('');
  } catch (err) {
    container.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--color-danger); padding: 1.5rem;">Error al cargar bitácora: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function setupAdminView() {
  let searchDebounce = null;
  const searchInput = document.getElementById('searchUserInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(loadUsersTable, 300);
    });
  }

  document.getElementById('filterUserRole')?.addEventListener('change', loadUsersTable);
  document.getElementById('filterUserStatus')?.addEventListener('change', loadUsersTable);

  loadAdminMetrics();
  loadUsersTable();
  loadAuditLogsTable();
}
