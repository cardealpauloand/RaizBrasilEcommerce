<?php
declare(strict_types=1);

namespace App\Models;

class CategoryModel extends BaseModel
{
    public function listAll(): array
    {
        $stmt = $this->db->query('SELECT id, name FROM categories ORDER BY name ASC');
        return $stmt->fetchAll();
    }

    public function create(string $name): int
    {
        $stmt = $this->db->prepare('INSERT INTO categories(name) VALUES(?)');
        $stmt->execute([$name]);
        return (int)$this->db->lastInsertId();
    }

    public function update(int $id, string $name): void
    {
        $stmt = $this->db->prepare('UPDATE categories SET name = ? WHERE id = ?');
        $stmt->execute([$name, $id]);
    }

    public function delete(int $id): void
    {
        $stmt = $this->db->prepare('DELETE FROM categories WHERE id = ?');
        $stmt->execute([$id]);
    }
}
