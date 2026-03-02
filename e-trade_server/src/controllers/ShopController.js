const Order = require('../models/Order');
const Product = require('../models/Product');
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
const createOrder = async (req, res) => {
    try {
        console.log('[LOG] 1. Received createOrder request.');
        const { items, shippingAddress, shippingMethod, paymentMethod, shippingCost } = req.body;
        const customerId = req.user.id;

        // Validation
        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Cart is empty' });
        }

        if (!shippingAddress) {
            return res.status(400).json({ success: false, message: 'Shipping address is required' });
        }

        // Kiểm tra stock + tính giá từ hàng thật trong DB
        let totalPrice = 0;
        let orderItems = [];
        let sellerId = null;
        const stockErrors = []; // Mảng chứa các lỗi về tồn kho

        // OPTIMIZATION: Fetch tất cả sản phẩm 1 lần thay vì loop query (N+1 problem fix)
        const productIds = items.map(item => item.productId);
        console.log(`[LOG] 2. Fetching products from DB for IDs: ${productIds.join(', ')}`);
        const products = await Product.find({ _id: { $in: productIds } });
        console.log(`[LOG] 3. Found ${products.length} products in DB.`);
        // Tạo Map để tra cứu nhanh O(1)
        const productMap = new Map(products.map(p => [p._id.toString(), p]));

        // --- VÒNG LẶP KIỂM TRA (VALIDATION) ---
        // Kiểm tra tất cả sản phẩm trước khi thực hiện bất kỳ thay đổi nào
        for (const item of items) {
            console.log(`[LOG] 4. Processing item: ${item.productId}, quantity: ${item.quantity}`);
            const product = productMap.get(item.productId);
            
            if (!product) {
                // Lỗi nghiêm trọng, có thể dừng ngay lập tức
                return res.status(404).json({ success: false, message: `Sản phẩm với ID ${item.productId} không tồn tại.` });
            }

            if (product.status !== 'active') {
                stockErrors.push(`Sản phẩm "${product.name}" không còn được bán.`);
                continue; // Bỏ qua kiểm tra stock cho sản phẩm này và tiếp tục với sản phẩm khác
            }

            let availableStock = 0;
            if (product.product_type && product.product_type.length > 0) {
                availableStock = product.product_type.reduce((acc, curr) => acc + (curr.stock || 0), 0);
            } else {
                availableStock = product.stock || 0;
            }

            if (availableStock < item.quantity) {
                stockErrors.push(`"${product.name}" không đủ hàng (còn ${availableStock}, cần ${item.quantity})`);
            }
        }

        // --- KIỂM TRA KẾT QUẢ VALIDATION ---
        if (stockErrors.length > 0) {
            const errorMessage = "Một hoặc nhiều sản phẩm không đủ hàng:\n- " + stockErrors.join('\n- ');
            return res.status(400).json({ 
                success: false, 
                message: errorMessage
            });
        }

        // --- VÒNG LẶP THỰC THI (EXECUTION) ---
        // Chỉ chạy nếu tất cả sản phẩm đều hợp lệ
        for (const item of items) {
            const product = productMap.get(item.productId);
            
            const itemPrice = product.price * item.quantity;
            totalPrice += itemPrice;

            orderItems.push({
                product_id: product._id,
                name_snapshot: product.name,
                price_snapshot: product.price,
                quantity: item.quantity,
                image_snapshot: product.main_image,
                type: item.type || 'default'
            });

            if (!sellerId) {
                sellerId = product.store_id;
            }

            // Cập nhật tồn kho
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
            
            // Đánh dấu là đã thay đổi để Mongoose biết cần save
            product.markModified('product_type'); 
            console.log(`[LOG] 5. Attempting to save product ${product._id}...`);
            await product.save();
            console.log(`[LOG] 6. Product ${product._id} saved successfully.`);
        }


        // Tạo order
        console.log('[LOG] 7. All items processed. Attempting to create order...');
        const order = await Order.create({
            customer_id: customerId,
            seller_id: sellerId,
            items: orderItems,
            total_price: totalPrice,
            shipping_fee: shippingCost || 0, // Sử dụng shippingCost từ request, fallback về 0
            total_amount: totalPrice + (shippingCost || 0),
            shipping_address: shippingAddress,
            payment_method: paymentMethod,
            payment_status: 'pending',
            order_status: 'pending',
            history_logs: [
                {
                    action: 'Order created',
                    created_at: new Date()
                }
            ]
        });

        console.log(`[LOG] 8. Order ${order._id} created. Sending response to client.`);
        res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: {
                orderId: order._id,
                totalAmount: order.total_amount,
                paymentMethod: paymentMethod,
                orderStatus: order.order_status
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
            .sort({ created_at: -1 });

        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Lấy chi tiết một order
const getOrderDetail = async (req, res) => {
    try {
        const { orderId } = req.params;
        const customerId = req.user.id;

        const order = await Order.findById(orderId)
            .populate('items.product_id')
            .populate('customer_id', 'full_name email phone')
            .populate('seller_id', 'shop_name avatar');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Verify ownership
        if (order.customer_id._id.toString() !== customerId) {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        res.json({ success: true, data: order });
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