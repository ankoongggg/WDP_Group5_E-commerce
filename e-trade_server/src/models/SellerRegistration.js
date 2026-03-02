const mongoose = require('mongoose');
const User = require('./User');

const sellerRegistrationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shop_name: { type: String, required: true },
  shop_description: { type: String, required: true },
  identity_card: { type: String, required: true },
  identity_card_image: String,
  pickup_address: { type: String, required: true },
  phone: String,
  business_category: { type: String, required: true }, // Ngành kinh doanh
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  rejection_reason: String, // Lý do từ chối
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SellerRegistration', sellerRegistrationSchema);
