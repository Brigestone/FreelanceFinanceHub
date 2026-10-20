-- =======================================================================
-- FreelanceFinanceHub - Esquema de Base de Datos (MariaDB / MySQL XAMPP)
-- Bases de datos objetivo: freelancefinancehub (desarrollo)
--                          freelancefinancehub_test (pruebas automatizadas)
-- =======================================================================
--
-- !!! ADVERTENCIA: SCRIPT DESTRUCTIVO !!!
-- Cada tabla se elimina con DROP TABLE IF EXISTS antes de crearse.
-- Ejecutarlo sobre una base con datos BORRA TODOS LOS REGISTROS.
-- Úsalo SOLO para instalaciones nuevas o para reiniciar la base de pruebas.
-- Los cambios de estructura posteriores van en database/migrations/.
--
-- No contiene sentencia USE a propósito: se aplica sobre la base que
-- tengas seleccionada en phpMyAdmin o la que indiques en la línea de comandos:
--   cmd /c "C:\xampp\mysql\bin\mysql.exe -u root freelancefinancehub < database\schema.sql"
-- =======================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------------------------
-- 1. Tabla: roles
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `description` VARCHAR(255) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 2. Tabla: users
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `role_id` INT NOT NULL,
  `full_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `status` ENUM('active', 'suspended') NOT NULL DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_users_role_id` (`role_id`),
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 3. Tabla: hourly_rate_profiles (Módulo 1: Calculadora de Costos)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `hourly_rate_profiles`;
CREATE TABLE `hourly_rate_profiles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `profile_name` VARCHAR(100) NOT NULL,
  `target_monthly_income` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `working_days_per_week` INT NOT NULL DEFAULT 5,
  `hours_per_day` DECIMAL(4, 2) NOT NULL DEFAULT 8.00,
  `vacation_weeks_per_year` INT NOT NULL DEFAULT 4,
  `holidays_per_year` INT NOT NULL DEFAULT 12,
  `sick_leave_days_per_year` INT NOT NULL DEFAULT 5,
  `billable_percentage` DECIMAL(5, 2) NOT NULL DEFAULT 75.00,
  `tax_percentage` DECIMAL(5, 2) NOT NULL DEFAULT 20.00,
  `profit_margin_percentage` DECIMAL(5, 2) NOT NULL DEFAULT 15.00,
  `calculated_billable_hours_month` DECIMAL(8, 2) NULL,
  `calculated_min_hourly_rate` DECIMAL(10, 2) NULL,
  `calculated_recommended_hourly_rate` DECIMAL(10, 2) NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_profiles_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_profiles_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 4. Tabla: profile_expenses (Gastos fijos y software asociados al perfil)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `profile_expenses`;
CREATE TABLE `profile_expenses` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `profile_id` INT NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `periodicity` ENUM('monthly', 'annual') NOT NULL DEFAULT 'monthly',
  `expense_type` ENUM('fixed_cost', 'software') NOT NULL DEFAULT 'fixed_cost',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_expenses_profile` FOREIGN KEY (`profile_id`) REFERENCES `hourly_rate_profiles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_expenses_profile_id` (`profile_id`),
  INDEX `idx_expenses_type` (`expense_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 5. Tabla: subscription_categories (Módulo 2: Organizador de Suscripciones)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `subscription_categories`;
CREATE TABLE `subscription_categories` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `color_hex` VARCHAR(7) NOT NULL DEFAULT '#4F46E5',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 6. Tabla: subscriptions (Módulo 2: Organizador de Suscripciones)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `subscriptions`;
CREATE TABLE `subscriptions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `category_id` INT NULL,
  `service_name` VARCHAR(150) NOT NULL,
  `cost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'USD',
  `billing_cycle` ENUM('monthly', 'quarterly', 'annual') NOT NULL DEFAULT 'monthly',
  `start_date` DATE NOT NULL,
  `renewal_date` DATE NOT NULL,
  `is_trial` BOOLEAN NOT NULL DEFAULT FALSE,
  `trial_end_date` DATE NULL,
  `status` ENUM('active', 'trial', 'cancelled', 'paused') NOT NULL DEFAULT 'active',
  `payment_method` VARCHAR(50) NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_subscriptions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_subscriptions_category` FOREIGN KEY (`category_id`) REFERENCES `subscription_categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_subscriptions_user_id` (`user_id`),
  INDEX `idx_subscriptions_category_id` (`category_id`),
  INDEX `idx_subscriptions_status` (`status`),
  INDEX `idx_subscriptions_renewal_date` (`renewal_date`),
  INDEX `idx_subscriptions_trial_end_date` (`trial_end_date`),
  INDEX `idx_subscriptions_service_name` (`service_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 7. Tabla: alert_settings (Preferencias de notificación de cada usuario)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `alert_settings`;
CREATE TABLE `alert_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL UNIQUE,
  `trial_alert_days_before` INT NOT NULL DEFAULT 3,
  `renewal_alert_days_before` INT NOT NULL DEFAULT 5,
  `email_enabled` BOOLEAN NOT NULL DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_alert_settings_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------
-- 8. Tabla: notification_logs (Histórico e idempotencia de alertas de correo)
-- -----------------------------------------------------------------------
DROP TABLE IF EXISTS `notification_logs`;
CREATE TABLE `notification_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `subscription_id` INT NOT NULL,
  `notification_type` ENUM('trial_ending', 'renewal_upcoming') NOT NULL,
  `alert_for_date` DATE NOT NULL,
  `sent_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `status` ENUM('sent', 'failed') NOT NULL DEFAULT 'sent',
  `recipient_email` VARCHAR(150) NOT NULL,
  `error_message` TEXT NULL,
  CONSTRAINT `fk_logs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_logs_subscription` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_logs_user_id` (`user_id`),
  INDEX `idx_logs_subscription_id` (`subscription_id`),
  INDEX `idx_logs_idempotency` (`user_id`, `subscription_id`, `notification_type`, `alert_for_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
