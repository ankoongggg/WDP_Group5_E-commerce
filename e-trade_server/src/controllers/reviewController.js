const Order = require('../models/Order');
const ReviewProduct = require('../models/ReviewProduct');

const createProductReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { order_id, product_id, rating, comment, fileUploads } = req.body;

        if (!order_id || !product_id || !rating) {
            return res.status(400).json({ success: false, message: 'Order ID, Product ID, and rating are required.' });
        }

        const order = await Order.findOne({ _id: order_id, customer_id: userId });
        if (!order) return res.status(404).json({ success: false, message: 'Order not found or you are not the owner of this order.' });
        if (order.order_status !== 'completed') return res.status(400).json({ success: false, message: 'You can only review products from completed orders.' });

        const productInOrder = order.items.some(item => item.product_id.toString() === product_id);
        if (!productInOrder) return res.status(400).json({ success: false, message: 'This product is not part of the specified order.' });

        const existingReview = await ReviewProduct.findOne({ user_id: userId, order_id, product_id });
        if (existingReview) return res.status(400).json({ success: false, message: 'You have already reviewed this product for this order.' });

        const newReview = new ReviewProduct({
            product_id,
            user_id: userId,
            order_id,
            rating,
            comment,
            fileUploads: fileUploads || []
        });

        await newReview.save();
        res.status(201).json({ success: true, message: 'Thank you for your review!', data: newReview });
    } catch (error) {
        console.error("Error creating product review:", error);
        res.status(500).json({ success: false, message: 'Failed to submit review. Please try again later.' });
    }
};

// ĐÃ THÊM: Logic sửa đánh giá
const updateProductReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { order_id, product_id, rating, comment, fileUploads } = req.body;

        if (!order_id || !product_id || !rating) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc.' });
        }

        const review = await ReviewProduct.findOne({ user_id: userId, order_id, product_id });
        if (!review) return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá.' });

        // Logic "Chỉ được sửa 1 lần"
        if (review.is_edited) {
            return res.status(400).json({ success: false, message: 'Bạn chỉ được phép sửa đánh giá 1 lần duy nhất.' });
        }

        review.rating = rating;
        review.comment = comment;
        if (fileUploads) review.fileUploads = fileUploads;
        
        review.is_edited = true; // Khóa lại, không cho sửa lần 2
        review.updated_at = Date.now();

        await review.save();
        res.status(200).json({ success: true, message: 'Cập nhật đánh giá thành công!', data: review });
    } catch (error) {
        console.error("Error updating review:", error);
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật đánh giá.' });
    }
};

const getProductReviewByUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const { order_id, product_id } = req.query;

        if (!order_id || !product_id) return res.status(400).json({ success: false, message: 'Order ID and Product ID are required.' });

        const review = await ReviewProduct.findOne({ user_id: userId, order_id, product_id });
        if (!review) return res.status(200).json({ success: true, data: null, message: 'No review found.' });

        res.status(200).json({ success: true, data: review });
    } catch (error) {
        console.error("Error fetching product review:", error);
        res.status(500).json({ success: false, message: 'Failed to fetch review.' });
    }
};

module.exports = { createProductReview, updateProductReview, getProductReviewByUser };