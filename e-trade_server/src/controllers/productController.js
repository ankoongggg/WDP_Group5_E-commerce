const Product = require('../models/Product');
const Review = require('../models/ReviewProduct');

// Controller: Get product details
exports.getProductDetails = async (req, res) => {
    try {
        const productId = req.params.id;

        // Fetch product details
        const product = await Product.findById(productId)
            .select("_id store_id category_id name description main_image display_files price original_price product_type condition status rejection_reason")
            .populate('store_id', 'shop_name description')
            .populate('category_id', 'name description');

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Fetch reviews for the product
        const reviews = await Review.find({ product_id: productId })
            .select("_id user_id rating fileUploads comment created_at")
            .populate('user_id', 'name');

        // Compute average rating
        const averageRating = reviews.length
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)
            : 0;

        res.status(200).json({
            product,
            totalReviews: reviews.length,
            averageRating
        });
    } catch (error) {
        console.error('Error fetching product details:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Controller: Get all reviews for a product with pagination
exports.getProductReviews = async (req, res) => {
    try {
        const productId = req.params.id;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;

        // Optional: Check if product exists
        const productExists = await Product.findById(productId).select('_id');
        if (!productExists) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Fetch reviews with pagination
        const reviews = await Review.find({ product_id: productId })
            .populate('user_id', 'account_name avatar') // Populate user's name and avatar
            .sort({ created_at: -1 }) // Sort by newest first
            .skip(skip)
            .limit(limit);

        // Get total number of reviews for pagination
        const totalReviews = await Review.countDocuments({ product_id: productId });

        res.status(200).json({
            reviews,
            currentPage: page,
            totalPages: Math.ceil(totalReviews / limit),
            totalReviews,
        });
    } catch (error) {
        console.error('Error fetching product reviews:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};