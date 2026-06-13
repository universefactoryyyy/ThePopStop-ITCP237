module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Discount', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
        description: DataTypes.STRING,
        discount_type: { type: DataTypes.ENUM('percent', 'fixed'), defaultValue: 'percent' },
        discount_value: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
        min_order_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
        max_uses: { type: DataTypes.INTEGER, allowNull: true },
        used_count: { type: DataTypes.INTEGER, defaultValue: 0 },
        is_active: { type: DataTypes.TINYINT, defaultValue: 1 },
        expires_at: { type: DataTypes.DATE, allowNull: true }
    }, { tableName: 'discounts', timestamps: true });
};
