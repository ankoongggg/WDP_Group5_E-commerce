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
exports.getPendingProductsWithBlacklistedKeywords = async (req, res) => {
    try{
        const blackListKeywords = await BlacklistKeyword.find().select('keyword');
        const blackListKeywordArray = blackListKeywords.map(item => item.keyword);

        // Chỉ lấy sản phẩm pending, chưa bị xoá mềm và populate thông tin cửa hàng
        const pendingProducts = await Product.find({ status: 'pending' })
    .populate('store_id', 'shop_name')
    .populate('user_id', 'full_name email phone status avatar')
    .populate('category_id', 'name')
    .sort({ created_at: -1 });

        // (Hiện tại frontend chỉ dùng danh sách pending, chưa filter theo keyword;
        // nếu sau này cần, có thể áp dụng blackListKeywordArray để lọc tiếp)

        res.status(200).json({ products: pendingProducts });
    } catch (err) {
        console.error('Error fetching products with blacklisted keywords:', err);
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }

}

exports.getRejectedProductsWithBlacklistedKeywords = async (req, res) => {
    try{
        const getRejectedProductsAndProductGotCreateBefore30Days = await Product.find({
            $or:[
            {status: 'rejected'},
            {created_at: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }},

            ]
            // populate thông tin cửa hàng
        }).populate('store_id', 'shop_name')
    .populate('user_id', 'full_name email phone status avatar')
    .populate('category_id', 'name')
    .sort({ created_at: -1 });

        res.status(200).json({ products: getRejectedProductsAndProductGotCreateBefore30Days });
    }catch (err){
        console.error('Error fetching products with blacklisted keywords: ', err);
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
        product.status = status;
        await product.save();
        res.status(200).json({ message: 'Cập nhật trạng thái sản phẩm thành công', product });
    }catch (err){
        console.error('Error updating product status:', err);
        res.status(500).json({ message: 'Lỗi server', error: err.message });
    }
}
