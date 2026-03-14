const express = require('express');
const router = express.Router();
const {
    getProfile,
    updateProfile,
    getTotalUsersNumberAndComparison,
    toggleWishlist,
    toggleFollowStore,
    getWishlist,
    getFollowingStores,
} = require('../controllers/UserController');
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

// APIs for wishlist and following stores
router.post('/wishlist/toggle', protect, toggleWishlist);
router.post('/follow/toggle', protect, toggleFollowStore);
router.get('/wishlist', protect, getWishlist);
router.get('/following', protect, getFollowingStores);

module.exports = router;