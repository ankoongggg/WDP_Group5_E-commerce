const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/UserController');
const { protect } = require('../middlewares/auth');

router.get('/me', protect, getProfile);
router.put('/me', protect, updateProfile); 

module.exports = router;