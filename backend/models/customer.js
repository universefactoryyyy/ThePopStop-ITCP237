module.exports = (sequelize, DataTypes) => {
    return sequelize.define('Customer', {
        customer_id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        user_id: { type: DataTypes.INTEGER, allowNull: false },
        fname: DataTypes.STRING,
        lname: DataTypes.STRING,
        addressline: DataTypes.TEXT,
        zipcode: DataTypes.STRING,
        phone: DataTypes.STRING,
        image_path: DataTypes.STRING
    }, { tableName: 'customer', timestamps: true });
};
