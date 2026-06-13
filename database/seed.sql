-- The Pop Stop Database Setup
-- Run: CREATE DATABASE popstop_db; then run this script

USE popstop_db;

CREATE TABLE IF NOT EXISTS users (
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

CREATE TABLE IF NOT EXISTS customer (
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

CREATE TABLE IF NOT EXISTS products (
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

CREATE TABLE IF NOT EXISTS product_photos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    photo_path VARCHAR(500),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cart (
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

CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    total_amount DECIMAL(10,2) DEFAULT 0,
    status ENUM('Pending','Processing','Shipped','Delivered','Cancelled') DEFAULT 'Pending',
    shipping_address TEXT,
    payment_method VARCHAR(100),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS order_items (
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

CREATE TABLE IF NOT EXISTS reviews (
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

-- Seed admin user (password: admin123)
INSERT IGNORE INTO users (name, email, password, role) VALUES
('Admin', 'admin@popstop.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Seed products (no Hirono)
INSERT IGNORE INTO products (name, series, brand, price, cost_price, sku, description, stock_quantity, status, image_url) VALUES
('Molly Space Travel Series', 'Space Travel', 'POP MART', 1250.00, 800.00, 'PM-MOLLY-ST-001', 'Molly dressed as an astronaut exploring the cosmos. Limited edition.', 50, 'In Stock', 'images/molly-space.jpg'),
('Molly Artist Series', 'Artist Series', 'POP MART', 980.00, 600.00, 'PM-MOLLY-ART-001', 'Molly with a paintbrush and palette, celebrating creativity.', 30, 'In Stock', 'images/molly-artist.jpg'),
('Dimoo Aquarium Series', 'Aquarium', 'POP MART', 1100.00, 700.00, 'PM-DIMOO-AQ-001', 'Dimoo floating underwater with sea creatures around him.', 20, 'In Stock', 'images/dimoo-aquarium.jpg'),
('Dimoo Night Garden', 'Night Garden', 'POP MART', 990.00, 620.00, 'PM-DIMOO-NG-001', 'Dimoo sleeping under blooming night flowers.', 15, 'Low Stock', 'images/dimoo-nightgarden.jpg'),
('Skullpanda Skull Series', 'Skull Series', 'POP MART', 1350.00, 880.00, 'PM-SP-SK-001', 'Skullpanda in her iconic dark aesthetic with glowing skull accents.', 25, 'In Stock', 'images/skullpanda-skull.jpg'),
('Labubu The Monsters Series', 'The Monsters', 'POP MART', 1500.00, 950.00, 'PM-LAB-TM-001', 'Labubu with mischievous teeth and pointed ears, fan favourite.', 40, 'In Stock', 'images/labubu-monsters.jpg'),
('Labubu Macaron Series', 'Macaron', 'POP MART', 1200.00, 750.00, 'PM-LAB-MAC-001', 'Labubu in pastel macaron-themed outfit. Sweet and collectible.', 18, 'Low Stock', 'images/labubu-macaron.jpg'),
('Crybaby Broken Heart Series', 'Broken Heart', 'POP MART', 1050.00, 650.00, 'PM-CRY-BH-001', 'Crybaby shedding a single tear with a broken heart motif.', 35, 'In Stock', 'images/crybaby-brokenheart.jpg'),
('Crybaby Meteor Shower Series', 'Meteor Shower', 'POP MART', 1080.00, 670.00, 'PM-CRY-MS-001', 'Crybaby gazing at falling stars, dreamy and pastel colored.', 22, 'In Stock', 'images/crybaby-meteor.jpg'),
('Azrael Sweet Dreams', 'Sweet Dreams', 'POP MART', 1400.00, 900.00, 'PM-AZ-SD-001', 'Azrael the black cat in dreamland with cloud and moon details.', 10, 'Low Stock', 'images/azrael-sweetdreams.jpg'),
('Pucky Elf Series', 'Elf Series', 'POP MART', 920.00, 580.00, 'PM-PUC-ELF-001', 'Pucky as a tiny woodland elf with mushroom hat.', 45, 'In Stock', 'images/pucky-elf.jpg'),
('The Monsters Farmer Bob', 'Farmer Bob', 'POP MART', 1300.00, 820.00, 'PM-BOB-FB-001', 'Farmer Bob with overalls and a basket of vegetables. Adorable.', 28, 'In Stock', 'images/farmerbob.jpg');
