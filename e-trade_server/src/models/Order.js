const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    seller_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [
        {
            product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
            name_snapshot: String,
            price_snapshot: Number,
            quantity: Number,
            image_snapshot: String,
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

module.exports = mongoose.model('Order', orderSchema);