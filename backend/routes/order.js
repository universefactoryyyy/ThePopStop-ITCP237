const express = require('express');
const router = express.Router();
const { createOrder, getUserOrders, getAllOrders, updateOrderStatus, getOrderReceipt } = require('../controllers/order');
const { isAuthenticatedUser, isAdmin, optionalAuth } = require('../middlewares/auth');

router.post('/orders', isAuthenticatedUser, createOrder);
router.get('/orders/my', isAuthenticatedUser, getUserOrders);
router.get('/orders/:id/receipt', optionalAuth, getOrderReceipt);
router.get('/orders', isAdmin, getAllOrders);
router.put('/orders/:id/status', isAdmin, updateOrderStatus);

module.exports = router;
