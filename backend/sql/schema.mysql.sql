
SET NAMES utf8mb4;
SET time_zone = '+00:00';

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

CREATE TABLE IF NOT EXISTS categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT NULL,
  price DECIMAL(10,2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  category_id INT NULL,
  gender ENUM('Masculina','Feminina','Unissex') DEFAULT 'Masculina',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product_images (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  url VARCHAR(500) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  CONSTRAINT fk_pimg_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS product_price_audit (
  id INT AUTO_INCREMENT PRIMARY KEY,
  product_id INT NOT NULL,
  old_price DECIMAL(10,2) NOT NULL,
  new_price DECIMAL(10,2) NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_pp_audit_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
) ENGINE=InnoDB;

DROP TRIGGER IF EXISTS trg_products_price_audit;
DELIMITER $$
CREATE TRIGGER trg_products_price_audit
BEFORE UPDATE ON products
FOR EACH ROW
BEGIN
  IF NEW.price <> OLD.price THEN
    INSERT INTO product_price_audit(product_id, old_price, new_price)
    VALUES(OLD.id, OLD.price, NEW.price);
  END IF;
END$$
DELIMITER ;

DROP FUNCTION IF EXISTS fn_has_stock;
DELIMITER $$
CREATE FUNCTION fn_has_stock(p_product_id INT, p_qty INT) RETURNS TINYINT
DETERMINISTIC
BEGIN
  DECLARE v_stock INT;
  SELECT stock INTO v_stock FROM products WHERE id = p_product_id;
  IF v_stock IS NULL THEN RETURN 0; END IF;
  IF v_stock >= p_qty THEN RETURN 1; ELSE RETURN 0; END IF;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_seed_fake_orders;
DELIMITER $$
CREATE PROCEDURE sp_seed_fake_orders(IN p_month INT, IN p_year INT, IN p_count INT)
BEGIN
  DECLARE i INT DEFAULT 0;
  WHILE i < p_count DO
    INSERT INTO addresses(street, number, city, state, zip)
    VALUES('Rua Demo','1','Sao Paulo','SP','01001000');
    SET @addr_id = LAST_INSERT_ID();

    INSERT INTO orders(address_id, status, subtotal, shipping_cost, total, payment_method, created_at)
    VALUES(@addr_id, 'pago', 100.00, 0.00, 100.00, 'cartao', MAKEDATE(p_year,1) + INTERVAL p_month-1 MONTH + INTERVAL FLOOR(RAND()*28) DAY);
    SET @order_id = LAST_INSERT_ID();

    SELECT id, price INTO @pid, @pprice FROM products ORDER BY RAND() LIMIT 1;
    INSERT INTO order_items(order_id, product_id, title, price, qty)
      SELECT @order_id, id, title, price, 1 FROM products WHERE id=@pid;

    SET i = i + 1;
  END WHILE;
END$$
DELIMITER ;

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_pimg_product_sort ON product_images(product_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status_created ON orders(status, created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order ON shipments(order_id);

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
