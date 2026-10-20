const mysql = require('mysql2/promise');
const config = require('./env');

const dbConfig = {
  ...config.db,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  charset: 'utf8mb4',
  // Fechas DATE se devuelven como 'YYYY-MM-DD' para evitar desfases de zona horaria.
  dateStrings: ['DATE']
};

// Pool de conexiones a MariaDB (XAMPP)
const pool = mysql.createPool(dbConfig);

/**
 * Prueba la conexión a la base de datos.
 * @returns {Promise<{success: boolean, message: string, details?: object, error?: string, code?: string}>}
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT VERSION() AS db_version, DATABASE() AS current_db');
    connection.release();

    return {
      success: true,
      message: 'Conexión a MariaDB establecida exitosamente.',
      details: {
        database: rows[0].current_db,
        version: rows[0].db_version,
        host: dbConfig.host,
        port: dbConfig.port
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error al conectar con MariaDB.',
      error: error.message,
      code: error.code
    };
  }
}

/** Cierra todas las conexiones del pool (apagado limpio y fin de pruebas). */
async function closePool() {
  await pool.end();
}

// Ejecución directa para diagnóstico: npm run db:test
if (require.main === module) {
  (async () => {
    console.log('Probando conexión a la base de datos con la configuración actual...');
    console.log(`Host: ${dbConfig.host}:${dbConfig.port} | Usuario: ${dbConfig.user} | BD: ${dbConfig.database}`);
    const result = await testConnection();
    await closePool();
    if (result.success) {
      console.log('✅ ' + result.message);
      console.log('Detalles:', result.details);
      process.exit(0);
    } else {
      console.error('❌ ' + result.message);
      console.error('Código de error:', result.code);
      console.error('Detalle:', result.error);
      process.exit(1);
    }
  })();
}

module.exports = {
  pool,
  testConnection,
  closePool
};
