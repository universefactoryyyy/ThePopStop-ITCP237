module.exports = (sequelize, DataTypes) => {
    return sequelize.define('ProductPhoto', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        product_id: { type: DataTypes.INTEGER, allowNull: false },
        photo_path: DataTypes.STRING
    }, { tableName: 'product_photos', timestamps: true });
};
