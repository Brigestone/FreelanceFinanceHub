# Documentación Técnica - FreelanceFinanceHub

## 1. Visión General
FreelanceFinanceHub es una solución web diseñada para freelancers y pequeños negocios, compuesta por dos módulos principales:
1. **Calculadora de Costos Reales por Hora:** Cálculo de punto de equilibrio y tarifa recomendada considerando costos fijos, software, vacaciones, tiempo no facturable e impuestos.
2. **Organizador de Suscripciones:** Gestión de servicios recurrentes y periodos de prueba gratuita (`free trials`) con alertas preventivas por correo electrónico.

## 2. Tecnologías y Versiones
- **Backend:** Node.js (v18+) con Express.
- **Base de Datos:** MariaDB (XAMPP) / MySQL 8.
- **Frontend:** HTML5 semántico, CSS3 modular y JavaScript Vanilla (ES6+).
- **Conector BD:** `mysql2/promise` con Connection Pooling.

## 3. Estado de la Fase 1
- Estructura de carpetas creada.
- Servidor Express y ruta de comprobación `GET /api/v1/health` listos.
- Conexión con MariaDB configurada con pooling y variables de entorno.
- Esquema DDL `database/schema.sql` y catálogos `database/seeds.sql` preparados.
- `.gitignore` y `.env.example` creados.
