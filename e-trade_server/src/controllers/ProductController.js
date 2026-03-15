const mongoose = require("mongoose");
const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Review = require('../models/ReviewProduct'); // Thêm import Review của Thắng
const BlacklistKeyword = require('../models/BlacklistKeyword');
const Order = require('../models/Order');
const Category = require('../models/Category');
// ==========================================
// CÁC HÀM CỦA TÚ (Quản lý tìm kiếm, lọc)
// ==========================================

// GET /api/products
// Query params: 
// - keyword: tìm kiếm theo tên hoặc mô tả
// - limit: giới hạn số lượng (mặc định 10)
// - page: phân trang
// Helper function: Đếm số order của từng sản phẩm để xếp hạng "Bán chạy"
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

// Hàm Helper đếm số lượng Order để tối ưu hiệu suất
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

        // Xử lý biến đầu vào
        const searchKeyword = keyword ? keyword.trim().toLowerCase() : null;
        const interestWords = interests ? interests.replace(/,/g, ' ').trim() : null;
        
        let catIds = [];
        if (category_interests) {
            catIds = category_interests.split(',')
                .map(id => id.trim())
                .filter(id => mongoose.Types.ObjectId.isValid(id))
                .map(id => new mongoose.Types.ObjectId(id));
        }

        // 1. CHỈ LẤY SẢN PHẨM ACTIVE (Không lọc theo keyword ở bước này để đảm bảo có đủ data bù đắp)
        let pipeline = [ { $match: { status: 'active' } } ];

        // 2. TÍNH TOÁN STOCK TRONG PIPELINE
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

        // 3. THUẬT TOÁN CHẤM ĐIỂM (SCORING)
        let scoreLogic = { $add: [0] }; // Mặc định 0 điểm

        // +100 Điểm nếu khớp Keyword (Người dùng chủ động search)
        if (searchKeyword) {
            const regex = new RegExp(searchKeyword.split(/\s+/).join('|'), 'i');
            scoreLogic.$add.push({ $cond: [{ $regexMatch: { input: { $ifNull: ["$name", ""] }, regex: regex } }, 100, 0] });
        }
        
        // Nếu không có Keyword, check lịch sử duyệt (Trang chủ)
        if (!searchKeyword) {
            // +50 Điểm nếu thuộc Category đã xem
            if (catIds.length > 0) {
                scoreLogic.$add.push({ $cond: [{ $in: ["$category_id", catIds] }, 50, 0] });
            }
            // +30 Điểm nếu tên na ná các sản phẩm đã xem
            if (interestWords) {
                const regexInt = new RegExp(interestWords.split(/\s+/).join('|'), 'i');
                scoreLogic.$add.push({ $cond: [{ $regexMatch: { input: { $ifNull: ["$name", ""] }, regex: regexInt } }, 30, 0] });
            }
        }

        // Gắn điểm vào sản phẩm
        pipeline.push({ $addFields: { match_score: scoreLogic } });

        // 4. LẤY TOÀN BỘ (HOẶC GIỚI HẠN LỚN) LÊN ĐỂ JS GẮN TOTAL_ORDERS RỒI MỚI SORT
        // (Do Order nằm ở bảng khác, việc lookup toàn bộ DB trong pipeline rất chậm, ta xử lý bằng JS)
        let products = await Product.aggregate(pipeline);
        const orderCountMap = await getOrderCounts();

        // Gắn số order vào từng SP
        products = products.map(p => {
            p.totalOrders = orderCountMap[p._id.toString()] || 0;
            return p;
        });

        // 5. THUẬT TOÁN SORT CUỐI CÙNG BẰNG JAVASCRIPT
        products.sort((a, b) => {
            // Ưu tiên 1: Còn hàng lên trước, Hết hàng xuống cuối
            if (a.is_in_stock !== b.is_in_stock) return b.is_in_stock - a.is_in_stock;
            // Ưu tiên 2: Điểm liên quan (Keyword, Category) cao lên trước
            if (a.match_score !== b.match_score) return b.match_score - a.match_score;
            // Ưu tiên 3: Bán chạy (Nhiều Order) lên trước
            if (a.totalOrders !== b.totalOrders) return b.totalOrders - a.totalOrders;
            // Ưu tiên 4: Cùng điểm, cùng order -> Mới nhất lên trước
            return new Date(b.created_at) - new Date(a.created_at);
        });

        // 6. PHÂN TRANG VÀ BÙ ĐẮP SẢN PHẨM (Pagination)
        const total = products.length;
        const paginatedProducts = products.slice(skip, skip + parseInt(limit));

        // 7. CHỈ LOOKUP STORE & USER CHO CÁC SẢN PHẨM NẰM TRONG TRANG HIỆN TẠI (Tối ưu cực mạnh)
        await Product.populate(paginatedProducts, [
            { path: 'store_id', select: 'shop_name' },
            { path: 'user_id', select: 'full_name' }
        ]);

        // LOG NGẮN GỌN 1 DÒNG
        //console.log(`[GET PRODUCTS] Search: '${keyword||'none'}' | Category: ${catIds.length} | Interests: '${interestWords||'none'}' -> Trả về ${paginatedProducts.length}/${total}`);

        res.json({
            success: true,
            count: paginatedProducts.length,
            total_pages: Math.ceil(total / limit),
            current_page: parseInt(page),
            data: paginatedProducts
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
            // 1. Lọc sản phẩm Active và là Đồ cũ (Used)
            { 
                $match: { 
                    status: 'active',
                    condition: 'Used'
                } 
            },

            // 2. Lookup để lấy thông tin người dùng đăng bán (User)
            { 
                $lookup: { 
                    from: 'users', 
                    localField: 'user_id', 
                    foreignField: '_id', 
                    as: 'user' 
                } 
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },

            // 3. Tính toán tổng Stock (bao gồm cả phân loại)
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

            // 4. Chỉ giữ lại sản phẩm còn hàng (Stock > 0)
            {
                $match: {
                    calculated_stock: { $gt: 0 }
                }
            },

            // 5. Lấy ngẫu nhiên (Random)
            { $sample: { size: limit } },

            // 6. Format dữ liệu trả về cho gọn gàng (Giống với ProductCard)
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

        // 1. Lọc theo Category
        if (category) {
            const catIds = category.split(',')
                .map(id => id.trim())
                .filter(id => mongoose.Types.ObjectId.isValid(id))
                .map(id => new mongoose.Types.ObjectId(id));
            if (catIds.length > 0) {
                matchStage.category_id = { $in: catIds };
            }
        }

        // 2. Lọc theo Keyword (Tìm kiếm chính xác)
        if (keyword) {
            isSearching = true;
            // Xóa khoảng trắng thừa, tìm kiếm Case-insensitive
            const cleanKeyword = keyword.trim().replace(/\s+/g, ' ');
            const searchRegex = new RegExp(cleanKeyword, 'i');
            matchStage.$or = [
                { name: searchRegex },
                { description: searchRegex }
            ];
        }

        // 3. Lấy dữ liệu sản phẩm thỏa mãn
        let products = await Product.find(matchStage)
            .populate('store_id', 'shop_name')
            .populate('user_id', 'full_name')
            .lean(); // Dùng lean() để trả về plain object, tăng tốc độ

        // Khai báo biến chứa sản phẩm gợi ý (Fallback)
        let fallbackProducts = [];

        // 4. LOGIC FALLBACK (Nếu tìm không ra sản phẩm)
        if (products.length === 0 && isSearching && category) {
            console.log("-> Không tìm thấy Keyword trong Category. Bật chế độ Fallback.");
            // Tạo query mới: Cùng Category nhưng bỏ qua Keyword
            let fallbackMatch = { status: 'active', category_id: matchStage.category_id };
            fallbackProducts = await Product.find(fallbackMatch)
                .populate('store_id', 'shop_name')
                .populate('user_id', 'full_name')
                .limit(8) // Chỉ lấy tối đa 8 sản phẩm gợi ý
                .lean();
        }

        // 5. MAP STOCK VÀ TOTAL ORDERS
        const orderMap = await getOrderCounts();
        
        const mapProductData = (p) => {
            // Tính tổng stock an toàn
            let totalStock = 0;
            if (Array.isArray(p.product_type) && p.product_type.length > 0) {
                totalStock = p.product_type.reduce((sum, pt) => sum + (pt.stock || 0), 0);
            } else {
                totalStock = p.stock || 0;
            }

            p.calculated_stock = totalStock;
            p.is_in_stock = totalStock > 0 ? 1 : 0;
            p.totalOrders = orderMap[p._id.toString()] || 0;
            
            // Format name user cho chuẩn với component
            if (p.user_id) p.user_id.name = p.user_id.full_name;

            return p;
        };

        products = products.map(mapProductData);
        if (fallbackProducts.length > 0) {
            fallbackProducts = fallbackProducts.map(mapProductData);
        }

        // 6. SORT THEO YÊU CẦU CỦA FRONTEND (filter params)
        products.sort((a, b) => {
            // LUÔN ƯU TIÊN: Hàng còn Stock lên trước
            if (a.is_in_stock !== b.is_in_stock) return b.is_in_stock - a.is_in_stock;

            switch (filter) {
                case 'popular': // Bán chạy nhất
                    return b.totalOrders - a.totalOrders;
                case 'latest': // Mới nhất
                    return new Date(b.created_at) - new Date(a.created_at);
                case 'price-asc': // Giá thấp đến cao
                    return a.price - b.price;
                case 'price-desc': // Giá cao đến thấp
                    return b.price - a.price;
                default: 
                    // Mặc định: Phù hợp keyword (Đã lọc ở DB) -> Nhiều đơn -> Mới nhất
                    if (a.totalOrders !== b.totalOrders) return b.totalOrders - a.totalOrders;
                    return new Date(b.created_at) - new Date(a.created_at);
            }
        });

        // 7. PHÂN TRANG (Bằng Javascript sau khi Sort)
        const total = products.length;
        const paginatedProducts = products.slice(skip, skip + parseInt(limit));

        console.log(`[GET LIST] Đã trả về ${paginatedProducts.length}/${total} sản phẩm. Fallback: ${fallbackProducts.length}`);
        
        res.json({
            success: true,
            count: paginatedProducts.length,
            total_pages: Math.ceil(total / parseInt(limit)) || 1,
            current_page: parseInt(page),
            data: paginatedProducts,
            fallbackData: fallbackProducts // Trả mảng gợi ý riêng
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

        // Pipeline xử lý logic "xịn" bằng Aggregation
        let pipeline = [
            { 
                $match: { 
                    status: 'active', 
                    original_price: { $gt: 0 },
                    condition: 'New'
                } 
            }
        ];

        // 1. Filter by keyword nếu có
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

        // 2. Tính toán % giảm giá trực tiếp trong DB (Nhanh hơn JS thuần)
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

        // 3. Lọc sản phẩm có giảm giá > 0
        pipeline.push({ $match: { discount_numeric: { $gt: 0 } } });

        // 4. Chiến lược lấy dữ liệu: Ưu tiên giảm sâu (>50%), nếu không có thì lấy giảm nhiều nhất
        pipeline.push({
            $facet: {
                deepSale: [
                    { $match: { discount_numeric: { $gt: 50 } } },
                    { $sample: { size: limitNum } } // Random lấy limit
                ],
                topSale: [
                    { $sort: { discount_numeric: -1 } }, // Sắp xếp giảm dần
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

        // Populate store info thủ công (vì aggregate $lookup phức tạp hơn ở bước này)
        await Product.populate(finalResult, { path: 'store_id', select: 'shop_name' });

        // Format lại dữ liệu trả về
        finalResult = finalResult.map(p => ({
            ...p,
            discount_percentage: Math.round(p.discount_numeric) + '%'
        }));

        // 6. Trả về kết quả
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

// GET /api/products/:id (Để xem chi tiết - Của Tú)
exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('store_id', 'shop_name pickup_address')
            .populate('category_id', 'name');

        if (!product) {
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

// Controller: Get product details
exports.getProductDetails = async (req, res) => {
    try {
        const productId = req.params.id;

        // ĐÃ THÊM CHỮ "stock" VÀO SELECT ĐỂ FRONTEND LẤY ĐƯỢC SỐ LƯỢNG
        const product = await Product.findById(productId)
            .select("_id store_id category_id name description main_image display_files price original_price product_type stock condition status rejection_reason")
            .populate('store_id', 'shop_name description')
            .populate('category_id', 'name description');

        if (!product) {
            return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
        }

        // 2. Use aggregation to get all review stats efficiently
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

        // 3. Process the aggregation result
        const overallStats = statsResult[0].overall[0] || { averageRating: 0, totalReviews: 0 };
        const countsPerRatingRaw = statsResult[0].countsPerRating || [];

        // Create a clean object for rating counts, ensuring all ratings from 1-5 are present with a default of 0
        const ratingCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        countsPerRatingRaw.forEach(item => {
            if (item.rating >= 1 && item.rating <= 5) {
                ratingCounts[item.rating] = item.count;
            }
        });

        res.status(200).json({
            product,
            totalReviews: overallStats.totalReviews,
            // Ensure averageRating is a number and fixed to one decimal place
            averageRating: overallStats.averageRating ? parseFloat(overallStats.averageRating.toFixed(1)) : 0,
            ratingCounts // This is the new data
        });
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
};

// Controller: Get all reviews for a product with pagination
exports.getProductReviews = async (req, res) => {
    try {
        const productId = req.params.id;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const rating = parseInt(req.query.rating, 10);
        const skip = (page - 1) * limit;

        // Optional: Check if product exists
        const productExists = await Product.findById(productId).select('_id');
        if (!productExists) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Xây dựng bộ lọc
        const filter = { product_id: productId };
        if (rating && rating >= 1 && rating <= 5) {
            filter.rating = rating;
        }

        // Fetch reviews with pagination
        const reviews = await Review.find(filter)
            .populate('user_id', 'account_name avatar') // Populate user's name and avatar
            .sort({ created_at: -1 }) // Sort by newest first
            .skip(skip)
            .limit(limit);

        // Get total number of reviews for pagination
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

// customer product functions (Tú)
// [GET] /api/past-item-listing/me
// [GET] /api/products/customer_passed_products
exports.getCustomerPassedProducts = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Tìm các sản phẩm do user này tạo, nhưng không thuộc về Store nào
        const products = await Product.find({ 
            user_id: userId, 
        }).sort({ created_at: -1 });

        res.status(200).json({ success: true, data: products });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// [PUT] /api/products/pass/:id
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

        // chỉ cho phép thay đổi một vài trường
        if (name) product.name = name;
        if (description) product.description = description;
        if (category_id) product.category_id = category_id;
        if (main_image) product.main_image = main_image;
        if (display_files) product.display_files = display_files;
        if (price !== undefined) product.price = price;
        if (original_price !== undefined) product.original_price = original_price;

        // nếu client gửi product_type array thì thay toàn bộ (với điều kiện số lượng và giới hạn)
        if (product_type && Array.isArray(product_type)) {
            product.product_type = product_type.map(pt => ({
                ...pt,
                stock: Math.min(10, Math.max(0, Number(pt.stock) || 0))
            }));
        }

        // lưu lại thời gian cập nhật
        product.updated_at = new Date();

        await product.save();
        res.status(200).json({ success: true, data: product, message: 'Đã cập nhật sản phẩm.' });
    } catch (error) {
        console.error('Error updating passed product:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// [DELETE] /api/products/pass/:id
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
        const userId = req.user.id; // Lấy từ token đăng nhập
        const { name, description, category_id, main_image, display_files = [], price, original_price,
             product_type, condition } = req.body;

        // 1. Kiểm tra xem User này có Store hay không
        const store = await Store.findOne({ user_id: userId, status: 'active' });
        const isStore = !!store;

        let finalCondition = condition;
        let finalProductType = Array.isArray(product_type) ? product_type : [];

        // 2. LOGIC CHỐNG LÁCH LUẬT CHO CUSTOMER (Không có store)
        if (!isStore) {
            // Kiểm tra giới hạn bài đăng (Ví dụ: tối đa 5 bài Pass đồ)
            const activePostsCount = await Product.countDocuments({ user_id: userId, store_id: { $exists: false }, status: { $ne: 'inactive' } });
            if (activePostsCount >= 10) {
                return res.status(403).json({ message: 'Bạn đã đạt giới hạn đăng bán cá nhân. Vui lòng đăng ký Cửa hàng để bán thêm.' });
            }

            // Ép cứng tình trạng là đồ cũ
            finalCondition = 'Used';

            // ensure each type has numeric stock and cap at 10 per type
            if (finalProductType.length > 0) {
                finalProductType = finalProductType.map((pt) => ({
                    ...pt,
                    stock: Math.min(10, Math.max(0, Number(pt.stock) || 0))
                }));
            } else {
                finalProductType = [{ description: 'Mặc định', stock: 1, price_difference: 0 }];
            }
        }

        
        const blackListKeywords = await BlacklistKeyword.find();
        const textToCheck = `${name} ${description || ''}`.toLowerCase();
        
        let finalStatus = 'pending'; // Mặc định là pass
        let rejectionReason = '';

        for (const item of blackListKeywords) {
            if (textToCheck.includes(item.keyword.toLowerCase())) {
                if (item.level === 'high') {
                    //xóa bài
                    rejectionReason = `Sản phẩm bị từ chối vì chứa từ khóa cấm: "${item.keyword}"`;
                    return; // Dừng vòng lặp ngay khi tìm thấy từ cấm
                }
                if (item.level === 'critical') {
                    //khóa tài khoản
                   rejectionReason = `Sản phẩm bị từ chối vì chứa từ khóa cấm: "${item.keyword}"`;
                    return; // Dừng vòng lặp ngay khi tìm thấy từ cấm
                }
                if (item.level === 'medium') {
                finalStatus = 'pending';
                rejectionReason = `Hệ thống tự động tạm giữ vì chứa từ khóa nhạy cảm: "${item.keyword}"`;
                break; 
                }// Dừng vòng lặp ngay khi tìm thấy từ cấm
            }
        }

        // 4. Tạo sản phẩm
        const newProduct = new Product({
            store_id: isStore ? store._id : undefined, // Nếu có store thì gán, không thì undefined
            user_id: userId,                           // Luôn lưu user_id để biết ai đăng
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
            message: finalStatus === 'active' ? 'Đăng bán sản phẩm thành công!' : 'Sản phẩm đang được chờ duyệt do chứa từ khóa nhạy cảm.',
            data: newProduct
        });

    } catch (error) {
        console.error('Lỗi tạo sản phẩm:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ', error: error.message });
    }
};