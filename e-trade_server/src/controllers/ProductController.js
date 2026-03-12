const mongoose = require("mongoose");
const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Review = require('../models/ReviewProduct'); // Thêm import Review của Thắng
const BlacklistKeyword = require('../models/BlacklistKeyword');
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
            
            // 1. Lookup Store (Có thể null nếu là đồ pass của customer)
            {
                $lookup: {
                    from: 'stores',
                    localField: 'store_id',
                    foreignField: '_id',
                    as: 'store'
                }
            },
            { $unwind: { path: '$store', preserveNullAndEmptyArrays: true } },
            
            // 2. Lookup User (Để lấy thông tin người đăng pass đồ)
            {
                $lookup: {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }
        ];

        // 3. Search Keyword Logic
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

            // Sắp xếp: Relevance giảm dần, sau đó mới đến ngày tạo
            pipeline.push({
                $sort: { relevance: -1, created_at: -1 }
            });
        } else {
            pipeline.push({
                $sort: { created_at: -1 }
            });
        }

        // 4. Phân trang
        pipeline.push({ $skip: skip });
        pipeline.push({ $limit: parseInt(limit) });

        // 5. Project (Định hình dữ liệu trả về an toàn)
        pipeline.push({
            $project: {
                _id: 1,
                name: 1,
                main_image: 1,
                price: 1,
                original_price: 1,
                condition: 1,
                status: 1,
                product_type: 1,
                created_at: 1,
                category_id: 1,
                
                // Logic tính stock
                stock: {
                    $cond: {
                        if: { $gt: [{ $size: { $ifNull: ["$product_type", []] } }, 0] },
                        then: { $sum: "$product_type.stock" },
                        else: { $ifNull: ["$stock", 0] }
                    }
                },
                
                // Trả về thông tin Store NẾU tồn tại
                store_id: {
                    $cond: {
                        if: { $ifNull: ["$store._id", false] }, // Nếu store._id có tồn tại
                        then: {
                            _id: '$store._id',
                            shop_name: '$store.shop_name'
                        },
                        else: null // Trả về null nếu không có store
                    }
                },

                // Trả về thông tin User NẾU tồn tại
                user_id: {
                    $cond: {
                        if: { $ifNull: ["$user._id", false] }, // Nếu user._id có tồn tại
                        then: {
                            _id: '$user._id',
                            // Lưu ý: User schema của bạn thường dùng full_name thay vì name
                            name: '$user.full_name' 
                        },
                        else: null // Trả về null nếu không có user
                    }
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
        console.error("Lỗi khi getProducts:", error);
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
        const { name, description, category_id, main_image, price, original_price, quantity, display_files } = req.body;

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

        // nếu người dùng gửi số lượng mới (chỉ áp dụng cho hàng pass)
        if (quantity !== undefined) {
            let qty = parseInt(quantity, 10);
            if (isNaN(qty) || qty < 1) qty = 1;
            if (qty > 10) qty = 10;
            if (product.product_type && product.product_type.length > 0) {
                product.product_type[0].stock = qty;
            } else {
                product.product_type = [{ description: 'Mặc định', stock: qty, price_difference: 0 }];
            }
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
             product_type, condition, quantity } = req.body;

        // 1. Kiểm tra xem User này có Store hay không
        const store = await Store.findOne({ user_id: userId, status: 'active' });
        const isStore = !!store;

        let finalCondition = condition;
        let finalProductType = product_type || [];

        // convert incoming quantity to integer and cap at 10
        let qty = parseInt(quantity, 10);
        if (isNaN(qty) || qty < 1) qty = 1;
        if (qty > 10) qty = 10;

        // 2. LOGIC CHỐNG LÁCH LUẬT CHO CUSTOMER (Không có store)
        if (!isStore) {
            // Kiểm tra giới hạn bài đăng (Ví dụ: tối đa 5 bài Pass đồ)
            const activePostsCount = await Product.countDocuments({ user_id: userId, store_id: { $exists: false }, status: { $ne: 'inactive' } });
            if (activePostsCount >= 10) {
                return res.status(403).json({ message: 'Bạn đã đạt giới hạn đăng bán cá nhân. Vui lòng đăng ký Cửa hàng để bán thêm.' });
            }

            // Ép cứng tình trạng là đồ cũ
            finalCondition = 'Used'; 

            // cho phép số lượng do người dùng nhập (tối đa 10)
            if (finalProductType.length > 0) {
                finalProductType = finalProductType.map((pt, index) => ({
                    ...pt,
                    stock: index === 0 ? qty : 0 // chỉ vị trí đầu có số lượng
                }));
            } else {
                finalProductType = [{ description: 'Mặc định', stock: qty, price_difference: 0 }];
            }
        }

        
        const blackListKeywords = await BlacklistKeyword.find();
        const textToCheck = `${name} ${description || ''}`.toLowerCase();
        
        let finalStatus = 'active'; // Mặc định là pass
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