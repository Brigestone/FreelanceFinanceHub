# FreelanceFinanceHub — Manual de Usuario

**FreelanceFinanceHub** es una aplicación web integral diseñada para freelancers, consultores y pequeños negocios, orientada a resolver dos desafíos críticos:
1. Conocer con precisión matemática la **tarifa mínima por hora** que se debe cobrar para cubrir costos reales, impuestos y vacaciones.
2. Organizar y vigilar los **servicios recurrentes y periodos de prueba gratuita**, evitando cobros automáticos sorpresivos.

---

## 1. Acceso a la Plataforma

### Registro de Nueva Cuenta
1. Ingresa a `http://localhost:3000/register`.
2. Completa tu nombre completo, correo electrónico y contraseña (mínimo 8 caracteres con mayúscula, minúscula y número).
3. Presiona **Crear Cuenta**. Serás redirigido automáticamente a tu **Panel Principal**.

### Inicio de Sesión
1. Ingresa a `http://localhost:3000/login`.
2. Escribe tus credenciales y haz clic en **Iniciar Sesión**.

---

## 2. Módulo 1: Calculadora de Costos Reales por Hora

Accede desde el menú superior en **Calculadora** o desde el botón en el Panel Principal.

### ¿Cómo funciona?
1. **Ingreso Neto Mensual Deseado:** Indica cuánto dinero limpio deseas percibir cada mes para tus gastos personales y vida cotidiana.
2. **Jornada de Trabajo:** Configura tus días laborales por semana (ej. 5) y horas por día (ej. 8).
3. **Días No Laborables:** Indica cuántas semanas de vacaciones deseas al año, cuántos días festivos/feriados no trabajarás y cuántos días estimas por enfermedad o imprevistos.
4. **Porcentaje Facturable:** En el trabajo freelance, parte del tiempo se dedica a reuniones, propuestas y administración. Si dedicas un 75% a trabajo de clientes facturable, indícalo aquí.
5. **Impuestos Estimados:** Porcentaje aproximado de impuestos sobre tus ingresos brutos (ej. 20%).
6. **Margen de Ganancia:** Porcentaje de colchón financiero de seguridad o rentabilidad para tu negocio (ej. 15%).
7. **Costos Fijos y Software:**
   - Escribe el nombre del gasto (ej. *"Internet y Móvil"* o *"Licencia Adobe"*).
   - Escribe el monto en dólares y selecciona si es **Mensual** o **Anual**, y si corresponde a un **Costo Fijo** o a **Software/SaaS**.
   - Haz clic en **+ Añadir**.

### Resultados en Tiempo Real
- **Tarifa Recomendada:** Tu precio sugerido por hora a cobrar a clientes (incluye margen de ganancia).
- **Tarifa Mínima:** Tu tarifa de punto de equilibrio (break-even). Cobrar por debajo de este número generará pérdidas operativas.
- **Horas Facturables:** El volumen real de horas facturables que tendrás disponibles al mes y al año.
- **Presupuesto Anual:** El total de dinero bruto necesario para cubrir impuestos, costos de negocio y tu salario neto.

### Guardar Escenarios
- Escribe un nombre en **Nombre del Escenario** (ej. *"Escenario Crecimiento 2026"*) y presiona **Guardar Escenario**.
- Podrás consultar tus escenarios en la columna derecha, cargarlos con un clic para recalcular o eliminarlos cuando lo desees.

---

## 3. Módulo 2: Organizador de Suscripciones y Free Trials

Accede desde el menú superior en **Suscripciones**.

### Registrar un Servicio o Free Trial
1. Haz clic en el botón **+ Nueva Suscripción**.
2. Completa los datos del servicio: nombre, costo, ciclo (mensual, trimestral, anual), categoría, fecha de inicio y próxima renovación.
3. **Si es una prueba gratuita:** Marca la casilla *"¿Es un periodo de prueba gratuito (Free Trial)?"* e indica la **Fecha de Fin de Prueba**.
4. Haz clic en **Guardar Suscripción**.

### Tarjetas de Métricas Financieras
En la parte superior verás en tiempo real:
- **Gasto Mensual Proyectado:** Cuánto dinero cuesta mantener activas todas tus herramientas al mes.
- **Gasto Anual Proyectado:** La proyección de costo total en un año completo.
- **Suscripciones Activas** y **Periodos de Prueba Activos**.

### Aviso Preventivo de Trials
- Si tienes alguna prueba gratuita que finalizará en los siguientes 7 días, aparecerá un **banner de alerta en amarillo** advirtiéndote para que puedas cancelar a tiempo si no deseas continuar.

### Búsqueda, Filtros y Ordenamiento
- **Buscador:** Escribe en la barra de búsqueda para filtrar al instante por nombre, método de pago o notas.
- **Filtros combinables:** Puedes filtrar por estado (Activas, En Prueba, Pausadas, Canceladas) y simultáneamente por categoría.
- **Ordenamiento:** Ordena la tabla por fecha de renovación próxima, por costo ascendente/descendente o por nombre de servicio.

### Configuración de Alertas por Correo
1. Haz clic en **🔔 Configurar Alertas**.
2. Define con cuántos días de anticipación deseas recibir avisos antes de que venza un Free Trial (ej. 3 días) o antes de que se cobre una renovación (ej. 5 días).
3. Asegúrate de tener marcada la casilla de notificaciones activas.
4. El botón **⚡ Probar Verificación Ahora** permite forzar una comprobación manual inmediata para verificar que el sistema detecte tus servicios por vencer.

---

## 4. Panel de Administración (Solo Administradores)

Si tu usuario posee el rol `admin`, aparecerá la pestaña **Administración** en la barra superior.

1. **Métricas Globales:** Total de usuarios registrados, costo mensual global administrado, tarifas promedio de los freelancers y volumen de alertas enviadas.
2. **Control de Usuarios:**
   - Busca usuarios por nombre o correo.
   - Filtra por rol (`admin`, `freelancer`) o estado (`active`, `suspended`).
   - Botón **Suspender / Reactivar:** Bloquea inmediatamente el acceso a un usuario problemático.
   - Botón **Hacer Admin / Hacer Freelancer:** Modifica los privilegios del usuario.
3. **Bitácora de Auditoría:** Registro histórico de cada correo de alerta despachado en la plataforma.
