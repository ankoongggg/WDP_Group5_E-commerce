const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');

// API: Get store details
router.get('/:id', storeController.getStoreDetails);

// API: Get all products for a store
router.get('/:id/products', storeController.getStoreProducts);

module.exports = router;