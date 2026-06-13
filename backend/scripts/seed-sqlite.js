
const sequelize = require('../config/database');
const db = require('../models');
const bcrypt = require('bcrypt');

async function seedDatabase() {
    try {
        console.log('Syncing database...');
        await sequelize.sync({ force: true }); // Drop tables if they exist and recreate

        console.log('Seeding admin user...');
        const adminPassword = await bcrypt.hash('password', 10);
        await db.User.create({
            id: 1,
            name: 'Admin',
            email: 'admin@popstop.com',
            password: adminPassword,
            role: 'admin',
            is_active: 1
        });

        console.log('Seeding products...');
        const products = [
            {
                id: 1,
                name: 'SKULLPANDA Covenant of the White Moon Figure',
                series: 'Skullpanda',
                brand: 'Pop Mart',
                price: 1700.00,
                cost_price: 1600.00,
                sku: 'PM-SKP-001',
                description: 'SKULLPANDA Covenant of the White Moon Figure',
                stock_quantity: 20,
                status: 'In Stock',
                image_url: 'images/skullpanda1.jpg'
            },
            {
                id: 2,
                name: 'SKULLPANDA The Glimpse Figure',
                series: 'Skullpanda',
                brand: 'Pop Mart',
                price: 1700.00,
                cost_price: 1600.00,
                sku: 'PM-SKP-002',
                description: 'SKULLPANDA The Glimpse Figure',
                stock_quantity: 18,
                status: 'In Stock',
                image_url: 'images/skullpanda2.jpg'
            },
            {
                id: 3,
                name: 'SKULLPANDA Club Man Figurine',
                series: 'Skullpanda',
                brand: 'Pop Mart',
                price: 1700.00,
                cost_price: 1600.00,
                sku: 'PM-SKP-003',
                description: 'SKULLPANDA Club Man Figurine',
                stock_quantity: 15,
                status: 'In Stock',
                image_url: 'images/skullpanda3.jpg'
            },
            {
                id: 4,
                name: 'CRYBABY BE MINE FIGURINE',
                series: 'Crybaby',
                brand: 'Pop Mart',
                price: 7280.00,
                cost_price: 7180.00,
                sku: 'PM-CRY-001',
                description: 'CRYBABY BE MINE FIGURINE',
                stock_quantity: 5,
                status: 'Low Stock',
                image_url: 'images/crybaby1.jpg'
            },
            {
                id: 5,
                name: 'CRYBABY MAKE ME FLOAT FIGURE',
                series: 'Crybaby',
                brand: 'Pop Mart',
                price: 1700.00,
                cost_price: 1600.00,
                sku: 'PM-CRY-002',
                description: 'CRYBABY MAKE ME FLOAT FIGURE',
                stock_quantity: 14,
                status: 'In Stock',
                image_url: 'images/crybaby2.jpg'
            },
            {
                id: 6,
                name: 'Crybaby Coconut Figure-Brown',
                series: 'Crybaby',
                brand: 'Pop Mart',
                price: 1700.00,
                cost_price: 1600.00,
                sku: 'PM-CRY-003',
                description: 'Crybaby Coconut Figure-Brown',
                stock_quantity: 12,
                status: 'In Stock',
                image_url: 'images/crybaby3.jpg'
            },
            {
                id: 7,
                name: 'Crybaby Coconut Figure-Green',
                series: 'Crybaby',
                brand: 'Pop Mart',
                price: 1700.00,
                cost_price: 1600.00,
                sku: 'PM-CRY-004',
                description: 'Crybaby Coconut Figure-Green',
                stock_quantity: 11,
                status: 'In Stock',
                image_url: 'images/crybaby4.jpg'
            },
            {
                id: 8,
                name: 'LABUBU Hip-hop Girl Figure',
                series: 'The Monster',
                brand: 'Pop Mart',
                price: 1700.00,
                cost_price: 1600.00,
                sku: 'PM-LAB-001',
                description: 'LABUBU Hip-hop Girl Figure',
                stock_quantity: 25,
                status: 'In Stock',
                image_url: 'images/labubu1.jpg'
            },
            {
                id: 9,
                name: 'LABUBU Superstar Dance Moves Figure',
                series: 'The Monster',
                brand: 'Pop Mart',
                price: 1700.00,
                cost_price: 1600.00,
                sku: 'PM-LAB-002',
                description: 'LABUBU Superstar Dance Moves Figure',
                stock_quantity: 22,
                status: 'In Stock',
                image_url: 'images/labubu2.jpg'
            },
            {
                id: 10,
                name: 'THE MONSTERS_How to Train Your Dragon Figurine',
                series: 'The Monster',
                brand: 'Pop Mart',
                price: 6000.00,
                cost_price: 5900.00,
                sku: 'PM-MON-001',
                description: 'THE MONSTERS_How to Train Your Dragon Figurine',
                stock_quantity: 8,
                status: 'Low Stock',
                image_url: 'images/labubu3.jpg'
            },
            {
                id: 11,
                name: 'PINO JELLY Chocolate Cookie Figurine',
                series: 'Pino Jelly',
                brand: 'Pop Mart',
                price: 5000.00,
                cost_price: 4900.00,
                sku: 'PM-PIN-001',
                description: 'PINO JELLY Chocolate Cookie Figurine',
                stock_quantity: 10,
                status: 'Low Stock',
                image_url: 'images/pino1.jpg'
            },
            {
                id: 12,
                name: 'PINO JELLY Birthday Bash Figurine',
                series: 'Pino Jelly',
                brand: 'Pop Mart',
                price: 5000.00,
                cost_price: 4900.00,
                sku: 'PM-PIN-002',
                description: 'PINO JELLY Birthday Bash Figurine',
                stock_quantity: 12,
                status: 'In Stock',
                image_url: 'images/pino2.jpg'
            },
            {
                id: 13,
                name: 'PINO JELLY Guess Who I am Figure',
                series: 'Pino Jelly',
                brand: 'Pop Mart',
                price: 1700.00,
                cost_price: 1600.00,
                sku: 'PM-PIN-003',
                description: 'PINO JELLY Guess Who I am Figure',
                stock_quantity: 18,
                status: 'In Stock',
                image_url: 'images/pino3.jpg'
            },
            {
                id: 14,
                name: 'PINO JELLY Fairyland Figurine',
                series: 'Pino Jelly',
                brand: 'Pop Mart',
                price: 5000.00,
                cost_price: 4900.00,
                sku: 'PM-PIN-004',
                description: 'PINO JELLY Fairyland Figurine',
                stock_quantity: 9,
                status: 'Low Stock',
                image_url: 'images/pino4.jpg'
            },
            {
                id: 15,
                name: 'Funko Marvel: Deadpool & Wolverine - Wolverine Pop! Vinyl Figure',
                series: 'Marvel',
                brand: 'Funko',
                price: 695.00,
                cost_price: 595.00,
                sku: 'FK-MAR-001',
                description: 'Funko Marvel: Deadpool & Wolverine - Wolverine Pop! Vinyl Figure',
                stock_quantity: 30,
                status: 'In Stock',
                image_url: 'images/funko1.jpg'
            }
        ];
        await db.Product.bulkCreate(products);

        console.log('Seeding discounts...');
        const discounts = [
            {
                code: 'POPSTOP10',
                description: '10% off your order',
                discount_type: 'percent',
                discount_value: 10.00,
                min_order_amount: 500.00,
                max_uses: 100,
                is_active: 1
            },
            {
                code: 'SAVE100',
                description: 'P100 off orders P1000+',
                discount_type: 'fixed',
                discount_value: 100.00,
                min_order_amount: 1000.00,
                max_uses: 50,
                is_active: 1
            },
            {
                code: 'WELCOME50',
                description: 'P50 welcome discount',
                discount_type: 'fixed',
                discount_value: 50.00,
                min_order_amount: 300.00,
                max_uses: null,
                is_active: 1
            }
        ];
        await db.Discount.bulkCreate(discounts);

        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seedDatabase();

