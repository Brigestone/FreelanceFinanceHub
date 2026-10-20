# Documentación de la API de Autenticación y Control de Acceso (Fase 2)

Todas las rutas de autenticación se encuentran bajo el prefijo `/api/v1/auth`.

---

## 1. Registro de Usuario (Freelancer)

- **Método y Ruta:** `POST /api/v1/auth/register`
- **Acceso:** Público (Protegido por rate-limiting contra spam).
- **Cuerpo de la Solicitud (JSON):**
  ```json
  {
    "fullName": "Juan Pérez",
    "email": "juan@example.com",
    "password": "Password123"
  }
  ```
- **Respuestas:**
  - `201 Created`: Usuario registrado con éxito. Se emite la cookie `HttpOnly` `ffh_session`.
  - `409 Conflict`: Ya existe un usuario con ese correo electrónico.
  - `422 Unprocessable Entity`: Fallo de validación (nombre muy corto, email inválido o contraseña que no cumple requisitos de seguridad).

---

## 2. Inicio de Sesión (Login)

- **Método y Ruta:** `POST /api/v1/auth/login`
- **Acceso:** Público (Protegido por rate-limiting de intentos fallidos por IP y correo).
- **Cuerpo de la Solicitud (JSON):**
  ```json
  {
    "email": "juan@example.com",
    "password": "Password123"
  }
  ```
- **Respuestas:**
  - `200 OK`: Credenciales válidas. Devuelve el objeto del usuario e inserta la cookie `ffh_session`.
  - `401 Unauthorized`: "Credenciales inválidas." (Misma respuesta ante contraseña errónea o usuario inexistente, para mitigar enumeración).
  - `403 Forbidden`: Usuario suspendido por un administrador.
  - `429 Too Many Requests`: Límite de intentos fallidos superado.

---

## 3. Consultar Sesión Actual

- **Método y Ruta:** `GET /api/v1/auth/me`
- **Acceso:** Autenticado (Requiere cookie de sesión activa).
- **Respuestas:**
  - `200 OK`: Retorna `{ "success": true, "data": { "user": { "id": 1, "fullName": "...", "email": "...", "role": "freelancer", ... } } }`.
  - `401 Unauthorized`: No hay sesión activa o el token expiró.
  - `403 Forbidden`: La cuenta está suspendida.

---

## 4. Cierre de Sesión (Logout)

- **Método y Ruta:** `POST /api/v1/auth/logout`
- **Acceso:** Público e idempotente.
- **Efecto:** Elimina la cookie de sesión `ffh_session`.
- **Respuesta:** `200 OK`.

---

## 5. Control de Acceso por Roles (RBAC) - Endpoint de Comprobación

- **Método y Ruta:** `GET /api/v1/admin/ping`
- **Acceso:** Requiere sesión activa y rol `admin`.
- **Respuestas:**
  - `200 OK`: Acceso concedido al administrador.
  - `401 Unauthorized`: No hay sesión iniciada.
  - `403 Forbidden`: Usuario con rol estándar (`freelancer`).
