const mongoose = require('mongoose');

const passwordResetTokenSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, unique: true },
    created_at: { type: Date, default: Date.now, expires: 900 },
});

module.exports = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
