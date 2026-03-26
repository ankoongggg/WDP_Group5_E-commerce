const Order = require('../models/Order');
const Store = require('../models/Store');
const Product = require('../models/Product');
const ReviewProduct = require('../models/ReviewProduct');

/**
 * @desc    [SELLER] Lấy danh sách đơn hàng của cửa hàng
 * @route   GET /api/orders/seller
 * @access  Private (Seller)
 */
exports.getSellerOrders = async (req, res) => {
    try {
        const sellerUserId = req.user.id;
        const { status, page = 1, limit = 10, search } = req.query;

        const store = await Store.findOne({ user_id: sellerUserId }).select('_id');
        if (!store) {
            return res.status(404).json({ message: 'Không tìm thấy cửa hàng cho người bán này.' });
        }

        const matchStage = { seller_id: store._id, seller_type: 'Store' };
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
                    as: 'customer_info' 
                }
            },
            {
                $unwind: {
                    path: '$customer_info',
                    preserveNullAndEmptyArrays: true
                }
            }
        ];

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
                            { 'customer_info.full_name': searchRegex },
                            { 'customer_info.email': searchRegex },
                            { 'orderIdString': searchRegex }
                        ]
                    }
                }
            );
        }

        const paginatedPipeline = [
            ...pipeline,
            {
                $project: {
                    customer_id: '$customer_info', 
                    seller_id: 1,
                    items: 1,
                    total_price: 1,
                    shipping_fee: 1,
                    total_amount: 1,
                    shipping_address: 1, 
                    payment_method: 1,
                    payment_status: 1,
                    order_status: 1,
                    history_logs: 1,
                    note: 1,
                    cancel_reason: 1,   // Hiển thị cho seller
                    cancelled_by: 1,    // Hiển thị cho seller
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
 */
exports.getSellerDashboardStats = async (req, res) => {
    try {
        const sellerUserId = req.user.id;
        const { revenuePeriod = '30d', startDate: queryStartDate, endDate: queryEndDate } = req.query; 

        const store = await Store.findOne({ user_id: sellerUserId }).select('_id');
        if (!store) {
            return res.status(404).json({ message: 'Không tìm thấy cửa hàng.' });
        }

        let startDate = new Date();
        const endDate = new Date(); 

        if (queryStartDate && queryEndDate) {
            startDate = new Date(queryStartDate);
            const end = new Date(queryEndDate);
            end.setHours(23, 59, 59, 999);
            endDate.setTime(end.getTime());
        } else if (revenuePeriod === '7d') {
            startDate.setDate(startDate.getDate() - 7);
        } else { 
            startDate.setDate(startDate.getDate() - 30);
        }

        const statsPipeline = Order.aggregate([
            { $match: { seller_id: store._id, seller_type: 'Store' } },
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

        const recentOrdersQuery = Order.find({ seller_id: store._id, seller_type: 'Store' })
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
 * @desc    [SELLER] Cập nhật trạng thái đơn hàng (Xác nhận/Từ chối + Hoàn kho)
 */
exports.updateOrderStatusBySeller = async (req, res) => {
    try {
        const { orderId } = req.params;
        const sellerUserId = req.user.id;
        const { status, reason } = req.body;

        const validStatuses = ['confirmed', 'shipping', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: `Trạng thái '${status}' không hợp lệ.` });
        }

        const store = await Store.findOne({ user_id: sellerUserId }).select('_id');
        if (!store) {
            return res.status(403).json({ message: 'Bạn không có quyền thực hiện hành động này.' });
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
        }
        if (order.seller_id.toString() !== store._id.toString()) {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập đơn hàng này.' });
        }

        const currentStatus = order.order_status;
        const allowedTransitions = {
            pending: ['confirmed', 'cancelled'],
            confirmed: ['shipping', 'cancelled'],
            shipping: ['completed'], 
        };

        if (currentStatus === 'completed' || currentStatus === 'cancelled') {
            return res.status(400).json({ message: `Không thể thay đổi trạng thái của đơn hàng đã '${currentStatus}'.` });
        }

        if (!allowedTransitions[currentStatus] || !allowedTransitions[currentStatus].includes(status)) {
            return res.status(400).json({ message: `Không thể chuyển trạng thái từ '${currentStatus}' sang '${status}'.` });
        }

        order.order_status = status;
        let logMessage = `Người bán đã cập nhật trạng thái đơn hàng thành '${status}'.`;

        if (status === 'cancelled') {
            order.cancel_reason = reason || 'Người bán đã từ chối đơn hàng.';
            order.cancelled_by = 'seller'; 
            logMessage = `Người bán đã hủy đơn hàng. Lý do: ${reason || 'Không có'}`;

            if (order.payment_status === 'completed') {
                order.payment_status = 'refunding'; // Đổi thành chờ hoàn tiền
            }

            // --- LOGIC HOÀN KHO CHO SELLER ---
            for (const item of order.items) {
                const product = await Product.findById(item.product_id);
                if (product) {
                    let variantFound = false;
                    if (product.product_type && product.product_type.length > 0 && item.type && item.type !== 'default') {
                        const variant = product.product_type.find(v => v.description === item.type);
                        if (variant) {
                            variant.stock = (variant.stock || 0) + item.quantity;
                            variantFound = true;
                        }
                    }
                    if (!variantFound) {
                        product.stock = (product.stock || 0) + item.quantity;
                    }
                    product.markModified('product_type');
                    await product.save();
                }
            }
        }

        order.history_logs.push({ action: logMessage, created_at: new Date() });
        await order.save();

        res.status(200).json({
            success: true,
            message: `Cập nhật trạng thái đơn hàng thành công.`,
            data: order
        });

    } catch (error) {
        console.error('Lỗi khi cập nhật trạng thái đơn hàng:', error);
        res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
};

/**
 * @desc    [SELLER/USER] Xác nhận đã hoàn tiền cho đơn hàng hủy
 */
exports.refundOrderBySeller = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        
        let hasPermission = false;
        if (order.seller_type === 'Store') {
            const store = await Store.findOne({ user_id: userId }).select('_id');
            if (store && order.seller_id.toString() === store._id.toString()) hasPermission = true;
        } else {
            // Cho phép cả người dùng pass đồ cũ tự hoàn tiền
            if (order.seller_id.toString() === userId) hasPermission = true;
        }

        if (!hasPermission) return res.status(403).json({ message: 'Không có quyền thực hiện' });

        if (order.order_status !== 'cancelled' || order.payment_status !== 'refunding') {
            return res.status(400).json({ message: 'Trạng thái không hợp lệ để hoàn tiền' });
        }

        order.payment_status = 'refunded';
        order.history_logs.push({ action: 'Người bán đã chuyển khoản hoàn tiền cho khách hàng.', created_at: new Date() });
        await order.save();
        
        res.status(200).json({ success: true, message: 'Xác nhận hoàn tiền thành công', data: order });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

/**
 * @desc    [CUSTOMER] Khách hàng tự hủy đơn COD khi còn PENDING
 */
exports.customerCancelOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;
        const userId = req.user.id;

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });

        if (order.customer_id.toString() !== userId) {
            return res.status(403).json({ message: 'Bạn không có quyền hủy đơn hàng này.' });
        }

        // Chỉ cho phép hủy khi đơn chưa được giao (chưa chuyển sang shipping)
        if (order.order_status === 'shipping' || order.order_status === 'completed' || order.order_status === 'cancelled') {
            return res.status(400).json({ message: 'Không thể hủy đơn hàng ở trạng thái này.' });
        }

        // Logic Hoàn tiền (Refund) nếu đã thanh toán trước
        let refundMessage = '';
        if (order.payment_status === 'completed') {
            order.payment_status = 'refunding'; // Chuyển sang trạng thái chờ
            refundMessage = ' Vui lòng chờ người bán hoàn tiền lại cho bạn.';
        }

        order.order_status = 'cancelled';
        order.cancel_reason = reason || 'Người mua tự hủy đơn.';
        order.cancelled_by = 'customer';
        order.history_logs.push({ 
            action: `Người mua đã chủ động hủy đơn hàng.${refundMessage} Lý do: ${reason}`, 
            created_at: new Date() 
        });

        // --- LOGIC HOÀN KHO CHO CUSTOMER ---
        for (const item of order.items) {
            const product = await Product.findById(item.product_id);
            if (product) {
                let variantFound = false;
                if (product.product_type && product.product_type.length > 0 && item.type && item.type !== 'default') {
                    const variant = product.product_type.find(v => v.description === item.type);
                    if (variant) {
                        variant.stock = (variant.stock || 0) + item.quantity;
                        variantFound = true;
                    }
                }
                if (!variantFound) {
                    product.stock = (product.stock || 0) + item.quantity;
                }
                product.markModified('product_type');
                await product.save();
            }
        }

        await order.save();
        res.status(200).json({ success: true, message: `Đã hủy đơn hàng thành công.${refundMessage}` });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

/**
 * @desc    [SELLER] Lấy đơn hàng ký gửi (2nd hand)
 */
exports.getCustomerPassedOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status } = req.query;
        let matchStage = { seller_id: userId, seller_type: 'User' };
        if (status) matchStage.order_status = status;
        const orders = await Order.find(matchStage)
            .populate('customer_id', 'full_name email phone') 
            .populate('items.product_id', 'name main_image')
            .sort({ created_at: -1 });
        res.status(200).json({ success: true, data: orders });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

/**
 * @desc    [SELLER] Cập nhật đơn hàng ký gửi
 */
exports.updatePassedOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;
        const { status, reason } = req.body;
        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
        if (order.seller_type !== 'User' || order.seller_id.toString() !== userId) {
            return res.status(403).json({ message: 'Bạn không có quyền xử lý đơn này.' });
        }
        order.order_status = status;
        if (status === 'cancelled') {
            order.note = reason;
            order.cancel_reason = reason;
            order.cancelled_by = 'seller';
            if (order.payment_status === 'completed') {
                order.payment_status = 'refunding';
            }
            for (const item of order.items) {
                    const product = await Product.findById(item.product_id);
                    if (product) {
                        let variantFound = false;
                        if (product.product_type && product.product_type.length > 0 && item.type && item.type !== 'default') {
                            const variant = product.product_type.find(v => v.description === item.type);
                            if (variant) {
                                variant.stock = (variant.stock || 0) + item.quantity;
                                variantFound = true;
                            }
                        }
                        if (!variantFound) {
                            product.stock = (product.stock || 0) + item.quantity;
                        }
                        await product.save();
                    }
                }
        }
        order.history_logs.push({ action: `Chủ hàng đã chuyển trạng thái thành ${status}`, created_at: new Date() });
        await order.save();
        res.status(200).json({ success: true, message: 'Đã cập nhật đơn hàng', data: order });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

/**
 * @desc    [CUSTOMER] Lấy lịch sử đơn hàng cá nhân
 */
exports.getMyOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await Order.find({ customer_id: userId })
            .populate('seller_id', 'shop_name full_name avatar')
            .populate('items.product_id', 'name main_image price')
            .sort({ created_at: -1 })
            .lean(); // Lấy data thuần để thêm trường user_review

        // Lấy tất cả đánh giá của user
        const userReviews = await ReviewProduct.find({ user_id: userId }).lean();

        // Gắn đánh giá vào từng item trong order
        const formattedOrders = orders.map(order => {
            const isCompleted = order.order_status === 'completed';

            order.items = order.items.map(item => {
                const review = userReviews.find(r => 
                    r.order_id.toString() === order._id.toString() && 
                    r.product_id.toString() === (item.product_id?._id || item.product_id).toString()
                );
                
                item.user_review = review || null;

                if (!isCompleted) {
                    item.review_status = 'NOT_ELIGIBLE'; // Chưa hoàn thành, không được đánh giá
                } else if (review) {
                    item.review_status = review.is_edited ? 'EDITED' : 'REVIEWED';
                } else {
                    item.review_status = 'PENDING_REVIEW';
                }
                return item;
            });
            return order;
        });

        res.status(200).json({ success: true, data: formattedOrders });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi lấy lịch sử đơn hàng', error: error.message });
    }
};

/**
 * @desc    [CUSTOMER] Xem chi tiết 1 đơn hàng
 */
exports.getOrderDetail = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;
        const order = await Order.findById(orderId)
            .populate('seller_id', 'shop_name full_name avatar phone')
            .populate('items.product_id', 'name main_image price')
            .lean(); // Lấy data thuần
        
        if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        if (order.customer_id.toString() !== userId) return res.status(403).json({ success: false, message: 'Không có quyền' });

        // Lấy các đánh giá của user cho đơn hàng này
        const userReviews = await ReviewProduct.find({ user_id: userId, order_id: orderId }).lean();
        const isCompleted = order.order_status === 'completed';

        // Gắn đánh giá vào từng item
        order.items = order.items.map(item => {
            const review = userReviews.find(r => r.product_id.toString() === (item.product_id?._id || item.product_id).toString());
            
            item.user_review = review || null;

            if (!isCompleted) {
                item.review_status = 'NOT_ELIGIBLE';
            } else if (review) {
                item.review_status = review.is_edited ? 'EDITED' : 'REVIEWED';
            } else {
                item.review_status = 'PENDING_REVIEW';
            }
            return item;
        });

        res.json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
};