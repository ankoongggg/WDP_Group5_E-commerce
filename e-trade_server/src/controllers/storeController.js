const Store = require('../models/Store');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/ReviewProduct');
const SellerRegistration = require('../models/SellerRegistration');
const mongoose = require('mongoose');

// Lấy thông tin store + stats cho seller hiện tại
exports.getMyStore = async (req, res) => {
    try {
        const userId = req.user.id;

        // Tìm store theo user_id
        const store = await Store.findOne({ user_id: userId })
            .populate('user_id', 'avatar account_name full_name email')
            .select('-identity_card -__v');

        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Bạn chưa có cửa hàng nào. Vui lòng đăng ký seller hoặc chờ admin phê duyệt.',
            });
        }

        const storeObjectId = new mongoose.Types.ObjectId(store._id);

        // Tính stats tương tự getStoreDetails nhưng theo store_id
        const statsAgg = await Product.aggregate([
            { $match: { store_id: storeObjectId, status: 'active', is_deleted: { $ne: true } } },
            {
                $group: {
                    _id: '$store_id',
                    productIds: { $push: '$_id' },
                    totalProducts: { $sum: 1 },
                },
            },
            {
                $lookup: {
                    from: 'reviewproducts',
                    localField: 'productIds',
                    foreignField: 'product_id',
                    as: 'reviews',
                },
            },
            { $unwind: { path: '$reviews', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: '$_id',
                    totalProducts: { $first: '$totalProducts' },
                    totalReviews: { $sum: { $cond: [{ $ifNull: ['$reviews', false] }, 1, 0] } },
                    totalRating: { $sum: { $ifNull: ['$reviews.rating', 0] } },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalProducts: 1,
                    totalReviews: 1,
                    averageRating: {
                        $cond: [
                            { $eq: ['$totalReviews', 0] },
                            0,
                            { $divide: ['$totalRating', '$totalReviews'] },
                        ],
                    },
                },
            },
        ]);

        const statsRaw = statsAgg[0] || { totalProducts: 0, totalReviews: 0, averageRating: 0 };

        return res.status(200).json({
            success: true,
            data: {
                store,
                stats: {
                    totalProducts: statsRaw.totalProducts,
                    totalReviews: statsRaw.totalReviews,
                    averageRating: parseFloat(statsRaw.averageRating.toFixed(1)),
                },
            },
        });
    } catch (error) {
        console.error('Lỗi khi lấy thông tin store của seller hiện tại:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ nội bộ',
        });
    }
};

// Cập nhật thông tin store cho seller hiện tại
exports.updateMyStore = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            shop_name,
            logo,
            description,
            pickup_address,
            phone,
            contact_email,
        } = req.body;

        const errors = {};

        if (!shop_name || typeof shop_name !== 'string' || shop_name.trim().length < 2) {
            errors.shop_name = 'Tên cửa hàng là bắt buộc và phải có độ dài tối thiểu 2 ký tự.';
        }

        if (phone && !/^[0-9+\-\s]{8,20}$/.test(phone)) {
            errors.phone = 'Số điện thoại không hợp lệ.';
        }

        if (contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email)) {
            errors.contact_email = 'Email liên hệ không hợp lệ.';
        }

        if (logo && !/^https?:\/\//i.test(logo)) {
            errors.logo = 'Logo URL phải bắt đầu bằng http hoặc https.';
        }

        if (pickup_address && pickup_address.trim().length < 5) {
            errors.pickup_address = 'Địa chỉ nhận hàng quá ngắn.';
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({
                success: false,
                errors,
            });
        }

        const store = await Store.findOne({ user_id: userId });
        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Bạn chưa có cửa hàng nào. Vui lòng đăng ký seller hoặc chờ admin phê duyệt.',
            });
        }

        // Cập nhật các field cho phép
        store.shop_name = shop_name;
        if (logo !== undefined) store.logo = logo;
        if (description !== undefined) store.description = description;
        if (pickup_address !== undefined) store.pickup_address = pickup_address;
        if (phone !== undefined) store.phone = phone;
        if (contact_email !== undefined) store.contact_email = contact_email;
        store.updated_at = Date.now();

        await store.save();

        return res.status(200).json({
            success: true,
            data: store,
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật thông tin store của seller hiện tại:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi máy chủ nội bộ',
        });
    }
};

