const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const ctrl = require('../controllers/adminController');

const router = Router();

router.use(authMiddleware);
// router.use(adminMiddleware);

router.get('/admin/users', asyncHandler(ctrl.listUsers));
router.get('/admin/documents', asyncHandler(ctrl.listAllDocuments));
router.delete('/admin/users/:id', asyncHandler(ctrl.deleteUser));
router.put('/admin/users/:id/role', asyncHandler(ctrl.updateUserRole));

module.exports = router;
