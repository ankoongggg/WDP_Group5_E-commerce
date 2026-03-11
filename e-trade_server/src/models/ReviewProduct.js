const mongoose = require('mongoose');
const Product = require('./Product');
const User = require('./User');
const Order = require('./Order');

const reviewProductSchema = new mongoose.Schema({
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    fileUploads: [String],
    comment: { type: String},
    
    // ĐÃ THÊM: Cờ đánh dấu đã sửa hay chưa (mặc định là chưa)
    is_edited: { type: Boolean, default: false }, 
    
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ReviewProduct', reviewProductSchema);