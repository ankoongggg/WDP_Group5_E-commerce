const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    from_user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'from_user_type'
    },

    // Trường để biết tham chiếu đến model nào
    from_user_type: {
        type: String,
        required: true,
        enum: ['User', 'Administration']
    },

    to_user_id: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    title: String,
    message: String,
    is_read: { type: Boolean, default: false },
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Notification', notificationSchema);
