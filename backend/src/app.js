const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const config = require('./config/env');
const healthRoutes = require('./routes/healthRoutes');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const calculatorRoutes = require('./routes/calculatorRoutes');
const subscriptionRoutes = require('./routes/subscriptionRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const originCheck = require('./middlewares/originCheck');
const { apiLimiter } = require('./middlewares/rateLimiter');
const errorHandler = require('./middlewares/errorHandler');

const FRONTEND_DIR = path.join(__dirname, '../../frontend');

const app = express();

// No revelar la tecnología del servidor
app.disable('x-powered-by');

// --- Cabeceras de seguridad (helmet + Content Security Policy) -------------
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // <-- Permite scripts en el HTML
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'], // <-- Permite estilos en el HTML
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        objectSrc: ["'none'"],
        // En local (HTTP) no se fuerza HTTPS; en producción sí.
        upgradeInsecureRequests: config.isProduction ? [] : null
      }
    },
    hsts: config.isProduction
  })
);

// --- CORS: solo orígenes declarados en APP_ORIGIN, con cookies --------------
app.use(
  cors({
    origin: (origin, callback) => callback(null, !origin || config.allowedOrigins.includes(origin)),
    credentials: true
  })
);

// --- Parsers con límite de tamaño -----------------------------------------
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));
app.use(cookieParser());

// --- Frontend estático ----------------------------------------------------
// /login → login.html, /register → register.html, etc.
app.use(express.static(path.join(FRONTEND_DIR, 'public'), { extensions: ['html'] }));
// CSS y JS del cliente (corrige las rutas ../src rotas de la Fase 1)
app.use('/assets', express.static(path.join(FRONTEND_DIR, 'src')));

// --- API ------------------------------------------------------------------
app.use('/api', apiLimiter, originCheck);
app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/calculator', calculatorRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/alerts', notificationRoutes);

// 404 para rutas de API inexistentes
app.all('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

// Manejo centralizado de errores (siempre al final)
app.use(errorHandler);

module.exports = app;
