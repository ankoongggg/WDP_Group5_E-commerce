const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth');

const { 
    getProductsOnHomePage, 
    getProductsOnProductList,
    getProductById, 
    getRandomUsedProducts,
    getRandomProductsgotSaleMoreThan50Percent,
    getProductDetails, 
    getProductReviews,
    createPassing2ndProduct,
    getCustomerPassedProducts,
    updateCustomerPassedProduct,
    deleteCustomerPassedProduct,
} = require('../controllers/ProductController');

// =========================================
// 1. CÁC ROUTE CỤ THỂ (Phải đặt lên trên cùng)
// =========================================
// các route liên quan đến customer pass items cần auth
router.get('/customer_passed_products', protect, getCustomerPassedProducts);
// API: Lấy sản phẩm giảm giá
router.get('/sale', getRandomProductsgotSaleMoreThan50Percent);
// API: Tạo sản phẩm mới ( customer pass 2nd product) 
router.post('/create_2nd_product', protect, createPassing2ndProduct);
// API: Cập nhật / xóa bài pass của chính user
router.put('/pass/:id', protect, updateCustomerPassedProduct);
router.delete('/pass/:id', protect, deleteCustomerPassedProduct);
// =========================================
// 2. ROUTE GỐC
// =========================================

// API: Lấy tất cả sản phẩm (Trending Now)
router.get('/home', getProductsOnHomePage);
router.get('/used', getRandomUsedProducts); // API: Lấy sản phẩm đã qua sử dụng
router.get('/', getProductsOnProductList); // tạm thời để 2 route này trỏ về cùng 1 controller, sau này nếu cần có thể tách riêng
// =========================================
// 3. CÁC ROUTE CÓ PARAMETER (/:id) (Phải đặt dưới cùng)
// =========================================

// API: Lấy chi tiết 1 sản phẩm 
router.get('/:id', getProductDetails); 

// API: Lấy review của 1 sản phẩm
router.get('/:id/reviews', getProductReviews);





module.exports = router;