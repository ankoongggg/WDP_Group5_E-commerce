const mongoose = require('mongoose');
const Product = require('../models/Product');
const Store = require('../models/Store');
const BlacklistKeyword = require('../models/BlacklistKeyword');

// Helper: lấy store của seller hiện tại
const getCurrentSellerStore = async (userId) => {
    return Store.findOne({ user_id: userId });
};

// GET /api/seller/products
exports.getSellerProducts = async (req, res) => {
    try {
        const userId = req.user.id;
        const store = await getCurrentSellerStore(userId);
        if (!store) {
            return res.status(400).json({ success: false, message: 'Bạn chưa có cửa hàng' });
        }

        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const allowedLimits = [10, 25, 50, 100];
        const limit = allowedLimits.includes(parseInt(req.query.limit, 10)) ? parseInt(req.query.limit, 10) : 25;
        const skip = (page - 1) * limit;
        const { status, search } = req.query;

        // ĐÃ FIX 1: Dùng $ne: true để lấy được cả những sản phẩm cũ bị thiếu trường is_deleted
        const filter = {
            store_id: store._id,
            is_deleted: { $ne: true },
        };

        // ĐÃ FIX 2: Chặn đứng chữ 'undefined', 'all' và chuỗi rỗng lọt vào query
        if (status && status !== 'undefined' && status !== 'all' && status.trim() !== '') {
            filter.status = { $in: [status] }; 
        }

        if (search && search !== 'undefined' && search.trim() !== '') {
            filter.name = { $regex: search, $options: 'i' };
        }

        const [items, total] = await Promise.all([
            Product.find(filter)
                .sort({ created_at: -1 })
                .skip(skip)
                .limit(limit),
            Product.countDocuments(filter),
        ]);

        res.json({
            success: true,
            data: items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (err) {
        console.error('getSellerProducts error:', err);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
    }
};

// POST /api/seller/products
exports.createSellerProduct = async (req, res) => {
    try {
        const userId = req.user.id;
        const store = await getCurrentSellerStore(userId);
        if (!store) {
            return res.status(400).json({ success: false, message: 'Bạn chưa có cửa hàng' });
        }

        const {
            name,
            category_id,
            price,
            original_price,
            condition,
            description,
            main_image,
            display_files,
            product_type,
        } = req.body;

        const errors = {};
        if (!name || !name.trim()) errors.name = 'Tên sản phẩm là bắt buộc';
        if (!Array.isArray(category_id) || category_id.length === 0) {
            errors.category_id = 'Danh mục là bắt buộc';
        }
        if (price === undefined || price === null || Number(price) <= 0) {
            errors.price = 'Giá bán phải lớn hơn 0';
        }
        if (!condition || !condition.trim()) {
            errors.condition = 'Tình trạng là bắt buộc';
        }
        if (original_price && Number(original_price) < Number(price)) {
            errors.original_price = 'Giá gốc phải lớn hơn hoặc bằng giá bán';
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ success: false, errors });
        }

        

        // 2. Chuẩn hoá product_type (không giới hạn stock của 2nd)
        let finalProductType = Array.isArray(product_type) ? product_type : [];
        if (finalProductType.length > 0) {
            finalProductType = finalProductType.map((pt) => ({
                description: pt.description || 'Mặc định',
                stock: Number(pt.stock) || 0,
                price_difference: Number(pt.price_difference) || 0,
            }));
        } else {
            finalProductType = [{ description: 'Mặc định', stock: 0, price_difference: 0 }];
        }

        const payload = {
            store_id: store._id,
            user_id: userId,
            category_id,
            name: name.trim(),
            description,
            main_image,
            display_files: Array.isArray(display_files) ? display_files : [],
            price: Number(price),
            original_price: original_price ? Number(original_price) : undefined,
            product_type: finalProductType,
            
            condition: condition || 'New', // Mặc định là 'New' nếu không cung cấp
            status: ['active'],
            is_deleted: false,
        };

        // 1. Kiểm duyệt từ khóa cấm (dùng chung với pass item)
        const blackListKeywords = await BlacklistKeyword.find().lean();
        let finalStatus = ['active']; // Default status
        const textToCheck = `${name} ${description || ''}`.toLowerCase();
        let rejectionReason = '';

        for (const item of blackListKeywords) {
            if (textToCheck.includes(item.keyword.toLowerCase())) {
                if (item.level === 'high' || item.level === 'critical') {
                    return res.status(400).json({ success: false, message: `Sản phẩm bị từ chối vì chứa từ khóa cấm: "${item.keyword}"` });
                } else if (item.level === 'medium') {
                    rejectionReason = `Sản phẩm bị từ chối vì chứa từ khóa nhạy cảm: "${item.keyword}"`;
                    finalStatus = ['rejected']; // Set to rejected for medium level as well
                    break;
                }
            }
        }
        
        payload.status = finalStatus;
        payload.rejection_reason = rejectionReason;

        const created = await Product.create(payload);
        res.status(201).json({ success: true, data: created, message: 'Sản phẩm đã được tạo thành công.' });
    } catch (err) {
        console.error('createSellerProduct error:', err);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
    }
};

// PUT /api/seller/products/:id
exports.updateSellerProduct = async (req, res) => {
    try {
        const userId = req.user.id;
        const store = await getCurrentSellerStore(userId);
        if (!store) {
            return res.status(400).json({ success: false, message: 'Bạn chưa có cửa hàng' });
        }

        const productId = req.params.id;
        const product = await Product.findOne({ _id: productId, store_id: store._id, is_deleted: { $ne: true } });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        }

        const {
            name,
            category_id,
            price,
            original_price,
            condition,
            description,
            main_image,
            display_files,
            product_type,
        } = req.body;

        const errors = {};
        if (!name || !name.trim()) errors.name = 'Tên sản phẩm là bắt buộc';
        if (!Array.isArray(category_id) || category_id.length === 0) {
            errors.category_id = 'Danh mục là bắt buộc';
        }
        if (price === undefined || price === null || Number(price) <= 0) {
            errors.price = 'Giá bán phải lớn hơn 0';
        }
        if (!condition || !condition.trim()) {
            errors.condition = 'Tình trạng là bắt buộc';
        }
        if (original_price && Number(original_price) < Number(price)) {
            errors.original_price = 'Giá gốc phải lớn hơn hoặc bằng giá bán';
        }

        if (Object.keys(errors).length > 0) {
            return res.status(400).json({ success: false, errors });
        }

        product.name = name.trim();
        product.category_id = category_id;
        product.price = Number(price);
        product.original_price = original_price ? Number(original_price) : undefined;
        product.condition = condition;
        product.description = description;
        product.main_image = main_image;
        product.display_files = Array.isArray(display_files) ? display_files : [];

        let updatedProductType = Array.isArray(product_type) ? product_type : [];
        if (updatedProductType.length > 0) {
            updatedProductType = updatedProductType.map((pt) => ({
                description: pt.description || 'Mặc định',
                stock: Number(pt.stock) || 0,
                price_difference: Number(pt.price_difference) || 0,
            }));
        } else {
            updatedProductType = [{ description: 'Mặc định', stock: 0, price_difference: 0 }];
        }

        product.product_type = updatedProductType;
        product.updated_at = new Date();

        // 1. Kiểm duyệt từ khóa cấm (dùng chung với pass item)
        const blackListKeywords = await BlacklistKeyword.find().lean();
        let finalStatus = ['active']; // Default status
        const textToCheck = `${name} ${description || ''}`.toLowerCase();
        let rejectionReason = '';

        for (const item of blackListKeywords) {
            if (textToCheck.includes(item.keyword.toLowerCase())) {
                if (item.level === 'high' || item.level === 'critical') {
                    rejectionReason = `Sản phẩm bị từ chối vì chứa từ khóa cấm: "${item.keyword}"`;
                    finalStatus = ['rejected'];
                    break;
                } else if (item.level === 'medium') {
                    rejectionReason = `Sản phẩm bị từ chối vì chứa từ khóa nhạy cảm: "${item.keyword}"`;
                    finalStatus = ['rejected']; // Set to rejected for medium level as well
                    break;
                }
            }
        }
        
        product.status = finalStatus;
        product.rejection_reason = rejectionReason;

        await product.save();

        if (product.status.includes('rejected')) {
            return res.status(400).json({ success: false, message: 'Món hàng không hợp lệ: ' + product.rejection_reason, data: product });
        } else {
            res.json({ success: true, data: product, message: 'Sản phẩm đã được cập nhật thành công.' });
        }
    } catch (err) {
        console.error('updateSellerProduct error:', err);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
    }
};

