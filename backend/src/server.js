// La configuración se valida ANTES de cargar cualquier otro módulo.
let config;
try {
  config = require('./config/env');
} catch (error) {
  if (error.name === 'ConfigError') {
    console.error('❌ ' + error.message);
    process.exit(1);
  }
  throw error;
}

const app = require('./app');
const { testConnection, closePool } = require('./config/db');
const { initCron, stopCron } = require('./services/cronService');


const server = app.listen(config.port, async () => {
  console.log('====================================================');
  console.log(`🚀 Servidor FreelanceFinanceHub activo en: http://localhost:${config.port}`);
  console.log(`📡 Endpoint de salud: http://localhost:${config.port}/api/v1/health`);
  console.log(`🌐 Frontend: http://localhost:${config.port}/`);
  console.log(`⚙️  Entorno: ${config.env} | Orígenes permitidos: ${config.allowedOrigins.join(', ')}`);
  console.log('====================================================');

  console.log('🔍 Verificando conexión con MariaDB (XAMPP)...');
  const dbStatus = await testConnection();
  if (dbStatus.success) {
    console.log(`✅ Base de datos conectada: [${dbStatus.details.database}] en ${dbStatus.details.host}:${dbStatus.details.port}`);
    console.log(`ℹ️  Versión del motor: ${dbStatus.details.version}`);
  } else {
    console.warn(`⚠️  Atención: No se pudo conectar a la base de datos (${dbStatus.message})`);
    console.warn(`   Código: ${dbStatus.code || 'N/A'} - Detalle: ${dbStatus.error || 'Verifica que MySQL esté iniciado en XAMPP'}`);
  }
  console.log('====================================================\n');

  // Iniciar servicio de alertas automáticas (node-cron)
  initCron();
});

server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ El puerto ${config.port} ya está en uso. Cierra el otro proceso o cambia PORT en .env.`);
    process.exit(1);
  }
  throw error;
});

// Cierre limpio: deja de aceptar conexiones y libera el pool de MariaDB.
function shutdown(signal) {
  console.log(`\n${signal} recibido. Cerrando servidor...`);
  stopCron();
  server.close(async () => {
    try {
      await closePool();
    } catch {
      /* el pool ya estaba cerrado */
    }
    console.log('Servidor finalizado.');
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
