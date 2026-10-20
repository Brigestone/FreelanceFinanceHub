-- =======================================================================
-- FreelanceFinanceHub - Datos Iniciales / Catálogos Base
-- Idempotente: puede ejecutarse varias veces sin duplicar registros.
-- No contiene sentencia USE: se aplica sobre la base seleccionada.
-- No crea usuarios ni contraseñas. El primer admin se crea con:
--   npm run admin:create
-- =======================================================================

-- 1. Insertar roles del sistema (sin usuarios ni credenciales por defecto por seguridad)
INSERT INTO `roles` (`id`, `name`, `description`) VALUES
  (1, 'admin', 'Administrador del sistema con acceso a métricas globales y gestión de usuarios'),
  (2, 'freelancer', 'Usuario estándar profesional independiente o microempresa')
ON DUPLICATE KEY UPDATE `description` = VALUES(`description`);

-- 2. Insertar catálogo de categorías para el organizador de suscripciones
INSERT INTO `subscription_categories` (`id`, `name`, `color_hex`) VALUES
  (1, 'Software & SaaS', '#3B82F6'),
  (2, 'Hosting & Infraestructura', '#10B981'),
  (3, 'Marketing & SEO', '#F59E0B'),
  (4, 'Diseño & Creatividad', '#EC4899'),
  (5, 'Finanzas & Legal', '#8B5CF6'),
  (6, 'Productividad & Oficina', '#06B6D4'),
  (7, 'Otros', '#6B7280')
ON DUPLICATE KEY UPDATE `color_hex` = VALUES(`color_hex`);
