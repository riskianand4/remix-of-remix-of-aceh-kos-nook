module.exports = (requiredFields = []) => (req, res, next) => {
  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res.status(400).json({
        error: { code: 400, message: `Field '${field}' is required.` },
      });
    }
  }
  next();
};
