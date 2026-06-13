const db = require('../models');
const Discount = db.Discount;
const { Op } = require('sequelize');

const calculateDiscountAmount = (discount, subtotal) => {
    const value = parseFloat(discount.discount_value);
    const total = parseFloat(subtotal);
    if (discount.discount_type === 'percent') {
        return Math.min(total, (total * value) / 100);
    }
    return Math.min(total, value);
};

exports.validateDiscount = async (req, res) => {
    try {
        const { code, subtotal } = req.body;
        if (!code) return res.status(400).json({ error: 'Discount code is required' });

        const discount = await Discount.findOne({
            where: {
                code: code.trim().toUpperCase(),
                is_active: 1,
                [Op.or]: [{ expires_at: null }, { expires_at: { [Op.gt]: new Date() } }]
            }
        });

        if (!discount) return res.status(404).json({ error: 'Invalid or expired discount code' });
        if (discount.max_uses !== null && discount.used_count >= discount.max_uses) {
            return res.status(400).json({ error: 'This discount code has reached its usage limit' });
        }

        const orderSubtotal = parseFloat(subtotal) || 0;
        if (orderSubtotal < parseFloat(discount.min_order_amount)) {
            return res.status(400).json({
                error: `Minimum order of ₱${parseFloat(discount.min_order_amount).toFixed(2)} required for this code`
            });
        }

        const discount_amount = calculateDiscountAmount(discount, orderSubtotal);
        const total_amount = orderSubtotal - discount_amount;

        return res.status(200).json({
            success: true,
            code: discount.code,
            description: discount.description,
            discount_type: discount.discount_type,
            discount_value: discount.discount_value,
            discount_amount: discount_amount.toFixed(2),
            subtotal: orderSubtotal.toFixed(2),
            total_amount: total_amount.toFixed(2)
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ error: 'Error validating discount' });
    }
};

exports.getApplicableDiscounts = async (req, res) => {
    try {
        const subtotal = parseFloat(req.query.subtotal) || 0;
        const discounts = await Discount.findAll({
            where: {
                is_active: 1,
                [Op.or]: [{ expires_at: null }, { expires_at: { [Op.gt]: new Date() } }]
            },
            order: [['min_order_amount', 'ASC']]
        });

        const rows = discounts
            .filter((d) => subtotal >= parseFloat(d.min_order_amount))
            .filter((d) => d.max_uses === null || d.used_count < d.max_uses)
            .map((d) => {
                const discount_amount = calculateDiscountAmount(d, subtotal);
                const minAmt = parseFloat(d.min_order_amount).toFixed(2);
                const peso = '\u20B1';
                const label = d.discount_type === 'percent'
                    ? `${d.code} - ${d.discount_value}% off (min ${peso}${minAmt})`
                    : `${d.code} - ${peso}${parseFloat(d.discount_value).toFixed(2)} off (min ${peso}${minAmt})`;
                return {
                    code: d.code,
                    description: d.description,
                    discount_type: d.discount_type,
                    discount_value: d.discount_value,
                    min_order_amount: d.min_order_amount,
                    discount_amount: discount_amount.toFixed(2),
                    label
                };
            });

        return res.status(200).json({ rows });
    } catch (err) {
        return res.status(500).json({ error: 'Error fetching applicable discounts' });
    }
};

exports.getAllDiscounts = async (req, res) => {
    try {
        const discounts = await Discount.findAll({ order: [['createdAt', 'DESC']] });
        return res.status(200).json({ rows: discounts });
    } catch (err) {
        return res.status(500).json({ error: 'Error fetching discounts' });
    }
};

exports.createDiscount = async (req, res) => {
    try {
        const { code, description, discount_type, discount_value, min_order_amount, max_uses, is_active, expires_at } = req.body;
        if (!code || !discount_value) return res.status(400).json({ error: 'Code and discount value are required' });

        const discount = await Discount.create({
            code: code.trim().toUpperCase(),
            description,
            discount_type: discount_type || 'percent',
            discount_value,
            min_order_amount: min_order_amount || 0,
            max_uses: max_uses || null,
            is_active: is_active !== undefined ? is_active : 1,
            expires_at: expires_at || null
        });
        return res.status(201).json({ success: true, discount });
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ error: 'Discount code already exists' });
        return res.status(500).json({ error: 'Error creating discount' });
    }
};

exports.updateDiscount = async (req, res) => {
    try {
        const { id } = req.params;
        const { code, description, discount_type, discount_value, min_order_amount, max_uses, is_active, expires_at } = req.body;
        const updateData = { description, discount_type, discount_value, min_order_amount, max_uses, is_active, expires_at };
        if (code) updateData.code = code.trim().toUpperCase();

        await Discount.update(updateData, { where: { id } });
        return res.status(200).json({ success: true });
    } catch (err) {
        if (err.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ error: 'Discount code already exists' });
        return res.status(500).json({ error: 'Error updating discount' });
    }
};

exports.deleteDiscount = async (req, res) => {
    try {
        await Discount.destroy({ where: { id: req.params.id } });
        return res.status(200).json({ success: true });
    } catch (err) {
        return res.status(500).json({ error: 'Error deleting discount' });
    }
};

exports.calculateDiscountAmount = calculateDiscountAmount;
