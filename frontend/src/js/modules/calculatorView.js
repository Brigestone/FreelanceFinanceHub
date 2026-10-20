let expensesList = [];
let currentEditingProfileId = null;

function renderExpenses() {
  const container = document.getElementById('expensesListContainer');
  if (!container) return;

  if (expensesList.length === 0) {
    container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.85rem; font-style: italic;">No has agregado gastos operativos.</p>';
    return;
  }

  container.innerHTML = expensesList.map((exp, index) => `
    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.6rem 0.8rem; background: var(--bg-input); border-radius: var(--radius-sm); margin-bottom: 0.5rem; font-size: 0.9rem;">
      <div>
        <strong>${escapeHtml(exp.name)}</strong>
        <span style="color: var(--text-muted); font-size: 0.8rem; margin-left: 0.5rem;">
          (${exp.expenseType === 'software' ? 'Software' : 'Fijo'} - ${exp.periodicity === 'annual' ? 'Anual' : 'Mensual'})
        </span>
      </div>
      <div style="display: flex; align-items: center; gap: 0.8rem;">
        <span style="color: var(--color-primary); font-weight: 600;">$${Number(exp.amount).toFixed(2)}</span>
        <button type="button" class="btn btn-secondary delete-exp-btn" data-index="${index}" style="width: auto; padding: 0.2rem 0.5rem; font-size: 0.75rem; color: var(--color-danger);">✕</button>
      </div>
    </div>
  `).join('');

  container.querySelectorAll('.delete-exp-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const idx = parseInt(btn.getAttribute('data-index'), 10);
      expensesList.splice(idx, 1);
      renderExpenses();
      triggerLiveSimulation();
    });
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[m]);
}

function getCalculatorFormData() {
  return {
    profileName: document.getElementById('profileName')?.value.trim() || 'Mi Perfil de Tarifa',
    targetMonthlyIncome: parseFloat(document.getElementById('targetMonthlyIncome').value) || 0,
    workingDaysPerWeek: parseInt(document.getElementById('workingDaysPerWeek').value, 10) || 5,
    hoursPerDay: parseFloat(document.getElementById('hoursPerDay').value) || 8,
    vacationWeeksPerYear: parseInt(document.getElementById('vacationWeeksPerYear').value, 10) || 0,
    holidaysPerYear: parseInt(document.getElementById('holidaysPerYear').value, 10) || 0,
    sickLeaveDaysPerYear: parseInt(document.getElementById('sickLeaveDaysPerYear').value, 10) || 0,
    billablePercentage: parseFloat(document.getElementById('billablePercentage').value) || 75,
    taxPercentage: parseFloat(document.getElementById('taxPercentage').value) || 20,
    profitMarginPercentage: parseFloat(document.getElementById('profitMarginPercentage').value) || 15,
    expenses: expensesList
  };
}

let simulationTimeout = null;
function triggerLiveSimulation() {
  clearTimeout(simulationTimeout);
  simulationTimeout = setTimeout(async () => {
    const data = getCalculatorFormData();
    try {
      const res = await calculatorApi.simulate(data);
      if (res.success && res.data) {
        updateResultsUI(res.data);
      }
    } catch (err) {
      // Silenciar errores durante tipeo continuo
    }
  }, 250);
}

function updateResultsUI(data) {
  document.getElementById('resMinRate').textContent = `$${data.rates.minHourlyRate.toFixed(2)}`;
  document.getElementById('resRecRate').textContent = `$${data.rates.recommendedHourlyRate.toFixed(2)}`;
  document.getElementById('resBillableHoursYear').textContent = `${data.timeBreakdown.billableHoursYear} hrs`;
  document.getElementById('resBillableHoursMonth').textContent = `${data.timeBreakdown.billableHoursMonth} hrs`;
  document.getElementById('resAnnualOperating').textContent = `$${data.expensesBreakdown.annualOperatingExpenses.toFixed(2)}`;
  document.getElementById('resAnnualTaxes').textContent = `$${data.incomeBreakdown.estimatedAnnualTaxes.toFixed(2)}`;
  document.getElementById('resTotalBudget').textContent = `$${data.incomeBreakdown.totalAnnualBudgetRequired.toFixed(2)}`;
}

