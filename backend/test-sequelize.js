const sequelize = require('./config/database');

async function testSequelize() {
    try {
        console.log('Testing Sequelize connection...');
        await sequelize.authenticate();
        console.log('✓ Sequelize connected successfully!');
        
        // Check if tables exist
        const [tables] = await sequelize.query('SHOW TABLES');
        console.log(`✓ Found ${tables.length} tables in database!`);
        console.log('Tables:', tables.map(t => Object.values(t)[0]));
        
        await sequelize.close();
    } catch (error) {
        console.error('✗ Sequelize connection error:', error);
    }
}

testSequelize();
