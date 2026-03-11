const Order = require('../models/Order');
const Store = require('../models/Store');
const Product = require('../models/Product');

/**
 * @desc    [SELLER] Lấy danh sách đơn hàng của cửa hàng
 * @route   GET /api/orders/seller
 * @access  Private (Seller)
 * @query   status (pending, confirmed, shipping, completed, cancelled)
 */
exports.getSellerOrders = async (req, res) => {
    try {
        const sellerUserId = req.user.id;
        const { status, page = 1, limit = 10, search } = req.query;

        // 1. Tìm cửa hàng của người bán đang đăng nhập
        const store = await Store.findOne({ user_id: sellerUserId }).select('_id');
        if (!store) {
            return res.status(404).json({ message: 'Không tìm thấy cửa hàng cho người bán này.' });
        }

        // 2. Xây dựng pipeline tổng hợp để lọc, tìm kiếm và phân trang
        const matchStage = { seller_id: store._id };
        if (status && ['pending', 'confirmed', 'shipping', 'completed', 'cancelled'].includes(status)) {
            matchStage.order_status = status;
        }

        const pipeline = [
            { $match: matchStage },
            { $sort: { created_at: -1 } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'customer_id',
                    foreignField: '_id',
                    as: 'customer_id' // Ghi đè trực tiếp để không cần map lại
                }
            },
            {
                $unwind: {
                    path: '$customer_id',
                    preserveNullAndEmptyArrays: true
                }
            }
        ];

        // Thêm bước tìm kiếm nếu có
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            pipeline.push(
                {
                    $addFields: {
                        orderIdString: { $toString: '$_id' }
                    }
                },
                {
                    $match: {
                        $or: [
                            { 'customer_id.full_name': searchRegex },
                            { 'customer_id.email': searchRegex },
                            { 'orderIdString': searchRegex }
                        ]
                    }
                }
            );
        }

        // Sử dụng $facet để lấy cả dữ liệu đã phân trang và tổng số lượng
        // ĐÃ THÊM $project Ở ĐÂY ĐỂ HIỂN THỊ shipping_address VÀ CÁC TRƯỜNG CẦN THIẾT
        const paginatedPipeline = [
            ...pipeline,
            {
                $project: {
                    customer_id: 1,
                    seller_id: 1,
                    items: 1,
                    total_price: 1,
                    shipping_fee: 1,
                    total_amount: 1,
                    shipping_address: 1, // Khóa chính để frontend nhận được địa chỉ
                    payment_method: 1,
                    payment_status: 1,
                    order_status: 1,
                    history_logs: 1,
                    note: 1,
                    created_at: 1,
                    updated_at: 1
                }
            },
            {
                $facet: {
                    data: [{ $skip: (parseInt(page) - 1) * parseInt(limit) }, { $limit: parseInt(limit) }],
                    metadata: [{ $count: 'total' }]
                }
            }
        ];

        const result = await Order.aggregate(paginatedPipeline);
        const orders = result[0].data;
        const totalOrders = result[0].metadata[0]?.total || 0;
        const totalPages = Math.ceil(totalOrders / parseInt(limit));

        res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalOrders,
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách đơn hàng của người bán:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
};

/**
 * @desc    [SELLER] Lấy dữ liệu thống kê cho dashboard
 * @route   GET /api/seller/dashboard
 * @access  Private (Seller)
 */
