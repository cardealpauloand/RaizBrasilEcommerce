<?php
declare(strict_types=1);

namespace App\Models;

class ProductModel extends BaseModel
{
    public function listAll(): array
    {
        $stmt = $this->db->query("SELECT p.id, p.title, p.description, p.price, c.name AS category
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
        $stmt = $this->db->prepare("SELECT p.id, p.title, p.description, p.price, c.name AS category
            FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) return null;
        $imgs = $this->db->prepare('SELECT url FROM product_images WHERE product_id = ? ORDER BY sort_order ASC');
        $imgs->execute([$id]);
        $row['images'] = array_map(fn($r) => $r['url'], $imgs->fetchAll() ?: []);
        return $row;
    }
}
