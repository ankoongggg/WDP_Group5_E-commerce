const express = require('express');
const router = express.Router();
const { getProductDetails, getProductReviews } = require('../controllers/productController');

// API: Get product details
router.get('/:id', getProductDetails);

// API: Get all reviews for a product
router.get('/:id/reviews', getProductReviews);

module.exports = router;