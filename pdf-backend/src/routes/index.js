const { Router } = require('express');
const pdfRoutes = require('./pdfRoutes');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const documentRoutes = require('./documentRoutes');
const templateRoutes = require('./templateRoutes');
const versionRoutes = require('./versionRoutes');
const shareRoutes = require('./shareRoutes');
const qrRoutes = require('./qrRoutes');
const folderRoutes = require('./folderRoutes');
const adminRoutes = require('./adminRoutes');

const router = Router();
router.use(authRoutes);
router.use(adminRoutes);
router.use(documentRoutes);
router.use(folderRoutes);
router.use(templateRoutes);
router.use(versionRoutes);
router.use(shareRoutes);
router.use(qrRoutes);
router.use(pdfRoutes);
router.use(healthRoutes);

module.exports = router;
