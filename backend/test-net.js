const net = require('net');

function testNet(host) {
    return new Promise((resolve, reject) => {
        console.log(`Testing net.connect to ${host}:3306...`);
        const client = net.connect(3306, host, () => {
            console.log(`✓ net.connect connected to ${host}:3306`);
            client.end();
            resolve({ success: true, host });
        });

        client.on('error', (err) => {
            console.error(`✗ net.connect error to ${host}:3306:`, err.message);
            reject({ success: false, host, error: err.message });
        });

        client.setTimeout(10000, () => {
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
            const result = await testNet(host);
            console.log(`\n✅ ${host} is reachable!`);
        } catch (e) {
            // continue
        }
    }
}

main();
