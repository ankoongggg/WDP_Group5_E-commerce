const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Review = require('../models/ReviewProduct'); // Thêm import Review của Thắng

// ==========================================
// CÁC HÀM CỦA TÚ (Quản lý tìm kiếm, lọc)
// ==========================================

const getProductsByShop = async (req, res) => {
    // Đang chờ code
}

const filterProductsBySearch = async (req, res) => {
    // Đang chờ code
}

// GET /api/products
// Query params: 
// - keyword: tìm kiếm theo tên hoặc mô tả
// - limit: giới hạn số lượng (mặc định 10)
// - page: phân trang
exports.getProducts = async (req, res) => {
    try {
        const { keyword, page = 1, limit = 12 } = req.query;
        const skip = (page - 1) * limit;

        // Query cơ bản: Chỉ lấy sản phẩm đang active
        let matchStage = { status: 'active' };

        // Pipeline xử lý
        let pipeline = [
            { $match: matchStage },
            {
                $lookup: { // Join với Store để lấy tên shop
                    from: 'stores',
                    localField: 'store_id',
                    foreignField: '_id',
                    as: 'store'
                }
            },
            { $unwind: '$store' }, // Giải nén mảng store
        ];

        if (keyword) {
            pipeline.push({
                $addFields: {
                    relevance: {
                        $cond: {
                            if: {
                                $regexMatch: {
                                    input: "$name",
                                    regex: keyword,
                                    options: "i"
                                }
                            },
                            then: 1, // Nếu tên chứa keyword -> 1 điểm
                            else: 0  // Không chứa -> 0 điểm
                        }
                    }
                }
            });

            // Sắp xếp: Relevance giảm dần (1 -> 0), sau đó mới đến ngày tạo
            pipeline.push({
                $sort: { relevance: -1, created_at: -1 }
            });
        } else {
            // Nếu không có keyword thì cứ mới nhất lên đầu
            pipeline.push({
                $sort: { created_at: -1 }
            });
        }

        // Phân trang
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: parseInt(limit) });

        // Thực thi
        const products = await Product.aggregate(pipeline);

        // Đếm tổng (để phân trang)
        const total = await Product.countDocuments(matchStage);

        res.json({
            success: true,
            count: products.length,
            total_pages: Math.ceil(total / limit),
            current_page: parseInt(page),
            data: products
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

exports.getRandomProductsgotSaleMoreThan50Percent = async (req, res) => {
    try {
        const { keyword, limit = 10 } = req.query;

        // query cơ bản
        let query = {
            status: 'active',
            // ĐÃ FIX: Comment lại dòng condition: 'New' để lấy cả hàng Used
            // condition: 'New', 
            original_price: { $gt: 0 }
        };

        // 2. if keyword, thêm điều kiện tìm kiếm
        if (keyword) {
            //$or gộp contain trong seach name && question
            //%regex để tìm kiếm gần đúng, i để ignore case
            query.$or = [
                { name: { $regex: keyword, $options: 'i' } },
                { description: { $regex: keyword, $options: 'i' } }
            ];
        }

        // 3. Lấy TOÀN BỘ sản phẩm thỏa mãn điều kiện về (hoặc giới hạn 500 để ko bị nặng)
        // Populate luôn store để lấy thông tin shop
        const allProducts = await Product.find(query)
            .populate('store_id')
            .limit(500)
            .lean(); // .lean() giúp trả về object JS thuần, chạy nhanh hơn

        // Tính toán % giảm giá cho từng sản phẩm bằng Javascript
        // (Gốc - Bán) / Gốc * 100
        const productsWithDiscount = allProducts.map(p => {

            const original = p.original_price || 0;
            const price = p.price || 0;

            let discountPercent = 0;
            if (original > 0 && original > price) {
                discountPercent = ((original - price) / original) * 100;
            }

            return {
                ...p,
                discount_numeric: discountPercent, // Lưu số để sort
                discount_percentage: Math.round(discountPercent) + '%' // Lưu chuỗi để hiển thị
            };
        });

        //sản phẩm giảm > 50%
        let deepSaleProducts = productsWithDiscount.filter(p => p.discount_numeric > 50);

        let finalResult = [];
        let strategyUsed = '';

        //>50% 
        // gth: greater than 
        if (deepSaleProducts.length > 0 && deepSaleProducts.length >= 50) {
            // Có hàng giảm sâu 
            strategyUsed = 'random_deep_sale';

            // Xáo trộn mảng (Shuffle) để lấy ngẫu nhiên
            for (let i = deepSaleProducts.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [deepSaleProducts[i], deepSaleProducts[j]] = [deepSaleProducts[j], deepSaleProducts[i]];
            }

            // Cắt lấy số lượng limit
            finalResult = deepSaleProducts.slice(0, parseInt(limit));

        } else {
            //Không có, lấy giảm giá cao nhất ---
            strategyUsed = 'highest_available';
            // Sắp xếp giảm dần theo %
            productsWithDiscount.sort((a, b) => b.discount_numeric - a.discount_numeric);
            // Cắt lấy top
            finalResult = productsWithDiscount.slice(0, parseInt(limit));
        }

        // 6. Trả về kết quả
        res.status(200).json({
            success: true,
            count: finalResult.length,
            strategy: strategyUsed,
            data: finalResult
        });

    } catch (err) {
        console.error("Simple Logic Error:", err);
        res.status(500).json({
            success: false,
            message: 'Server Error + error: ' + err.message,
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

        // 1. Fetch product details
        const product = await Product.findById(productId)
            .select("_id store_id category_id name description main_image display_files price original_price product_type condition status rejection_reason")
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