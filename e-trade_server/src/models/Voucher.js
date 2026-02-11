const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
    product_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    code: { type: String, required: true },
    seller_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    discount_amount: Number,
    start_date: Date,
    end_date: Date,
    is_used: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Voucher', voucherSchema);