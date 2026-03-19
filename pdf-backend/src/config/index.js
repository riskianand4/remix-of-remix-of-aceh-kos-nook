module.exports = {
  PORT: process.env.PORT || 3002,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/pdf-generator',
  CORS_ORIGINS: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['*'],
  RATE_LIMIT: {
    windowMs: 60 * 2000,
    max: 60,
  },
  BODY_LIMIT: '200mb',
  MAX_VERSIONS_PER_DOC: 10,
  // Auth
  JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production-use-long-random-string',
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:8081',
  // SMTP
  SMTP_HOST: process.env.SMTP_HOST || 'smtp.gmail.com',
  SMTP_PORT: parseInt(process.env.SMTP_PORT) || 587,
  SMTP_SECURE: process.env.SMTP_SECURE === 'true',
  SMTP_USER: process.env.SMTP_USER || '',
  SMTP_PASS: process.env.SMTP_PASS || '',
  FROM_EMAIL: process.env.FROM_EMAIL || 'noreply@example.com',
};
