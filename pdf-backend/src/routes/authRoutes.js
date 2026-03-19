const { Router } = require('express');
const asyncHandler = require('../middleware/asyncHandler');
const authMiddleware = require('../middleware/authMiddleware');
const ctrl = require('../controllers/authController');

const router = Router();

router.post('/auth/register', asyncHandler(ctrl.register));
router.post('/auth/login', asyncHandler(ctrl.login));
router.get('/auth/verify-email', asyncHandler(ctrl.verifyEmail));
router.post('/auth/google', asyncHandler(ctrl.googleLogin));
router.get('/auth/me', authMiddleware, asyncHandler(ctrl.me));
router.post('/auth/forgot-password', asyncHandler(ctrl.forgotPassword));
router.post('/auth/reset-password', asyncHandler(ctrl.resetPassword));
router.put('/auth/profile', authMiddleware, asyncHandler(ctrl.updateProfile));
router.put('/auth/change-password', authMiddleware, asyncHandler(ctrl.changePassword));
router.post('/auth/verify-password', authMiddleware, asyncHandler(ctrl.verifyPassword));

module.exports = router;
