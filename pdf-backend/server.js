require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./src/app');
const config = require('./src/config');

mongoose
  .connect(config.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(config.PORT, () => {
      console.log(`PDF Backend running at http://localhost:${config.PORT}`);
      console.log(`Health check: http://localhost:${config.PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
