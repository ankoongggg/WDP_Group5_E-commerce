const express = require('express');
const router = express.Router();
const storeController = require('../controllers/storeController');
const { protect } = require('../middlewares/auth');

router.get('/admin/stores', storeController.getListingStoresAndRevenuesTotalOrdersFromProductOfEachStore);

// API: Get store details
router.get('/:id', storeController.getStoreDetails);

// API: Get all products for a store
router.get('/:id/products', storeController.getStoreProducts);

// API: Register as seller
router.post('/register-seller', protect, storeController.registerSeller);

// API: Get seller registration status
router.get('/registration/status', protect, storeController.getSellerRegistrationStatus);

// =====================================================
// ADMIN ROUTES
// =====================================================
router.get('/admin/pending-sellers',  storeController.getPendingSellers);
router.put('/admin/approve-seller/:id',  storeController.approveSeller);
router.delete('/admin/reject-seller/:id', storeController.rejectSeller);

module.exports = router;