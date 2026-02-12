const mongoose = require('mongoose');
const User = require('./User');

const conversationSchema = new mongoose.Schema({
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    last_message: String,
    is_read: { type: Boolean, default: false },
    updated_at: { type: Date, default: Date.now },
    created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Conversation', conversationSchema);