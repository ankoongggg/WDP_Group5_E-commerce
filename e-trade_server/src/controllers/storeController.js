const Store = require('../models/Store');
const Product = require('../models/Product');
const Review = require('../models/ReviewProduct');
const SellerRegistration = require('../models/SellerRegistration');
const mongoose = require('mongoose');

// Controller: Lấy thông tin chi tiết công khai của một cửa hàng
exports.getStoreDetails = async (req, res) => {
    try {
        const storeId = req.params.id;
        const storeObjectId = new mongoose.Types.ObjectId(storeId);

        // 1. Lấy thông tin cửa hàng và thông tin avatar, tên của chủ cửa hàng
        const store = await Store.findById(storeId)
            .populate('user_id', 'avatar account_name full_name')
            .select('-identity_card -updated_at -__v');

        if (!store) {
            return res.status(404).json({ message: 'Không tìm thấy cửa hàng' });
        }

        // 2. Dùng aggregation để lấy thống kê sản phẩm và đánh giá một cách hiệu quả
        const stats = await Product.aggregate([
            // Giai đoạn 1: Lọc các sản phẩm đang hoạt động của cửa hàng
            { $match: { store_id: storeObjectId, status: 'active' } },
            // Giai đoạn 2: Nhóm để đếm sản phẩm và thu thập ID
            {
                $group: {
                    _id: "$store_id",
                    productIds: { $push: "$_id" },
                    totalProducts: { $sum: 1 }
                }
            },
            // Giai đoạn 3: Tra cứu các đánh giá liên quan
            {
                $lookup: {
                    from: 'reviewproducts', // Tên collection của model ReviewProduct
                    localField: 'productIds',
                    foreignField: 'product_id',
                    as: 'reviews'
                }
            },
            // Giai đoạn 4: "Mở" mảng reviews để xử lý từng đánh giá
            { $unwind: { path: "$reviews", preserveNullAndEmptyArrays: true } },
            // Giai đoạn 5: Nhóm lại để tính toán thống kê đánh giá
            {
                $group: {
                    _id: "$_id",
                    totalProducts: { $first: "$totalProducts" },
                    totalReviews: { $sum: { $cond: [{ $ifNull: ["$reviews", false] }, 1, 0] } },
                    totalRating: { $sum: { $ifNull: ["$reviews.rating", 0] } }
                }
            },
            // Giai đoạn 6: Định dạng đầu ra cuối cùng
            {
                $project: {
                    _id: 0,
                    totalProducts: 1,
                    totalReviews: 1,
                    averageRating: {
                        $cond: [{ $eq: ["$totalReviews", 0] }, 0, { $divide: ["$totalRating", "$totalReviews"] }]
                    }
                }
            }
        ]);

        // Lấy kết quả hoặc đặt giá trị mặc định nếu không có sản phẩm nào
        const storeStats = stats[0] || { totalProducts: 0, totalReviews: 0, averageRating: 0 };

        // 4. Trả về kết quả
        res.status(200).json({
            store,
            stats: {
                totalProducts: storeStats.totalProducts,
                totalReviews: storeStats.totalReviews,
                averageRating: parseFloat(storeStats.averageRating.toFixed(1)),
            }
        });
    } catch (error) {
        console.error('Lỗi khi lấy chi tiết cửa hàng:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
};

// Controller: Lấy tất cả sản phẩm của một cửa hàng
exports.getStoreProducts = async (req, res) => {
    try {
        const storeId = req.params.id;
        // Phân trang
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 12;
        const skip = (page - 1) * limit;

        // Lọc và tìm kiếm
        const { search, sortBy, minPrice, maxPrice } = req.query;

        // Kiểm tra xem cửa hàng có tồn tại không
        const storeExists = await Store.findById(storeId).select('_id');
        if (!storeExists) {
            return res.status(404).json({ message: 'Không tìm thấy cửa hàng' });
        }

        // Xây dựng điều kiện lọc
        const filter = { store_id: storeId, status: 'active' };

        if (search) {
            // Sử dụng regex để tìm kiếm không phân biệt chữ hoa/thường
            filter.name = { $regex: search, $options: 'i' };
        }

        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) {
                filter.price.$gte = parseInt(minPrice, 10);
            }
            if (maxPrice) {
                filter.price.$lte = parseInt(maxPrice, 10);
            }
        }

        // Xây dựng tùy chọn sắp xếp
        let sortOptions = { created_at: -1 }; // Mặc định sắp xếp theo mới nhất
        if (sortBy) {
            switch (sortBy) {
                case 'price_asc':
                    sortOptions = { price: 1 };
                    break;
                case 'price_desc':
                    sortOptions = { price: -1 };
                    break;
            }
        }

        // Lấy sản phẩm với phân trang, lọc và sắp xếp
        const products = await Product.find(filter)
            .select('name main_image price original_price stock product_type store_id')
            .populate('store_id', 'shop_name') // Thêm populate để lấy tên shop
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);

        // Lấy tổng số sản phẩm khớp với bộ lọc để phân trang
        const totalProducts = await Product.countDocuments(filter);

        res.status(200).json({
            products,
            currentPage: page,
            totalPages: Math.ceil(totalProducts / limit),
            totalProducts,
        });

    } catch (error) {
        console.error('Lỗi khi lấy sản phẩm của cửa hàng:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
};

// Controller: Đăng kí seller (gửi đơn yêu cầu)
exports.registerSeller = async (req, res) => {
    try {
        const userId = req.user.id;
        const { shop_name, shop_description, identity_card, identity_card_image, pickup_address, phone, business_category } = req.body;

        // Kiểm tra user đã có store chưa
        const existingStore = await Store.findOne({ user_id: userId });
        if (existingStore) {
            return res.status(400).json({ message: 'Bạn đã có cửa hàng rồi' });
        }

        // Kiểm tra đã có pending request chưa
        const existingRequest = await SellerRegistration.findOne({ 
            user_id: userId, 
            status: 'pending' 
        });
        if (existingRequest) {
            return res.status(400).json({ message: 'Bạn đã gửi đơn đăng kí seller, vui lòng chờ phê duyệt' });
        }

        // Validate input
        if (!shop_name || !shop_description || !identity_card || !pickup_address || !business_category) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
        }

        // Tạo đơn đăng kí
        const registration = new SellerRegistration({
            user_id: userId,
            shop_name,
            shop_description,
            identity_card,
            identity_card_image,
            pickup_address,
            phone,
            business_category,
            status: 'pending'
        });

        await registration.save();
        res.status(201).json({ 
            message: 'Gửi đơn đăng kí seller thành công! Vui lòng chờ admin phê duyệt.',
            registration 
        });
    } catch (error) {
        console.error('Lỗi khi đăng kí seller:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
};

// Controller: Lấy trạng thái đơn đăng kí seller
exports.getSellerRegistrationStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        
        const registration = await SellerRegistration.findOne({ user_id: userId })
            .sort({ created_at: -1 });

        if (!registration) {
            return res.status(404).json({ message: 'Bạn chưa gửi đơn đăng kí seller nào' });
        }

        res.status(200).json(registration);
    } catch (error) {
        console.error('Lỗi khi lấy trạng thái đơn đăng kí:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
};