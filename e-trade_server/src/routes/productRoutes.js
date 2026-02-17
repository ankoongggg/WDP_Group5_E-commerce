const express = require('express');
const router = express.Router();
const { getProducts, getProductById, getRandomProductsgotSaleMoreThan50Percent } = require('../controllers/ProductController');

router.get('/sale', getRandomProductsgotSaleMoreThan50Percent);
router.get('/', getProducts);
router.get('/:id', getProductById);


module.exports = router;