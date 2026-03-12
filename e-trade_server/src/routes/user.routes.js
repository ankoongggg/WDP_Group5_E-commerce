const express = require('express');
const router = express.Router();
const {
    getProfile,
    updateProfile,
    getTotalUsersNumberAndComparison,
    getUserList,
    updateUserRole,
    banAccount,
    createUserByAdmin,
} = require('../controllers/UserController');
const { createProductReview, getProductReviewByUser } = require('../controllers/reviewController');
const { protect, isAdmin } = require('../middlewares/auth');
const { updateProductReview } = require('../controllers/reviewController');
// ...
router.put('/feedback', protect, updateProductReview);
router.get('/me', protect, getProfile);
router.get('/admin/users/total', getTotalUsersNumberAndComparison);
router.put('/me', protect, updateProfile); 

// Admin user management
router.get('/admin/users', protect, isAdmin, getUserList);
router.post('/admin/users', protect, isAdmin, createUserByAdmin);
router.patch('/admin/users/:id/role', protect, isAdmin, updateUserRole);
router.patch('/admin/users/:id/ban', protect, isAdmin, banAccount);

// APIs for product reviews
router.post('/feedback', protect, createProductReview);
router.get('/feedback/check', protect, getProductReviewByUser);

module.exports = router;