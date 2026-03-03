const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
// Giả định bạn có một middleware tên là `protect` để xác thực token và lấy thông tin user
const { protect } = require('../middlewares/auth');

// === Public Routes ===
// GET /api/stores/:id - Lấy thông tin chi tiết công khai của một cửa hàng
router.get('/:id', storeController.getStoreDetails);

// GET /api/stores/:id/products - Lấy tất cả sản phẩm của một cửa hàng
router.get('/:id/products', storeController.getStoreProducts);

// === Protected Routes (yêu cầu đăng nhập) ===
// POST /api/stores/register - Gửi đơn đăng kí để trở thành seller
router.post('/register-seller', protect, storeController.registerSeller);

// GET /api/stores/registration/status - Lấy trạng thái đơn đăng kí seller của user hiện tại
router.get('/registration/status', protect, storeController.getSellerRegistrationStatus);

// PUT /api/stores/registration - Cập nhật thông tin đơn đăng kí seller
router.put('/registration', protect, storeController.updateSellerRegistration);

module.exports = router;