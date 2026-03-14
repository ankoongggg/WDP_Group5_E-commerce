const User = require('../models/User');
const bcrypt = require('bcryptjs');
const Product = require('../models/Product');
const Store = require('../models/Store');

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json({ success: true, data: user });
    } catch (error) { 
        res.status(500).json({ success: false, message: 'Lỗi lấy thông tin profile' }); 
    }
};

const updateProfile = async (req, res) => {
    try {
        const { full_name, phone, gender, dob, addresses } = req.body;
        
        // Fix lỗi Mongoose không lưu được nếu dob bị sai định dạng hoặc chuỗi rỗng
        const validDob = dob ? new Date(dob) : null;

        // Dùng $set để ÉP MongoDB cập nhật toàn bộ các trường này
        const updatedUser = await User.findByIdAndUpdate(
            req.user.id,
            { 
                $set: {
                    full_name: full_name, 
                    phone: phone, 
                    gender: gender, 
                    dob: validDob, 
                    addresses: addresses
                }
            },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: 'User không tồn tại' });
        }

        res.json({ success: true, message: 'Cập nhật thành công', data: updatedUser });
    } catch (error) {
        console.error("Lỗi Update Profile:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const toggleWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { productId } = req.body;

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp ID sản phẩm' });
        }

        const productExists = await Product.findById(productId);
        if (!productExists) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }

        const user = await User.findById(userId);
        const isWishlisted = user.wishlist.includes(productId);

        const updateOperation = isWishlisted ? { $pull: { wishlist: productId } } : { $addToSet: { wishlist: productId } };
        const message = isWishlisted ? 'Đã xóa khỏi danh sách yêu thích' : 'Đã thêm vào danh sách yêu thích';

        const updatedUser = await User.findByIdAndUpdate(userId, updateOperation, { new: true }).select('wishlist');

        res.json({ success: true, message, data: updatedUser.wishlist });

    } catch (error) {
        console.error("Lỗi khi xử lý wishlist:", error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

const toggleFollowStore = async (req, res) => {
    try {
        const userId = req.user.id;
        const { storeId } = req.body;

        if (!storeId) {
            return res.status(400).json({ success: false, message: 'Vui lòng cung cấp ID cửa hàng' });
        }

        const storeExists = await Store.findById(storeId);
        if (!storeExists) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy cửa hàng' });
        }

        const user = await User.findById(userId);
        const isFollowing = user.following_stores.includes(storeId);

        const updateOperation = isFollowing ? { $pull: { following_stores: storeId } } : { $addToSet: { following_stores: storeId } };
        const message = isFollowing ? 'Đã bỏ theo dõi cửa hàng' : 'Đã theo dõi cửa hàng';

        const updatedUser = await User.findByIdAndUpdate(userId, updateOperation, { new: true }).select('following_stores');

        res.json({ success: true, message, data: updatedUser.following_stores });

    } catch (error) {
        console.error("Lỗi khi theo dõi cửa hàng:", error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

const getWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 12, search } = req.query;
        const pageInt = parseInt(page);
        const limitInt = parseInt(limit);
        const skip = (pageInt - 1) * limitInt;

        // 1. Lấy danh sách ID sản phẩm yêu thích của người dùng
        const user = await User.findById(userId).select('wishlist').lean();
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        if (user.wishlist.length === 0) {
            return res.json({
                success: true,
                data: [],
                pagination: { currentPage: 1, totalPages: 0, totalItems: 0, limit: limitInt }
            });
        }

        // 2. Xây dựng bộ lọc cho sản phẩm
        const productFilter = {
            _id: { $in: user.wishlist }
        };
        if (search) {
            productFilter.name = { $regex: search, $options: 'i' };
        }

        // 3. Truy vấn sản phẩm với bộ lọc, phân trang và lấy tổng số lượng
        const [products, totalItems] = await Promise.all([
            Product.find(productFilter)
                .select('name main_image price original_price store_id')
                .populate('store_id', 'shop_name')
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limitInt)
                .lean(),
            Product.countDocuments(productFilter)
        ]);

        const totalPages = Math.ceil(totalItems / limitInt);

        res.json({
            success: true,
            data: products,
            pagination: {
                currentPage: pageInt,
                totalPages: totalPages,
                totalItems: totalItems,
                limit: limitInt
            }
        });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách yêu thích:", error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};

const getFollowingStores = async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 12, search } = req.query;
        const pageInt = parseInt(page);
        const limitInt = parseInt(limit);
        const skip = (pageInt - 1) * limitInt;
        
        // 1. Lấy danh sách ID cửa hàng đang theo dõi của người dùng
        const user = await User.findById(userId).select('following_stores').lean();
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        if (user.following_stores.length === 0) {
            return res.json({
                success: true,
                data: [],
                pagination: { currentPage: 1, totalPages: 0, totalItems: 0, limit: limitInt }
            });
        }

        // 2. Xây dựng bộ lọc cho cửa hàng
        const storeFilter = {
            _id: { $in: user.following_stores }
        };
        if (search) {
            storeFilter.shop_name = { $regex: search, $options: 'i' };
        }

        // 3. Truy vấn cửa hàng với bộ lọc, phân trang và lấy tổng số lượng
        const [stores, totalItems] = await Promise.all([
            Store.find(storeFilter)
                .select('shop_name description user_id')
                .populate('user_id', 'avatar')
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limitInt)
                .lean(),
            Store.countDocuments(storeFilter)
        ]);

        const totalPages = Math.ceil(totalItems / limitInt);

        res.json({
            success: true,
            data: stores,
            pagination: {
                currentPage: pageInt,
                totalPages: totalPages,
                totalItems: totalItems,
                limit: limitInt
            }
        });
    } catch (error) {
        console.error("Lỗi khi lấy danh sách cửa hàng theo dõi:", error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
};


// Admin User functions
const getUserList = async (req, res) => {
    try {
        const { search = '', page = 1, limit = 20, role, status } = req.query;
        const query = {};

        if (search.trim()) {
            const regex = new RegExp(search.trim(), 'i');
            query.$or = [{ email: regex }, { phone: regex }, { full_name: regex }];
        }

        if (role) {
            query.role = role;
        }

        if (status) {
            query.status = status;
        }

        const skip = (Number(page) - 1) * Number(limit);

        const [users, total] = await Promise.all([
            User.find(query)
                .select('full_name email phone role status created_at ban_reason banned_until')
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(Number(limit)),
            User.countDocuments(query),
        ]);

        res.json({
            success: true,
            data: users,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (err) {
        console.error('Lỗi get account', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { roles } = req.body;

        if (!Array.isArray(roles)) {
            return res.status(400).json({ success: false, message: 'Roles phải là một mảng.' });
        }

        const allowedRoles = ['customer', 'seller', 'admin'];
        const invalid = roles.filter((r) => !allowedRoles.includes(r));
        if (invalid.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Role không hợp lệ: ${invalid.join(', ')}`,
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { $set: { role: roles } },
            { new: true, runValidators: true },
        ).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User không tồn tại' });
        }

        res.json({ success: true, message: 'Cập nhật role thành công', data: user });
    } catch (err) {
        console.error('Lỗi updateUserRole', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

const banAccount = async (req, res) => {
    try {
        const { id } = req.params;
        const { action, ban_reason, banned_until, durationDays } = req.body;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User không tồn tại' });
        }

        if (action === 'ban') {
            let bannedUntilDate = null;

            if (durationDays && Number(durationDays) > 0) {
                const d = new Date();
                d.setDate(d.getDate() + Number(durationDays));
                bannedUntilDate = d;
            } else if (banned_until) {
                const parsed = new Date(banned_until);
                if (!isNaN(parsed.getTime())) {
                    bannedUntilDate = parsed;
                }
            }

            user.status = 'banned';
            user.ban_reason = ban_reason || user.ban_reason || 'Tài khoản đã bị khóa bởi quản trị viên.';
            user.banned_until = bannedUntilDate;
        } else if (action === 'unban') {
            user.status = 'active';
            // Giữ lại ban_reason và banned_until theo yêu cầu
        } else {
            return res.status(400).json({ success: false, message: 'Hành động không hợp lệ' });
        }

        await user.save();

        res.json({ success: true, message: 'Cập nhật trạng thái tài khoản thành công', data: user });
    } catch (err) {
        console.error('Lỗi ban account', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

const upSellerRequest = async (req, res) => {
    try {
        // TODO: triển khai sau nếu cần
        res.status(501).json({ success: false, message: 'Chức năng đang được phát triển' });
    } catch (err) {
        console.error('Lỗi up seller request', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// Admin: tạo tài khoản mới
const createUserByAdmin = async (req, res) => {
    try {
        const { full_name, email, password, phone, roles } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Tên, email và mật khẩu là bắt buộc' });
        }

        const existing = await User.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email đã tồn tại' });
        }

        const allowedRoles = ['customer', 'seller', 'admin'];
        const finalRoles = Array.isArray(roles) && roles.length > 0 ? roles : ['customer'];
        const invalid = finalRoles.filter((r) => !allowedRoles.includes(r));
        if (invalid.length > 0) {
            return res.status(400).json({ success: false, message: `Role không hợp lệ: ${invalid.join(', ')}` });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = await User.create({
            full_name,
            account_name: full_name,
            email: email.toLowerCase(),
            password: hashedPassword,
            phone: phone || '',
            role: finalRoles,
            status: 'active',
        });

        const plainUser = user.toObject();
        delete plainUser.password;

        res.status(201).json({ success: true, message: 'Tạo tài khoản thành công', data: plainUser });
    } catch (err) {
        console.error('Lỗi createUserByAdmin', err);
        res.status(500).json({ success: false, message: err.message });
    }
};

// admin dashboard functions
// lấy số lượng user và so sánh tăng giảm so với tháng trước
const getTotalUsersNumberAndComparison = async (req,res) => {
    try{
        const totalUsers = await User.countDocuments();
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const usersLastMonth = await User.countDocuments({ createdAt: { $gte: lastMonth } });
        const comparison = totalUsers - usersLastMonth;

        res.json({ success: true, data: { totalUsers, comparison } });
    }catch(err){
        console.error("Lỗi get total users", err);
        res.status(500).json({ success: false, message: err.message });
    }
}

module.exports = { getProfile, updateProfile, banAccount, upSellerRequest, getTotalUsersNumberAndComparison, toggleWishlist, toggleFollowStore, getWishlist, getFollowingStores };
module.exports = {
    getProfile,
    updateProfile,
    getUserList,
    updateUserRole,
    banAccount,
    upSellerRequest,
    createUserByAdmin,
    getTotalUsersNumberAndComparison,
};

