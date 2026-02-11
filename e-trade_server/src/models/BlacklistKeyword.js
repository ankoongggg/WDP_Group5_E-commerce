const mongoose = require('mongoose');

const blacklistKeywordSchema = new mongoose.Schema({
    keyword: { type: String, required: true, unique: true },
    level: { type: String, required: true },
    created_by: { type: mongoose.Schema.Types.ObjectId },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('BlacklistKeyword', blacklistKeywordSchema);