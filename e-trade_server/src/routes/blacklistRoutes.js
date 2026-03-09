const express = require('express');
const router = express.Router();
const { protect, isAdmin} = require('../middlewares/auth');
const { getKeywords, addKeyword, deleteKeyword,
    UpdateStatusForProductWithBlacklistedKeyword,
    getPendingProductsWithBlacklistedKeywords
 } = require('../controllers/BlacklistController');

router.get('/',protect, isAdmin, getKeywords);
router.post('/create', protect, isAdmin, addKeyword);
router.delete('/:id', protect, isAdmin, deleteKeyword);
router.get('/admin/pending-products', protect, isAdmin, getPendingProductsWithBlacklistedKeywords);
router.put('/admin/set-status', protect, isAdmin, UpdateStatusForProductWithBlacklistedKeyword);
module.exports = router;