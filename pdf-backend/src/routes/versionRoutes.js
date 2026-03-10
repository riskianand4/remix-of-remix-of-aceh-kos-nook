const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const ctrl = require('../controllers/versionController');

const router = Router();

router.get('/documents/:id/versions', asyncHandler(ctrl.list));
router.post('/documents/:id/versions', asyncHandler(ctrl.save));
router.post('/documents/:id/versions/:vid/restore', asyncHandler(ctrl.restore));

module.exports = router;
