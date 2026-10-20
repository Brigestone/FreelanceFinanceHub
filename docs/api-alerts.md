# Documentación del Servicio de Alertas Automáticas (Fase 5)

Prefijo base: `/api/v1/alerts`

Todas las rutas requieren autenticación con sesión activa.

---

## 1. Consultar Preferencias de Alertas

- **Método y Ruta:** `GET /api/v1/alerts/settings`
- **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "data": {
      "settings": {
        "id": 1,
        "user_id": 1,
        "trial_alert_days_before": 3,
        "renewal_alert_days_before": 5,
        "email_enabled": 1
      }
    }
  }
  ```

---

## 2. Actualizar Preferencias de Alertas

- **Método y Ruta:** `PUT /api/v1/alerts/settings`
- **Cuerpo (JSON):**
  ```json
  {
    "trialAlertDaysBefore": 5,
    "renewalAlertDaysBefore": 7,
    "emailEnabled": true
  }
  ```
- **Respuesta (200 OK):** Preferencias actualizadas.

---

## 3. Historial de Auditoría de Alertas Enviadas

- **Método y Ruta:** `GET /api/v1/alerts/history`
- **Respuesta (200 OK):** Lista de registros de `notification_logs` asociados al usuario.

---

## 4. Ejecución Manual Bajo Demanda

- **Método y Ruta:** `POST /api/v1/alerts/trigger-check`
- **Respuesta (200 OK):**
  ```json
  {
    "success": true,
    "message": "Verificación de alertas ejecutada exitosamente.",
    "data": {
      "processed": 1,
      "sent": 1,
      "failed": 0
    }
  }
  ```

---

## 5. Tarea Programada Automática (Scheduler)

- Implementada con `node-cron` dentro de `backend/src/services/cronService.js`.
- Programación predeterminada: Todos los días a las **08:00 AM** (`0 8 * * *`).
- Comprueba periodos de prueba por vencer (`is_trial = 1`) y renovaciones de suscripciones activas.
- Garantiza **idempotencia total**: no envía correos duplicados para la misma fecha y suscripción ya alertada.
