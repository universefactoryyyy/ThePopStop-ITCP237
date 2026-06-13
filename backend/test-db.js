const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection(host) {
    try {
        console.log(`Testing MySQL connection to ${host}...`);
        const connection = await mysql.createConnection({
            host,
            port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            connectTimeout: 20000
        });
        console.log(`✓ Successfully connected to MySQL server at ${host}!`);
        
        // Check if database exists
        const [databases] = await connection.execute('SHOW DATABASES LIKE ?', [process.env.DB_NAME]);
        if (databases.length > 0) {
            console.log(`✓ Database "${process.env.DB_NAME}" exists!`);
            await connection.end();
            return { success: true, host };
        } else {
            console.log(`- Database "${process.env.DB_NAME}" does NOT exist - trying to create it...`);
            await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
            console.log(`✓ Database "${process.env.DB_NAME}" created successfully!`);
            console.log(`Now please import database/popstop_db.sql to populate tables and sample data!`);
            await connection.end();
            return { success: true, host, dbCreated: true };
        }
    } catch (error) {
        console.error(`✗ Error connecting to ${host}:`, error.message);
        return { success: false, host, error: error.message };
    }
}

async function main() {
    const hosts = ['127.0.0.1', 'localhost', '::1'];
    for (const host of hosts) {
        const result = await testConnection(host);
        if (result.success) {
            console.log(`\n✅ Best host to use: ${host}`);
            console.log(`Updating backend/.env DB_HOST to ${host}...`);
            // Update .env file
            const fs = require('fs');
            const path = require('path');
            const envPath = path.join(__dirname, '.env');
            let envContent = fs.readFileSync(envPath, 'utf8');
            envContent = envContent.replace(/DB_HOST=.*/, `DB_HOST=${host}`);
            fs.writeFileSync(envPath, envContent, 'utf8');
            console.log(`✓ .env updated!`);
            return;
        }
    }
    console.log('\n❌ Could not connect to MySQL on any host!');
    console.log('Please verify:');
    console.log('1. MySQL server is running');
    console.log('2. DB_USER and DB_PASSWORD in .env are correct');
    console.log('3. Database "popstop_db" exists (import database/popstop_db.sql)');
}

main();
