const mongoose = require('mongoose');
const User = require('./User');

const storeSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  description: String,
  identity_card: String,
  pickup_address: String,
  total_sales: Number,
  shop_name: { type: String, required: true },
  status: String,
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Store', storeSchema);