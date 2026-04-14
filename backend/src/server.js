const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS — allowlist + Vercel preview deployments
const allowlist = new Set([env.frontendUrl, ...env.allowedOrigins]);
const corsOptions = {
  origin: (origin, callback) => {
    // Allow no-origin (curl, health checks, server-to-server)
    if (!origin) return callback(null, true);
    // Allow exact matches from allowlist
    if (allowlist.has(origin)) return callback(null, true);
    // Allow any Vercel preview deploy for this project
    if (/^https:\/\/zellu(-[a-z0-9-]+)?\.vercel\.app$/.test(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Rate limiting
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging
if (env.nodeEnv !== 'test') {
  app.use(morgan('dev'));
}

// Root healthcheck (for Railway / uptime monitors)
app.get('/', (_req, res) => {
  res.json({ name: 'Zellu API', status: 'ok', allowedOrigins: [...allowlist] });
});

// Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Zellu API running on port ${env.port}`);
});

module.exports = app;
