const net = require('net');

function testNetMySQL(host) {
    return new Promise((resolve, reject) => {
        console.log(`Testing net.connect to ${host}:3306...`);
        const client = net.connect(3306, host, () => {
            console.log(`✓ net.connect connected to ${host}:3306`);
            
            // Wait for the server's initial handshake packet
            client.once('data', (data) => {
                console.log(`✓ Received initial packet from ${host}:3306`);
                console.log('Packet length:', data.length);
                console.log('First 20 bytes:', data.slice(0, 20));
                client.end();
                resolve({ success: true, host });
            });
        });

        client.on('error', (err) => {
            console.error(`✗ net.connect error to ${host}:3306:`, err.message);
            reject({ success: false, host, error: err.message });
        });

        client.setTimeout(30000, () => {
            console.error(`✗ net.connect timeout to ${host}:3306`);
            client.end();
            reject({ success: false, host, error: 'timeout' });
        });
    });
}

async function main() {
    const hosts = ['127.0.0.1', 'localhost', '::1'];
    for (const host of hosts) {
        try {
            const result = await testNetMySQL(host);
            console.log(`\n✅ ${host} is a real MySQL server!`);
            return;
        } catch (e) {
            console.log(`\n❌ ${host} failed:`, e.error);
        }
    }
}

main();
