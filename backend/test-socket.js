
const net = require('net');
const mysql = require('mysql2');

console.log('=== Testing net.connect on all possible MySQL ports and hosts ===');

const hosts = ['127.0.0.1', 'localhost', '::1', '0.0.0.0'];
const port = 3306;

hosts.forEach(host => {
  console.log(`\n--- Testing ${host}:${port} ---`);
  const client = net.connect(port, host, () => {
    console.log(`✅ Successfully connected to ${host}:${port}`);
    client.once('data', (data) => {
      console.log('📥 Received initial handshake:', data.toString('hex'));
      client.end();
    });
    client.once('end', () => console.log('🔌 Connection closed'));
  });
  
  client.on('error', (err) => {
    console.error('❌ Error:', err.message);
  });
  
  client.setTimeout(10000, () => {
    console.error('⏱️ Connection timeout');
    client.end();
  });
});

// Also try mysql2 connection
console.log('\n\n=== Testing mysql2 connection ===');
const conn = mysql.createConnection({
  host: '127.0.0.1',
  port: 3306,
  user: 'root',
  password: '',
  debug: true
});
conn.connect((err) => {
  if (err) {
    console.error('mysql2 connect error:', err);
  } else {
    console.log('mysql2 connected!');
  }
  conn.end();
});

