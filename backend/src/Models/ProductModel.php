<?php
declare(strict_types=1);

namespace App\Models;

class ProductModel extends BaseModel
{
    public function listAll(): array
    {
        $stmt = $this->db->query("SELECT p.id, p.title, p.description, p.price, p.stock, c.name AS category
            FROM products p LEFT JOIN categories c ON c.id = p.category_id ORDER BY p.id DESC");
        $rows = $stmt->fetchAll();
        // Attach first image url (if any)
        foreach ($rows as &$r) {
            $img = $this->db->prepare('SELECT url FROM product_images WHERE product_id = ? ORDER BY sort_order ASC LIMIT 1');
            $img->execute([$r['id']]);
            $r['image'] = $img->fetchColumn() ?: null;
        }
        return $rows;
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare("SELECT p.id, p.title, p.description, p.price, p.stock, c.name AS category
            FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) return null;
        $imgs = $this->db->prepare('SELECT url FROM product_images WHERE product_id = ? ORDER BY sort_order ASC');
        $imgs->execute([$id]);
        $row['images'] = array_map(fn($r) => $r['url'], $imgs->fetchAll() ?: []);
        return $row;
    }

    public function create(array $data): int
    {
        $title = trim((string)($data['title'] ?? ''));
        $price = (float)($data['price'] ?? 0);
        $stock = (int)($data['stock'] ?? 0);
        $description = $data['description'] ?? null;
        $categoryId = $this->resolveCategoryId($data);
        $stmt = $this->db->prepare('INSERT INTO products(title, description, price, stock, category_id) VALUES (?,?,?,?,?)');
        $stmt->execute([$title, $description, $price, $stock, $categoryId]);
        return (int)$this->db->lastInsertId();
    }

    public function update(int $id, array $data): void
    {
        $categoryId = $this->resolveCategoryId($data, true);
        $stmt = $this->db->prepare('UPDATE products SET title = COALESCE(?, title), description = COALESCE(?, description), price = COALESCE(?, price), stock = COALESCE(?, stock), category_id = COALESCE(?, category_id) WHERE id = ?');
        $title = $data['title'] ?? null;
        $description = $data['description'] ?? null;
        $price = isset($data['price']) ? (float)$data['price'] : null;
        $stock = isset($data['stock']) ? (int)$data['stock'] : null;
        $stmt->execute([$title, $description, $price, $stock, $categoryId, $id]);
    }

    public function delete(int $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM products WHERE id = ?');
        $stmt->execute([$id]);
    }

    private function resolveCategoryId(array $data, bool $allowNull = false): ?int
    {
        // Accept category_id directly or category_name (create if missing)
        if (isset($data['category_id'])) return (int)$data['category_id'];
        $name = trim((string)($data['category_name'] ?? ''));
        if ($name === '') return $allowNull ? null : null;
        $sel = $this->db->prepare('SELECT id FROM categories WHERE name = ?');
        $sel->execute([$name]);
        $cid = $sel->fetchColumn();
        if ($cid) return (int)$cid;
        $ins = $this->db->prepare('INSERT INTO categories(name) VALUES(?)');
        $ins->execute([$name]);
        return (int)$this->db->lastInsertId();
    }
}
