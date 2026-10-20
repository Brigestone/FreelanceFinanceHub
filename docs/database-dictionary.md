# Diccionario de Datos — FreelanceFinanceHub

Motor de Base de Datos: **MariaDB 10.4+ / MySQL 8.0+ (InnoDB)**  
Juego de Caracteres: **`utf8mb4`** / Collation: **`utf8mb4_unicode_ci`**

---

## 1. Tabla: `roles`
Catálogo de roles para el control de acceso basado en roles (RBAC).

| Columna | Tipo de Dato | Nulo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | `AUTO_INCREMENT` | Clave primaria. |
| `name` | `VARCHAR(50)` | NO | - | Nombre único del rol (`admin`, `freelancer`). |
| `description` | `VARCHAR(255)` | SÍ | `NULL` | Descripción de permisos del rol. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Fecha de creación del registro. |

---

## 2. Tabla: `users`
Almacena las cuentas de usuario de la plataforma.

| Columna | Tipo de Dato | Nulo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | `AUTO_INCREMENT` | Clave primaria. |
| `role_id` | `INT` | NO | - | Clave foránea hacia `roles(id)`. |
| `full_name` | `VARCHAR(100)` | NO | - | Nombre completo del usuario. |
| `email` | `VARCHAR(150)` | NO | - | Correo electrónico único (login). |
| `password_hash` | `VARCHAR(255)` | NO | - | Hash de la contraseña con `bcryptjs` (salt 12). |
| `status` | `ENUM('active','suspended')` | NO | `'active'` | Estado de la cuenta. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Fecha de registro. |
| `updated_at` | `TIMESTAMP` | NO | `ON UPDATE CURRENT_TIMESTAMP` | Última actualización. |

- **Restricciones & Índices:** `fk_users_role` (RESTRICT), `idx_users_email` (UNIQUE), `idx_users_role_id`, `idx_users_status`.

---

## 3. Tabla: `hourly_rate_profiles`
Escenarios de cálculo de tarifa horaria (Módulo 1).

| Columna | Tipo de Dato | Nulo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | `AUTO_INCREMENT` | Clave primaria. |
| `user_id` | `INT` | NO | - | Clave foránea hacia `users(id)` (CASCADE). |
| `profile_name` | `VARCHAR(100)` | NO | - | Nombre descriptivo del escenario. |
| `target_monthly_income` | `DECIMAL(12,2)` | NO | `0.00` | Sueldo neto mensual deseado. |
| `working_days_per_week` | `INT` | NO | `5` | Días laborales por semana (1 a 7). |
| `hours_per_day` | `DECIMAL(4,2)` | NO | `8.00` | Horas de trabajo al día. |
| `vacation_weeks_per_year` | `INT` | NO | `4` | Semanas de vacaciones anuales. |
| `holidays_per_year` | `INT` | NO | `12` | Días feriados anuales no laborados. |
| `sick_leave_days_per_year` | `INT` | NO | `5` | Días de enfermedad/bajas estimados al año. |
| `billable_percentage` | `DECIMAL(5,2)` | NO | `75.00` | % de tiempo facturable vs admin/ventas. |
| `tax_percentage` | `DECIMAL(5,2)` | NO | `20.00` | Tasa impositiva estimada (%). |
| `profitMarginPercentage` | `DECIMAL(5,2)` | NO | `15.00` | Margen de ganancia o colchón de seguridad (%). |
| `calculated_billable_hours_month` | `DECIMAL(8,2)` | SÍ | `NULL` | Horas facturables calculadas al mes. |
| `calculated_min_hourly_rate` | `DECIMAL(10,2)` | SÍ | `NULL` | Tarifa mínima de punto de equilibrio calculada. |
| `calculated_recommended_hourly_rate` | `DECIMAL(10,2)` | SÍ | `NULL` | Tarifa sugerida con margen de ganancia. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Fecha de creación. |
| `updated_at` | `TIMESTAMP` | NO | `ON UPDATE CURRENT_TIMESTAMP` | Última actualización. |

---

## 4. Tabla: `profile_expenses`
Gastos operativos y licencias de software asociados a un escenario de tarifa.

| Columna | Tipo de Dato | Nulo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | `AUTO_INCREMENT` | Clave primaria. |
| `profile_id` | `INT` | NO | - | Clave foránea hacia `hourly_rate_profiles(id)` (CASCADE). |
| `name` | `VARCHAR(100)` | NO | - | Concepto del gasto (ej. "Internet", "Adobe CC"). |
| `amount` | `DECIMAL(10,2)` | NO | `0.00` | Monto del gasto. |
| `periodicity` | `ENUM('monthly','annual')`| NO | `'monthly'` | Periodicidad de pago. |
| `expense_type`| `ENUM('fixed_cost','software')`| NO | `'fixed_cost'` | Clasificación: costo fijo u operativo de software. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Fecha de creación. |

