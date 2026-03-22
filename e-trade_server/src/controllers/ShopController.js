const Order = require('../models/Order');
const Product = require('../models/Product');
const Review = require('../models/ReviewProduct');
const User = require('../models/User');

// =====================================================
// PAYMENT METHODS
// =====================================================

const getPaymentMethods = async (req, res) => {
    try {
        const methods = [
            { id: 'credit_card', name: 'Credit Card', icon: 'credit_card', description: 'Visa, Mastercard, etc.', enabled: true },
            { id: 'debit_card', name: 'Debit Card', icon: 'credit_card', description: 'Bank Debit Card', enabled: true },
            { id: 'cod', name: 'Cash On Delivery (COD)', icon: 'local_shipping', description: 'Pay when you receive', enabled: true },
            { id: 'bank_transfer', name: 'Bank Transfer', icon: 'account_balance', description: 'Direct Bank Transfer', enabled: true },
            { id: 'e_wallet', name: 'E-Wallet', icon: 'digital_wallet', description: 'Momo, ZaloPay, etc.', enabled: true }
        ];
        res.json({ success: true, data: methods });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// =====================================================
// PLACE ORDER
// =====================================================

const createOrder = async (req, res) => {
    try {
        console.log('[LOG] 1. Received createOrder request.');
        
        const { items, shippingAddress, shipping_address, shippingMethod, paymentMethod, shippingCost } = req.body;
        const customerId = req.user.id;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        const finalAddress = shipping_address || shippingAddress;
        if (!finalAddress) {
            return res.status(400).json({ success: false, message: 'Shipping address is required' });
        }

        const productIds = items.map(item => item.productId || item.product_id);
        const products = await Product.find({ _id: { $in: productIds } });
        const productMap = new Map(products.map(p => [p._id.toString(), p]));

        const stockErrors = [];
        const ordersByShop = {};

        for (const item of items) {
            const pId = item.productId || item.product_id;
            const product = productMap.get(pId);
            const itemType = item.type || item.variant || 'default'; // Lấy an toàn cả type hoặc variant
            
            if (!product) {
                return res.status(404).json({ success: false, message: `Sản phẩm không tồn tại.` });
            }

            const isActive = Array.isArray(product.status) ? product.status.includes('active') : product.status === 'active';
            if (!isActive) {
                stockErrors.push(`Sản phẩm "${product.name}" không còn được bán.`);
                continue; 
            }

            let availableStock = 0;
            let targetVariant = null;

            if (product.product_type && product.product_type.length > 0 && itemType !== 'default') {
                const cleanItemType = String(itemType).trim().toLowerCase();
                
                targetVariant = product.product_type.find(t => 
                    t && t.description && String(t.description).trim().toLowerCase() === cleanItemType
                );

                if (!targetVariant) {
                    stockErrors.push(`Không khớp phân loại "${itemType}" của sản phẩm "${product.name}".`);
                    continue; 
                }
                availableStock = targetVariant.stock || 0;
            } else if (product.product_type && product.product_type.length > 0 && itemType === 'default') {
                stockErrors.push(`Vui lòng chọn phân loại cho sản phẩm "${product.name}".`);
                continue;
            } else {
                availableStock = product.stock || 0;
            }

            if (availableStock < item.quantity) {
                stockErrors.push(`"${product.name}" ${itemType !== 'default' ? `(Loại: ${itemType})` : ''} không đủ hàng (còn ${availableStock}, cần ${item.quantity})`);
                continue;
            }

            let actualSellerId = null;
            let actualSellerType = 'Store';

            if (product.store_id) {
                actualSellerId = product.store_id;
                actualSellerType = 'Store';
            } else if (product.user_id) {
                actualSellerId = product.user_id;
                actualSellerType = 'User'; 
            } else {
                stockErrors.push(`Sản phẩm "${product.name}" bị lỗi: Không xác định được người bán.`);
                continue;
            }

            const groupKey = `${actualSellerType}_${actualSellerId.toString()}`;
            
            if (!ordersByShop[groupKey]) {
                ordersByShop[groupKey] = {
                    seller_id: actualSellerId,
                    seller_type: actualSellerType,
                    items: [],
                    total_price: 0
                };
            }

            let unitPrice = product.price;
            if (targetVariant && targetVariant.price_difference) {
                unitPrice += targetVariant.price_difference;
            }
            const itemPrice = unitPrice * item.quantity;
            
            ordersByShop[groupKey].total_price += itemPrice;
            ordersByShop[groupKey].items.push({
                product_id: product._id,
                name_snapshot: product.name,
                price_snapshot: unitPrice, 
                quantity: item.quantity,
                image_snapshot: product.main_image,
                type: itemType
            });

            if (targetVariant) {
                targetVariant.stock = (targetVariant.stock || 0) - item.quantity;
            } else {
                product.stock = (product.stock || 0) - item.quantity;
            }
            product.markModified('product_type');
        }

        if (stockErrors.length > 0) {
            return res.status(400).json({ success: false, message: "Một hoặc nhiều sản phẩm bị lỗi:\n- " + stockErrors.join('\n- ') });
        }

        const savePromises = Array.from(productMap.values()).map(p => p.save());
        await Promise.all(savePromises);

        const shopKeys = Object.keys(ordersByShop);
        const numberOfShops = shopKeys.length;
        const totalShippingCost = shippingCost || 0;
        const shippingPerOrder = Math.round(totalShippingCost / numberOfShops);

        // =================================================================
        // LOGIC "TIỀN TRAO CHÁO MÚC": THANH TOÁN ONLINE THÌ AUTO XÁC NHẬN
        // =================================================================
        const isOnlinePayment = paymentMethod !== 'cod';
        // Nếu trả online thì cho 'confirmed' luôn, còn 'cod' thì 'pending' (Chờ xác nhận)
        const initialOrderStatus = isOnlinePayment ? 'confirmed' : 'pending';
        const initialPaymentStatus = isOnlinePayment ? 'completed' : 'pending';
        const logMessage = isOnlinePayment 
            ? `Order created and auto-confirmed via ${paymentMethod}` 
            : `Order created (COD) - Waiting for seller confirmation`;

        const orderCreationPromises = shopKeys.map(groupKey => {
            const shopOrderData = ordersByShop[groupKey];
            return Order.create({
                customer_id: customerId,
                seller_id: shopOrderData.seller_id,
                seller_type: shopOrderData.seller_type,
                items: shopOrderData.items,
                total_price: shopOrderData.total_price,
                shipping_fee: shippingPerOrder,
                total_amount: shopOrderData.total_price + shippingPerOrder,
                shipping_address: finalAddress,
                payment_method: paymentMethod,
                payment_status: initialPaymentStatus, // Set theo logic ở trên
                order_status: initialOrderStatus,     // Set theo logic ở trên
                history_logs: [{ action: logMessage, created_at: new Date() }]
            });
        });

        const createdOrders = await Promise.all(orderCreationPromises);
        console.log(`[LOG] Successfully created ${createdOrders.length} split orders with status ${initialOrderStatus}.`);

        res.status(201).json({
            success: true,
            message: `Tạo thành công ${createdOrders.length} đơn hàng`,
            data: {
                orderId: createdOrders[0]._id, 
                orderIds: createdOrders.map(o => o._id), 
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

const submitPayment = async (req, res) => {
    try {
        const { orderId, paymentMethod, cardDetails } = req.body;
        const customerId = req.user.id;

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        if (order.customer_id.toString() !== customerId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        if (order.payment_status === 'completed') {
            return res.status(400).json({ success: false, message: 'Order already paid' });
        }

        let paymentResult = processPayment(paymentMethod, cardDetails, order.total_amount);

        if (!paymentResult.success) {
            return res.status(400).json({ success: false, message: paymentResult.message });
        }

        order.payment_status = 'completed';
        // 👉 CHỖ NÀY CŨNG CHO AUTO XÁC NHẬN LUÔN NẾU THANH TOÁN THÀNH CÔNG BẰNG CHỨC NĂNG BỔ SUNG
        order.order_status = 'confirmed'; 
        order.history_logs.push({
            action: `Payment received via ${paymentMethod} - Order auto-confirmed`,
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

const processPayment = (method, cardDetails, amount) => {
    if (method === 'cod') return { success: true, transactionId: `COD-${Date.now()}` };
    if ((method === 'credit_card' || method === 'debit_card') && cardDetails) {
        const { cardNumber, cvv } = cardDetails;
        if (!cardNumber || cardNumber.length < 13 || !cvv || cvv.length !== 3) {
            return { success: false, message: 'Invalid card details' };
        }
        const isSuccess = Math.random() < 0.7; // Tỷ lệ thành công 70% mô phỏng
        if (!isSuccess) return { success: false, message: 'Card declined. Please try another card.' };
        return { success: true, transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
    }
    if (method === 'bank_transfer') return { success: true, transactionId: `BANK-${Date.now()}` };
    if (method === 'e_wallet') return { success: true, transactionId: `WALLET-${Date.now()}` };
    return { success: false, message: 'Invalid payment method' };
};

// =====================================================
// GET ORDERS
// =====================================================

const getMyOrders = async (req, res) => {
    try {
        const customerId = req.user.id;
        const orders = await Order.find({ customer_id: customerId })
            .populate('items.product_id')
            .populate('seller_id', 'shop_name avatar')
            .sort({ created_at: -1 })
            .lean();

        const orderIds = orders.map(o => o._id);
        const userReviews = await Review.find({ order_id: { $in: orderIds }, user_id: customerId }).lean();

        const reviewsMap = new Map();
        userReviews.forEach(review => {
            reviewsMap.set(`${review.order_id.toString()}-${review.product_id.toString()}`, review);
        });

        const enrichedOrders = orders.map(order => {
            order.items = order.items.map(item => {
                if (!item.product_id) return item;
                const reviewKey = `${order._id.toString()}-${item.product_id._id.toString()}`;
                const review = reviewsMap.get(reviewKey);
                return { ...item, user_review: review || null };
            });
            return order;
        });

        res.json({ success: true, data: enrichedOrders });
    } catch (error) {
        console.error('Get my orders error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getOrderDetail = async (req, res) => {
    try {
        const { orderId } = req.params;
        const customerId = req.user.id;

        const order = await Order.findById(orderId)
            .populate('items.product_id', '_id') 
            .populate('customer_id', 'full_name email phone')
            .populate({ path: 'seller_id', select: 'shop_name avatar full_name' });

        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
        if (order.customer_id._id.toString() !== customerId) return res.status(403).json({ success: false, message: 'Unauthorized' });

        const userReviews = await Review.find({ order_id: orderId, user_id: customerId }).lean();
        const reviewsMap = new Map(userReviews.map(review => [review.product_id.toString(), review]));

        const orderData = order.toObject();

        orderData.items = orderData.items.map(item => {
            if (!item.product_id) return item; 
            const review = reviewsMap.get(item.product_id._id.toString());
            return { ...item, user_review: review || null };
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
    getOrderDetail 
};