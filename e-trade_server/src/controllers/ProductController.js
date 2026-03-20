const mongoose = require("mongoose");
const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Review = require('../models/ReviewProduct');
const BlacklistKeyword = require('../models/BlacklistKeyword');
const Order = require('../models/Order');
const Category = require('../models/Category');

const getActiveUserIds = async () => {
    const now = new Date();
    const activeUsers = await User.find({
        status: 'active',
    }).select('_id').lean();
    return activeUsers.map(u => u._id);
};

const getActiveStoreIds = async (activeUserIds) => {
    const activeStores = await Store.find({
        status: 'active',
        user_id: { $in: activeUserIds }
    }).select('_id').lean();
    return activeStores.map(s => s._id);
};


// ==========================================
// CÁC HÀM CỦA TÚ (Quản lý tìm kiếm, lọc)
// ==========================================

const isActiveUser = (user) => {
    if (user.status !== 'active') return false;
    //trường hợp người dùng là seller 100%
    if (!user) return true;

    return true;
};

const isActiveStore = (store) => {
    if ( store.status !== 'active') return false;
    //trường hợp người dùng chỉ bán đồ cũ không mở shop
    if (!store) return true;

    return true;
};


// 2. HÀM MỚI: TÍNH ĐIỂM ĐÁNH GIÁ TRUNG BÌNH CỦA TỪNG SẢN PHẨM
const getRatingStats = async () => {
    const stats = await Review.aggregate([
        {
            $group: {
                _id: "$product_id",
                averageRating: { $avg: "$rating" },
                totalReviews: { $sum: 1 }
            }
        }
    ]);
    const map = {};
    stats.forEach(s => { 
        if (s._id) {
            map[s._id.toString()] = {
                rating: parseFloat(s.averageRating.toFixed(1)), // Làm tròn 1 chữ số thập phân (VD: 4.5)
                reviewsCount: s.totalReviews
            };
        }
    });
    return map;
};

// 3. CẬP NHẬT HÀM MAP DỮ LIỆU
// Nhớ truyền ratingMap vào hàm mapProductData
const mapProductData = (p, orderMap, ratingMap) => {
    let totalStock = 0;
    if (Array.isArray(p.product_type) && p.product_type.length > 0) {
        totalStock = p.product_type.reduce((sum, pt) => sum + (pt.stock || 0), 0);
    } else {
        totalStock = p.stock || 0;
    }

    p.calculated_stock = totalStock;
    p.is_in_stock = totalStock > 0 ? 1 : 0;
    p.totalOrders = orderMap[p._id?.toString()] || 0;
    
    // Gắn thêm Rating
    const ratingInfo = ratingMap[p._id?.toString()] || { rating: 0, reviewsCount: 0 };
    p.averageRating = ratingInfo.rating;
    p.totalReviews = ratingInfo.reviewsCount;
    
    if (p.user_id && p.user_id.full_name) p.user_id.name = p.user_id.full_name;
    return p;
};


const getTopSellingProductIds = async () => {
    const orderStats = await Order.aggregate([
        { $match: { order_status: 'completed' } },
        { $unwind: "$items" },
        { $group: { _id: "$items.product_id", totalOrders: { $sum: "$items.quantity" } } }
    ]);
    
    const map = {};
    orderStats.forEach(stat => {
        if (stat._id) map[stat._id.toString()] = stat.totalOrders;
    });
    return map;
};

const getOrderCounts = async () => {
    const stats = await Order.aggregate([
        { $match: { order_status: 'completed' } },
        { $unwind: "$items" },
        { $group: { _id: "$items.product_id", totalOrders: { $sum: "$items.quantity" } } }
    ]);
    // console.log("Stats:", stats);
    const map = {};
    stats.forEach(s => { if (s._id) map[s._id.toString()] = s.totalOrders; });
    return map;
};

