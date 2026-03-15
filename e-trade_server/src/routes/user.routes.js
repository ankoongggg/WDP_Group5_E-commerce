const express = require('express'); // Đã sửa 'styled-components' thành 'express' cho chuẩn Backend
const router = express.Router();
const {
    getProfile,
    updateProfile,
    changePassword, // KHAI BÁO HÀM VỪA EXPORT
    getTotalUsersNumberAndComparison,
    getUserList,
    updateUserRole,
    banAccount,
    createUserByAdmin,
    toggleWishlist,
    toggleFollowStore,
    getWishlist,
    getFollowingStores,
} = require('../controllers/UserController');
const { createProductReview, getProductReviewByUser } = require('../controllers/reviewController');
const { protect, isAdmin } = require('../middlewares/auth');
const { updateProductReview } = require('../controllers/reviewController');

router.put('/feedback', protect, updateProductReview);
router.get('/me', protect, getProfile);
router.get('/admin/users/total', getTotalUsersNumberAndComparison);
router.put('/me', protect, updateProfile); 

// THÊM ĐƯỜNG DẪN ĐỔI MẬT KHẨU TẠI ĐÂY NÈ ĐẠI CA (Dùng chung middleware protect)
router.put('/change-password', protect, changePassword);

// Admin user management
router.get('/admin/users', protect, isAdmin, getUserList);
router.post('/admin/users', protect, isAdmin, createUserByAdmin);
router.patch('/admin/users/:id/role', protect, isAdmin, updateUserRole);
router.patch('/admin/users/:id/ban', protect, isAdmin, banAccount);

// APIs for product reviews
router.post('/feedback', protect, createProductReview);
router.get('/feedback/check', protect, getProductReviewByUser);

// APIs for wishlist and following stores
router.post('/wishlist/toggle', protect, toggleWishlist);
router.post('/follow/toggle', protect, toggleFollowStore);
router.get('/wishlist', protect, getWishlist);
router.get('/following', protect, getFollowingStores);

module.exports = router;