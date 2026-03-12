const express = require('express');
const router = express.Router();

const {
    getSellerProducts,
    createSellerProduct,
    updateSellerProduct,
    updateSellerProductStatus,
    softDeleteSellerProduct,
    addSellerProductStock // <--- 1. Bổ sung hàm này vào đây
} = require('../controllers/sellerProductController');

const { protect, isSeller } = require('../middlewares/auth');

// All routes below require seller authentication
router.use(protect, isSeller);

router.get('/products', getSellerProducts);
router.post('/products', createSellerProduct);
router.put('/products/:id', updateSellerProduct);
router.patch('/products/:id/status', updateSellerProductStatus);
router.delete('/products/:id', softDeleteSellerProduct);

// 2. Sửa lại thành gọi trực tiếp tên hàm
router.patch('/products/:id/stock', addSellerProductStock); 

module.exports = router;