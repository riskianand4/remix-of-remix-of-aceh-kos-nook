const { Router } = require('express');
const { handleGenerateQr } = require('../controllers/qrController');

const router = Router();
router.post('/qr', handleGenerateQr);

module.exports = router;
