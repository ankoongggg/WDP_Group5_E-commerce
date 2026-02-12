const mongoose = require('mongoose');
const Store = require('./Store');
const Category = require('./Category');

const productSchema = new mongoose.Schema({
    store_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Store', required: true },
    category_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }],
    name: { type: String, required: true },
    description: String,
    main_image: String,
    display_files: [String],
    price: { type: Number, required: true },
    original_price: Number,
    product_type: [
        {
            description: String,
            stock: Number,
            price_difference: Number,
        }
    ],
    condition: String,
    status: String,
    rejection_reason: String,
});

module.exports = mongoose.model('Product', productSchema);