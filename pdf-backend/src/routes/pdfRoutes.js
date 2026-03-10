const { Router } = require('express');
const { handleGeneratePdf } = require('../controllers/pdfController');
const validateBody = require('../middleware/validateBody');

const router = Router();
router.post('/generate-pdf', validateBody(['html']), handleGeneratePdf);

module.exports = router;
