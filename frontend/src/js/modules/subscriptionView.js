let categoriesList = [];
let editingSubscriptionId = null;

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
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function getStatusBadge(sub) {
  if (sub.status === 'trial') {
    const daysLeft = sub.days_until_trial_end;
    let text = 'Trial';
    if (daysLeft !== null) {
      text += daysLeft < 0 ? ' (vencido)' : ` (${daysLeft}d restantes)`;
    }
    return `<span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #fcd34d; border-color: rgba(245, 158, 11, 0.4);">${text}</span>`;
  }
  if (sub.status === 'active') {
    return `<span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #6ee7b7; border-color: rgba(16, 185, 129, 0.4);">Activa</span>`;
  }
  if (sub.status === 'paused') {
    return `<span class="badge" style="background: rgba(156, 163, 175, 0.2); color: #d1d5db; border-color: rgba(156, 163, 175, 0.4);">Pausada</span>`;
  }
  return `<span class="badge" style="background: rgba(239, 68, 68, 0.2); color: #fca5a5; border-color: rgba(239, 68, 68, 0.4);">Cancelada</span>`;
}

async function loadCategories() {
  try {
    const res = await subscriptionApi.getCategories();
    categoriesList = res.data?.categories || [];

    const filterSelect = document.getElementById('filterCategory');
    const formSelect = document.getElementById('subCategoryId');

    const options = categoriesList.map((c) => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');

    if (filterSelect) {
      filterSelect.innerHTML = '<option value="">Todas las Categorías</option>' + options;
    }
    if (formSelect) {
      formSelect.innerHTML = '<option value="">Sin Categoría</option>' + options;
    }
  } catch (err) {
    console.error('Error al cargar categorías:', err);
  }
}

async function loadMetrics() {
  try {
    const res = await subscriptionApi.getMetrics();
    const m = res.data?.metrics;
    if (!m) return;

    document.getElementById('metricMonthly').textContent = `$${m.monthlyProjectedCost.toFixed(2)}`;
    document.getElementById('metricAnnual').textContent = `$${m.annualProjectedCost.toFixed(2)}`;
    document.getElementById('metricActive').textContent = m.activeSubscriptionsCount;
    document.getElementById('metricTrials').textContent = m.activeTrialsCount;

    const trialsAlertBox = document.getElementById('trialsAlertNotice');
    if (m.trialsExpiringIn7Days > 0) {
      trialsAlertBox.style.display = 'block';
      document.getElementById('expiringTrialsCount').textContent = m.trialsExpiringIn7Days;
    } else {
      trialsAlertBox.style.display = 'none';
    }
  } catch (err) {
    console.error('Error al cargar métricas:', err);
  }
}

async function loadSubscriptions() {
  const container = document.getElementById('subscriptionsTableBody');
  if (!container) return;

  const search = document.getElementById('searchInput')?.value.trim();
  const status = document.getElementById('filterStatus')?.value;
  const categoryId = document.getElementById('filterCategory')?.value;
  const sortBy = document.getElementById('sortBySelect')?.value || 'renewal_date';
  const sortOrder = document.getElementById('sortOrderSelect')?.value || 'ASC';

  container.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-muted);">Cargando suscripciones...</td></tr>';

  try {
    const res = await subscriptionApi.getAll({
      search,
      status,
      categoryId,
      sortBy,
      sortOrder
    });

    const subs = res.data?.subscriptions || [];

    if (subs.length === 0) {
      container.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
        No se encontraron suscripciones con los filtros seleccionados.
      </td></tr>`;
      return;
    }

    container.innerHTML = subs.map((s) => `
      <tr style="border-bottom: 1px solid var(--border-color);">
        <td style="padding: 1rem 0.75rem;">
          <strong style="color: var(--text-main); font-size: 0.95rem;">${escapeHtml(s.service_name)}</strong>
          ${s.payment_method ? `<div style="color: var(--text-muted); font-size: 0.75rem;">${escapeHtml(s.payment_method)}</div>` : ''}
        </td>
        <td style="padding: 1rem 0.75rem;">
          <span style="font-weight: 700; color: var(--color-primary); font-size: 1rem;">$${Number(s.cost).toFixed(2)}</span>
          <span style="color: var(--text-muted); font-size: 0.75rem;">/${s.billing_cycle === 'annual' ? 'año' : (s.billing_cycle === 'quarterly' ? 'trim' : 'mes')}</span>
        </td>
        <td style="padding: 1rem 0.75rem;">
          ${s.category_name ? `<span class="badge" style="background: ${s.category_color}22; color: ${s.category_color}; border-color: ${s.category_color}55;">${escapeHtml(s.category_name)}</span>` : '<span style="color: var(--text-muted); font-size: 0.8rem;">-</span>'}
        </td>
        <td style="padding: 1rem 0.75rem;">
          ${getStatusBadge(s)}
        </td>
        <td style="padding: 1rem 0.75rem; font-size: 0.85rem; color: var(--text-light);">
          <div>${formatDate(s.renewal_date)}</div>
          ${s.days_until_renewal !== null ? `<small style="color: ${s.days_until_renewal <= 7 ? 'var(--color-warning)' : 'var(--text-muted)'};">${s.days_until_renewal >= 0 ? `En ${s.days_until_renewal} días` : 'Vencida'}</small>` : ''}
        </td>
        <td style="padding: 1rem 0.75rem; font-size: 0.85rem;">
          ${s.is_trial ? `${formatDate(s.trial_end_date)}` : '<span style="color: var(--text-muted);">-</span>'}
        </td>
        <td style="padding: 1rem 0.75rem; text-align: right;">
          <button class="btn btn-secondary edit-sub-btn" data-id="${s.id}" style="width: auto; padding: 0.3rem 0.6rem; font-size: 0.8rem; margin-right: 0.25rem;">Editar</button>
          <button class="btn btn-secondary delete-sub-btn" data-id="${s.id}" style="width: auto; padding: 0.3rem 0.6rem; font-size: 0.8rem; color: var(--color-danger);">✕</button>
        </td>
      </tr>
    `).join('');

    container.querySelectorAll('.edit-sub-btn').forEach((btn) => {
      btn.addEventListener('click', () => openEditModal(btn.getAttribute('data-id')));
    });

    container.querySelectorAll('.delete-sub-btn').forEach((btn) => {
      btn.addEventListener('click', () => deleteSub(btn.getAttribute('data-id')));
    });
  } catch (err) {
    container.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--color-danger); padding: 1.5rem;">Error al cargar datos: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function openCreateModal() {
  editingSubscriptionId = null;
  document.getElementById('modalTitle').textContent = 'Nueva Suscripción';
  document.getElementById('subscriptionForm').reset();
  document.getElementById('subIsTrial').checked = false;
  document.getElementById('trialDateGroup').style.display = 'none';
  document.getElementById('modalAlert').style.display = 'none';
  document.getElementById('subscriptionModal').style.display = 'flex';
}

async function openEditModal(id) {
  try {
    const res = await subscriptionApi.getById(id);
    const sub = res.data?.subscription;
    if (!sub) return;

    editingSubscriptionId = sub.id;
    document.getElementById('modalTitle').textContent = 'Editar Suscripción';
    document.getElementById('subServiceName').value = sub.service_name;
    document.getElementById('subCost').value = sub.cost;
    document.getElementById('subCurrency').value = sub.currency;
    document.getElementById('subBillingCycle').value = sub.billing_cycle;
    document.getElementById('subStartDate').value = sub.start_date.split('T')[0];
    document.getElementById('subRenewalDate').value = sub.renewal_date.split('T')[0];
    document.getElementById('subStatus').value = sub.status;
    document.getElementById('subCategoryId').value = sub.category_id || '';
    document.getElementById('subPaymentMethod').value = sub.payment_method || '';
    document.getElementById('subNotes').value = sub.notes || '';

    const isTrialCheck = document.getElementById('subIsTrial');
    isTrialCheck.checked = sub.is_trial === 1 || sub.is_trial === true;

    const trialGroup = document.getElementById('trialDateGroup');
    if (isTrialCheck.checked) {
      trialGroup.style.display = 'block';
      document.getElementById('subTrialEndDate').value = sub.trial_end_date ? sub.trial_end_date.split('T')[0] : '';
    } else {
      trialGroup.style.display = 'none';
      document.getElementById('subTrialEndDate').value = '';
    }

    document.getElementById('modalAlert').style.display = 'none';
    document.getElementById('subscriptionModal').style.display = 'flex';
  } catch (err) {
    alert('Error al obtener suscripción: ' + err.message);
  }
}

function closeModal() {
  document.getElementById('subscriptionModal').style.display = 'none';
}

async function deleteSub(id) {
  if (!confirm('¿Deseas eliminar este registro de suscripción?')) return;
  try {
    await subscriptionApi.delete(id);
    await loadSubscriptions();
    await loadMetrics();
  } catch (err) {
    alert('Error al eliminar: ' + err.message);
  }
}

function setupSubscriptionEvents() {
  let searchDebounce = null;
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(loadSubscriptions, 300);
    });
  }

  const filterStatus = document.getElementById('filterStatus');
  const filterCategory = document.getElementById('filterCategory');
  const sortBySelect = document.getElementById('sortBySelect');
  const sortOrderSelect = document.getElementById('sortOrderSelect');

  [filterStatus, filterCategory, sortBySelect, sortOrderSelect].forEach((el) => {
    if (el) el.addEventListener('change', loadSubscriptions);
  });

  const isTrialCheckbox = document.getElementById('subIsTrial');
  if (isTrialCheckbox) {
    isTrialCheckbox.addEventListener('change', (e) => {
      document.getElementById('trialDateGroup').style.display = e.target.checked ? 'block' : 'none';
      if (e.target.checked) {
        document.getElementById('subStatus').value = 'trial';
      } else {
        document.getElementById('subStatus').value = 'active';
      }
    });
  }

  // Guardar formulario
  const form = document.getElementById('subscriptionForm');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const alertBox = document.getElementById('modalAlert');
      alertBox.style.display = 'none';

      const isTrial = document.getElementById('subIsTrial').checked;
      const trialEndDate = document.getElementById('subTrialEndDate').value;

      if (isTrial && !trialEndDate) {
        alertBox.textContent = 'Indica la fecha en que termina el periodo de prueba.';
        alertBox.className = 'alert alert-danger';
        alertBox.style.display = 'block';
        return;
      }

      const payload = {
        serviceName: document.getElementById('subServiceName').value.trim(),
        cost: parseFloat(document.getElementById('subCost').value),
        currency: document.getElementById('subCurrency').value,
        billingCycle: document.getElementById('subBillingCycle').value,
        startDate: document.getElementById('subStartDate').value,
        renewalDate: document.getElementById('subRenewalDate').value,
        isTrial,
        trialEndDate: isTrial ? trialEndDate : null,
        status: document.getElementById('subStatus').value,
        categoryId: document.getElementById('subCategoryId').value ? parseInt(document.getElementById('subCategoryId').value, 10) : null,
        paymentMethod: document.getElementById('subPaymentMethod').value.trim() || null,
        notes: document.getElementById('subNotes').value.trim() || null
      };

      try {
        if (editingSubscriptionId) {
          await subscriptionApi.update(editingSubscriptionId, payload);
        } else {
          await subscriptionApi.create(payload);
        }
        closeModal();
        await loadSubscriptions();
        await loadMetrics();
      } catch (err) {
        let msg = err.message;
        if (err.data?.errors && err.data.errors.length > 0) {
          msg = err.data.errors.map((x) => x.message).join(' ');
        }
        alertBox.textContent = msg;
        alertBox.className = 'alert alert-danger';
        alertBox.style.display = 'block';
      }
    });
  }

  document.getElementById('openCreateModalBtn')?.addEventListener('click', openCreateModal);
  document.getElementById('closeModalBtn')?.addEventListener('click', closeModal);
  document.getElementById('cancelModalBtn')?.addEventListener('click', closeModal);

  // Configuración de alertas
  const alertsModal = document.getElementById('alertsModal');
  const openAlertsModalBtn = document.getElementById('openAlertsModalBtn');
  const closeAlertsModalBtn = document.getElementById('closeAlertsModalBtn');
  const cancelAlertsModalBtn = document.getElementById('cancelAlertsModalBtn');
  const alertsForm = document.getElementById('alertsSettingsForm');
  const triggerCheckNowBtn = document.getElementById('triggerCheckNowBtn');

  const closeAlertsModal = () => { if (alertsModal) alertsModal.style.display = 'none'; };

  if (openAlertsModalBtn) {
    openAlertsModalBtn.addEventListener('click', async () => {
      try {
        const res = await alertsApi.getSettings();
        const s = res.data?.settings;
        if (s) {
          document.getElementById('trialAlertDays').value = s.trial_alert_days_before;
          document.getElementById('renewalAlertDays').value = s.renewal_alert_days_before;
          document.getElementById('emailEnabledCheck').checked = s.email_enabled === 1 || s.email_enabled === true;
        }
        document.getElementById('alertsModalNotice').style.display = 'none';
        alertsModal.style.display = 'flex';
      } catch (err) {
        alert('Error al cargar configuración de alertas: ' + err.message);
      }
    });
  }

  closeAlertsModalBtn?.addEventListener('click', closeAlertsModal);
  cancelAlertsModalBtn?.addEventListener('click', closeAlertsModal);

  if (alertsForm) {
    alertsForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const notice = document.getElementById('alertsModalNotice');
      notice.style.display = 'none';

      try {
        await alertsApi.updateSettings({
          trialAlertDaysBefore: parseInt(document.getElementById('trialAlertDays').value, 10),
          renewalAlertDaysBefore: parseInt(document.getElementById('renewalAlertDays').value, 10),
          emailEnabled: document.getElementById('emailEnabledCheck').checked
        });
        notice.textContent = '¡Preferencias de alertas actualizadas correctamente!';
        notice.className = 'alert alert-success';
        notice.style.display = 'block';
        setTimeout(closeAlertsModal, 1500);
      } catch (err) {
        notice.textContent = err.message;
        notice.className = 'alert alert-danger';
        notice.style.display = 'block';
      }
    });
  }

  if (triggerCheckNowBtn) {
    triggerCheckNowBtn.addEventListener('click', async () => {
      const notice = document.getElementById('alertsModalNotice');
      triggerCheckNowBtn.disabled = true;
      triggerCheckNowBtn.textContent = 'Verificando...';

      try {
        const res = await alertsApi.triggerCheck();
        const d = res.data;
        notice.textContent = `Verificación completada: ${d.processed} evaluadas, ${d.sent} enviadas, ${d.failed} fallidas.`;
        notice.className = 'alert alert-success';
        notice.style.display = 'block';
      } catch (err) {
        notice.textContent = 'Error al ejecutar verificación: ' + err.message;
        notice.className = 'alert alert-danger';
        notice.style.display = 'block';
      } finally {
        triggerCheckNowBtn.disabled = false;
        triggerCheckNowBtn.textContent = '⚡ Probar Verificación Ahora';
      }
    });
  }
}
