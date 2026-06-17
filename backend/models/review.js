module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Review', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        product_id: { type: DataTypes.INTEGER, allowNull: false },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        order_id: { type: DataTypes.INTEGER, allowNull: false },
        rating: { type: DataTypes.TINYINT, allowNull: false },
        review_text: DataTypes.TEXT,
        is_approved: { type: DataTypes.TINYINT, defaultValue: 0 },
        is_anonymous: { type: DataTypes.TINYINT, defaultValue: 0 }
    }, { tableName: 'reviews', timestamps: true });
};
