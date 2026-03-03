const express = require('express');
const router = express.Router();
const { getCategories,getAllCategories, getCategoryById,createCategory,
    updateCategory,hideCategory,showCategory
} = require('../controllers/CategoryController');

router.get('/',getCategories);
router.get('/all',getAllCategories);
router.get('/:id', getCategoryById);

router.post('/create', createCategory);
router.put('/:id', updateCategory);
router.put('/:id/show', showCategory);
router.put('/:id/hide', hideCategory);

module.exports = router;