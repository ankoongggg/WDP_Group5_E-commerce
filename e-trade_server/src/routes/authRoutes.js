const express = require('express');
const router = express.Router();
const { register, login, logout, googleAuth, googleCallback, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);

router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);


module.exports = router;