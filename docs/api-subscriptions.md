# Documentación de la API de Suscripciones (Fase 4)

Prefijo base: `/api/v1/subscriptions`

Todas las rutas requieren autenticación mediante la cookie segura `ffh_session`.

---

## 1. Listar Suscripciones con Búsqueda, Filtros y Ordenamiento

- **Método y Ruta:** `GET /api/v1/subscriptions`
- **Parámetros de Consulta (Query Params - Combinables):**
  - `search` (string): Busca texto en `service_name`, `notes` o `payment_method`.
  - `status` (string): Filtra por estado (`active`, `trial`, `cancelled`, `paused`).
  - `categoryId` (number): Filtra por ID de categoría de suscripción.
  - `billingCycle` (string): Filtra por ciclo (`monthly`, `quarterly`, `annual`).
  - `isTrial` (boolean): Filtra únicamente los servicios en periodo de prueba (`true` / `false`).
  - `sortBy` (string): Columna para ordenar (`cost`, `renewal_date`, `trial_end_date`, `service_name`, `status`, `created_at`).
  - `sortOrder` (string): Dirección (`ASC` o `DESC`).
  - `page` (number): Número de página (default: 1).
  - `limit` (number): Registros por página (default: 20).

- **Ejemplo de Consulta Combinada:**
  ```http
  GET /api/v1/subscriptions?search=Cloud&status=trial&categoryId=1&sortBy=cost&sortOrder=DESC
  ```

- **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "subscriptions": [
        {
          "id": 1,
          "service_name": "Google Cloud Platform",
          "cost": 150.00,
          "currency": "USD",
          "billing_cycle": "monthly",
          "start_date": "2026-10-01",
          "renewal_date": "2026-11-01",
          "is_trial": 1,
          "trial_end_date": "2026-10-31",
          "status": "trial",
          "category_name": "Hosting & Infraestructura",
          "category_color": "#10B981",
          "days_until_renewal": 12,
          "days_until_trial_end": 11
        }
      ],
      "pagination": {
        "totalItems": 1,
        "currentPage": 1,
        "limit": 20,
        "totalPages": 1
      }
    }
  }
  ```

---

## 2. Resumen de Métricas Financieras

- **Método y Ruta:** `GET /api/v1/subscriptions/metrics/summary`
- **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "metrics": {
        "monthlyProjectedCost": 54.99,
        "annualProjectedCost": 659.88,
        "activeSubscriptionsCount": 1,
        "activeTrialsCount": 1,
        "trialsExpiringIn7Days": 1,
        "renewalsIn7Days": 0,
        "totalRegistered": 2
      }
    }
  }
  ```

---

## 3. Catálogo de Categorías

- **Método y Ruta:** `GET /api/v1/subscriptions/categories`
- **Respuesta (200 OK):** Lista de categorías disponibles con nombres y códigos hexadecimales de color.

---

## 4. Crear Nueva Suscripción

- **Método y Ruta:** `POST /api/v1/subscriptions`
- **Cuerpo (JSON):**
  ```json
  {
    "serviceName": "Figma Professional",
    "cost": 15.00,
    "currency": "USD",
    "billingCycle": "monthly",
    "startDate": "2026-10-20",
    "renewalDate": "2026-11-20",
    "isTrial": false,
    "trialEndDate": null,
    "status": "active",
    "categoryId": 4,
    "paymentMethod": "Tarjeta Visa Débito",
    "notes": "Plan individual de diseño"
  }
  ```
- **Respuesta (201 Created):** Retorna la suscripción creada con su ID y categoría asociada.

---

## 5. Obtener Detalle de Suscripción

- **Método y Ruta:** `GET /api/v1/subscriptions/:id`
- **Respuesta:** 200 OK o 404 Not Found si no existe o pertenece a otro usuario.

---

## 6. Actualizar Suscripción

- **Método y Ruta:** `PUT /api/v1/subscriptions/:id`
- **Respuesta (200 OK):** Objeto de suscripción actualizado.

---

## 7. Eliminar Suscripción

- **Método y Ruta:** `DELETE /api/v1/subscriptions/:id`
- **Respuesta (200 OK):** `{ "success": true, "message": "Suscripción eliminada con éxito." }`
