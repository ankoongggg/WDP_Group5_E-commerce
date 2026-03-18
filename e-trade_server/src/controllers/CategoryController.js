const Category = require('../models/Category.js');
const Product = require('../models/Product.js');
// GET /api/categories
exports.getCategories = async (req,res) => {
    try{
        const categories = await Category.find({}).where('is_active').equals(true).select('name');
        res.status(200).json(categories);

    }
    catch (err){
        res.status(500).json({
            error: err.message
        })
    }
}

exports.getAllCategories = async (req,res) => {
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


/*
_id
699591935ab0aec57f4d9825
name
"Thể Thao & Dã Ngoại"
is_active
true
created_at
2026-02-18T10:16:51.835+00:00
updated_at
2026-02-18T10:16:51.835+00:00
__v
0*/
exports.createCategory = async (req, res) => {
    try {
        const { name, description = '', is_active = true } = req.body;
        if (!name) {
            return res.status(400).json({ success: false, message: 'Name is required' });
        }
        // build object matching sample data structure
        const newCategory = new Category({ name, description, is_active });
        await newCategory.save();
        res.status(201).json({ success: true, message: 'Category created successfully', data: newCategory });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }   
};
exports.updateCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const { name, description, is_active } = req.body;
        const update = {};
        if (name !== undefined) update.name = name;
        if (description !== undefined) update.description = description;
        if (is_active !== undefined) update.is_active = is_active;

        const updatedCategory = await Category.findByIdAndUpdate(
            categoryId,
            update,
            { new: true, runValidators: true }
        );
        if (!updatedCategory) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        res.json({ success: true, message: 'Category updated successfully', data: updatedCategory });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
};

exports.hideCategory = async (req, res) => {
    try{
        const categoryId = req.params.id;
        const hidden = await Category.findByIdAndUpdate(
            categoryId,
            { is_active: false },
            { new: true }
        );
        if (!hidden) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        res.json({ success: true, message: 'Category hidden', data: hidden });
    } catch(err) {
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
}

exports.showCategory = async (req, res) => {
    try{
        const categoryId = req.params.id;
        const showed = await Category.findByIdAndUpdate(
            categoryId,
            { is_active: true },
            { new: true }
        );
        if (!showed) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }
        res.json({ success: true, message: 'Category showed', data: showed });
    } catch(err) {
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
}