exports.getProductsOnHomePage = async (req, res) => {
    try {
        const { interests, category_interests, limit = 18 } = req.query;

        const interestWords = interests ? interests.replace(/,/g, ' ').trim() : null;
        let catIds = [];
        if (category_interests) {
            catIds = category_interests.split(',')
                .map(id => id.trim())
                .filter(id => mongoose.Types.ObjectId.isValid(id))
                .map(id => new mongoose.Types.ObjectId(id));
        }

        // 1. PRE-FETCH ACTIVE USERS & STORES (active user + store-owner active)
        const activeUserIds = await getActiveUserIds();
        const activeStoreIds = await getActiveStoreIds(activeUserIds);

        let matchStage = {
            $and: [
                { status: 'active' },
                { is_deleted: { $ne: true } },
                {
                    $or: [
                        { user_id: { $in: activeUserIds } },
                        { store_id: { $in: activeStoreIds } }
                    ]
                }
            ]
        };

        // Tìm tất cả sản phẩm hợp lệ
        let products = await Product.find(matchStage)
            .populate('store_id', 'shop_name')
            .populate('user_id', 'full_name')
            .lean();

            
        // gán ordercount và rating count
        const orderMap = await getOrderCounts();
        const ratingMap = await getRatingStats();

        products = products.map(p => {
            const mappedP = mapProductData(p, orderMap, ratingMap);

            // Tính điểm Relevance dựa vào LocalStorage của User
            let score = 0;
            if (catIds.length > 0 && catIds.some(id => mappedP.category_id.some(c => c.toString() === id.toString()))) {
                score += 50; // Trúng Category đã xem
            }
            if (interestWords && new RegExp(interestWords.split(/\s+/).join('|'), 'i').test(mappedP.name)) {
                score += 30; // Trúng Keyword đã xem
            }
            mappedP.match_score = score;

            return mappedP;
        });

        // SORT GỢI Ý: Còn hàng -> Trúng sở thích -> Nhiều Order -> Mới nhất
        products.sort((a, b) => {
            if (a.is_in_stock !== b.is_in_stock) return b.is_in_stock - a.is_in_stock;
            if (a.match_score !== b.match_score) return b.match_score - a.match_score;
            if (a.totalOrders !== b.totalOrders) return b.totalOrders - a.totalOrders;
            return new Date(b.created_at) - new Date(a.created_at);
        });

        const finalProducts = products.slice(0, parseInt(limit));

        res.json({
            success: true,
            count: finalProducts.length,
            data: finalProducts
        });

    } catch (error) {
        console.error("[Lỗi GET Home Products]", error.message);
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

        let products = await Product.aggregate(pipeline);

        // Filter user-based deactive/banned safety for non-store used products at sync level (defensive)
        const now = new Date();
        const activeUsers = await getActiveUserIds();
        const setActiveUserIds = new Set(activeUsers.map(id => id.toString()));

        // gán ordercount và rating count
        const orderMap = await getOrderCounts();
        const ratingMap = await getRatingStats();

        products = products.map(p => mapProductData(p, orderMap, ratingMap));

        const filtered = products.filter(p => {
            if (!p.user_id) return true;
            return setActiveUserIds.has(p.user_id._id ? p.user_id._id.toString() : p.user_id.toString());
        });

        

        res.status(200).json({
            success: true,
            count: filtered.length,
            data: filtered
        });

    } catch (err) {
        console.error("[GET RANDOM USED PRODUCTS ERROR]", err.message);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getProductsOnProductList = async (req, res) => {
    try {
        // console.log("=== START GET PRODUCT LIST ===");
        const { keyword, category, filter, condition, page = 1, limit = 12 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // 1. PRE-FETCH ACTIVE USERS & STORES ĐỂ LỌC (QUAN TRỌNG)
        const activeUserIds = await getActiveUserIds();
        const activeStoreIds = await getActiveStoreIds(activeUserIds);

        // 2. KHỞI TẠO MATCH STAGE
        let matchStage = {
            $and: [
                // Sản phẩm phải active và không bị xóa
                { status: 'active' },
                { is_deleted: { $ne: true } },
                {
                    $or: [
                        { user_id: { $in: activeUserIds } },
                        { store_id: { $in: activeStoreIds } }
                    ]
                }
            ]
        };

        let isSearching = false;

        // 3. XỬ LÝ FILTER CATEGORY & KEYWORD
        if (category) {
            const catIds = category.split(',')
                .map(id => id.trim())
                .filter(id => mongoose.Types.ObjectId.isValid(id))
                .map(id => new mongoose.Types.ObjectId(id));
            if (catIds.length > 0) {
                matchStage.$and.push({ category_id: { $in: catIds } });
            }
        }

        if (keyword) {
            isSearching = true;
            const cleanKeyword = keyword.trim().replace(/\s+/g, ' ');
            const searchRegex = new RegExp(cleanKeyword, 'i');
            matchStage.$and.push({
                $or: [
                    { name: searchRegex },
                    { description: searchRegex }
                ]
            });
        }

        if (condition) {
            if (condition.toLowerCase() === 'new') {
                matchStage.$and.push({ condition: { $in: ['New', 'new', 'NEW'] } });
            } else if (condition.toLowerCase() === 'used') {
                matchStage.$and.push({ condition: { $in: ['Used', 'used', 'USED'] } });
            }
        }

        // 4. TRUY VẤN SẢN PHẨM THỎA MÃN
        let products = await Product.find(matchStage)
            .populate('store_id', 'shop_name')
            .populate('user_id', 'full_name')
            .lean();

        // 5. XỬ LÝ FALLBACK (NẾU TÌM KEYWORD KHÔNG RA MÀ CÓ CHỌN CATEGORY)
        let fallbackProducts = [];
        if (products.length === 0 && isSearching && category) {
            // console.log("-> Bật chế độ Fallback: Bỏ qua Keyword, tìm trong Category.");
            
            // Xây dựng lại matchStage cho fallback: giữ nguyên quy tắc an toàn User/Store, bỏ Keyword
            let fallbackMatch = {
                $and: [
                    { status: 'active' },
                    { is_deleted: { $ne: true } },
                    {
                        $or: [
                            { user_id: { $in: activeUserIds } },
                            { store_id: { $in: activeStoreIds } }
                        ]
                    },
                    // Chỉ giữ lại category
                    { category_id: matchStage.$and.find(cond => cond.category_id)?.category_id }
                ]
            };

            if (condition) {
                if (condition.toLowerCase() === 'new') {
                    fallbackMatch.$and.push({ condition: { $in: ['New', 'new', 'NEW'] } });
                } else if (condition.toLowerCase() === 'used') {
                    fallbackMatch.$and.push({ condition: { $in: ['Used', 'used', 'USED'] } });
                }
            }

            // GỌI 2 HÀM HELPER ĐỂ LẤY MAP
        const orderMap = await getOrderCounts();
        const ratingMap = await getRatingStats();

        // TRUYỀN VÀO MAPPER
        products = products.map(p => mapProductData(p, orderMap, ratingMap));

            fallbackProducts = await Product.find(fallbackMatch)
                .populate('store_id', 'shop_name')
                .populate('user_id', 'full_name')
                .limit(8)
                .lean();
        }

        // 6. XỬ LÝ DATA: TÍNH STOCK VÀ GHÉP SỐ ĐƠN (TOTAL ORDERS)
        const orderMap = await getOrderCounts();
        const ratingMap = await getRatingStats();

        products = products.map(p => mapProductData(p, orderMap, ratingMap));
        if (fallbackProducts.length > 0) {
            fallbackProducts = fallbackProducts.map(p => mapProductData(p, orderMap, ratingMap));
        }

        // 7. SORTING (Thuật toán sắp xếp)
        products.sort((a, b) => {
            // LUÔN ƯU TIÊN: Còn hàng lên trước
            if (a.is_in_stock !== b.is_in_stock) return b.is_in_stock - a.is_in_stock;

            switch (filter) {
                case 'popular': return b.totalOrders - a.totalOrders;
                case 'latest': return new Date(b.created_at) - new Date(a.created_at);
                case 'price-asc': return a.price - b.price;
                case 'price-desc': return b.price - a.price;
                default: 
                    // Mặc định: Phổ biến nhất -> Mới nhất
                    if (a.totalOrders !== b.totalOrders) return b.totalOrders - a.totalOrders;
                    return new Date(b.created_at) - new Date(a.created_at);
            }
        });

        // 8. PHÂN TRANG & TRẢ KẾT QUẢ
        const total = products.length;
        const paginatedProducts = products.slice(skip, skip + parseInt(limit));

        // console.log(`[GET LIST] Trả về ${paginatedProducts.length}/${total} sản phẩm.`);
        
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
        const limit = parseInt(req.query.limit) || 10;
        const keyword = req.query.keyword ? req.query.keyword.trim() : null;

        // 1. LẤY DANH SÁCH USER VÀ STORE ĐANG HOẠT ĐỘNG
        const activeUserIds = await getActiveUserIds();
        const activeStoreIds = await getActiveStoreIds(activeUserIds);

        // 2. KHỞI TẠO ĐIỀU KIỆN LỌC (MATCH STAGE)
        let matchStage = {
            status: { $in: ['active', 'Active'] },
            condition: { $in: ['New', 'new', 'NEW'] }, // Đảm bảo lấy đúng hàng mới
            
            // CHECK AN TOÀN: SẢN PHẨM CỦA SHOP ACTIVE HOẶC USER ACTIVE (NẾU KHÔNG PHẢI SHOP)
            $or: [
                { store_id: { $in: activeStoreIds } },
                { user_id: { $in: activeUserIds }, store_id: { $exists: false } },
                { user_id: { $in: activeUserIds }, store_id: null }
            ]
        };

        // NẾU CÓ KEYWORD
        if (keyword) {
            const searchRegex = new RegExp(keyword.replace(/\s+/g, '|'), 'i');
            matchStage.$and = [
                {
                    $or: [
                        { name: searchRegex },
                        { description: searchRegex }
                    ]
                }
            ];
        }

        // 3. PIPELINE LẤY DATA & TÍNH STOCK, % SALE
        const pipeline = [
            { $match: matchStage },
            
            // Tính Stock Thực Tế
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
            
            // Chỉ lấy hàng còn Stock (Gỡ dòng này nếu muốn show cả hàng hết kho)
            { $match: { calculated_stock: { $gt: 0 } } },

            // Tính % Giảm giá
            {
                $addFields: {
                    discount_numeric: {
                        $multiply: [
                            { $divide: [{ $subtract: ["$original_price", "$price"] }, "$original_price"] },
                            100
                        ]
                    }
                }
            },

            // Chỉ giữ lại hàng có giảm giá (Price < Original Price)
            { $match: { discount_numeric: { $gt: 0 } } },

            // Gán thêm random value để Sort ngẫu nhiên đa dạng Shop
            { $addFields: { random_sort: { $rand: {} } } },
            
            // Format dữ liệu trả về cho nhẹ
            {
                $project: {
                    _id: 1, name: 1, main_image: 1, display_files: 1, 
                    price: 1, original_price: 1, product_type: 1, 
                    condition: 1, status: 1, store_id: 1, user_id: 1, category_id: 1,
                    calculated_stock: 1, discount_numeric: 1, random_sort: 1
                }
            }
        ];

        let products = await Product.aggregate(pipeline);

        // 4. PHÂN NHÁNH DEEP SALE BẰNG JAVASCRIPT (Đảm bảo không rớt Data do MongoDB $sample)
        let deepSaleProducts = products.filter(p => p.discount_numeric >= 50);
        let finalResult = [];
        let strategyUsed = '';

        if (deepSaleProducts.length >= limit / 2) {
            // Nếu có nhiều hàng Deep Sale -> Trộn ngẫu nhiên và lấy ra đủ số lượng
            strategyUsed = 'random_deep_sale';
            // Sort theo random_sort (giúp các sản phẩm của các Shop khác nhau nằm xen kẽ)
            finalResult = deepSaleProducts.sort((a, b) => a.random_sort - b.random_sort).slice(0, limit);
        } else {
            // Nếu ít hàng Deep Sale -> Lấy Top những mặt hàng giảm giá cao nhất (Bất kể % là bao nhiêu)
            strategyUsed = 'highest_available';
            finalResult = products.sort((a, b) => {
                // Ưu tiên 1: % Giảm giá cao hơn
                if (b.discount_numeric !== a.discount_numeric) return b.discount_numeric - a.discount_numeric;
                // Ưu tiên 2: Nếu bằng % giảm giá thì Random để đa dạng Shop
                return a.random_sort - b.random_sort;
            }).slice(0, limit);
        }

        // 5. POPULATE THÔNG TIN CHỦ SHOP
        await Product.populate(finalResult, [
            { path: 'store_id', select: 'shop_name' },
            { path: 'user_id', select: 'full_name account_name' }
        ]);

        const orderMap = await getOrderCounts();
        const ratingMap = await getRatingStats();

        // 6. FORMAT JSON RESPONSE
        finalResult = finalResult.map(p => ({
            ...p,
            stock: p.calculated_stock,
            is_in_stock: p.calculated_stock > 0 ? 1 : 0,
            discount_percentage: Math.round(p.discount_numeric) + '%',
            totalOrders: orderMap[p._id?.toString()] || 0,
            averageRating: ratingMap[p._id?.toString()]?.rating || 0,
            totalReviews: ratingMap[p._id?.toString()]?.reviewsCount || 0,
            user_id: p.user_id ? { 
                _id: p.user_id._id, 
                name: p.user_id.full_name || p.user_id.account_name 
            } : null,
            random_sort: undefined // Xóa trường tạm
        }));

        res.status(200).json({
            success: true,
            count: finalResult.length,
            strategy: strategyUsed,
            data: finalResult
        });

    } catch (err) {
        console.error("[SALE LOGIC ERROR]:", err.message);
        res.status(500).json({
            success: false,
            message: 'Server Error'
        });
    }
};

exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('store_id', 'shop_name pickup_address status user_id')
            .populate('category_id', 'name');

        if (!product || product.status !== 'active') {
            return res.status(404).json({ success: false, message: 'Product not found' });
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

        // 1. LẤY DATA VÀ POPULATE ĐẦY ĐỦ CẢ STORE VÀ USER
        const product = await Product.findById(productId)
            .select("_id store_id user_id category_id name description main_image display_files price original_price product_type stock condition status rejection_reason")
            .populate('store_id', 'shop_name description pickup_address status user_id') // Data của Shop
            .populate('user_id', 'full_name account_name avatar status')                 // Data của Người bán 2nd
            .populate('category_id', 'name description');

        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }

        // 2. KIỂM TRA SẢN PHẨM CÓ ACTIVE KHÔNG
        // (Xử lý an toàn cho cả trường hợp DB lưu status là Array ["active"] hoặc String "active")
        const isActiveProduct = Array.isArray(product.status) 
            ? product.status.includes('active') || product.status.includes('Active')
            : product.status === 'active' || product.status === 'Active';

        if (!isActiveProduct) {
            return res.status(404).json({ message: 'Sản phẩm không tồn tại hoặc đang chờ duyệt.' });
        }

        // 3. KIỂM TRA QUYỀN HIỂN THỊ (TÀI KHOẢN NGƯỜI BÁN CÓ BỊ KHOÁ KHÔNG?)
        let isSellerActive = false;

        if (product.store_id) {
            // TRƯỜNG HỢP A: HÀNG CỦA SHOP BÁN
            // Cửa hàng phải Active VÀ Chủ cửa hàng cũng phải Active
            const isStoreActive = product.store_id.status === 'active' || product.store_id.status === 'Active';
            
            // Tìm chủ cửa hàng
            const storeOwner = await User.findById(product.store_id.user_id).select('status');
            const isOwnerActive = storeOwner && (storeOwner.status === 'active' || storeOwner.status === 'Active');
            
            if (isStoreActive && isOwnerActive) {
                isSellerActive = true;
            }
        } else if (product.user_id) {
            // TRƯỜNG HỢP B: HÀNG 2ND PASS CỦA USER
            // Chỉ cần kiểm tra User đó có đang Active không
            const isUserActive = product.user_id.status === 'active' || product.user_id.status === 'Active';
            if (isUserActive) {
                isSellerActive = true;
            }
        }

        if (!isSellerActive) {
            return res.status(404).json({ message: 'Sản phẩm này hiện không khả dụng do tài khoản người bán đã bị khóa.' });
        }

        // 4. LẤY ĐÁNH GIÁ (REVIEWS) - Giữ nguyên logic cũ của bạn
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

        // 4.5. LẤY TỔNG SỐ LƯỢNG ĐÃ BÁN (TOTAL ORDERS) TỪ CÁC ĐƠN HÀNG COMPLETED
        const orderCountAgg = await Order.aggregate([
            { $match: { order_status: 'completed' } },
            { $unwind: "$items" },
            { $match: { "items.product_id": new mongoose.Types.ObjectId(productId) } },
            { $group: { _id: null, totalSold: { $sum: "$items.quantity" } } }
        ]);
        const totalSold = orderCountAgg[0]?.totalSold || 0;

        // Thêm trường totalOrders vào object product để render UI
        const productData = product.toObject ? product.toObject() : product;
        productData.totalOrders = totalSold;

        // 5. TRẢ DỮ LIỆU VỀ FRONTEND
        res.status(200).json({
            success: true,
            product: productData,
            totalReviews: overallStats.totalReviews,
            averageRating: overallStats.averageRating ? parseFloat(overallStats.averageRating.toFixed(1)) : 0,
            ratingCounts 
        });

    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
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

        // --- VALIDATE KÝ TỰ KHÔNG HỢP LỆ (XSS & Ký tự đặc biệt) ---
        const dangerousPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>|<iframe\b|<object\b|javascript:|on\w+=/gi;

        if (name) {
            if (dangerousPattern.test(name) || /[<>{}\[\]\\]/g.test(name)) {
                return res.status(400).json({ success: false, message: 'Tên sản phẩm chứa ký tự không hợp lệ (Không dùng < > [ ] { }).' });
            }
            product.name = name.trim();
        }

        if (description !== undefined) {
            if (dangerousPattern.test(description)) {
                return res.status(400).json({ success: false, message: 'Mô tả chứa nội dung không hợp lệ.' });
            }
            product.description = (description.trim() !== '') ? description.trim() : "Mặc định";
        }

        if (category_id) product.category_id = category_id;
        if (main_image) product.main_image = main_image;
        if (display_files) product.display_files = display_files;
        if (price !== undefined) product.price = price;
        if (original_price !== undefined) product.original_price = original_price;

        // --- XỬ LÝ PRODUCT_TYPE (Tự động fallback về Mặc định / Stock: 1) ---
        let finalProductType = [];
        try {
            if (Array.isArray(product_type) && product_type.length > 0) {
                finalProductType = product_type.map((pt) => {
                    let desc = (pt.description && typeof pt.description === 'string' && pt.description.trim() !== '') 
                                ? pt.description.trim() 
                                : 'Mặc định';
                    
                    if (dangerousPattern.test(desc) || /[<>{}\[\]\\]/g.test(desc)) {
                        throw new Error('Tên phân loại chứa ký tự không hợp lệ.');
                    }

                    return {
                        ...pt,
                        description: desc,
                        stock: Math.min(10, Math.max(1, Number(pt.stock) || 1)),
                        price_difference: Number(pt.price_difference) || 0
                    };
                });
            } else {
                finalProductType = [{ description: 'Mặc định', stock: 1, price_difference: 0 }];
            }
        } catch (err) {
            return res.status(400).json({ success: false, message: err.message });
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

        product.updated_at = new Date();
        product.product_type = finalProductType;
        product.status = finalStatus;
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

        // --- VALIDATE KÝ TỰ KHÔNG HỢP LỆ ---
        const dangerousPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>|<iframe\b|<object\b|javascript:|on\w+=/gi;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({ success: false, message: 'Tên sản phẩm không được để trống.' });
        }
        if (dangerousPattern.test(name) || /[<>{}\[\]\\]/g.test(name)) {
            return res.status(400).json({ success: false, message: 'Tên sản phẩm chứa ký tự không hợp lệ (Không dùng < > [ ] { }).' });
        }
        if (description && dangerousPattern.test(description)) {
            return res.status(400).json({ success: false, message: 'Mô tả chứa nội dung không hợp lệ.' });
        }

        const safeDescription = (description && description.trim() !== '') ? description.trim() : "Mặc định";
        
        // 2. Ép cứng tình trạng Used
        const finalCondition = 'Used';

        // --- XỬ LÝ PRODUCT_TYPE (Tự động fallback về Mặc định / Stock: 1) ---
        let finalProductType = [];
        try {
            if (Array.isArray(product_type) && product_type.length > 0) {
                finalProductType = product_type.map((pt) => {
                    let desc = (pt.description && typeof pt.description === 'string' && pt.description.trim() !== '') 
                                ? pt.description.trim() 
                                : 'Mặc định';
                    
                    if (dangerousPattern.test(desc) || /[<>{}\[\]\\]/g.test(desc)) {
                        throw new Error('Tên phân loại chứa ký tự không hợp lệ.');
                    }

                    return {
                        ...pt,
                        description: desc,
                        stock: Math.min(10, Math.max(1, Number(pt.stock) || 1)),
                        price_difference: Number(pt.price_difference) || 0
                    };
                });
            } else {
                finalProductType = [{ description: 'Mặc định', stock: 1, price_difference: 0 }];
            }
        } catch (err) {
            return res.status(400).json({ success: false, message: err.message });
        }

        // 3. Kiểm duyệt từ khóa cấm
        const blackListKeywords = await BlacklistKeyword.find();
        const textToCheck = `${name} ${safeDescription}`.toLowerCase();
        
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
            name: name.trim(),
            description: safeDescription,
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