# Documentación de la API de Administración (Fase 6)

Prefijo base: `/api/v1/admin`

Todas las rutas requieren autenticación con sesión activa y **rol `admin`**. Cualquier usuario con rol estándar (`freelancer`) recibirá un error `403 Forbidden`.

---

## 1. Métricas Globales de la Plataforma

- **Método y Ruta:** `GET /api/v1/admin/metrics`
- **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "metrics": {
        "users": {
          "total": 12,
          "active": 11,
          "suspended": 1
        },
        "subscriptions": {
          "total": 35,
          "active": 28,
          "trial": 4,
          "totalMonthlyManagedCost": 1250.50
        },
        "calculator": {
          "totalProfiles": 15,
          "avgRecommendedRate": 34.20,
          "avgMinRate": 28.50
        },
        "notifications": {
          "totalSent": 42,
          "trialAlerts": 18,
          "renewalAlerts": 24
        }
      }
    }
  }
  ```

---

## 2. Listar y Filtrar Usuarios

- **Método y Ruta:** `GET /api/v1/admin/users`
- **Parámetros de Consulta (Query Params):**
  - `search`: Busca texto en `full_name` o `email`.
  - `role`: Filtra por `admin` o `freelancer`.
  - `status`: Filtra por `active` o `suspended`.
  - `page`: Número de página.
  - `limit`: Límite de resultados.

- **Respuesta (200 OK):** Lista de usuarios con contadores de actividad (`total_profiles`, `total_subscriptions`).

---

## 3. Suspender o Reactivar Cuenta de Usuario

- **Método y Ruta:** `PATCH /api/v1/admin/users/:id/status`
- **Cuerpo (JSON):**
  ```json
  {
    "status": "suspended" // o "active"
  }
  ```
- **Regla de Seguridad:** Un administrador no puede suspender su propia cuenta (`400 Bad Request`).
- **Efecto Inmediato:** En el instante en que un usuario es suspendido, el middleware `authMiddleware` rechaza cualquier petición con `403 Forbidden`, impidiendo su acceso aunque conserve una cookie de sesión válida.

---

## 4. Cambiar Rol de Usuario

- **Método y Ruta:** `PATCH /api/v1/admin/users/:id/role`
- **Cuerpo (JSON):**
  ```json
  {
    "role": "admin" // o "freelancer"
  }
  ```
- **Regla de Seguridad:** Un administrador no puede degradar su propio rol.

---

## 5. Bitácora de Auditoría Global

- **Método y Ruta:** `GET /api/v1/admin/audit-logs`
- **Respuesta (200 OK):** Historial completo de alertas generadas y entregadas a todos los usuarios de la plataforma.
