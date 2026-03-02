const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { protect } = require('../middlewares/auth');

// API: Get store details
router.get('/:id', storeController.getStoreDetails);

// API: Get all products for a store
router.get('/:id/products', storeController.getStoreProducts);

// API: Register as seller
router.post('/register-seller', protect, storeController.registerSeller);

// API: Get seller registration status
router.get('/registration/status', protect, storeController.getSellerRegistrationStatus);

module.exports = router;