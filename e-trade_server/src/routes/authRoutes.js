const express = require('express');
const router = express.Router();
const { register, login, refreshToken, getProfile, logout, changePassword, forgotPassword, resetPassword } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.get('/profile', verifyToken, getProfile);
router.post('/logout', verifyToken, logout);
router.put('/change-password', verifyToken, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
