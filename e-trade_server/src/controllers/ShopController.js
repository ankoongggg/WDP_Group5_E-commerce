const Order = require('../models/Order');
const Product = require('../models/Product');
const Review = require('../models/ReviewProduct');
const User = require('../models/User');

// =====================================================
// PAYMENT METHODS
// =====================================================

// Lấy danh sách payment methods
const getPaymentMethods = async (req, res) => {
    try {
        const methods = [
            {
                id: 'credit_card',
                name: 'Credit Card',
                icon: 'credit_card',
                description: 'Visa, Mastercard, etc.',
                enabled: true
            },
            {
                id: 'debit_card',
                name: 'Debit Card',
                icon: 'credit_card',
                description: 'Bank Debit Card',
                enabled: true
            },
            {
                id: 'cod',
                name: 'Cash On Delivery (COD)',
                icon: 'local_shipping',
                description: 'Pay when you receive',
                enabled: true
            },
            {
                id: 'bank_transfer',
                name: 'Bank Transfer',
                icon: 'account_balance',
                description: 'Direct Bank Transfer',
                enabled: true
            },
            {
                id: 'e_wallet',
                name: 'E-Wallet',
                icon: 'digital_wallet',
                description: 'Momo, ZaloPay, etc.',
                enabled: true
            }
        ];
        
        res.json({ success: true, data: methods });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// =====================================================
// PLACE ORDER
// =====================================================

// Tạo đơn hàng từ cart
// Tạo đơn hàng từ cart (ĐÃ FIX: TỰ ĐỘNG TÁCH ĐƠN THEO SHOP)
const createOrder = async (req, res) => {
    try {
        console.log('[LOG] 1. Received createOrder request.');
        
        const { items, shippingAddress, shipping_address, shippingMethod, paymentMethod, shippingCost } = req.body;
        const customerId = req.user.id;

        // Validation
        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        const finalAddress = shipping_address || shippingAddress;
        if (!finalAddress) {
            return res.status(400).json({ success: false, message: 'Shipping address is required' });
        }

        // Fetch tất cả sản phẩm
        const productIds = items.map(item => item.productId || item.product_id);
        const products = await Product.find({ _id: { $in: productIds } });
        const productMap = new Map(products.map(p => [p._id.toString(), p]));

        const stockErrors = [];
        
        // BƯỚC 1: Gom nhóm sản phẩm theo Shop (seller_id)
        // Cấu trúc: { "shopId_1": { items: [], total_price: 0 }, "shopId_2": { ... } }
        const ordersByShop = {};

        // --- VÒNG LẶP KIỂM TRA VÀ GOM NHÓM ---
        for (const item of items) {
            const pId = item.productId || item.product_id;
            const product = productMap.get(pId);
            
            if (!product) {
                return res.status(404).json({ success: false, message: `Sản phẩm không tồn tại.` });
            }

            const isActive = Array.isArray(product.status) ? product.status.includes('active') : product.status === 'active';
            if (!isActive) {
                stockErrors.push(`Sản phẩm "${product.name}" không còn được bán.`);
                continue; 
            }

            // Check stock
            let availableStock = product.product_type && product.product_type.length > 0 
                ? product.product_type.reduce((acc, curr) => acc + (curr.stock || 0), 0)
                : (product.stock || 0);

            if (availableStock < item.quantity) {
                stockErrors.push(`"${product.name}" không đủ hàng (còn ${availableStock})`);
                continue;
            }

            // Nếu qua ải kiểm tra, tiến hành đưa vào nhóm của Shop đó
            const sellerIdStr = product.store_id.toString();
            if (!ordersByShop[sellerIdStr]) {
                ordersByShop[sellerIdStr] = {
                    seller_id: product.store_id,
                    items: [],
                    total_price: 0
                };
            }

            const itemPrice = product.price * item.quantity;
            ordersByShop[sellerIdStr].total_price += itemPrice;
            ordersByShop[sellerIdStr].items.push({
                product_id: product._id,
                name_snapshot: product.name,
                price_snapshot: product.price,
                quantity: item.quantity,
                image_snapshot: product.main_image,
                type: item.type || 'default'
            });

            // CẬP NHẬT TỒN KHO DB TRONG BỘ NHỚ TRƯỚC (Sẽ save ở vòng sau)
            let quantityToDecrement = item.quantity;
            if (product.product_type && product.product_type.length > 0) {
                for (const type of product.product_type) {
                    if (quantityToDecrement === 0) break;
                    const stockToTake = Math.min(quantityToDecrement, type.stock || 0);
                    type.stock -= stockToTake;
                    quantityToDecrement -= stockToTake;
                }
            } else {
                product.stock = (product.stock || 0) - quantityToDecrement;
            }
            product.markModified('product_type');
        }

        if (stockErrors.length > 0) {
            return res.status(400).json({ success: false, message: stockErrors.join('\n') });
        }

        // BƯỚC 2: Lưu các sản phẩm đã bị trừ kho xuống DB
        const savePromises = Array.from(productMap.values()).map(p => p.save());
        await Promise.all(savePromises);

        // BƯỚC 3: TẠO CÁC ĐƠN HÀNG RIÊNG BIỆT CHO TỪNG SHOP
        const shopKeys = Object.keys(ordersByShop);
        const numberOfShops = shopKeys.length;
        
        // Chia tiền ship (hoặc tính full cho mỗi đơn tùy policy của anh, ở đây em chia đều)
        const totalShippingCost = shippingCost || 0;
        const shippingPerOrder = Math.round(totalShippingCost / numberOfShops);

        const orderCreationPromises = shopKeys.map(sellerStr => {
            const shopOrderData = ordersByShop[sellerStr];
            return Order.create({
                customer_id: customerId,
                seller_id: shopOrderData.seller_id,
                items: shopOrderData.items,
                total_price: shopOrderData.total_price,
                shipping_fee: shippingPerOrder,
                total_amount: shopOrderData.total_price + shippingPerOrder,
                shipping_address: finalAddress,
                payment_method: paymentMethod,
                payment_status: 'pending',
                order_status: 'pending',
                history_logs: [{ action: 'Order created', created_at: new Date() }]
            });
        });

        // Chạy song song việc tạo các đơn hàng
        const createdOrders = await Promise.all(orderCreationPromises);
        console.log(`[LOG] Successfully created ${createdOrders.length} split orders.`);

        // Lấy ID của đơn đầu tiên để Frontend vẫn không bị lỗi (nếu frontend chỉ chờ 1 ID)
        // Hoặc tốt nhất là trả về mảng. Ở đây em trả về ID đầu tiên để tương thích code cũ
        res.status(201).json({
            success: true,
            message: `Tạo thành công ${createdOrders.length} đơn hàng`,
            data: {
                orderId: createdOrders[0]._id, // Vẫn trả về để Frontend Navigate
                orderIds: createdOrders.map(o => o._id), // Trả thêm mảng ID
                totalAmount: createdOrders.reduce((sum, o) => sum + o.total_amount, 0),
                paymentMethod: paymentMethod,
                isSplit: createdOrders.length > 1
            }
        });

    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// =====================================================
// PAYMENT REQUEST
// =====================================================

// Gửi payment request (xử lý thanh toán)
const submitPayment = async (req, res) => {
    try {
        const { orderId, paymentMethod, cardDetails } = req.body;
        const customerId = req.user.id;

        // Validate order exists
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Verify order belongs to user
        if (order.customer_id.toString() !== customerId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        // Nếu đã thanh toán rồi
        if (order.payment_status === 'completed') {
            return res.status(400).json({ 
                success: false, 
                message: 'Order already paid' 
            });
        }

        // Xử lý thanh toán dựa trên payment method
        let paymentResult = processPayment(paymentMethod, cardDetails, order.total_amount);

        if (!paymentResult.success) {
            return res.status(400).json({ 
                success: false, 
                message: paymentResult.message 
            });
        }

        // Cập nhật order status
        order.payment_status = 'completed';
        order.order_status = 'confirmed';
        order.history_logs.push({
            action: `Payment received via ${paymentMethod}`,
            created_at: new Date()
        });
        
        await order.save();

        res.json({
            success: true,
            message: 'Payment successful',
            data: {
                orderId: order._id,
                paymentStatus: order.payment_status,
                orderStatus: order.order_status,
                totalAmount: order.total_amount,
                transactionId: paymentResult.transactionId
            }
        });

    } catch (error) {
        console.error('Payment error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

// Mock payment processing
const processPayment = (method, cardDetails, amount) => {
    // COD không cần xử lý thanh toán ngay
    if (method === 'cod') {
        return {
            success: true,
            transactionId: `COD-${Date.now()}`
        };
    }

    // Card payments
    if ((method === 'credit_card' || method === 'debit_card') && cardDetails) {
        const { cardNumber, cvv } = cardDetails;

        // Validate card (basic)
        if (!cardNumber || cardNumber.length < 13 || !cvv || cvv.length !== 3) {
            return {
                success: false,
                message: 'Invalid card details'
            };
        }

        // Mock: 70% success rate
        const isSuccess = Math.random() < 0.7;
        
        if (!isSuccess) {
            return {
                success: false,
                message: 'Card declined. Please try another card.'
            };
        }

        return {
            success: true,
            transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        };
    }

    // Bank transfer
    if (method === 'bank_transfer') {
        return {
            success: true,
            transactionId: `BANK-${Date.now()}`
        };
    }

    // E-wallet
    if (method === 'e_wallet') {
        return {
            success: true,
            transactionId: `WALLET-${Date.now()}`
        };
    }

    return {
        success: false,
        message: 'Invalid payment method'
    };
};

// =====================================================
// GET ORDERS
// =====================================================

// Lấy danh sách orders của user
const getMyOrders = async (req, res) => {
    try {
        const customerId = req.user.id;
        const orders = await Order.find({ customer_id: customerId })
            .populate('items.product_id')
            .populate('seller_id', 'shop_name avatar')
            .sort({ created_at: -1 })
            .lean(); // Dùng .lean() để trả về plain object dễ thao tác

        // Lấy tất cả Order IDs để query Review
        const orderIds = orders.map(o => o._id);
        
        // Tìm tất cả review của user này cho các đơn hàng trên
        const userReviews = await Review.find({ 
            order_id: { $in: orderIds }, 
            user_id: customerId 
        }).lean();

        // Tạo Map để tra cứu nhanh: Key là `${orderId}-${productId}`, Value là review object
        const reviewsMap = new Map();
        userReviews.forEach(review => {
            reviewsMap.set(`${review.order_id.toString()}-${review.product_id.toString()}`, review);
        });

        // Gắn review vào từng item của order
        const enrichedOrders = orders.map(order => {
            order.items = order.items.map(item => {
                if (!item.product_id) return item;
                const reviewKey = `${order._id.toString()}-${item.product_id._id.toString()}`;
                const review = reviewsMap.get(reviewKey);
                return {
                    ...item,
                    user_review: review || null
                };
            });
            return order;
        });

        res.json({ success: true, data: enrichedOrders });
    } catch (error) {
        console.error('Get my orders error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy chi tiết một order (ĐÃ ĐƯỢC KHÔI PHỤC)
const getOrderDetail = async (req, res) => {
    try {
        const { orderId } = req.params;
        const customerId = req.user.id;

        const order = await Order.findById(orderId)
            .populate('items.product_id', '_id') // Chỉ cần _id để tạo link
            .populate('customer_id', 'full_name email phone')
            .populate('seller_id', 'shop_name avatar');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Xác thực quyền sở hữu
        if (order.customer_id._id.toString() !== customerId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        // Lấy các đánh giá của người dùng cho đơn hàng này
        const userReviews = await Review.find({ order_id: orderId, user_id: customerId }).lean();
        const reviewsMap = new Map(userReviews.map(review => [review.product_id.toString(), review]));

        // Chuyển đổi sang object thuần để chỉnh sửa
        const orderData = order.toObject();

        // Gắn thông tin đánh giá vào từng sản phẩm trong đơn hàng
        orderData.items = orderData.items.map(item => {
            if (!item.product_id) return item; // Bỏ qua nếu sản phẩm đã bị xóa
            
            const review = reviewsMap.get(item.product_id._id.toString());
            return {
                ...item,
                user_review: review || null // Gắn đánh giá nếu có, ngược lại là null
            };
        });

        res.json({ success: true, data: orderData });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    getPaymentMethods,
    createOrder,
    submitPayment,
    getMyOrders,
    getOrderDetail // Đã thêm lại vào module.exports
};