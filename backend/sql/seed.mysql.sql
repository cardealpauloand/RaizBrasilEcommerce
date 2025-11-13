-- Seed basic data
INSERT INTO categories (name) VALUES ('Camisetas') ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Insert sample products
INSERT INTO products (title, description, price, category_id, gender)
SELECT 'Camiseta Raiz Brasil Agrícola', 'Tecido premium, ideal para o dia a dia no campo. Estampa agrícola exclusiva.', 139.90, c.id, 'Masculina'
FROM categories c WHERE c.name='Camisetas';

INSERT INTO products (title, description, price, category_id, gender)
SELECT 'Camiseta Raiz Brasil Azul', 'Conforto e estilo em tom azul. Perfeita para feiras e eventos.', 139.90, c.id, 'Masculina'
FROM categories c WHERE c.name='Camisetas';

INSERT INTO products (title, description, price, category_id, gender)
SELECT 'Camiseta Raiz Brasil Azul & Cinza', 'Combinação moderna de azul e cinza, com a força do agro.', 139.90, c.id, 'Masculina'
FROM categories c WHERE c.name='Camisetas';

-- Images (first image only as example)
INSERT INTO product_images (product_id, url, sort_order)
SELECT p.id, '/RaizBrasilAgricolaFrente.jpg', 0 FROM products p WHERE p.title='Camiseta Raiz Brasil Agrícola';
INSERT INTO product_images (product_id, url, sort_order)
SELECT p.id, '/RaizBrasilAzulFrente.jpg', 0 FROM products p WHERE p.title='Camiseta Raiz Brasil Azul';
INSERT INTO product_images (product_id, url, sort_order)
SELECT p.id, '/RaizBrasilAzulECinzaFrente.jpg', 0 FROM products p WHERE p.title='Camiseta Raiz Brasil Azul & Cinza';
