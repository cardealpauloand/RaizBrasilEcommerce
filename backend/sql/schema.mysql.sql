-- Raiz Brasil Ecommerce - MySQL schema
-- Run in a new database (e.g., raiz_brasil)

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- Users
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NULL,
  is_admin TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Addresses (shipping addresses)
CREATE TABLE IF NOT EXISTS addresses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  name VARCHAR(120) NULL,
  phone VARCHAR(20) NULL,
  street VARCHAR(200) NOT NULL,
  number VARCHAR(20) NOT NULL,
  complement VARCHAR(120) NULL,
  city VARCHAR(120) NOT NULL,
  state CHAR(2) NOT NULL,
  zip VARCHAR(8) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- Products
CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  price DECIMAL(10,2) NOT NULL,
  category_id INT NULL,
  gender ENUM('Masculina','Feminina','Unissex') DEFAULT 'Masculina',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Product images
CREATE TABLE IF NOT EXISTS product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  url VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_pimg_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  address_id INT NOT NULL,
  status ENUM('novo','aguardando','pago','processando','enviado','entregue','cancelado') NOT NULL DEFAULT 'novo',
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method ENUM('cartao','pix','boleto') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_orders_address FOREIGN KEY (address_id) REFERENCES addresses(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NULL,
  title VARCHAR(200) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  qty INT NOT NULL DEFAULT 1,
  size VARCHAR(10) NULL,
  CONSTRAINT fk_oitems_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_oitems_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  method ENUM('cartao','pix','boleto') NOT NULL,
  status ENUM('aguardando','pago','falhado') NOT NULL DEFAULT 'aguardando',
  pix_code TEXT NULL,
  boleto_line VARCHAR(255) NULL,
  card_last4 CHAR(4) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Shipments
CREATE TABLE IF NOT EXISTS shipments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  carrier VARCHAR(80) NULL,
  tracking_code VARCHAR(120) NULL,
  status ENUM('preparando','enviado','entregue') NOT NULL DEFAULT 'preparando',
  eta_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_shipments_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
) ENGINE=InnoDB;
