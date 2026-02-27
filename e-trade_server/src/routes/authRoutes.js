const express = require('express');
const router = express.Router();
const { register, login, logout, googleAuth, googleCallback } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);

router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

module.exports = router;