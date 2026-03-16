const Cart = require('../models/cart.js');

exports.getCart = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id; // Bắt chuẩn ID
        let cart = await Cart.findOne({ user_id: userId }).populate('items.product_id');
        if (!cart) {
            cart = await Cart.create({ user_id: userId, items: [] });
        }
        res.status(200).json({ success: true, data: cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.syncCart = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        if (!userId) return res.status(401).json({ success: false, message: 'Thiếu User ID' });

        const { items } = req.body;
        let cart = await Cart.findOne({ user_id: userId });

        if (!cart) {
            cart = new Cart({ user_id: userId, items: items || [] });
        } else {
            cart.items = items || [];
        }

        await cart.save();
        res.status(200).json({ success: true, message: 'Đồng bộ thành công' });
    } catch (error) {
        console.error('Lỗi DB Sync:', error);
        res.status(500).json({ success: false, message: error.message }); // Báo lỗi chi tiết thay vì chung chung
    }
};

exports.clearCart = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        await Cart.findOneAndUpdate({ user_id: userId }, { items: [] });
        res.status(200).json({ success: true, message: 'Đã dọn sạch' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};