const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const authMiddleware = require('../middleware/authMiddleware');
const ctrl = require('../controllers/documentController');

const router = Router();

// Public — verify by doc code (no auth needed)
router.get('/documents/verify/:code', asyncHandler(ctrl.verifyByCode));

// Public — list all published docs (starter templates for users)
router.get('/documents/published', asyncHandler(ctrl.listPublished));

// All other document routes require auth (applied per-route)
router.get('/documents/stats', authMiddleware, asyncHandler(ctrl.getStats));
router.get('/documents/archive', authMiddleware, asyncHandler(ctrl.listAll));
router.get('/documents', authMiddleware, asyncHandler(ctrl.list));
router.get('/documents/:id', authMiddleware, asyncHandler(ctrl.getById));
router.post('/documents', authMiddleware, asyncHandler(ctrl.create));
router.put('/documents/:id', authMiddleware, asyncHandler(ctrl.update));
router.delete('/documents/:id', authMiddleware, asyncHandler(ctrl.delete));
router.post('/documents/:id/duplicate', authMiddleware, asyncHandler(ctrl.duplicate));
router.post('/documents/:id/move', authMiddleware, asyncHandler(ctrl.moveToFolder));
router.post('/documents/:id/fork', authMiddleware, asyncHandler(ctrl.forkPublished));
router.post('/documents/bulk-delete', authMiddleware, asyncHandler(ctrl.bulkDelete));
router.post('/documents/archive-delete', authMiddleware, asyncHandler(ctrl.archiveDelete));
router.post('/documents/export', authMiddleware, asyncHandler(ctrl.exportDocs));
router.post('/documents/import', authMiddleware, asyncHandler(ctrl.importDocs));
router.patch('/documents/:id/publish', authMiddleware, asyncHandler(ctrl.publish));

module.exports = router;