async function loadSavedProfiles() {
  const container = document.getElementById('savedProfilesContainer');
  if (!container) return;

  try {
    const res = await calculatorApi.getProfiles();
    const profiles = res.data?.profiles || [];

    if (profiles.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">No tienes escenarios de tarifa guardados aún.</p>';
      return;
    }

    container.innerHTML = profiles.map((p) => `
      <div class="card" style="margin-bottom: 1rem; padding: 1.25rem; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <h4 style="color: var(--text-main); margin-bottom: 0.25rem;">${escapeHtml(p.profile_name)}</h4>
          <p style="color: var(--text-muted); font-size: 0.85rem;">
            Tarifa rec.: <strong style="color: var(--color-success); font-size: 1rem;">$${Number(p.calculated_recommended_hourly_rate).toFixed(2)}/h</strong>
            | Mín.: $${Number(p.calculated_min_hourly_rate).toFixed(2)}/h
            | Horas/mes: ${p.calculated_billable_hours_month} h
          </p>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button class="btn btn-secondary load-profile-btn" data-id="${p.id}" style="width: auto; padding: 0.4rem 0.8rem; font-size: 0.85rem;">Cargar</button>
          <button class="btn btn-secondary delete-profile-btn" data-id="${p.id}" style="width: auto; padding: 0.4rem 0.8rem; font-size: 0.85rem; color: var(--color-danger);">Eliminar</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.load-profile-btn').forEach((btn) => {
      btn.addEventListener('click', () => loadProfileDetail(btn.getAttribute('data-id')));
    });

    container.querySelectorAll('.delete-profile-btn').forEach((btn) => {
      btn.addEventListener('click', () => deleteProfile(btn.getAttribute('data-id')));
    });
  } catch (err) {
    container.innerHTML = `<p style="color: var(--color-danger); font-size: 0.9rem;">Error al cargar perfiles: ${escapeHtml(err.message)}</p>`;
  }
}

async function loadProfileDetail(profileId) {
  try {
    const res = await calculatorApi.getProfileById(profileId);
    if (!res.success || !res.data) return;

    const p = res.data.profile;
    currentEditingProfileId = p.id;

    document.getElementById('profileName').value = p.profile_name;
    document.getElementById('targetMonthlyIncome').value = p.target_monthly_income;
    document.getElementById('workingDaysPerWeek').value = p.working_days_per_week;
    document.getElementById('hoursPerDay').value = p.hours_per_day;
    document.getElementById('vacationWeeksPerYear').value = p.vacation_weeks_per_year;
    document.getElementById('holidaysPerYear').value = p.holidays_per_year;
    document.getElementById('sickLeaveDaysPerYear').value = p.sick_leave_days_per_year;
    document.getElementById('billablePercentage').value = p.billable_percentage;
    document.getElementById('taxPercentage').value = p.tax_percentage;
    document.getElementById('profitMarginPercentage').value = p.profit_margin_percentage;

    expensesList = (p.expenses || []).map((e) => ({
      name: e.name,
      amount: e.amount,
      periodicity: e.periodicity,
      expenseType: e.expense_type
    }));

    renderExpenses();
    updateResultsUI(res.data.breakdown);

    document.getElementById('saveProfileBtn').textContent = 'Actualizar Escenario';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (err) {
    alert('Error al cargar perfil: ' + err.message);
  }
}

async function deleteProfile(profileId) {
  if (!confirm('¿Estás seguro de que deseas eliminar este escenario de cálculo?')) return;
  try {
    await calculatorApi.deleteProfile(profileId);
    if (currentEditingProfileId == profileId) {
      resetCalculatorForm();
    }
    await loadSavedProfiles();
  } catch (err) {
    alert('Error al eliminar perfil: ' + err.message);
  }
}

function resetCalculatorForm() {
  currentEditingProfileId = null;
  document.getElementById('profileName').value = 'Mi Perfil de Tarifa';
  document.getElementById('saveProfileBtn').textContent = 'Guardar Escenario';
  expensesList = [];
  renderExpenses();
  triggerLiveSimulation();
}

function setupCalculatorView() {
  const inputs = [
    'targetMonthlyIncome', 'workingDaysPerWeek', 'hoursPerDay',
    'vacationWeeksPerYear', 'holidaysPerYear', 'sickLeaveDaysPerYear',
    'billablePercentage', 'taxPercentage', 'profitMarginPercentage'
  ];

  inputs.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', triggerLiveSimulation);
  });

  // Agregar Gasto
  const addExpenseBtn = document.getElementById('addExpenseBtn');
  if (addExpenseBtn) {
    addExpenseBtn.addEventListener('click', () => {
      const nameInput = document.getElementById('expenseName');
      const amountInput = document.getElementById('expenseAmount');
      const periodicityInput = document.getElementById('expensePeriodicity');
      const typeInput = document.getElementById('expenseType');

      const name = nameInput.value.trim();
      const amount = parseFloat(amountInput.value);

      if (!name || isNaN(amount) || amount <= 0) {
        alert('Ingresa un nombre válido y un monto mayor a 0 para el gasto.');
        return;
      }

      expensesList.push({
        name,
        amount,
        periodicity: periodicityInput.value,
        expenseType: typeInput.value
      });

      nameInput.value = '';
      amountInput.value = '';
      renderExpenses();
      triggerLiveSimulation();
    });
  }

  // Guardar / Actualizar
  const saveBtn = document.getElementById('saveProfileBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const data = getCalculatorFormData();
      const alertBox = document.getElementById('calculatorAlert');

      try {
        saveBtn.disabled = true;
        if (currentEditingProfileId) {
          await calculatorApi.updateProfile(currentEditingProfileId, data);
          alertBox.textContent = '¡Escenario actualizado correctamente!';
        } else {
          const res = await calculatorApi.createProfile(data);
          currentEditingProfileId = res.data?.profileId;
          saveBtn.textContent = 'Actualizar Escenario';
          alertBox.textContent = '¡Escenario guardado correctamente!';
        }

        alertBox.className = 'alert alert-success';
        alertBox.style.display = 'block';
        await loadSavedProfiles();
      } catch (err) {
        alertBox.textContent = err.message;
        alertBox.className = 'alert alert-danger';
        alertBox.style.display = 'block';
      } finally {
        saveBtn.disabled = false;
        setTimeout(() => { alertBox.style.display = 'none'; }, 4000);
      }
    });
  }

  // Nuevo perfil
  const newProfileBtn = document.getElementById('newProfileBtn');
  if (newProfileBtn) {
    newProfileBtn.addEventListener('click', resetCalculatorForm);
  }

  renderExpenses();
  triggerLiveSimulation();
  loadSavedProfiles();
}
