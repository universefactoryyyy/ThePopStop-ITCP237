const db = require('../models');
const Product = db.Product;
const ProductPhoto = db.ProductPhoto;
const OrderItem = db.OrderItem;
const Review = db.Review;
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');

const getProductStatus = (stock) => {
    if (stock <= 0) return 'Out of Stock';
    if (stock <= 5) return 'Low Stock';
    return 'In Stock';
};

// Helper function to get product stats
const getProductStats = async (productId) => {
    try {
        // Get sold count
        const soldResult = await OrderItem.sum('quantity', { where: { product_id: productId } });
        const soldCount = soldResult || 0;
        
        // Get average rating
        const avgRatingResult = await Review.findOne({
            where: { product_id: productId, is_approved: 1 },
            attributes: [[db.sequelize.fn('AVG', db.sequelize.col('rating')), 'avgRating']]
        });
        const averageRating = avgRatingResult?.dataValues?.avgRating 
            ? parseFloat(avgRatingResult.dataValues.avgRating) 
            : null;
            
        const reviewCount = await Review.count({
            where: { product_id: productId, is_approved: 1 }
        });
        
        return { soldCount, averageRating, reviewCount };
    } catch (err) {
        console.error('Error getting product stats:', err);
        return { soldCount: 0, averageRating: null, reviewCount: 0 };
    }
};

exports.getAllProducts = async (req, res) => {
    try {
        const { search, brand, series, status, sort } = req.query;
        // Check if user is admin
        let isAdmin = false;
        if (req.header('Authorization')) {
            try {
                const token = req.header('Authorization').split(' ')[1];
                if (token) {
                    const decoded = jwt.verify(token, process.env.JWT_SECRET);
                    const user = await db.User.findByPk(decoded.id);
                    isAdmin = user && user.role === 'admin';
                }
            } catch (e) {
                isAdmin = false;
            }
        }
        const where = isAdmin ? {} : { deleted_at: null };
        if (search) where[Op.or] = [{ name: { [Op.like]: `%${search}%` } }, { brand: { [Op.like]: `%${search}%` } }, { series: { [Op.like]: `%${search}%` } }];
        if (brand) where.brand = brand;
        if (series) where.series = series;
        if (status) where.status = status;
        let order = [['createdAt', 'DESC']];
        if (sort === 'price_asc') order = [['price', 'ASC']];
        if (sort === 'price_desc') order = [['price', 'DESC']];

        let products = await Product.findAll({ where, include: [{ model: ProductPhoto }], order });
        
        // Enhance products with stats
        products = await Promise.all(products.map(async (product) => {
            const stats = await getProductStats(product.id);
            return {
                ...product.toJSON(),
                sold_count: stats.soldCount,
                average_rating: stats.averageRating,
                review_count: stats.reviewCount
            };
        }));

        // Apply sort by sold or rating after getting stats
        if (sort === 'sold_asc') {
            products.sort((a, b) => a.sold_count - b.sold_count);
        } else if (sort === 'sold_desc') {
            products.sort((a, b) => b.sold_count - a.sold_count);
        } else if (sort === 'rating_asc') {
            products.sort((a, b) => (a.average_rating || 0) - (b.average_rating || 0));
        } else if (sort === 'rating_desc') {
            products.sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
        }

        return res.status(200).json({ rows: products });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error fetching products' });
    }
};

exports.getSingleProduct = async (req, res) => {
    try {
        const product = await Product.findOne({
            where: { id: req.params.id, deleted_at: null },
            include: [{ model: ProductPhoto }, {
                model: db.Review, include: [{ model: db.User, attributes: ['name'] }]
            }]
        });
        if (!product) return res.status(404).json({ message: 'Product not found' });
        
        const stats = await getProductStats(product.id);
        
        return res.status(200).json({ 
            success: true, 
            result: {
                ...product.toJSON(),
                sold_count: stats.soldCount,
                average_rating: stats.averageRating,
                review_count: stats.reviewCount
            }
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error fetching product' });
    }
};

exports.searchAutocomplete = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(200).json({ rows: [] });
        const products = await Product.findAll({
            where: {
                deleted_at: null,
                [Op.or]: [{ name: { [Op.like]: `%${q}%` } }, { brand: { [Op.like]: `%${q}%` } }]
            },
            attributes: ['id', 'name', 'brand', 'price'],
            limit: 8
        });
        return res.status(200).json({ rows: products });
    } catch (err) {
        return res.status(500).json({ error: 'Search error' });
    }
};

exports.createProduct = async (req, res) => {
    try {
        const { name, series, brand, price, cost_price, sku, description, stock_quantity, status } = req.body;
        if (!name || !price || !sku) return res.status(400).json({ error: 'Missing required fields: name, price, sku' });

        let image_url = null;
        if (req.file) image_url = req.file.path.replace(/\\/g, '/');

        const product = await Product.create({ name, series, brand, price, cost_price, sku, description, stock_quantity: stock_quantity || 0, status: status || 'Out of Stock', image_url });
        return res.status(201).json({ success: true, product });
    } catch (err) {
        console.log(err);
        if (err.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ error: 'SKU already exists' });
        return res.status(500).json({ error: 'Error creating product', details: err.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, series, brand, price, cost_price, sku, description, stock_quantity } = req.body;
        let image_url = req.file ? req.file.path.replace(/\\/g, '/') : undefined;

        const updateData = { name, series, brand, price, cost_price, sku, description, stock_quantity };
        if (stock_quantity !== undefined) {
            updateData.status = getProductStatus(stock_quantity);
        }
        if (image_url) updateData.image_url = image_url;

        await Product.update(updateData, { where: { id } });
        return res.status(200).json({ success: true });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error updating product' });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        await Product.update({ deleted_at: new Date() }, { where: { id: req.params.id } });
        return res.status(200).json({ success: true, message: 'Product deleted' });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error deleting product' });
    }
};

exports.restoreProduct = async (req, res) => {
    try {
        await Product.update({ deleted_at: null }, { where: { id: req.params.id } });
        return res.status(200).json({ success: true, message: 'Product restored' });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error restoring product' });
    }
};

exports.uploadPhotos = async (req, res) => {
    try {
        const { product_id } = req.params;
        if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });

        const photos = await Promise.all(req.files.map(f =>
            ProductPhoto.create({ product_id, photo_path: f.path.replace(/\\/g, '/') })
        ));
        return res.status(201).json({ success: true, photos });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error uploading photos' });
    }
};
