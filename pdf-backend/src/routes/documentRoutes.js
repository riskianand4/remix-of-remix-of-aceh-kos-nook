const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const ctrl = require('../controllers/documentController');

const router = Router();

router.get('/documents/stats', asyncHandler(ctrl.getStats));
router.get('/documents/verify/:code', asyncHandler(ctrl.verifyByCode));
router.get('/documents', asyncHandler(ctrl.list));
router.get('/documents/:id', asyncHandler(ctrl.getById));
router.post('/documents', asyncHandler(ctrl.create));
router.put('/documents/:id', asyncHandler(ctrl.update));
router.delete('/documents/:id', asyncHandler(ctrl.delete));
router.post('/documents/:id/duplicate', asyncHandler(ctrl.duplicate));
router.post('/documents/bulk-delete', asyncHandler(ctrl.bulkDelete));
router.post('/documents/export', asyncHandler(ctrl.exportDocs));
router.post('/documents/import', asyncHandler(ctrl.importDocs));

module.exports = router;
