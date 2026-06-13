const mysql = require('mysql2');
require('dotenv').config();

console.log('Testing mysql2 with debug logging...');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : '(empty)');

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    debug: true,
    family: 4
});

connection.connect((err) => {
    if (err) {
        console.error('❌ mysql2 connect error:', err);
        return;
    }
    console.log('✅ mysql2 connected!');
    connection.query('SHOW DATABASES', (err, results) => {
        if (err) {
            console.error('❌ query error:', err);
        } else {
            console.log('✅ Databases:', results);
        }
        connection.end();
    });
});
