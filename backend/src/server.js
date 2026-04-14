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
app.use(helmet());
app.use(cors({ origin: env.frontendUrl, credentials: true }));

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

// Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Zellu API running on port ${env.port}`);
});

module.exports = app;
