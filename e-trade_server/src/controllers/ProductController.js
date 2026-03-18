const mongoose = require("mongoose");
const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Review = require('../models/ReviewProduct');
const BlacklistKeyword = require('../models/BlacklistKeyword');
const Order = require('../models/Order');
const Category = require('../models/Category');

/**
 * Kiểm tra seller/customer chưa bị ban.
 */
const isSellerActive = (seller) => {
    if (!seller) return false;
    if (seller.status === 'banned') return false;
    if (seller.banned_until && new Date(seller.banned_until) > new Date()) return false;
    return true;
};

const isProductActive = (status) => {
    if (Array.isArray(status)) return status.includes('active');
    return status === 'active';
};

// ==========================================
// CÁC HÀM CỦA TÚ (Quản lý tìm kiếm, lọc)
// ==========================================

const getTopSellingProductIds = async () => {
    const orderStats = await Order.aggregate([
        { $unwind: "$items" },
        { $group: { _id: "$items.product_id", totalOrders: { $sum: 1 } } }
    ]);
    
    const map = {};
    orderStats.forEach(stat => {
        if (stat._id) map[stat._id.toString()] = stat.totalOrders;
    });
    return map;
};

const getOrderCounts = async () => {
    const stats = await Order.aggregate([
        { $unwind: "$items" },
        { $group: { _id: "$items.product_id", totalOrders: { $sum: 1 } } }
    ]);
    const map = {};
    stats.forEach(s => { if (s._id) map[s._id.toString()] = s.totalOrders; });
    return map;
};

