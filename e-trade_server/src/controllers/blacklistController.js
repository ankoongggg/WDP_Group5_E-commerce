const BlacklistKeyword = require('../models/BlacklistKeyword.js');
const Product = require('../models/Product.js'); 
// [GET] Lấy danh sách từ khóa
exports.getKeywords = async (req, res) => {
    try {
        const keywords = await BlacklistKeyword.find().sort({ created_at: -1 });
        res.status(200).json(keywords);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

// [POST] Thêm từ khóa mới
exports.addKeyword = async (req, res) => {
    try {
        const { keyword, level } = req.body;

        // Kiểm tra xem từ khóa đã tồn tại chưa
        const existingKeyword = await BlacklistKeyword.findOne({ keyword: keyword.toLowerCase().trim() });
        if (existingKeyword) {
            return res.status(400).json({ message: 'Từ khóa này đã tồn tại trong hệ thống!' });
        }

        const newKeyword = await BlacklistKeyword.create({
            keyword: keyword.toLowerCase().trim(),
            level: level
            // created_by: req.user._id // Mở comment này nếu bạn có middleware xác thực admin
        });

        res.status(201).json(newKeyword);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

// [DELETE] Xóa từ khóa
exports.deleteKeyword = async (req, res) => {
    try {
        await BlacklistKeyword.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Đã xóa từ khóa thành công' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
};

// get pending products where product name contains any blacklisted keyword
// Renamed and repurposed to get rejected products for admin view
exports.getRejectedProductsForAdmin = async (req, res) => {
    try{
        // Filter for products explicitly rejected by the auto-moderation system.
        // These products have a 'rejected' status AND a non-empty rejection_reason.
        const rejectedProducts = await Product.find({
            status: { $in: ['rejected'] }, // Ensure it's explicitly rejected
            rejection_reason: { $exists: true, $ne: '' }, // Only show products with a system-generated reason
            is_deleted: { $ne: true } // Exclude soft-deleted products
        })
        .populate('store_id', 'shop_name')
        .populate('user_id', 'full_name email phone status avatar')
        .populate('category_id', 'name')
        .sort({ created_at: -1 })
        .lean(); // Use .lean() for faster read and easier modification

        const formattedProducts = rejectedProducts.map(product => {
            let productOrigin = '';
            let ownerInfo = {};

            if (product.store_id) {
                productOrigin = 'Sản phẩm từ Shop';
                ownerInfo = {
                    type: 'Shop',
                    id: product.store_id._id,
                    name: product.store_id.shop_name,
                    user: product.user_id ? { // User_id of the store owner
                        id: product.user_id._id,
                        name: product.user_id.full_name || product.user_id.account_name,
                        email: product.user_id.email,
                        phone: product.user_id.phone,
                        avatar: product.user_id.avatar
                    } : null
                };
            } else if (product.user_id) {
                productOrigin = 'Sản phẩm 2nd-hand từ Người dùng';
                ownerInfo = {
                    type: 'User',
                    id: product.user_id._id,
                    name: product.user_id.full_name || product.user_id.account_name,
                    email: product.user_id.email,
                    phone: product.user_id.phone,
                    avatar: product.user_id.avatar
                };
            } else {
                productOrigin = 'Không xác định';
                ownerInfo = { type: 'Unknown' };
            }

            return {
                ...product,
                product_origin_type: productOrigin,
                owner_details: ownerInfo,
                rejection_reason: product.rejection_reason || 'Không có lý do cụ thể',
                is_2nd_hand: product.condition && product.condition.toLowerCase() === 'used'
            };
        });

        res.status(200).json({ products: formattedProducts });
    } catch (err) {
        console.error('Error fetching rejected products for admin:', err);
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }

}

exports.UpdateStatusForProductWithBlacklistedKeyword = async (req, res) => {
    try{
        const { productId, status } = req.body;
        const product = await Product.findById(productId);
        if(!product){
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }
        product.status = [status]; // Ensure status is stored as an array
        await product.save();
        res.status(200).json({ message: 'Cập nhật trạng thái sản phẩm thành công', product });
    }catch (err){
        console.error('Error updating product status:', err);
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
}
