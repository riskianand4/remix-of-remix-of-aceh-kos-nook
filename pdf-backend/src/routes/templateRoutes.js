const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const ctrl = require('../controllers/templateController');

const router = Router();

router.get('/templates', asyncHandler(ctrl.list));
router.post('/templates', asyncHandler(ctrl.create));
router.delete('/templates/:id', asyncHandler(ctrl.delete));
router.post('/templates/:id/create-doc', asyncHandler(ctrl.createDocFromTemplate));

module.exports = router;
