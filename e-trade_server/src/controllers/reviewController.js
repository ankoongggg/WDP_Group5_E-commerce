const Order = require('../models/Order');
const ReviewProduct = require('../models/ReviewProduct');

const createProductReview = async (req, res) => {
    try {
        const userId = req.user.id;
        const { order_id, product_id, rating, comment, fileUploads } = req.body;

        // 1. Basic validation
        if (!order_id || !product_id || !rating) {
            return res.status(400).json({ success: false, message: 'Order ID, Product ID, and rating are required.' });
        }

        // 2. Check if the order exists, belongs to the user, and is completed
        const order = await Order.findOne({ _id: order_id, customer_id: userId });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found or you are not the owner of this order.' });
        }

        if (order.order_status !== 'completed') {
            return res.status(400).json({ success: false, message: 'You can only review products from completed orders.' });
        }

        // 3. Check if the product is in the order
        const productInOrder = order.items.some(item => item.product_id.toString() === product_id);
        if (!productInOrder) {
            return res.status(400).json({ success: false, message: 'This product is not part of the specified order.' });
        }

        // 4. Check if the user has already reviewed this product for this order
        const existingReview = await ReviewProduct.findOne({ user_id: userId, order_id, product_id });
        if (existingReview) {
            return res.status(400).json({ success: false, message: 'You have already reviewed this product for this order.' });
        }

        // 5. Create and save the new review
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

const getProductReviewByUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const { order_id, product_id } = req.query;

        if (!order_id || !product_id) {
            return res.status(400).json({ success: false, message: 'Order ID and Product ID are required.' });
        }

        const review = await ReviewProduct.findOne({ user_id: userId, order_id, product_id });

        if (!review) {
            // This is a valid state, not an error.
            return res.status(200).json({ success: true, data: null, message: 'No review found for this item in this order.' });
        }

        res.status(200).json({ success: true, data: review });

    } catch (error) {
        console.error("Error fetching product review:", error);
        res.status(500).json({ success: false, message: 'Failed to fetch review. Please try again later.' });
    }
};

module.exports = { createProductReview, getProductReviewByUser };