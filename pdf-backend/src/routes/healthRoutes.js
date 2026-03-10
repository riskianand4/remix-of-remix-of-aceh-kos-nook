const { Router } = require('express');
const { handleHealth } = require('../controllers/healthController');

const router = Router();
router.get('/health', handleHealth);

module.exports = router;
