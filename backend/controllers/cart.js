const db = require('../models');
const Cart = db.Cart;
const Product = db.Product;

exports.getCart = async (req, res) => {
    try {
        const userId = req.body.user.id;
        const items = await Cart.findAll({ where: { user_id: userId }, include: [{ model: Product }] });
        return res.status(200).json({ rows: items });
    } catch (err) {
        return res.status(500).json({ error: 'Error fetching cart' });
    }
};

exports.addToCart = async (req, res) => {
    try {
        const userId = req.body.user.id;
        const { product_id, quantity } = req.body;

        const [cartItem, created] = await Cart.findOrCreate({
            where: { user_id: userId, product_id },
            defaults: { quantity: quantity || 1 }
        });
        if (!created) await cartItem.update({ quantity: cartItem.quantity + (quantity || 1) });

        return res.status(200).json({ success: true, message: 'Added to cart', cartItem });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error adding to cart' });
    }
};

exports.updateCartItem = async (req, res) => {
    try {
        const userId = req.body.user.id;
        const { id } = req.params;
        const { quantity } = req.body;
        if (quantity < 1) return res.status(400).json({ error: 'Quantity must be at least 1' });
        await Cart.update({ quantity }, { where: { id, user_id: userId } });
        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: 'Error updating cart' });
    }
};

exports.removeFromCart = async (req, res) => {
    try {
        const userId = req.body.user.id;
        await Cart.destroy({ where: { id: req.params.id, user_id: userId } });
        return res.status(200).json({ success: true, message: 'Removed from cart' });
    } catch (err) {
        return res.status(500).json({ error: 'Error removing from cart' });
    }
};

exports.clearCart = async (req, res) => {
    try {
        const userId = req.body.user.id;
        await Cart.destroy({ where: { user_id: userId } });
        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: 'Error clearing cart' });
    }
};
