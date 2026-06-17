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

        // Get ALL delivered/shipped orders for reports
        let orders = await Order.findAll({
            where: { status: { [Op.in]: ['Delivered', 'Shipped'] } },
            attributes: ['total_amount', 'createdAt']
        });

        let brandSales = await OrderItem.findAll({
            include: [
                { model: Product, attributes: ['brand'], required: true },
                { 
                    model: Order, 
                    attributes: ['status'], 
                    where: { status: { [Op.in]: ['Delivered', 'Shipped'] } },
                    required: true
                }
            ],
            attributes: ['quantity', 'unit_price']
        });

        // If no real data, add dummy data to test
        if (!orders.length) {
            const today = new Date().toISOString();
            const yesterday = new Date(Date.now() - 86400000).toISOString();
            orders = [
                { total_amount: 1000, createdAt: today },
                { total_amount: 2000, createdAt: yesterday },
                { total_amount: 500, createdAt: yesterday }
            ];
            brandSales = [
                { quantity: 2, unit_price: 500, Product: { brand: 'Funko' } },
                { quantity: 1, unit_price: 1000, Product: { brand: 'Pop Mart' } }
            ];
        }

        return res.status(200).json({ success: true, stats: { totalProducts, totalUsers, totalOrders, totalRevenue: totalRevenue || 0 }, orders, brandSales });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error fetching dashboard stats' });
    }
};
