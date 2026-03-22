const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seller_id: { type: mongoose.Schema.Types.ObjectId, refPath: 'seller_type', required: true },
    seller_type: { type: String, enum: ['Store', 'User'], required: true, default: 'Store' },
    items: [
        {
            product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            name_snapshot: String,
            price_snapshot: Number,
            quantity: Number,
            image_snapshot: String,
            type: { type: String }, 
        },
    ],
    total_price: Number,
    shipping_fee: Number,
    total_amount: Number,
    shipping_address: {
        recipient_name: String,
        phone: String,
        full_address: String,
    },
    payment_method: String,
    payment_status: String,
    order_status: String,
    cancel_reason: { type: String }, // Lưu lý do hủy
    cancelled_by: { type: String, enum: ['customer', 'seller'] }, // Ai là người hủy
    history_logs: [
        {
            action: String,
            created_at: { type: Date, default: Date.now },
        },
    ],
    note: String,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

orderSchema.pre('save', function(next) {
    if (!this.seller_type) {
        this.seller_type = 'Store';
    }
    next();
});

module.exports = mongoose.model('Order', orderSchema);