const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, isSeller } = require('../middlewares/auth');

// Các route này yêu cầu người dùng phải đăng nhập (protect) và có vai trò 'seller' (isSeller)

// [SELLER] GET /api/seller/orders - Lấy danh sách đơn hàng cho cửa hàng của người bán
router.get('/orders', protect, isSeller, orderController.getSellerOrders);

// [SELLER] PUT /api/seller/orders/:orderId/status - Xác nhận hoặc từ chối một đơn hàng
router.put('/:orderId/status', protect, isSeller, orderController.updateOrderStatusBySeller);

module.exports = router;