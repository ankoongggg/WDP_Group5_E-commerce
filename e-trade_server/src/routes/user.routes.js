const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getTotalUsersNumberAndComparison } = require('../controllers/UserController');
const { protect } = require('../middlewares/auth');

router.get('/me', protect, getProfile);
router.get('/admin/users/total', getTotalUsersNumberAndComparison);
router.put('/me', protect, updateProfile); 

module.exports = router;