-- Safe to run multiple times — adds discount support to existing popstop_db
USE popstop_db;

CREATE TABLE IF NOT EXISTS discounts (
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

-- Add order columns only if they do not exist yet
SET @db = DATABASE();

SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'subtotal_amount') = 0,
    'ALTER TABLE orders ADD COLUMN subtotal_amount DECIMAL(10,2) DEFAULT 0 AFTER user_id',
    'SELECT ''subtotal_amount already exists'' AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'discount_code') = 0,
    'ALTER TABLE orders ADD COLUMN discount_code VARCHAR(50) DEFAULT NULL AFTER subtotal_amount',
    'SELECT ''discount_code already exists'' AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = IF(
    (SELECT COUNT(*) FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'discount_amount') = 0,
    'ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0 AFTER discount_code',
    'SELECT ''discount_amount already exists'' AS info'
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

INSERT IGNORE INTO discounts (code, description, discount_type, discount_value, min_order_amount, max_uses, is_active) VALUES
('POPSTOP10', '10% off your order', 'percent', 10.00, 500.00, 100, 1),
('SAVE100', 'P100 off orders P1000+', 'fixed', 100.00, 1000.00, 50, 1),
('WELCOME50', 'P50 welcome discount', 'fixed', 50.00, 300.00, NULL, 1);

-- Verify setup
SELECT 'Discount setup complete' AS status;
SELECT code, description, discount_type, discount_value, min_order_amount, is_active FROM discounts;
