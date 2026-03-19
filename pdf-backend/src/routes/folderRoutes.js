const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const authMiddleware = require('../middleware/authMiddleware');
const ctrl = require('../controllers/folderController');

const router = Router();

router.use(authMiddleware);

router.get('/folders', asyncHandler(ctrl.list));
router.post('/folders', asyncHandler(ctrl.create));
router.put('/folders/:id', asyncHandler(ctrl.rename));
router.delete('/folders/:id', asyncHandler(ctrl.delete));

module.exports = router;
