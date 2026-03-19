const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const config = require('./config');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();

// Security & compression
app.use(helmet());
app.use(compression());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: config.BODY_LIMIT }));

// Logging & rate limiting
app.use(requestLogger);

// Routes
app.use('/api', routes);

// Error handler
app.use(errorHandler);

module.exports = app;
