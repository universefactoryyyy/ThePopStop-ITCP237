const db = require('../models');
const Order = db.Order;
const Product = db.Product;
const User = db.User;
const OrderItem = db.OrderItem;
const { Op } = require('sequelize');

exports.getDashboardStats = async (req, res) => {
    try {
        const totalProducts = await Product.count({ where: { deleted_at: null } });
        const totalUsers = await User.count({ where: { deleted_at: null } });
        const totalOrders = await Order.count();
        const totalRevenue = await Order.sum('total_amount', { where: { status: { [Op.in]: ['Delivered', 'Shipped'] } } });

        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        const orders = await Order.findAll({
            where: { createdAt: { [Op.gte]: sixMonthsAgo }, status: { [Op.in]: ['Delivered', 'Shipped', 'Processing'] } },
            attributes: ['total_amount', 'createdAt']
        });

        const brandSales = await OrderItem.findAll({
            include: [{ model: Product, attributes: ['brand'] }],
            attributes: ['quantity', 'unit_price']
        });

        return res.status(200).json({ success: true, stats: { totalProducts, totalUsers, totalOrders, totalRevenue: totalRevenue || 0 }, orders, brandSales });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error fetching dashboard stats' });
    }
};
