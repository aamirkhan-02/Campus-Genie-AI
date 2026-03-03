const express = require('express');
const router = express.Router();
const {
    register, login, getMe, updatePreferences,
    verifyEmail, resendOTP, forgotPassword,
    verifyResetOTP, resetPassword, changePassword,
    uploadAvatar, removeAvatar
} = require('../controllers/authController');
const auth = require('../middleware/auth');
const upload = require('../config/multerConfig');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/verify-reset-otp', verifyResetOTP);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', auth, getMe);
router.put('/preferences', auth, updatePreferences);
router.post('/change-password', auth, changePassword);
router.put('/avatar', auth, upload.single('avatar'), uploadAvatar);
router.delete('/avatar', auth, removeAvatar);

module.exports = router;