const { Sequelize } = require('sequelize');
require('dotenv').config();

console.log('Testing Sequelize without specifying database first...');
const sequelize = new Sequelize(null, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    dialect: 'mysql',
    logging: console.log,
    dialectOptions: {
        connectTimeout: 60000,
        ssl: false
    }
});

async function test() {
    try {
        await sequelize.authenticate();
        console.log('✅ Sequelize connected without database!');
        
        // Now check if database exists, create if needed
        await sequelize.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`✅ Database ${process.env.DB_NAME} ready!`);
        
        // Now connect to the database
        await sequelize.close();
        const sequelizeWithDb = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
            host: process.env.DB_HOST,
            port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
            dialect: 'mysql',
            logging: console.log,
            dialectOptions: {
                connectTimeout: 60000,
                ssl: false
            }
        });
        await sequelizeWithDb.authenticate();
        console.log('✅ Sequelize connected to database!');
        await sequelizeWithDb.close();
    } catch (err) {
        console.error('❌ Error:', err);
    }
}

test();
