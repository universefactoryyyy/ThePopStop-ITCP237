const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

const db = {};
db.User = require('./user')(sequelize, DataTypes);
db.Customer = require('./customer')(sequelize, DataTypes);
db.Product = require('./product')(sequelize, DataTypes);
db.ProductPhoto = require('./productPhoto')(sequelize, DataTypes);
db.Cart = require('./cart')(sequelize, DataTypes);
db.Order = require('./order')(sequelize, DataTypes);
db.OrderItem = require('./orderItem')(sequelize, DataTypes);
db.Review = require('./review')(sequelize, DataTypes);
db.Discount = require('./discount')(sequelize, DataTypes);

db.User.hasOne(db.Customer, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.Customer.belongsTo(db.User, { foreignKey: 'user_id' });

db.Product.hasMany(db.ProductPhoto, { foreignKey: 'product_id', onDelete: 'CASCADE' });
db.ProductPhoto.belongsTo(db.Product, { foreignKey: 'product_id' });

db.User.hasMany(db.Cart, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.Cart.belongsTo(db.User, { foreignKey: 'user_id' });
db.Cart.belongsTo(db.Product, { foreignKey: 'product_id' });
db.Product.hasMany(db.Cart, { foreignKey: 'product_id' });

db.User.hasMany(db.Order, { foreignKey: 'user_id' });
db.Order.belongsTo(db.User, { foreignKey: 'user_id' });
db.Order.hasMany(db.OrderItem, { foreignKey: 'order_id', onDelete: 'CASCADE' });
db.OrderItem.belongsTo(db.Order, { foreignKey: 'order_id' });
db.OrderItem.belongsTo(db.Product, { foreignKey: 'product_id' });
db.Product.hasMany(db.OrderItem, { foreignKey: 'product_id' });

db.Product.hasMany(db.Review, { foreignKey: 'product_id', onDelete: 'CASCADE' });
db.Review.belongsTo(db.Product, { foreignKey: 'product_id' });
db.User.hasMany(db.Review, { foreignKey: 'user_id' });
db.Review.belongsTo(db.User, { foreignKey: 'user_id' });
db.Review.belongsTo(db.Order, { foreignKey: 'order_id' });

db.sequelize = sequelize;
db.Sequelize = require('sequelize');

module.exports = db;
