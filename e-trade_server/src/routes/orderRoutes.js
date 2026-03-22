const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { protect, isSeller } = require('../middlewares/auth');

// --- CỔNG CHO NGƯỜI MUA (CUSTOMER) ---
router.get('/my-orders', protect, orderController.getMyOrders);            // Lấy danh sách đơn
router.get('/detail/:orderId', protect, orderController.getOrderDetail);     // Xem chi tiết đơn
router.put('/cancel/:orderId', protect, orderController.customerCancelOrder); // Hủy đơn COD

// --- CỔNG CHO NGƯỜI BÁN (SELLER) ---
router.get('/seller/dashboard', protect, isSeller, orderController.getSellerDashboardStats);
router.get('/seller/orders', protect, isSeller, orderController.getSellerOrders);
router.put('/seller/status/:orderId', protect, isSeller, orderController.updateOrderStatusBySeller);

// --- CỔNG CHO PASS ĐỒ CŨ (2nd hand) ---
router.get('/2nd_orders', protect, orderController.getCustomerPassedOrders);
router.put('/update_passed_order_status/:orderId', protect, orderController.updatePassedOrderStatus);

module.exports = router;