const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
    store_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Store',},
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', },
    category_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true }],
    name: { type: String, required: true },
    description: String,
    main_image: String,
    display_files: [String],
    price: { type: Number, required: true },
    original_price: Number,
    stock: { type: Number, default: 0 },
    product_type: [
        {
            description: String,
            stock: Number,
            price_difference: Number,
        },
    ],
    condition: String,
    status: { type: [String], enum: ['pending', 'active', 'rejected', 'inactive'] },
    rejection_reason: String,
    // Soft delete & audit
    is_deleted: { type: Boolean, default: false },
    deleted_at: { type: Date, default: null },
    deleted_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Product', productSchema);

