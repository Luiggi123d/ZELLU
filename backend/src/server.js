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

// Parsing — raise limit because Evolution API webhooks include
// base64-encoded media in MESSAGES_UPSERT payloads.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting — skip the Evolution API webhook, which gets hammered
// from a single IP and must never be throttled.
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/api/whatsapp/webhook',
}));

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

// Inicia job de envio de campanhas (anti-ban)
const { startCampaignSenderJob } = require('./services/campaignSender');
startCampaignSenderJob();

// Error handling
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Zellu API running on port ${env.port}`);
  console.log(`  ANTHROPIC_API_KEY: ${process.env.ANTHROPIC_API_KEY ? 'configurada' : '*** NAO CONFIGURADA ***'}`);
  console.log(`  EVOLUTION_API_URL: ${env.evolutionApiUrl || '*** NAO CONFIGURADA ***'}`);
  console.log(`  BACKEND_PUBLIC_URL: ${env.backendPublicUrl || '*** NAO CONFIGURADA ***'}`);
});

module.exports = app;
