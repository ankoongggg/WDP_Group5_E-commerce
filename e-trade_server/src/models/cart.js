const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
    product_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    // 👇 CHÍNH LÀ NÓ! PHẢI KHAI BÁO CỘT NÀY THÌ DB MỚI CHỊU LƯU PHÂN LOẠI 👇
    type: {
        type: String,
        default: ''
    },
    variant: {
        type: String,
        default: ''
    }
});

const cartSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [cartItemSchema]
}, { timestamps: true });

module.exports = mongoose.model('Cart', cartSchema);