exports.getSellerDashboardStats = async (req, res) => {
    try {
        const sellerUserId = req.user.id;
        const { revenuePeriod = '30d', startDate: queryStartDate, endDate: queryEndDate } = req.query; // '7d', '30d'

        const store = await Store.findOne({ user_id: sellerUserId }).select('_id');
        if (!store) {
            return res.status(404).json({ message: 'Không tìm thấy cửa hàng.' });
        }

        let startDate = new Date();
        const endDate = new Date(); // End date is today for period-based queries

        if (queryStartDate && queryEndDate) {
            startDate = new Date(queryStartDate);
            // Set endDate to the end of the selected day for accurate filtering
            const end = new Date(queryEndDate);
            end.setHours(23, 59, 59, 999);
            endDate.setTime(end.getTime());
        } else if (revenuePeriod === '7d') {
            startDate.setDate(startDate.getDate() - 7);
        } else { // Default to 30 days
            startDate.setDate(startDate.getDate() - 30);
        }

        const statsPipeline = Order.aggregate([
            { $match: { seller_id: store._id } },
            {
                $facet: {
                    totalRevenue: [
                        { $match: { order_status: 'completed' } },
                        { $group: { _id: null, total: { $sum: '$total_amount' } } }
                    ],
                    orderStatusCounts: [
                        { $group: { _id: '$order_status', count: { $sum: 1 } } }
                    ],
                    revenueOverPeriod: [
                        { $match: { order_status: 'completed', created_at: { $gte: startDate, $lte: endDate } } },
                        {
                            $group: {
                                _id: { $dateToString: { format: "%Y-%m-%d", date: "$created_at" } },
                                dailyRevenue: { $sum: '$total_amount' }
                            }
                        },
                        { $sort: { _id: 1 } }
                    ],
                    productsSold: [
                        { $match: { order_status: { $in: ['confirmed', 'shipping', 'completed'] } } },
                        { $unwind: '$items' },
                        { $group: { _id: null, total: { $sum: '$items.quantity' } } }
                    ]
                }
            }
        ]);

        const recentOrdersQuery = Order.find({ seller_id: store._id })
            .sort({ created_at: -1 })
            .limit(5)
            .populate('customer_id', 'full_name');

        const [statsResult, recentOrders] = await Promise.all([statsPipeline, recentOrdersQuery]);

        const stats = statsResult[0];
        const formattedStats = {
            totalRevenue: stats.totalRevenue[0]?.total || 0,
            orderStatusCounts: stats.orderStatusCounts.reduce((acc, status) => {
                acc[status._id] = status.count;
                return acc;
            }, { pending: 0, confirmed: 0, shipping: 0, completed: 0, cancelled: 0 }),
            revenueOverPeriod: stats.revenueOverPeriod,
            productsSold: stats.productsSold[0]?.total || 0,
            recentOrders
        };

        res.status(200).json({ success: true, data: formattedStats });
    } catch (error) {
        console.error('Lỗi khi lấy dữ liệu dashboard của người bán:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
};

/**
 * @desc    [SELLER] Xác nhận hoặc từ chối đơn hàng
 * @route   PUT /api/orders/seller/:orderId/status
 * @access  Private (Seller)
 * @body    { action: 'confirm' | 'reject', reason?: string }
 */
exports.updateOrderStatusBySeller = async (req, res) => {
    try {
        const { orderId } = req.params;
        const sellerUserId = req.user.id;
        const { status, reason } = req.body; // status: 'confirmed', 'shipping', 'completed', 'cancelled'

        const validStatuses = ['confirmed', 'shipping', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: `Trạng thái '${status}' không hợp lệ.` });
        }

        // 1. Xác thực người bán và quyền sở hữu đơn hàng
        const store = await Store.findOne({ user_id: sellerUserId }).select('_id');
        if (!store) {
            return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này.' });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
        }
        // So sánh ID của cửa hàng với seller_id trong đơn hàng
        if (order.seller_id.toString() !== store._id.toString()) {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập đơn hàng này.' });
        }

        // 2. Kiểm tra logic chuyển đổi trạng thái
        const currentStatus = order.order_status;
        const allowedTransitions = {
            pending: ['confirmed', 'cancelled'],
            confirmed: ['shipping', 'cancelled'],
            shipping: ['completed'], // Không cho phép hủy khi đang giao
        };

        // Không cho phép thay đổi các đơn hàng đã hoàn thành hoặc đã hủy
        if (currentStatus === 'completed' || currentStatus === 'cancelled') {
            return res.status(400).json({ message: `Không thể thay đổi trạng thái của đơn hàng đã '${currentStatus}'.` });
        }

        if (!allowedTransitions[currentStatus] || !allowedTransitions[currentStatus].includes(status)) {
            return res.status(400).json({ message: `Không thể chuyển trạng thái từ '${currentStatus}' sang '${status}'.` });
        }

        // 3. Cập nhật trạng thái và xử lý các tác vụ phụ
        order.order_status = status;
        let logMessage = `Người bán đã cập nhật trạng thái đơn hàng thành '${status}'.`;

        if (status === 'cancelled') {
            order.note = reason || 'Người bán đã từ chối đơn hàng.';
            logMessage = `Người bán đã hủy đơn hàng. Lý do: ${reason || 'Không có'}`;

            // Hoàn trả tiền nếu đã thanh toán trước
            if (order.payment_status === 'completed') {
                order.payment_status = 'refunded';
            }

            // Hoàn trả số lượng sản phẩm vào kho (logic này được giữ nguyên)
            for (const item of order.items) {
                const product = await Product.findById(item.product_id);
                if (product) {
                    let variantFound = false;
                    // Ưu tiên hoàn trả cho đúng phân loại (variant)
                    if (product.product_type && product.product_type.length > 0 && item.type && item.type !== 'default') {
                        const variant = product.product_type.find(v => v.description === item.type);
                        if (variant) {
                            variant.stock = (variant.stock || 0) + item.quantity;
                            variantFound = true;
                        }
                    }
                    // Nếu không có variant hoặc không tìm thấy, hoàn trả vào stock chính
                    if (!variantFound) {
                        product.stock = (product.stock || 0) + item.quantity;
                    }
                    await product.save();
                }
            }
        }

        order.history_logs.push({ action: logMessage, created_at: new Date() });
        await order.save();

        res.status(200).json({
            message: `Cập nhật trạng thái đơn hàng thành công.`,
            data: order
        });

    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
};