const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const authMiddleware = require('../middleware/authMiddleware');
const ctrl = require('../controllers/templateController');

const router = Router();

router.get('/templates', authMiddleware, asyncHandler(ctrl.list));
router.post('/templates', authMiddleware, asyncHandler(ctrl.create));
router.delete('/templates/:id', authMiddleware, asyncHandler(ctrl.delete));
router.post('/templates/:id/create-doc', authMiddleware, asyncHandler(ctrl.createDocFromTemplate));

module.exports = router;
