const Cart = require('../models/cart.js');

exports.getCart = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id; 
        let cart = await Cart.findOne({ user_id: userId }).populate('items.product_id').lean();
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
        const items = req.body.items || [];
        
        const formattedItems = items.map(item => {
            const productId = item.product?._id || item.product_id || item.product;
            let typeStr = item.type || item.variant || '';
            if (typeof typeStr === 'object') {
                typeStr = typeStr.description || typeStr.name || '';
            }

            return {
                product_id: productId,
                quantity: Number(item.quantity) || 1,
                type: String(typeStr),
                variant: String(typeStr)
            };
        }).filter(item => item.product_id); 

        await Cart.findOneAndUpdate(
            { user_id: userId },
            { $set: { items: formattedItems } },
            { new: true, upsert: true }
        );

        res.status(200).json({ success: true, message: 'Đồng bộ thành công' });
    } catch (error) {
        console.error('Lỗi DB Sync:', error);
        res.status(500).json({ success: false, message: error.message }); 
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