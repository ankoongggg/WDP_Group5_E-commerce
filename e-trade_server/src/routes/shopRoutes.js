const express = require('express');
const router = express.Router();
const { 
    getPaymentMethods, 
    createOrder, 
    submitPayment,
    getMyOrders,
    getOrderDetail 
} = require('../controllers/ShopController');
const { protect } = require('../middlewares/auth');

// =====================================================
// PUBLIC ROUTES
// =====================================================

// Lấy danh sách payment methods
router.get('/payment-methods', getPaymentMethods);

// =====================================================
// PROTECTED ROUTES (Cần đăng nhập)
// =====================================================

// Tạo order từ cart
router.post('/orders', protect, createOrder);

// Gửi payment request (xử lý thanh toán)
router.post('/orders/:orderId/payment', protect, submitPayment);

// Lấy danh sách orders của user
router.get('/orders', protect, getMyOrders);

// Lấy chi tiết order
router.get('/orders/:orderId', protect, getOrderDetail);

module.exports = router;
