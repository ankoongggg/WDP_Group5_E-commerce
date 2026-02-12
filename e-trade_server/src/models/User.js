const mongoose = require('mongoose');
const Product = require('./Product');

const userSchema = new mongoose.Schema({
    avatar: String,
    refresh_token: String,
    addresses: [
        {
            city: String,
            district: String,
            is_default: Boolean,
            label: String,
            phone: String,
            recipient_name: String,
            street: String,
        },
    ],
    dob: Date,
    gender: String,
    phone: String,
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String, required: true },
    role: [String],
    status: String,
    ban_reason: String,
    banned_until: Date,
});

module.exports = mongoose.model('User', userSchema);