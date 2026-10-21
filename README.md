# FreelanceFinanceHub 💼💰

**FreelanceFinanceHub** es una plataforma web completa orientada a freelancers, consultores y pequeños negocios para optimizar sus finanzas mediante dos módulos principales:
1. **Calculadora de Costos Reales por Hora:** Cálculo de punto de equilibrio y tarifa recomendada considerando costos fijos, herramientas de software, vacaciones, tiempo no facturable e impuestos.
2. **Organizador de Suscripciones:** Registro y control de servicios recurrentes y periodos de prueba gratuita (`free trials`) con búsqueda, filtros combinables, ordenamiento y alertas por correo previas al cobro o fin de prueba.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend:** HTML5 Semántico, CSS3 Modular (Variables, Dark Theme, Glassmorphism responsivo) y JavaScript ES6+ Modular (Fetch Client con cookies HttpOnly, Route Guards).
- **Backend:** Node.js (v18+) con Express 4 en arquitectura desacoplada en capas (Controller-Service-Model/Repository).
- **Base de Datos:** MariaDB 10.4+ (XAMPP) / MySQL 8.0+ relacional normalizado (3FN) con índices y claves foráneas. Conexión mediante `mysql2/promise` con connection pooling.
- **Seguridad:** Hashing seguro con `bcryptjs`, autenticación mediante `jsonwebtoken` (JWT) en cookies `HttpOnly; SameSite=Strict`, `helmet` con Content Security Policy estricta, `express-rate-limit` contra ataques de fuerza bruta y mitigación de CSRF por origen.
- **Alertas y Tareas:** Planificador en segundo plano con `node-cron` y despacho de correos HTML mediante `nodemailer` con garantía de idempotencia en `notification_logs`.
- **Testing:** Suite completa de pruebas unitarias y de integración con `jest` y `supertest`.

---

## 🚀 Requisitos Previos

- **Node.js:** Versión 18 o superior instalada.
- **XAMPP / MariaDB:** XAMPP con el servicio MySQL/MariaDB iniciado en el puerto 3306.
- Base de datos principal: `freelancefinancehub`.
- Base de datos de pruebas automatizadas: `freelancefinancehub_test`.

---

## 📦 Instalación y Puesta en Marcha en Windows

### 1. Clonar o abrir el proyecto
Abre una terminal de **PowerShell** en la carpeta raíz del proyecto:
```powershell
cd c:\Users\JOSUE\OneDrive\Documents\FreelanceFinanceHub
```

### 2. Instalar dependencias
```powershell
npm install
```

### 3. Configuración de Variables de Entorno
Copia la plantilla y genera tu secreto criptográfico para JWT:
```powershell
Copy-Item .env.example .env -Force
npm run secret:generate
```

### 4. Importar Tablas y Catálogos en MariaDB (XAMPP)
Ejecuta la importación del esquema DDL y los catálogos en ambas bases de datos:
```powershell
# Base de datos de desarrollo
cmd /c "C:\xampp\mysql\bin\mysql.exe -u root freelancefinancehub < database\schema.sql"
cmd /c "C:\xampp\mysql\bin\mysql.exe -u root freelancefinancehub < database\seeds.sql"

# Base de datos de pruebas automatizadas
cmd /c "C:\xampp\mysql\bin\mysql.exe -u root freelancefinancehub_test < database\schema.sql"
cmd /c "C:\xampp\mysql\bin\mysql.exe -u root freelancefinancehub_test < database\seeds.sql"
```

### 5. Probar la Conexión con MariaDB
```powershell
npm run db:test
```
*(Debe responder: `✅ Conexión a MariaDB establecida exitosamente`)*.

### 6. Crear el Primer Usuario Administrador
Por seguridad, el sistema no incluye usuarios ni contraseñas predeterminadas. Ejecuta el script interactivo por consola:
```powershell
npm run admin:create
```
*(Ingresa tu nombre, correo y contraseña segura. La contraseña no se mostrará en pantalla al tipear)*.

### 7. Iniciar el Servidor de Desarrollo
```powershell
npm run dev
```

---

## 🚀 Enlace en Producción (Despliegue Final)

La aplicación se encuentra desplegada, conectada a la base de datos en la nube y completamente funcional en el siguiente enlace:
- **URL Principal:** [https://freelancefinancehub-production.up.railway.app](https://freelancefinancehub-production.up.railway.app)

## 🌐 Enlaces de la Aplicación

Con el servidor en ejecución, abre tu navegador en:
- **Página de Inicio:** `http://localhost:3000/`
- **Registro de Freelancers:** `http://localhost:3000/register`
- **Inicio de Sesión:** `http://localhost:3000/login`
- **Panel Principal:** `http://localhost:3000/dashboard`
- **Calculadora de Tarifas:** `http://localhost:3000/calculator`
- **Organizador de Suscripciones:** `http://localhost:3000/subscriptions`
- **Panel de Administración:** `http://localhost:3000/admin` *(Solo usuarios con rol admin)*
- **Comprobación de Salud:** `http://localhost:3000/api/v1/health`

---

## 🧪 Ejecución de Pruebas Automatizadas

La aplicación cuenta con una suite integral de **47 pruebas** (unitarias y de integración) que validan todas las capas del sistema contra la base `freelancefinancehub_test`:

```powershell
npm test
```

### Cobertura de las pruebas:
- **Autenticación & RBAC:** Registro, duplicados, contraseñas débiles, login, cookies seguras, protección de rutas y bloqueo inmediato a cuentas suspendidas.
- **Calculadora de Tarifas:** Fórmulas matemáticas, horas brutas y facturables, consolidación de costos e impuestos, simulaciones y CRUD de escenarios.
- **Organizador de Suscripciones:** CRUD de suscripciones y trials, búsqueda de texto, filtros combinados (estado + categoría), ordenamiento seguro y métricas.
- **Alertas Automáticas:** Notificaciones preventivas, auditoría e idempotencia total (prevención de correos duplicados).
- **Panel de Administración:** Métricas globales, control de cuentas activas/suspendidas, cambios de rol y prevención de auto-suspensión de administradores.

---

## 📚 Documentación Técnica Detallada

- [Manual de Usuario](docs/user-manual.md)
- [Arquitectura de Software y Seguridad](docs/architecture.md)
- [Diccionario de Datos](docs/database-dictionary.md)
- [API de Autenticación y RBAC](docs/api-auth.md)
- [API de la Calculadora de Costos](docs/api-calculator.md)
- [API del Organizador de Suscripciones](docs/api-subscriptions.md)
- [API de Alertas y Notificaciones](docs/api-alerts.md)
- [API del Panel de Administración](docs/api-admin.md)
