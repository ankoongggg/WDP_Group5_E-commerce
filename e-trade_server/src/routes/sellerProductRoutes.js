const express = require('express');
const router = express.Router();

const {
    getSellerProducts,
    createSellerProduct,
    updateSellerProduct,
    updateSellerProductStatus,
    softDeleteSellerProduct,
} = require('../controllers/sellerProductController');

const { protect, isSeller } = require('../middlewares/auth');

// All routes below require seller authentication
router.use(protect, isSeller);

router.get('/products', getSellerProducts);
router.post('/products', createSellerProduct);
router.put('/products/:id', updateSellerProduct);
router.patch('/products/:id/status', updateSellerProductStatus);
router.delete('/products/:id', softDeleteSellerProduct);

module.exports = router;

