const mongoose = require('mongoose');
const User = require('./User');

const storeSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  shop_name: { type: String, required: true },
  description: String,
  identity_card: String,
  pickup_address: String,
  total_sales: Number,
  // Thông tin hiển thị cho trang Store Management
  logo: String, // URL logo cửa hàng
  contact_email: String, // Email liên hệ riêng của cửa hàng (nếu khác email user)
  phone: String, // Số điện thoại cửa hàng
  tax_code: String, // Mã số thuế
  // Trạng thái hoạt động của cửa hàng (chủ yếu do admin/quy trình hệ thống quyết định)
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'inactive', 'suspended'],
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Store', storeSchema);