const db = require('../models');
const Review = db.Review;
const User = db.User;
const Order = db.Order;
const OrderItem = db.OrderItem;
const { filterProfanity } = require('../utils/filterProfanity');

const validateDeliveredOrder = async (userId, productId, orderId) => {
    const order = await Order.findOne({
        where: { id: orderId, user_id: userId, status: 'Delivered' },
        include: [{ model: OrderItem, where: { product_id: productId }, required: true }]
    });
    return order;
};

exports.createReview = async (req, res) => {
    try {
        const userId = req.body.user.id;
        const { product_id, order_id, rating, review_text } = req.body;
        if (!product_id || !order_id || !rating) return res.status(400).json({ error: 'Missing required fields' });
        if (rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1-5' });

        const order = await validateDeliveredOrder(userId, product_id, order_id);
        if (!order) return res.status(403).json({ error: 'You can only review products from delivered orders' });

        const existing = await Review.findOne({ where: { user_id: userId, product_id, order_id } });
        if (existing) return res.status(409).json({ error: 'You already reviewed this order for this product' });

        const cleanText = filterProfanity(review_text);
        const review = await Review.create({ product_id, user_id: userId, order_id, rating, review_text: cleanText });
        return res.status(201).json({ success: true, review });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error creating review' });
    }
};

exports.getProductReviews = async (req, res) => {
    try {
        const reviews = await Review.findAll({
            where: { product_id: req.params.product_id, is_approved: 1 },
            include: [{ model: User, attributes: ['name'] }],
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json({ rows: reviews });
    } catch (err) {
        return res.status(500).json({ error: 'Error fetching reviews' });
    }
};

exports.getEligibleReview = async (req, res) => {
    try {
        const userId = req.body.user.id;
        const productId = req.params.product_id;

        const orders = await Order.findAll({
            where: { user_id: userId, status: 'Delivered' },
            include: [{ model: OrderItem, where: { product_id: productId }, required: true }],
            order: [['createdAt', 'DESC']]
        });

        const reviews = await Review.findAll({
            where: { user_id: userId, product_id: productId },
            order: [['createdAt', 'DESC']]
        });

        const reviewedOrderIds = reviews.map((r) => r.order_id);
        const eligibleOrders = orders.filter((o) => !reviewedOrderIds.includes(o.id));

        return res.status(200).json({
            canReview: eligibleOrders.length > 0,
            eligibleOrders: eligibleOrders.map((o) => ({ id: o.id, date: o.createdAt })),
            myReviews: reviews
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error checking review eligibility' });
    }
};

exports.getAllReviews = async (req, res) => {
    try {
        const reviews = await Review.findAll({
            include: [{ model: User, attributes: ['name'] }, { model: db.Product, attributes: ['name'] }],
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json({ rows: reviews });
    } catch (err) {
        return res.status(500).json({ error: 'Error fetching reviews' });
    }
};

exports.updateReview = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.body.user.id;
        const { rating, review_text } = req.body;

        const review = await Review.findOne({ where: { id, user_id: userId } });
        if (!review) return res.status(404).json({ error: 'Review not found' });

        const order = await validateDeliveredOrder(userId, review.product_id, review.order_id);
        if (!order) return res.status(403).json({ error: 'You can only edit reviews for delivered orders' });

        const cleanText = review_text !== undefined ? filterProfanity(review_text) : review.review_text;
        await review.update({ rating: rating || review.rating, review_text: cleanText });
        return res.status(200).json({ success: true, review });
    } catch (err) {
        return res.status(500).json({ error: 'Error updating review' });
    }
};

exports.deleteReview = async (req, res) => {
    try {
        await Review.destroy({ where: { id: req.params.id } });
        return res.status(200).json({ success: true, message: 'Review deleted' });
    } catch (err) {
        return res.status(500).json({ error: 'Error deleting review' });
    }
};

exports.toggleApproval = async (req, res) => {
    try {
        const review = await Review.findByPk(req.params.id);
        if (!review) return res.status(404).json({ error: 'Review not found' });
        await review.update({ is_approved: review.is_approved ? 0 : 1 });
        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: 'Error updating review' });
    }
};
