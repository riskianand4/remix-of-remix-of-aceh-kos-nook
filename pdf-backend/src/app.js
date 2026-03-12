const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const config = require('./config');
const rateLimiter = require('./middleware/rateLimiter');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');
const shareRoutes = require('./routes/shareRoutes');

const app = express();

// Security & compression
app.use(helmet());
app.use(compression());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: config.BODY_LIMIT }));

// Logging
app.use(requestLogger);

// Public routes (no auth, no rate limit) — review/share endpoints
app.use('/api', shareRoutes);

// Rate limiting for protected routes
app.use('/api', rateLimiter);

// Protected routes
app.use('/api', routes);

// Error handler
app.use(errorHandler);

module.exports = app;