// Controller: Lấy thông tin chi tiết công khai của một cửa hàng
exports.getStoreDetails = async (req, res) => {
    try {
        const storeId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(storeId)) {
            return res.status(400).json({ message: 'ID cửa hàng không hợp lệ' });
        }
        const storeObjectId = new mongoose.Types.ObjectId(storeId);

        // Chạy song song các truy vấn để tối ưu tốc độ
        const [store, statsAgg, followerCount] = await Promise.all([
            Store.findById(storeId)
                .populate('user_id', 'avatar account_name full_name')
                .select('-identity_card -updated_at -__v')
                .lean(), // .lean() để đọc nhanh hơn

            Product.aggregate([
                // Giai đoạn 1: Lọc các sản phẩm đang hoạt động của cửa hàng
                { $match: { store_id: storeObjectId, status: 'active', is_deleted: { $ne: true } } },
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
            ]),
            
            User.countDocuments({ following_stores: storeObjectId })
        ]);

        if (!store) {
            return res.status(404).json({ message: 'Không tìm thấy cửa hàng' });
        }

        // Lấy kết quả hoặc đặt giá trị mặc định nếu không có sản phẩm nào
        const storeStats = statsAgg[0] || { totalProducts: 0, totalReviews: 0, averageRating: 0 };

        // Trả về kết quả
        res.status(200).json({
            store,
            stats: {
                totalProducts: storeStats.totalProducts,
                totalReviews: storeStats.totalReviews,
                averageRating: parseFloat(storeStats.averageRating.toFixed(1)),
                followerCount: followerCount || 0, // Thêm số người theo dõi
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
        const { search, sortBy, minPrice, maxPrice, exclude } = req.query;

        // Kiểm tra xem cửa hàng có tồn tại và seller không bị ban
        const store = await Store.findById(storeId).populate('user_id', 'status banned_until');
        if (!store) {
            return res.status(404).json({ message: 'Không tìm thấy cửa hàng' });
        }

        const now = new Date();
        if (!store.user_id || store.user_id.status === 'banned' || (store.user_id.banned_until && new Date(store.user_id.banned_until) > now)) {
            return res.status(404).json({ message: 'Không tìm thấy cửa hàng' });
        }

        // Xây dựng điều kiện lọc
        const filter = { store_id: storeId, status: 'active', is_deleted: { $ne: true } };

        // Thêm logic để loại trừ một sản phẩm cụ thể (dùng cho "Sản phẩm liên quan")
        if (exclude && mongoose.Types.ObjectId.isValid(exclude)) {
            filter._id = { $ne: new mongoose.Types.ObjectId(exclude) };
        }

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
        let products = await Product.find(filter)
            .select('name main_image price original_price stock product_type store_id user_id')
            .populate('store_id', 'shop_name') // Thêm populate để lấy tên shop
            .populate('user_id', 'status banned_until')
            .sort(sortOptions)
            .skip(skip)
            .limit(limit);

        
        products = products.filter(p => {
            if (!p.user_id) return true;
            if (p.user_id.status === 'banned') return false;
            if (p.user_id.banned_until && new Date(p.user_id.banned_until) > now) return false;
            return true;
        });

        // Lấy tổng số sản phẩm sau khi lọc ban
        const totalProducts = products.length;

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

        // Validate input (bao gồm phone vì schema yêu cầu)
        if (!shop_name || !shop_description || !identity_card || !pickup_address || !business_category || !phone) {
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
            // Kiểm tra xem user đã có Store chưa (trường hợp đã duyệt nhưng đơn đăng kí bị xóa)
            const existingStore = await Store.findOne({ user_id: userId });
            
            if (existingStore) {
                // Tự động sửa lỗi: Cập nhật role seller cho user nếu chưa có
                await User.findByIdAndUpdate(userId, { $addToSet: { role: 'seller' } });

                // Trả về object giả lập trạng thái approved để frontend hiển thị đúng
                return res.status(200).json({
                    status: 'approved',
                    shop_name: existingStore.shop_name,
                    created_at: existingStore.created_at
                });
            }

            return res.status(404).json({ message: 'Bạn chưa gửi đơn đăng kí seller nào' });
        }

        res.status(200).json(registration);
    } catch (error) {
        console.error('Lỗi khi lấy trạng thái đơn đăng kí:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
};

// Controller: Cập nhật thông tin đơn đăng kí seller
exports.updateSellerRegistration = async (req, res) => {
    try {
        const userId = req.user.id;
        const { shop_name, shop_description, identity_card, identity_card_image, pickup_address, phone, business_category } = req.body;

        // Tìm đơn đăng kí gần nhất
        const registration = await SellerRegistration.findOne({ user_id: userId }).sort({ created_at: -1 });

        if (!registration) {
            return res.status(404).json({ message: 'Không tìm thấy đơn đăng kí' });
        }

        // Chỉ cho phép sửa khi chưa được duyệt (pending hoặc rejected)
        if (registration.status === 'approved') {
            return res.status(400).json({ message: 'Đơn đăng kí đã được chấp thuận, không thể chỉnh sửa' });
        }

        // Cập nhật thông tin
        if (shop_name) registration.shop_name = shop_name;
        if (shop_description) registration.shop_description = shop_description;
        if (identity_card) registration.identity_card = identity_card;
        if (identity_card_image) registration.identity_card_image = identity_card_image;
        if (pickup_address) registration.pickup_address = pickup_address;
        if (phone) registration.phone = phone;
        if (business_category) registration.business_category = business_category;

        // Nếu đơn bị từ chối, khi sửa lại sẽ reset về pending để admin duyệt lại
        if (registration.status === 'rejected') {
            registration.status = 'pending';
            registration.rejection_reason = undefined;
        }

        registration.updated_at = Date.now();
        await registration.save();

        res.status(200).json({ 
            message: 'Cập nhật đơn đăng kí thành công',
            registration 
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật đơn đăng kí:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
};

// =====================================================
// ADMIN ROUTES
// =====================================================

// Controller: Lấy danh sách seller đang chờ duyệt
exports.getPendingSellers = async (req, res) => {
    try {
        const pendingSellers = await SellerRegistration.find({ status: 'pending' })
            .populate('user_id', 'full_name email')
            .sort({ created_at: -1 });

        res.status(200).json(pendingSellers);
    } catch (error) {
        console.error('Lỗi khi lấy danh sách seller chờ duyệt:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
};

// Controller: Phê duyệt đơn đăng kí seller
exports.approveSeller = async (req, res) => {
    try {
        const registrationId = req.params.id;

        // SỬA: Tìm trong SellerRegistration, không phải Store
        const registration = await SellerRegistration.findById(registrationId);

        if (!registration) {
            return res.status(404).json({ message: 'Không tìm thấy đơn đăng kí' });
        }
        if (registration.status !== 'pending') {
            return res.status(400).json({ message: 'Đơn đăng kí này đã được xử lý' });
        }
        

        // Tạo cửa hàng mới từ thông tin đăng kí
        const newStore = new Store({
            user_id: registration.user_id,
            shop_name: registration.shop_name,
            description: registration.shop_description, // Map trường dữ liệu
            identity_card: registration.identity_card,
            pickup_address: registration.pickup_address,
            phone: registration.phone,
            status: 'active' // Cửa hàng mới được active ngay
        });

        await newStore.save();

        // Cập nhật quyền user thành seller để hiển thị menu quản lý shop
        // Dùng $addToSet để thêm 'seller' vào mảng role một cách an toàn
        await User.findByIdAndUpdate(registration.user_id, { 
            $addToSet: { role: 'seller' } 
        });

        // Xóa đơn đăng kí đã được xử lý để dọn dẹp
        await SellerRegistration.findByIdAndDelete(registrationId);

        res.status(200).json({ message: 'Phê duyệt seller thành công', store: newStore });
    } catch (error) {
        console.error('Lỗi khi phê duyệt seller:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
};

// Controller: Từ chối đơn đăng kí seller
exports.rejectSeller = async (req, res) => {
    try {
        const registrationId = req.params.id;
        const { reason } = req.body; // Cho phép admin gửi lý do từ chối (nếu có)

        // SỬA: Tìm và cập nhật trong SellerRegistration, không phải xóa Store
        const registration = await SellerRegistration.findById(registrationId);

        if (!registration) {
            return res.status(404).json({ message: 'Không tìm thấy đơn đăng kí' });
        }
        if (registration.status !== 'pending') {
            return res.status(400).json({ message: 'Đơn đăng kí này đã được xử lý' });
        }

        // Cập nhật trạng thái thành 'rejected' và lưu lý do để người dùng xem
        registration.status = 'rejected';
        registration.rejection_reason = reason || 'Thông tin cung cấp chưa hợp lệ. Vui lòng chỉnh sửa và gửi lại.';
        // some existing documents may lack required fields; skip validation on save to avoid errors
        await registration.save({ validateBeforeSave: false });

        res.status(200).json({ message: 'Từ chối seller thành công', registration });
    } catch (error) {
        console.error('Lỗi khi từ chối seller:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
};
//admin func
exports.getListingStoresAndRevenuesTotalOrdersFromProductOfEachStore = async (req,res) => {
    try {
        const stores = await Store.find({}).populate('user_id', 'full_name email phone').lean();
        
        for (const store of stores) {
            const products = await Product.find({ store_id: store._id }).select('_id');
            const productIds = products.map(p => p._id);

            if (productIds.length === 0) {
                store.platform_fee = 0; // Sửa tên field
                store.total_orders = 0;
                continue;
            }

            const orders = await Order.find({
                items: { $elemMatch: { product_id: { $in: productIds } } }
            });

            let totalRevenue = 0;
            orders.forEach(order => {
                totalRevenue += order.total_amount;
            });

            // LOGIC MỚI: Chỉ lưu hoa hồng sàn (5% của tổng doanh thu)
            store.platform_fee = totalRevenue * 0.05; 
            store.total_orders = orders.length;
        }

        res.status(200).json(stores);
    } catch (err){
        console.error('Lỗi khi lấy danh sách cửa hàng:', err);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });    
    }
}