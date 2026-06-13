const express = require('express');
const router = express.Router();
const { createReview, getProductReviews, getEligibleReview, getAllReviews, updateReview, deleteReview, toggleApproval } = require('../controllers/review');
const { isAuthenticatedUser, isAdmin } = require('../middlewares/auth');

router.get('/reviews/product/:product_id', getProductReviews);
router.get('/reviews/eligible/:product_id', isAuthenticatedUser, getEligibleReview);
router.post('/reviews', isAuthenticatedUser, createReview);
router.put('/reviews/:id', isAuthenticatedUser, updateReview);
router.delete('/reviews/:id', isAdmin, deleteReview);
router.put('/reviews/:id/approve', isAdmin, toggleApproval);
router.get('/reviews', isAdmin, getAllReviews);

module.exports = router;
