# Documentación de la API de la Calculadora de Costos (Fase 3)

Prefijo base: `/api/v1/calculator`

Todas las rutas requieren autenticación mediante la cookie `ffh_session`.

---

## 1. Simular Tarifa en Vivo (Sin persistir)

- **Método y Ruta:** `POST /api/v1/calculator/simulate`
- **Cuerpo de la Solicitud (JSON):**
  ```json
  {
    "targetMonthlyIncome": 2000,
    "workingDaysPerWeek": 5,
    "hoursPerDay": 8,
    "vacationWeeksPerYear": 4,
    "holidaysPerYear": 10,
    "sickLeaveDaysPerYear": 5,
    "billablePercentage": 75,
    "taxPercentage": 20,
    "profitMarginPercentage": 15,
    "expenses": [
      {
        "name": "Internet",
        "amount": 50,
        "periodicity": "monthly",
        "expenseType": "fixed_cost"
      },
      {
        "name": "Licencia JetBrains",
        "amount": 200,
        "periodicity": "annual",
        "expenseType": "software"
      }
    ]
  }
  ```
- **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "timeBreakdown": {
        "netWorkingWeeksYear": 45,
        "grossHoursYear": 1800,
        "billableHoursYear": 1350,
        "billableHoursMonth": 112.5
      },
      "expensesBreakdown": {
        "annualFixedCosts": 600,
        "annualSoftwareCosts": 200,
        "annualOperatingExpenses": 800,
        "monthlyOperatingExpenses": 66.67
      },
      "incomeBreakdown": {
        "targetNetMonthlyIncome": 2000,
        "targetNetAnnualIncome": 24000,
        "estimatedAnnualTaxes": 6000,
        "targetGrossAnnualIncome": 30000,
        "totalAnnualBudgetRequired": 30800
      },
      "rates": {
        "minHourlyRate": 22.81,
        "recommendedHourlyRate": 26.24
      }
    }
  }
  ```

---

## 2. Listar Escenarios Guardados

- **Método y Ruta:** `GET /api/v1/calculator/profiles`
- **Respuesta (200 OK):** Lista de escenarios de tarifas guardados del usuario autenticado.

---

## 3. Obtener Detalle de un Escenario

- **Método y Ruta:** `GET /api/v1/calculator/profiles/:id`
- **Respuesta (200 OK):** Detalle del perfil con desglose recalculado en tiempo real y gastos asociados.
- **Respuesta (404 Not Found):** Si el perfil no existe o pertenece a otro usuario.

---

## 4. Guardar Nuevo Escenario

- **Método y Ruta:** `POST /api/v1/calculator/profiles`
- **Cuerpo:** Incluye `profileName` y los mismos parámetros del simulador.
- **Respuesta (201 Created):** Retorna `profileId` y el desglose de tarifas calculado.

---

## 5. Actualizar Escenario Existente

- **Método y Ruta:** `PUT /api/v1/calculator/profiles/:id`
- **Respuesta (200 OK):** Actualiza el perfil, reemplaza la lista de gastos en transacción y recalcula tarifas.

---

## 6. Eliminar Escenario

- **Método y Ruta:** `DELETE /api/v1/calculator/profiles/:id`
- **Respuesta (200 OK):** Elimina el perfil y en cascada sus gastos asociados.
