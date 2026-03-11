const mongoose = require("mongoose");
const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Review = require('../models/ReviewProduct'); // Thêm import Review của Thắng
const BlackListKeyword = require('../models/BlackListKeyword.js'); // Thêm import BlackListKeyword của Tú

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

        // Query cơ bản: Chỉ lấy sản phẩm đang active và chưa bị xoá mềm
        let matchStage = { status: 'active', is_deleted: { $ne: true } };

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

        // Thêm stage để định hình lại output và bao gồm các trường cần thiết
        pipeline.push({
            $project: {
                _id: 1,
                name: 1,
                main_image: 1,
                price: 1,
                original_price: 1,
                // Logic tính stock: Nếu có product_type (mảng) thì tính tổng stock bên trong, ngược lại lấy stock gốc
                stock: {
                    $cond: {
                        if: { $gt: [{ $size: { $ifNull: ["$product_type", []] } }, 0] },
                        then: { $sum: "$product_type.stock" },
                        else: { $ifNull: ["$stock", 0] }
                    }
                },
                product_type: 1, // Thêm loại sản phẩm (chứa tồn kho chi tiết)
                created_at: 1,
                category_id: 1, // Thêm trường này để frontend có thể lọc
                store_id: { // Đổi tên 'store' thành 'store_id' cho nhất quán
                    _id: '$store._id',
                    shop_name: '$store.shop_name'
                }
            }
        });

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
        const limitNum = parseInt(limit);

        // Pipeline xử lý logic "xịn" bằng Aggregation
        let pipeline = [
            { 
                $match: { 
                    status: 'active', 
                    original_price: { $gt: 0 } 
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
