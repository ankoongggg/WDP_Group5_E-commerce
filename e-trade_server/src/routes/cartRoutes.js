const express = require('express');
const router = express.Router();
const cartController = require('../controllers/CartController');
const { protect } = require('../middlewares/auth');

router.use(protect); // Bắt buộc đăng nhập mới được xài giỏ hàng DB

router.get('/', cartController.getCart);
router.put('/sync', cartController.syncCart);
router.delete('/', cartController.clearCart);

module.exports = router;