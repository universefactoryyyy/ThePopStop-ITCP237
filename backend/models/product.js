module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Product', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: { type: DataTypes.STRING, allowNull: false },
        series: DataTypes.STRING,
        brand: DataTypes.STRING,
        price: { type: DataTypes.DECIMAL(10,2), allowNull: false },
        cost_price: DataTypes.DECIMAL(10,2),
        sku: { type: DataTypes.STRING, unique: true },
        description: DataTypes.TEXT,
        stock_quantity: { type: DataTypes.INTEGER, defaultValue: 0 },
        status: { type: DataTypes.ENUM('In Stock','Low Stock','Out of Stock'), defaultValue: 'Out of Stock' },
        image_url: DataTypes.STRING,
        deleted_at: { type: DataTypes.DATE, allowNull: true }
    }, { tableName: 'products', timestamps: true });
};
