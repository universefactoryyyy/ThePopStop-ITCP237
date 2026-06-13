module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Order', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        subtotal_amount: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
        discount_code: DataTypes.STRING(50),
        discount_amount: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
        total_amount: { type: DataTypes.DECIMAL(10,2), defaultValue: 0 },
        status: { type: DataTypes.ENUM('Pending','Processing','Shipped','Delivered','Cancelled'), defaultValue: 'Pending' },
        shipping_address: DataTypes.TEXT,
        payment_method: DataTypes.STRING
    }, { tableName: 'orders', timestamps: true });
};