---

## 5. Tabla: `subscription_categories`
Catálogo de categorías para el organizador de suscripciones (Módulo 2).

| Columna | Tipo de Dato | Nulo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | `AUTO_INCREMENT` | Clave primaria. |
| `name` | `VARCHAR(100)` | NO | - | Nombre de la categoría (ej. "Software & SaaS"). |
| `color_hex` | `VARCHAR(7)` | NO | `'#4F46E5'` | Color hexadecimal para etiquetas en la interfaz. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Fecha de creación. |

---

## 6. Tabla: `subscriptions`
Registro de servicios recurrentes y periodos de prueba (Free Trials).

| Columna | Tipo de Dato | Nulo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | `AUTO_INCREMENT` | Clave primaria. |
| `user_id` | `INT` | NO | - | Clave foránea hacia `users(id)` (CASCADE). |
| `category_id` | `INT` | SÍ | `NULL` | Clave foránea hacia `subscription_categories(id)` (SET NULL). |
| `service_name` | `VARCHAR(150)` | NO | - | Nombre del servicio o suscripción. |
| `cost` | `DECIMAL(10,2)` | NO | `0.00` | Costo por ciclo. |
| `currency` | `VARCHAR(10)` | NO | `'USD'` | Código de moneda. |
| `billing_cycle` | `ENUM('monthly','quarterly','annual')` | NO | `'monthly'` | Ciclo de cobro. |
| `start_date` | `DATE` | NO | - | Fecha de inicio. |
| `renewal_date` | `DATE` | NO | - | Próxima fecha de renovación/cobro. |
| `is_trial` | `BOOLEAN` | NO | `FALSE` | Indica si está en periodo de prueba gratuito. |
| `trial_end_date` | `DATE` | SÍ | `NULL` | Fecha límite del periodo de prueba. |
| `status` | `ENUM('active','trial','cancelled','paused')` | NO | `'active'` | Estado actual de la suscripción. |
| `payment_method` | `VARCHAR(50)` | SÍ | `NULL` | Método de pago asociado (ej. "Visa *1234"). |
| `notes` | `TEXT` | SÍ | `NULL` | Notas u observaciones adicionales. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Fecha de creación. |
| `updated_at` | `TIMESTAMP` | NO | `ON UPDATE CURRENT_TIMESTAMP` | Última actualización. |

---

## 7. Tabla: `alert_settings`
Configuración personalizada de alertas preventivas para cada usuario.

| Columna | Tipo de Dato | Nulo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | `AUTO_INCREMENT` | Clave primaria. |
| `user_id` | `INT` | NO | - | Clave foránea única hacia `users(id)` (CASCADE). |
| `trial_alert_days_before` | `INT` | NO | `3` | Días antes de anticipación para avisos de fin de trial. |
| `renewal_alert_days_before`| `INT` | NO | `5` | Días antes de anticipación para avisos de renovación. |
| `email_enabled` | `BOOLEAN` | NO | `TRUE` | Activa o desactiva las notificaciones por correo. |
| `created_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Fecha de creación. |
| `updated_at` | `TIMESTAMP` | NO | `ON UPDATE CURRENT_TIMESTAMP` | Última actualización. |

---

## 8. Tabla: `notification_logs`
Historial de auditoría y mecanismo de garantía de **idempotencia** para el envío de alertas.

| Columna | Tipo de Dato | Nulo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INT` | NO | `AUTO_INCREMENT` | Clave primaria. |
| `user_id` | `INT` | NO | - | Clave foránea hacia `users(id)` (CASCADE). |
| `subscription_id` | `INT` | NO | - | Clave foránea hacia `subscriptions(id)` (CASCADE). |
| `notification_type` | `ENUM('trial_ending','renewal_upcoming')` | NO | - | Tipo de alerta enviada. |
| `alert_for_date` | `DATE` | NO | - | Fecha objetivo para la cual se envió la alerta. |
| `sent_at` | `TIMESTAMP` | NO | `CURRENT_TIMESTAMP` | Fecha y hora exacta de despacho. |
| `status` | `ENUM('sent','failed')` | NO | `'sent'` | Resultado del envío. |
| `recipient_email` | `VARCHAR(150)` | NO | - | Dirección a la que se despachó el correo. |
| `error_message` | `TEXT` | SÍ | `NULL` | Detalle del error si falló la entrega. |

- **Índice de Idempotencia:** `idx_logs_idempotency (user_id, subscription_id, notification_type, alert_for_date)`.
