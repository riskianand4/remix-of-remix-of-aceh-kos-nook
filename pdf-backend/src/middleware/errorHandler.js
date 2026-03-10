module.exports = (err, req, res, _next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  console.error(`[ERROR] ${req.method} ${req.path}:`, err.message);
  res.status(status).json({
    error: { code: status, message, timestamp: new Date().toISOString() },
  });
};
