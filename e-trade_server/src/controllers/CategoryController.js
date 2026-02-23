const Category = require('../models/Category.js');
const Product = require('../models/Product.js');
// GET /api/categories
exports.getCategories = async (req,res) => {
    try{
        const categories = await Category.find({});
        res.status(200).json(categories);

    }
    catch (err){
        res.status(500).json({
            error: err.message
        })
    }
}

exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        res.json({ success: true, data: category });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

exports.getProductsByCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const products = await Product.find({ category_id: categoryId, status: 'active' })
            .populate('store_id', 'shop_name pickup_address')
            .populate('category_id', 'name');
        res.json({ success: true, count: products.length, data: products });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }   
};