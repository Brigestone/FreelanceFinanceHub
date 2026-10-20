# Guía de Arquitectura de Software — FreelanceFinanceHub

## 1. Visión y Estilo Arquitectónico

FreelanceFinanceHub implementa una **Arquitectura en Capas (Layered / 3-Tier Architecture)** con separación estricta de responsabilidades:

```text
┌─────────────────────────────────────────────────────────────┐
│                       CAPA CLIENTE                          │
│   HTML5 Semántico, CSS3 Modular (Variables, Dark Theme),    │
│   JavaScript ES6+ Modular (ApiClient, RouteGuards, Views)   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON / Cookies HttpOnly
┌──────────────────────────────▼──────────────────────────────┐
│                    CAPA DE PRESENTACIÓN                     │
│   Express 4 Router + Middlewares (Helmet, CORS, CSRF Origin,│
│   Rate Limiter, Auth JWT, Role RBAC, Express-Validator)     │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                   CAPA DE LÓGICA DE NEGOCIO                 │
│   Services Puros (CalculationEngine, Auth, Subscriptions,   │
│   Admin, Mailer, Job Scheduler Cron)                        │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                     CAPA DE ACCESO A DATOS                  │
│   Models / Repositorios SQL (Consultas Parametrizadas,      │
│   Transacciones Atómicas ACID, Pool MySQL2/Promise)         │
└──────────────────────────────┬──────────────────────────────┘
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                       BASE DE DATOS                         │
│   MariaDB 10.4+ / MySQL 8.0+ (InnoDB, UTF8MB4, 3FN)         │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Decisiones Clave de Diseño y Seguridad

### A. Autenticación y Manejo de Sesión
- **JWT (JSON Web Tokens):** Firmados con clave de 128 caracteres hexadecimales generada criptográficamente (`HS256`).
- **Transporte en Cookies Seguras:** Los tokens no se almacenan en `localStorage` (vulnerable a robo por XSS), sino en cookies con flags `HttpOnly`, `SameSite=Strict` y `Secure` en producción.
- **Validación en Vivo de Estado (RBAC):** Cada petición verifica no solo la validez criptográfica del token sino el estado de la cuenta en base de datos. Si una cuenta es suspendida por un administrador, el usuario es bloqueado instantáneamente con código `403 Forbidden`.

### B. Prevención de Ataques Comunes
- **Inyección SQL:** 100% de las consultas utilizan sentencias preparadas y placeholders (`?`). El ordenamiento dinámico está protegido por una **lista blanca estricta** de columnas permitidas.
- **Fuerza Bruta & DoS:** Limitadores diferenciados mediante `express-rate-limit` (para la API global, login por IP+email y registro por IP).
- **Ataques de Temporización (Timing Attacks):** Implementación de hash señuelo durante el login para igualar los tiempos de cómputo de bcrypt cuando un correo no existe.
- **CSRF:** Mitigado mediante la cookie `SameSite=Strict` combinada con la verificación obligatoria del encabezado `Origin` / `Referer` en todas las operaciones que mutan datos (`POST`, `PUT`, `PATCH`, `DELETE`).
- **Cabeceras HTTP Seguras:** `helmet` con una Content Security Policy (CSP) estricta que inhabilita scripts o estilos inline no autorizados y desactiva `X-Powered-By`.

### C. Desacoplamiento del Motor Matemático
- La lógica de cálculo de la tarifa por hora reside en `calculationEngineService.js` como una función pura sin efectos secundarios ni dependencias de base de datos, lo que permitió alcanzar una cobertura del 100% en pruebas unitarias aisladas.

### D. Idempotencia en Tareas Programadas
- El planificador (`node-cron`) despacha alertas diarias verificando previamente la tabla `notification_logs`. Se garantiza que ninguna alerta de prueba gratuita o renovación sea enviada más de una vez para el mismo ciclo.
