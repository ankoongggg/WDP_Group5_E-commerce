const express = require('express');
const router = express.Router();

const { 
    getProducts, 
    getProductById, 
    getRandomProductsgotSaleMoreThan50Percent,
    getProductDetails, 
    getProductReviews 
} = require('../controllers/productController');

// =========================================
// 1. CÁC ROUTE CỤ THỂ (Phải đặt lên trên cùng)
// =========================================

// API: Lấy sản phẩm giảm giá
router.get('/sale', getRandomProductsgotSaleMoreThan50Percent);

// =========================================
// 2. ROUTE GỐC
// =========================================

// API: Lấy tất cả sản phẩm (Trending Now)
router.get('/', getProducts);

// =========================================
// 3. CÁC ROUTE CÓ PARAMETER (/:id) (Phải đặt dưới cùng)
// =========================================

// API: Lấy chi tiết 1 sản phẩm 
router.get('/:id', getProductDetails); 

// API: Lấy review của 1 sản phẩm
router.get('/:id/reviews', getProductReviews);

module.exports = router;