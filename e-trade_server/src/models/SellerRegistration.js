const mongoose = require('mongoose');

const sellerRegistrationSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    shop_name: {
        type: String,
        required: true
    },
    shop_description: {
        type: String,
        required: true
    },
    identity_card: {
        type: String,
        required: true
    },
    identity_card_image: {
        type: String
    },
    pickup_address: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    business_category: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    rejection_reason: {
        type: String
    }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('SellerRegistration', sellerRegistrationSchema);