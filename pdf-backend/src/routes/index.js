const { Router } = require('express');
const pdfRoutes = require('./pdfRoutes');
const healthRoutes = require('./healthRoutes');
const documentRoutes = require('./documentRoutes');
const templateRoutes = require('./templateRoutes');
const versionRoutes = require('./versionRoutes');
const qrRoutes = require('./qrRoutes');

const router = Router();
router.use(documentRoutes);
router.use(templateRoutes);
router.use(versionRoutes);
router.use(qrRoutes);
router.use(pdfRoutes);
router.use(healthRoutes);

module.exports = router;
