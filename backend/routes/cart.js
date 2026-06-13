const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controllers/cart');
const { isAuthenticatedUser } = require('../middlewares/auth');

router.get('/cart', isAuthenticatedUser, getCart);
router.post('/cart', isAuthenticatedUser, addToCart);
router.put('/cart/:id', isAuthenticatedUser, updateCartItem);
router.delete('/cart/:id', isAuthenticatedUser, removeFromCart);
router.delete('/cart', isAuthenticatedUser, clearCart);

module.exports = router;
