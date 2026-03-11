const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getTotalUsersNumberAndComparison } = require('../controllers/UserController');
const { createProductReview, getProductReviewByUser } = require('../controllers/reviewController');
const { protect } = require('../middlewares/auth');
const { updateProductReview } = require('../controllers/reviewController');
// ...
router.put('/feedback', protect, updateProductReview);
router.get('/me', protect, getProfile);
router.get('/admin/users/total', getTotalUsersNumberAndComparison);
router.put('/me', protect, updateProfile); 

// APIs for product reviews
router.post('/feedback', protect, createProductReview);
router.get('/feedback/check', protect, getProductReviewByUser);

module.exports = router;