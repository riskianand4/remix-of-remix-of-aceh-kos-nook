const rateLimit = require('express-rate-limit');
const config = require('../config');

module.exports = rateLimit({
  windowMs: config.RATE_LIMIT.windowMs,
  max: config.RATE_LIMIT.max,
  message: { error: { code: 429, message: 'Too many requests. Please try again later.' } },
  standardHeaders: true,
  legacyHeaders: false,
});