exports.getProductsOnHomePage = async (req, res) => {
    try {
        const { keyword, interests, category_interests, page = 1, limit = 18 } = req.query;
        const skip = (page - 1) * limit;

        const searchKeyword = keyword ? keyword.trim().toLowerCase() : null;
        const interestWords = interests ? interests.replace(/,/g, ' ').trim() : null;
        
        let catIds = [];
        if (category_interests) {
            catIds = category_interests.split(',')
                .map(id => id.trim())
                .filter(id => mongoose.Types.ObjectId.isValid(id))
                .map(id => new mongoose.Types.ObjectId(id));
        }

        const now = new Date();

        let pipeline = [
            { $match: { status: 'active' } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'seller'
                }
            },
            { $unwind: { path: '$seller', preserveNullAndEmptyArrays: true } },
            {
                $match: {
                    $and: [
                        { 'seller.status': { $ne: 'banned' } },
                        {
                            $or: [
                                { 'seller.banned_until': { $exists: false } },
                                { 'seller.banned_until': null },
                                { 'seller.banned_until': { $lte: now } }
                            ]
                        }
                    ]
                }
            }
        ];

        pipeline.push({
            $addFields: {
                calculated_stock: {
                    $cond: {
                        if: { $isArray: "$product_type" }, 
                        then: { $sum: "$product_type.stock" },
                        else: { $ifNull: ["$stock", 0] }
                    }
                }
            }
        }, {
            $addFields: {
                is_in_stock: { $cond: { if: { $gt: ["$calculated_stock", 0] }, then: 1, else: 0 } }
            }
        });

        let scoreLogic = { $add: [0] };

        if (searchKeyword) {
            const regex = new RegExp(searchKeyword.split(/\s+/).join('|'), 'i');
            scoreLogic.$add.push({ $cond: [{ $regexMatch: { input: { $ifNull: ["$name", ""] }, regex: regex } }, 100, 0] });
        }
        
        if (!searchKeyword) {
            if (catIds.length > 0) {
                scoreLogic.$add.push({ $cond: [{ $in: ["$category_id", catIds] }, 50, 0] });
            }
            if (interestWords) {
                const regexInt = new RegExp(interestWords.split(/\s+/).join('|'), 'i');
                scoreLogic.$add.push({ $cond: [{ $regexMatch: { input: { $ifNull: ["$name", ""] }, regex: regexInt } }, 30, 0] });
            }
        }

        pipeline.push({ $addFields: { match_score: scoreLogic } });

        let products = await Product.aggregate(pipeline);
        const orderCountMap = await getOrderCounts();

        products = products.map(p => {
            p.totalOrders = orderCountMap[p._id.toString()] || 0;
            return p;
        });

        products.sort((a, b) => {
            if (a.is_in_stock !== b.is_in_stock) return b.is_in_stock - a.is_in_stock;
            if (a.match_score !== b.match_score) return b.match_score - a.match_score;
            if (a.totalOrders !== b.totalOrders) return b.totalOrders - a.totalOrders;
            return new Date(b.created_at) - new Date(a.created_at);
        });

        const total = products.length;
        const paginatedProducts = products.slice(skip, skip + parseInt(limit));

        // Xoá thông tin seller lookup tạm thời đã dùng để lọc
        const cleanedProducts = paginatedProducts.map(p => {
            const copy = { ...p };
            delete copy.seller;
            return copy;
        });

        await Product.populate(cleanedProducts, [
            { path: 'store_id', select: 'shop_name' },
            { path: 'user_id', select: 'full_name' }
        ]);

        res.json({
            success: true,
            count: cleanedProducts.length,
            total_pages: Math.ceil(total / limit),
            current_page: parseInt(page),
            data: cleanedProducts
        });

    } catch (error) {
        console.error("[GET PRODUCTS ERROR]", error.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getRandomUsedProducts = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;

        const pipeline = [
            { 
                $match: { 
                    status: 'active',
                    condition: 'Used'
                } 
            },
            { 
                $lookup: { 
                    from: 'users', 
                    localField: 'user_id', 
                    foreignField: '_id', 
                    as: 'user' 
                } 
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            {
                $match: {
                    $and: [
                        { 'user.status': { $ne: 'banned' } },
                        {
                            $or: [
                                { 'user.banned_until': { $exists: false } },
                                { 'user.banned_until': null },
                                { 'user.banned_until': { $lte: new Date() } }
                            ]
                        }
                    ]
                }
            },
            {
                $addFields: {
                    calculated_stock: {
                        $cond: {
                            if: { $isArray: "$product_type" }, 
                            then: { $sum: "$product_type.stock" },
                            else: { $ifNull: ["$stock", 0] }
                        }
                    }
                }
            },
            {
                $match: {
                    calculated_stock: { $gt: 0 }
                }
            },
            // Sort bài mới đăng lên đầu
            { $sort: { created_at: -1 } },
            { $limit: limit },
            {
                $project: {
                    _id: 1, 
                    name: 1, 
                    main_image: 1, 
                    price: 1, 
                    original_price: 1,
                    condition: 1, 
                    status: 1,
                    stock: "$calculated_stock",
                    user_id: {
                        $cond: {
                            if: { $ifNull: ["$user._id", false] },
                            then: { _id: '$user._id', name: '$user.full_name' },
                            else: null 
                        }
                    }
                }
            }
        ];

        const products = await Product.aggregate(pipeline);

        res.status(200).json({
            success: true,
            count: products.length,
            data: products
        });

    } catch (err) {
        console.error("[GET RANDOM USED PRODUCTS ERROR]", err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getProductsOnProductList = async (req, res) => {
    try {
        console.log("=== START GET PRODUCT LIST ===");
        const { keyword, category, filter, page = 1, limit = 12 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        let matchStage = { status: 'active' };
        let isSearching = false;

        if (category) {
            const catIds = category.split(',')
                .map(id => id.trim())
                .filter(id => mongoose.Types.ObjectId.isValid(id))
                .map(id => new mongoose.Types.ObjectId(id));
            if (catIds.length > 0) {
                matchStage.category_id = { $in: catIds };
            }
        }

        if (keyword) {
            isSearching = true;
            const cleanKeyword = keyword.trim().replace(/\s+/g, ' ');
            const searchRegex = new RegExp(cleanKeyword, 'i');
            matchStage.$or = [
                { name: searchRegex },
                { description: searchRegex }
            ];
        }

        const now = new Date();

        let products = await Product.find(matchStage)
            .populate('store_id', 'shop_name')
            .populate('user_id', 'full_name status banned_until')
            .lean();

        let fallbackProducts = [];

        const filterBannedSellers = (item) => {
            if (!item.user_id) return false;
            if (item.user_id.status === 'banned') return false;
            if (item.user_id.banned_until && new Date(item.user_id.banned_until) > now) return false;
            return true;
        };

        products = products.filter(filterBannedSellers);

        if (products.length === 0 && isSearching && category) {
            console.log("-> Không tìm thấy Keyword trong Category. Bật chế độ Fallback.");
            let fallbackMatch = { status: 'active', category_id: matchStage.category_id };
            fallbackProducts = await Product.find(fallbackMatch)
                .populate('store_id', 'shop_name')
                .populate('user_id', 'full_name')
                .limit(8)
                .lean();
        }

        const orderMap = await getOrderCounts();
        
        const mapProductData = (p) => {
            let totalStock = 0;
            if (Array.isArray(p.product_type) && p.product_type.length > 0) {
                totalStock = p.product_type.reduce((sum, pt) => sum + (pt.stock || 0), 0);
            } else {
                totalStock = p.stock || 0;
            }

            p.calculated_stock = totalStock;
            p.is_in_stock = totalStock > 0 ? 1 : 0;
            p.totalOrders = orderMap[p._id.toString()] || 0;
            
            if (p.user_id) p.user_id.name = p.user_id.full_name;

            return p;
        };

        products = products.map(mapProductData);
        if (fallbackProducts.length > 0) {
            fallbackProducts = fallbackProducts.filter(filterBannedSellers).map(mapProductData);
        }

        products.sort((a, b) => {
            if (a.is_in_stock !== b.is_in_stock) return b.is_in_stock - a.is_in_stock;

            switch (filter) {
                case 'popular': 
                    return b.totalOrders - a.totalOrders;
                case 'latest': 
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'price-asc': 
                    return a.price - b.price;
                case 'price-desc': 
                    return b.price - a.price;
                default: 
                    if (a.totalOrders !== b.totalOrders) return b.totalOrders - a.totalOrders;
                    return new Date(b.created_at) - new Date(a.created_at);
            }
        });

        const total = products.length;
        const paginatedProducts = products.slice(skip, skip + parseInt(limit));

        console.log(`[GET LIST] Đã trả về ${paginatedProducts.length}/${total} sản phẩm. Fallback: ${fallbackProducts.length}`);
        
        res.json({
            success: true,
            count: paginatedProducts.length,
            total_pages: Math.ceil(total / parseInt(limit)) || 1,
            current_page: parseInt(page),
            data: paginatedProducts,
            fallbackData: fallbackProducts 
        });

    } catch (error) {
        console.error("[Lỗi GET Product List]", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getProductGotMostOrders = async (req, res) => {
    try{
        const { keyword, page = 1, limit = 12 } = req.query;
        const skip = (page - 1) * limit;

        const matchStage = {
            status: 'active',
            conditon: 'New',
        }
    }catch(err){
        console.error("Error in getProductGotMostOrders:", err);
        res.status(500).json({ success: false, message: 'Server Error', error: err.message });
    }
}

exports.getProductsGotSaleMoreThan50PercentRecommendedByAdmin = async (req, res) => {

}

exports.getRandomProductsgotSaleMoreThan50Percent = async (req, res) => {
    try {
        const { keyword, limit = 10 } = req.query;
        const limitNum = parseInt(limit);

        let pipeline = [
            { 
                $match: { 
                    status: 'active', 
                    original_price: { $gt: 0 },
                    condition: 'New'
                } 
            }
        ];

        if (keyword) {
            pipeline.push({
                $match: {
                    $or: [
                        { name: { $regex: keyword, $options: 'i' } },
                        { description: { $regex: keyword, $options: 'i' } }
                    ]
                }
            });
        }

        pipeline.push({
            $addFields: {
                discount_numeric: {
                    $multiply: [
                        { $divide: [{ $subtract: ["$original_price", "$price"] }, "$original_price"] },
                        100
                    ]
                }
            }
        });

        pipeline.push({ $match: { discount_numeric: { $gt: 0 } } });

        pipeline.push({
            $facet: {
                deepSale: [
                    { $match: { discount_numeric: { $gt: 50 } } },
                    { $sample: { size: limitNum } } 
                ],
                topSale: [
                    { $sort: { discount_numeric: -1 } }, 
                    { $limit: limitNum }
                ]
            }
        });

        const result = await Product.aggregate(pipeline);
        const deepSale = result[0].deepSale;
        const topSale = result[0].topSale;

        let finalResult = [];
        let strategyUsed = '';

        if (deepSale.length > 0) {
            strategyUsed = 'random_deep_sale';
            finalResult = deepSale;
        } else {
            strategyUsed = 'highest_available';
            finalResult = topSale;
        }

        await Product.populate(finalResult, { path: 'store_id', select: 'shop_name' });

        finalResult = finalResult.map(p => ({
            ...p,
            discount_percentage: Math.round(p.discount_numeric) + '%'
        }));

        res.status(200).json({
            success: true,
            count: finalResult.length,
            strategy: strategyUsed,
            data: finalResult
        });

    } catch (err) {
        console.error("Sale Logic Error:", err);
        res.status(500).json({
            success: false,
            message: 'Server Error',
            error: err.message
        });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('store_id', 'shop_name pickup_address')
            .populate('category_id', 'name');

        if (!product || !isProductActive(product.status)) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        if (product.user_id) {
            const seller = await User.findById(product.user_id).select('status banned_until');
            if (!isSellerActive(seller)) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }
        }

        if (product.store_id) {
            const store = await Store.findById(product.store_id).populate('user_id', 'status banned_until');
            if (store && store.user_id && !isSellerActive(store.user_id)) {
                return res.status(404).json({ success: false, message: 'Product not found' });
            }
        }

        res.json({ success: true, data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// ==========================================
// CÁC HÀM CỦA THẮNG (Chi tiết sản phẩm, đánh giá)
// ==========================================

exports.getProductDetails = async (req, res) => {
    try {
        const productId = req.params.id;

        const product = await Product.findById(productId)
            .select("_id store_id category_id name description main_image display_files price original_price product_type stock condition status rejection_reason")
            .populate('store_id', 'shop_name description')
            .populate('category_id', 'name description');

        if (!product || !isProductActive(product.status)) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }

        if (product.user_id) {
            const seller = await User.findById(product.user_id).select('status banned_until');
            if (!isSellerActive(seller)) {
                return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
            }
        }

        if (product.store_id) {
            const store = await Store.findById(product.store_id).populate('user_id', 'status banned_until');
            if (store && store.user_id && !isSellerActive(store.user_id)) {
                return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
            }
        }

        const statsResult = await Review.aggregate([
            { $match: { product_id: new mongoose.Types.ObjectId(productId) } },
            {
                $facet: {
                    overall: [
                        {
                            $group: {
                                _id: null,
                                averageRating: { $avg: "$rating" },
                                totalReviews: { $sum: 1 }
                            }
                        }
                    ],
                    countsPerRating: [
                        { $group: { _id: "$rating", count: { $sum: 1 } } },
                        { $project: { rating: "$_id", count: 1, _id: 0 } }
                    ]
                }
            }
        ]);

        const overallStats = statsResult[0].overall[0] || { averageRating: 0, totalReviews: 0 };
        const countsPerRatingRaw = statsResult[0].countsPerRating || [];

        const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        countsPerRatingRaw.forEach(item => {
            if (item.rating >= 1 && item.rating <= 5) {
                ratingCounts[item.rating] = item.count;
            }
        });

        res.status(200).json({
            product,
            totalReviews: overallStats.totalReviews,
            averageRating: overallStats.averageRating ? parseFloat(overallStats.averageRating.toFixed(1)) : 0,
            ratingCounts 
        });
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
};

exports.getProductReviews = async (req, res) => {
    try {
        const productId = req.params.id;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const rating = parseInt(req.query.rating, 10);
        const skip = (page - 1) * limit;

        const productExists = await Product.findById(productId).select('_id');
        if (!productExists) {
            return res.status(404).json({ message: 'Product not found' });
        }

        const filter = { product_id: productId };
        if (rating && rating >= 1 && rating <= 5) {
            filter.rating = rating;
        }

        const reviews = await Review.find(filter)
            .populate('user_id', 'account_name avatar') 
            .sort({ created_at: -1 }) 
            .skip(skip)
            .limit(limit);

        const totalReviews = await Review.countDocuments(filter);

        res.status(200).json({
            reviews,
            currentPage: page,
            totalPages: Math.ceil(totalReviews / limit),
            totalReviews,
        });
    } catch (error) {
        console.error('Error fetching product reviews:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// ==========================================
// CÁC HÀM CỦA TÚ (Pass Đồ Cũ)
// ==========================================

exports.getCustomerPassedProducts = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Thêm điều kiện store_id: { $exists: false } để chắc chắn chỉ lấy đồ Pass
        const products = await Product.find({ 
            user_id: userId, 
            store_id: { $exists: false }
        }).sort({ created_at: -1 });

        res.status(200).json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.updateCustomerPassedProduct = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const { name, description, category_id, main_image, price, original_price, product_type, display_files } = req.body;

        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
        if (product.user_id?.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Bạn không có quyền chỉnh sửa sản phẩm này.' });
        }

        if (name) product.name = name;
        if (description) product.description = description;
        if (category_id) product.category_id = category_id;
        if (main_image) product.main_image = main_image;
        if (display_files) product.display_files = display_files;
        if (price !== undefined) product.price = price;
        if (original_price !== undefined) product.original_price = original_price;

        if (product_type && Array.isArray(product_type)) {
            product.product_type = product_type.map(pt => ({
                ...pt,
                stock: Math.min(10, Math.max(0, Number(pt.stock) || 0))
            }));
        }

        product.updated_at = new Date();

        await product.save();
        res.status(200).json({ success: true, data: product, message: 'Đã cập nhật sản phẩm.' });
    } catch (error) {
        console.error('Error updating passed product:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.deleteCustomerPassedProduct = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
        if (product.user_id?.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Bạn không có quyền xóa sản phẩm này.' });
        }

        await product.deleteOne();
        res.status(200).json({ success: true, message: 'Đã xóa sản phẩm.' });
    } catch (error) {
        console.error('Error deleting passed product:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// [POST] /api/products/pass-item
exports.createPassing2ndProduct = async (req, res) => {
    try {
        const userId = req.user.id; 
        const { name, description, category_id, main_image, display_files = [], price, original_price, product_type } = req.body;

        // 1. Kiểm tra giới hạn 10 bài đăng
        const activePostsCount = await Product.countDocuments({ user_id: userId, store_id: { $exists: false }, status: { $ne: 'inactive' } });
        if (activePostsCount >= 10) {
            return res.status(403).json({ message: 'Bạn đã đạt giới hạn 10 bài đăng Pass đồ cá nhân.' });
        }

        // 2. Ép cứng tình trạng Used
        const finalCondition = 'Used';

        let finalProductType = Array.isArray(product_type) ? product_type : [];
        if (finalProductType.length > 0) {
            finalProductType = finalProductType.map((pt) => ({
                ...pt,
                stock: Math.min(10, Math.max(0, Number(pt.stock) || 0))
            }));
        } else {
            finalProductType = [{ description: 'Mặc định', stock: 1, price_difference: 0 }];
        }

        // 3. Kiểm duyệt từ khóa cấm
        const blackListKeywords = await BlacklistKeyword.find();
        const textToCheck = `${name} ${description || ''}`.toLowerCase();
        
        // TRẢ LẠI TÊN CHO EM: LUÔN PENDING CHỜ ADMIN DUYỆT!
        let finalStatus = 'pending'; 
        let rejectionReason = '';

        for (const item of blackListKeywords) {
            if (textToCheck.includes(item.keyword.toLowerCase())) {
                if (item.level === 'high' || item.level === 'critical') {
                    rejectionReason = `Sản phẩm bị từ chối vì chứa từ khóa cấm: "${item.keyword}"`;
                    return res.status(400).json({ success: false, message: rejectionReason });
                }
                if (item.level === 'medium') {
                    rejectionReason = `Hệ thống cảnh báo từ khóa nhạy cảm: "${item.keyword}"`;
                    break; 
                }
            }
        }

        // 4. Tạo sản phẩm cá nhân (Tuyệt đối không có store_id)
        const newProduct = new Product({
            store_id: undefined, 
            user_id: userId, 
            category_id,
            name,
            description,
            main_image,
            display_files,
            price,
            original_price,
            product_type: finalProductType,
            condition: finalCondition,
            status: finalStatus,
            rejection_reason: rejectionReason
        });

        await newProduct.save();

        res.status(201).json({
            success: true,
            message: 'Đăng bán thành công! Sản phẩm đang chờ Admin phê duyệt.',
            data: newProduct
        });

    } catch (error) {
        console.error('Lỗi tạo sản phẩm:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
    }
};