// PATCH /api/seller/products/:id/status
exports.updateSellerProductStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const store = await getCurrentSellerStore(userId);
        if (!store) {
            return res.status(400).json({ success: false, message: 'Bạn chưa có cửa hàng' });
        }

        const productId = req.params.id;
        const { status } = req.body;

        if (!['active', 'inactive'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
        }

        const product = await Product.findOneAndUpdate(
            { _id: productId, store_id: store._id, is_deleted: { $ne: true } },
            { $set: { status: [status], updated_at: new Date() } },
            { new: true },
        );

        if (!product) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        }

        res.json({ success: true, data: product });
    } catch (err) {
        console.error('updateSellerProductStatus error:', err);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
    }
};

// DELETE /api/seller/products/:id (soft delete)
exports.softDeleteSellerProduct = async (req, res) => {
    try {
        const userId = req.user.id;
        const store = await getCurrentSellerStore(userId);
        if (!store) {
            return res.status(400).json({ success: false, message: 'Bạn chưa có cửa hàng' });
        }

        const productId = req.params.id;

        const product = await Product.findOneAndUpdate(
            { _id: productId, store_id: store._id, is_deleted: { $ne: true } },
            {
                $set: {
                    is_deleted: true,
                    deleted_at: new Date(),
                    deleted_by: userId,
                    status: ['inactive'],
                },
            },
            { new: true },
        );

        if (!product) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        }

        res.json({ success: true, message: 'Đã xoá sản phẩm (soft delete)', data: product });
    } catch (err) {
        console.error('softDeleteSellerProduct error:', err);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
    }
};
// PATCH /api/seller/products/:id/stock
exports.addSellerProductStock = async (req, res) => {
    try {
        const userId = req.user.id;
        const store = await getCurrentSellerStore(userId); // Dùng lại hàm helper ở đầu file
        if (!store) {
            return res.status(400).json({ success: false, message: 'Bạn chưa có cửa hàng' });
        }

        const productId = req.params.id;
        const { amount } = req.body;

        if (!amount || isNaN(amount) || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Số lượng thêm phải lớn hơn 0' });
        }

        const product = await Product.findOne({ _id: productId, store_id: store._id, is_deleted: { $ne: true } });
        if (!product) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        }

        // Nếu sản phẩm có phân loại (size/màu), tạm thời cộng vào phân loại đầu tiên
        // Nếu không có phân loại, cộng vào stock gốc
        if (product.product_type && product.product_type.length > 0) {
            product.product_type[0].stock = (product.product_type[0].stock || 0) + Number(amount);
        } else {
            product.stock = (product.stock || 0) + Number(amount);
        }

        await product.save();
        res.json({ success: true, message: 'Cập nhật tồn kho thành công', data: product });
    } catch (err) {
        console.error('addSellerProductStock error:', err);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ nội bộ' });
    }
};