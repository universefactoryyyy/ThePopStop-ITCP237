module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Cart', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        product_id: { type: DataTypes.INTEGER, allowNull: false },
        quantity: { type: DataTypes.INTEGER, defaultValue: 1 }
    }, { tableName: 'cart', timestamps: true });
};
