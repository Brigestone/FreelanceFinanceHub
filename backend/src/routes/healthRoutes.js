const express = require('express');
const config = require('../config/env');
const { testConnection } = require('../config/db');

const router = express.Router();

/**
 * @route   GET /api/v1/health
 * @desc    Comprueba el estado de la API y la conectividad con MariaDB
 * @access  Público
 */
router.get('/', async (req, res, next) => {
  try {
    const dbStatus = await testConnection();

    const healthData = {
      status: dbStatus.success ? 'healthy' : 'degraded',
      service: 'FreelanceFinanceHub API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: config.env,
      database: {
        connected: dbStatus.success,
        driver: 'mysql2/promise',
        engine: 'MariaDB/MySQL (XAMPP)',
        // En producción no se exponen versión, host ni mensajes de error internos.
        ...(!config.isProduction && {
          details: dbStatus.success ? dbStatus.details : { error: dbStatus.error, code: dbStatus.code }
        })
      }
    };

    const httpStatus = dbStatus.success ? 200 : 503;
    res.status(httpStatus).json(healthData);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
