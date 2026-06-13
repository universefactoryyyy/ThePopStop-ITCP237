const db = require('../models');
const Order = db.Order;
const OrderItem = db.OrderItem;
const Product = db.Product;
const User = db.User;
const Discount = db.Discount;
const sendEmail = require('../utils/sendEmail');
const { generateOrderReceipt } = require('../utils/generatePDF');
const { orderConfirmationEmail, orderStatusUpdateEmail } = require('../utils/emailTemplates');
const { calculateDiscountAmount } = require('./discount');
const { Op } = require('sequelize');

exports.createOrder = async (req, res) => {
    try {
        const { cart, shipping_address, payment_method, discount_code } = req.body;
        const userId = req.body.user.id;

        if (!cart || cart.length === 0) return res.status(400).json({ error: 'Cart is empty' });

        let subtotal_amount = 0;
        for (const item of cart) {
            const product = await Product.findByPk(item.product_id);
            if (!product) return res.status(404).json({ error: `Product ${item.product_id} not found` });
            if (product.status === 'Out of Stock') {
                return res.status(400).json({ error: `${product.name} is out of stock` });
            }
            subtotal_amount += product.price * item.quantity;
        }

        let discount_amount = 0;
        let appliedCode = null;
        if (discount_code) {
            const discount = await Discount.findOne({
                where: {
                    code: discount_code.trim().toUpperCase(),
                    is_active: 1,
                    [Op.or]: [{ expires_at: null }, { expires_at: { [Op.gt]: new Date() } }]
                }
            });
            if (!discount) return res.status(400).json({ error: 'Invalid or expired discount code' });
            if (discount.max_uses !== null && discount.used_count >= discount.max_uses) {
                return res.status(400).json({ error: 'This discount code has reached its usage limit' });
            }
            if (subtotal_amount < parseFloat(discount.min_order_amount)) {
                return res.status(400).json({ error: `Minimum order of ₱${parseFloat(discount.min_order_amount).toFixed(2)} required` });
            }
            discount_amount = calculateDiscountAmount(discount, subtotal_amount);
            appliedCode = discount.code;
            await discount.update({ used_count: discount.used_count + 1 });
        }

        const total_amount = subtotal_amount - discount_amount;

        const order = await Order.create({
            user_id: userId,
            subtotal_amount,
            discount_code: appliedCode,
            discount_amount,
            total_amount,
            shipping_address,
            payment_method,
            status: 'Pending'
        });

        for (const item of cart) {
            const product = await Product.findByPk(item.product_id);
            await OrderItem.create({ order_id: order.id, product_id: item.product_id, quantity: item.quantity, unit_price: product.price });
            await Product.update({ stock_quantity: product.stock_quantity - item.quantity }, { where: { id: item.product_id } });
        }

        const user = await User.findByPk(userId);
        const fullOrder = await Order.findByPk(order.id, {
            include: [{ model: OrderItem, include: [{ model: Product }] }]
        });
        try {
            const pdfBuffer = await generateOrderReceipt(fullOrder);
            await sendEmail({
                email: user.email,
                subject: 'Order Confirmed - The Pop Stop',
                html: orderConfirmationEmail(user, fullOrder),
                attachments: [{ filename: `receipt-order-${fullOrder.id}.pdf`, content: pdfBuffer }]
            });
        } catch (emailErr) { console.log('Email error:', emailErr); }

        return res.status(201).json({ success: true, order_id: order.id, total_amount, message: 'Order placed successfully' });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error creating order', details: err.message });
    }
};

exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.body.user.id;
        const orders = await Order.findAll({
            where: { user_id: userId },
            include: [{ model: OrderItem, include: [{ model: Product, attributes: ['name', 'image_url', 'id', 'series', 'brand'] }] }],
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json({ rows: orders });
    } catch (err) {
        return res.status(500).json({ error: 'Error fetching orders' });
    }
};

exports.getOrderReceipt = async (req, res) => {
    try {
        const userId = req.body.user.id;
        const order = await Order.findByPk(req.params.id, {
            include: [{ model: OrderItem, include: [{ model: Product }] }, { model: User }]
        });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        if (order.user_id !== userId) return res.status(403).json({ error: 'Access denied' });

        const pdfBuffer = await generateOrderReceipt(order);
        const inline = req.query.inline === '1';
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename=receipt-order-${order.id}.pdf`);
        return res.send(pdfBuffer);
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error generating receipt' });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const orders = await Order.findAll({
            include: [
                { model: User, attributes: ['name', 'email'] },
                { model: OrderItem, include: [{ model: Product, attributes: ['name'] }] }
            ],
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json({ rows: orders });
    } catch (err) {
        return res.status(500).json({ error: 'Error fetching orders' });
    }
};

exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const order = await Order.findByPk(id, {
            include: [
                { model: User },
                { model: OrderItem, include: [{ model: Product }] }
            ]
        });
        if (!order) return res.status(404).json({ error: 'Order not found' });

        await order.update({ status });

        try {
            const pdfBuffer = await generateOrderReceipt(order);
            await sendEmail({
                email: order.User.email,
                subject: `Order #${order.id} Status Update - The Pop Stop`,
                html: orderStatusUpdateEmail(order.User, order, status),
                attachments: [{ filename: `receipt-order-${order.id}.pdf`, content: pdfBuffer }]
            });
        } catch (emailErr) { console.log('Email error:', emailErr); }

        return res.status(200).json({ success: true, message: 'Order status updated' });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error updating order status' });
    }
};
