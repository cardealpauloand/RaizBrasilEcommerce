<?php
declare(strict_types=1);

namespace App\Models;

class SavedItemModel extends BaseModel
{
    public function list(int $userId): array
    {
        $stmt = $this->db->prepare('
            SELECT si.id, si.product_id, si.size, si.saved_at,
                   p.title, p.price
            FROM saved_items si
            LEFT JOIN products p ON si.product_id = p.id
            WHERE si.user_id = ?
            ORDER BY si.saved_at DESC
        ');
        $stmt->execute([$userId]);
        return $stmt->fetchAll();
    }

    public function add(int $userId, int $productId, ?string $size = null): array
    {
        // Check if already saved
        $stmt = $this->db->prepare('
            SELECT id FROM saved_items
            WHERE user_id = ? AND product_id = ? AND size IS ?
        ');
        $stmt->execute([$userId, $productId, $size]);
        $existing = $stmt->fetch();

        if ($existing) {
            // Already saved, return existing
            return $existing;
        }

        // Insert new saved item
        $stmt = $this->db->prepare('
            INSERT INTO saved_items (user_id, product_id, size)
            VALUES (?, ?, ?)
        ');
        $stmt->execute([$userId, $productId, $size]);

        // Return new item with product data
        $stmt = $this->db->prepare('
            SELECT si.id, si.product_id, si.size, si.saved_at,
                   p.title, p.price
            FROM saved_items si
            LEFT JOIN products p ON si.product_id = p.id
            WHERE si.id = ?
        ');
        $stmt->execute([$this->db->lastInsertId()]);
        return $stmt->fetch();
    }

    public function remove(int $userId, int $itemId): bool
    {
        $stmt = $this->db->prepare('
            DELETE FROM saved_items
            WHERE id = ? AND user_id = ?
        ');
        $stmt->execute([$itemId, $userId]);
        return $stmt->rowCount() > 0;
    }

    public function clear(int $userId): bool
    {
        $stmt = $this->db->prepare('DELETE FROM saved_items WHERE user_id = ?');
        $stmt->execute([$userId]);
        return true;
    }
}
