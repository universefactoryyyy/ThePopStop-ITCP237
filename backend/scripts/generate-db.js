const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const XLSX = require('xlsx');

const EXCEL_PATH = 'C:/ThePopStop-WebApp/ThePopStop.xlsx';
const IMAGES_DIR = path.join(__dirname, '../../frontend/images');
const OUTPUT_PATH = path.join(__dirname, '../../database/popstop_db.sql');

const imageFiles = new Set(
    fs.readdirSync(IMAGES_DIR).map((f) => f.toLowerCase())
);

const manualImageMap = {
    'images/skullpanda3.2.jpg': 'images/skullpanda4.2.jpg',
    'images/skullpanda3.3.jpg': 'images/skullpanda4.3.jpg',
    'products/skullpanda3.3.jpg': 'images/skullpanda4.3.jpg',
};

function resolveImagePath(relativePath) {
    if (!relativePath) return null;
    let cleaned = relativePath.trim().replace(/\\/g, '/');
    if (manualImageMap[cleaned]) return manualImageMap[cleaned];
    if (cleaned.startsWith('products/')) {
        cleaned = cleaned.replace('products/', 'images/');
    }
    const basename = path.basename(cleaned);
    const dir = path.dirname(cleaned).replace(/\\/g, '/');
    const stem = path.parse(basename).name.toLowerCase();

    const match = [...imageFiles].find((file) => {
        const fileStem = path.parse(file).name.toLowerCase();
        return fileStem === stem;
    });

    if (!match) return null;
    return `${dir === '.' ? 'images' : dir}/${match}`.replace(/\\/g, '/');
}

function sqlEscape(value) {
    if (value === null || value === undefined) return 'NULL';
    return `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "''")}'`;
}

async function main() {
    const workbook = XLSX.readFile(EXCEL_PATH);
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets['Sheet1']);
    const adminHash = await bcrypt.hash('password', 10);

    const productInserts = [];
    const photoInserts = [];

    rows.forEach((row, index) => {
        const productId = index + 1;
        const name = row.__EMPTY || row.Name || row.name;
        const imageUrl = resolveImagePath(row.image_url) || row.image_url;
        const additional = (row.additional_images || '')
            .split(',')
            .map((p) => resolveImagePath(p))
            .filter(Boolean);

        productInserts.push(
            `(${productId}, ${sqlEscape(name)}, ${sqlEscape(row.Series)}, ${sqlEscape(row.Brand)}, ${Number(row.Price).toFixed(2)}, ${Number(row.cost_price).toFixed(2)}, ${sqlEscape(row.SKU)}, ${sqlEscape(row.Description)}, ${Number(row.Stock_Quantity)}, ${sqlEscape(row.Status)}, ${sqlEscape(imageUrl)}, NULL, NOW(), NOW())`
        );

        additional.forEach((photoPath) => {
            photoInserts.push(`(${productId}, ${sqlEscape(photoPath)}, NOW(), NOW())`);
        });
    });

    const sql = `-- The Pop Stop - Full Database
-- Drop current database and import this file in MySQL Workbench (XAMPP port 3306)
-- Admin login: admin@popstop.com / password
-- Sample discount codes: POPSTOP10, SAVE100, WELCOME50

DROP DATABASE IF EXISTS popstop_db;
CREATE DATABASE popstop_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE popstop_db;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin','customer') DEFAULT 'customer',
    token VARCHAR(500) DEFAULT NULL,
    is_active TINYINT(1) DEFAULT 1,
    deleted_at DATETIME DEFAULT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE customer (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    fname VARCHAR(255),
    lname VARCHAR(255),
    addressline TEXT,
    zipcode VARCHAR(20),
    phone VARCHAR(30),
    image_path VARCHAR(500),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    series VARCHAR(255),
    brand VARCHAR(255),
    price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2),
    sku VARCHAR(100) UNIQUE,
    description TEXT,
    stock_quantity INT DEFAULT 0,
    status ENUM('In Stock','Low Stock','Out of Stock') DEFAULT 'Out of Stock',
    image_url VARCHAR(500),
    deleted_at DATETIME DEFAULT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE product_photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    photo_path VARCHAR(500),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE cart (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_cart (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE discounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    discount_type ENUM('percent', 'fixed') NOT NULL DEFAULT 'percent',
    discount_value DECIMAL(10,2) NOT NULL,
    min_order_amount DECIMAL(10,2) DEFAULT 0,
    max_uses INT DEFAULT NULL,
    used_count INT DEFAULT 0,
    is_active TINYINT(1) DEFAULT 1,
    expires_at DATETIME DEFAULT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subtotal_amount DECIMAL(10,2) DEFAULT 0,
    discount_code VARCHAR(50) DEFAULT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    status ENUM('Pending','Processing','Shipped','Delivered','Cancelled') DEFAULT 'Pending',
    shipping_address TEXT,
    payment_method VARCHAR(100),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    user_id INT NOT NULL,
    order_id INT NOT NULL,
    rating TINYINT NOT NULL,
    review_text TEXT,
    is_approved TINYINT(1) DEFAULT 1,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

INSERT INTO users (id, name, email, password, role, is_active, createdAt, updatedAt) VALUES
(1, 'Admin', 'admin@popstop.com', ${sqlEscape(adminHash)}, 'admin', 1, NOW(), NOW());

INSERT INTO products (id, name, series, brand, price, cost_price, sku, description, stock_quantity, status, image_url, deleted_at, createdAt, updatedAt) VALUES
${productInserts.join(',\n')};

INSERT INTO product_photos (product_id, photo_path, createdAt, updatedAt) VALUES
${photoInserts.join(',\n')};

INSERT INTO discounts (code, description, discount_type, discount_value, min_order_amount, max_uses, is_active) VALUES
('POPSTOP10', '10% off your order', 'percent', 10.00, 500.00, 100, 1),
('SAVE100', 'P100 off orders P1000+', 'fixed', 100.00, 1000.00, 50, 1),
('WELCOME50', 'P50 welcome discount', 'fixed', 50.00, 300.00, NULL, 1);
`;

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, sql, 'utf8');

    console.log(`Generated ${OUTPUT_PATH}`);
    console.log(`Products: ${rows.length}`);
    console.log(`Additional photos: ${photoInserts.length}`);
    console.log(`Admin hash: ${adminHash}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
