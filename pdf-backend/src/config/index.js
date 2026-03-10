module.exports = {
  PORT: process.env.PORT || 3002,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/pdf-generator',
  CORS_ORIGINS: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*'],
  RATE_LIMIT: {
    windowMs: 60 * 1000,
    max: 60,
  },
  BODY_LIMIT: '100mb',
  MAX_VERSIONS_PER_DOC: 10,
};
