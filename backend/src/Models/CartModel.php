<?php
declare(strict_types=1);

namespace App\Models;

class CartModel extends BaseModel
{
    public function getOrCreate(int $userId): array
    {
        // Check if cart exists
        $stmt = $this->db->prepare('SELECT * FROM carts WHERE user_id = ?');
        $stmt->execute([$userId]);
        $cart = $stmt->fetch();

        if (!$cart) {
            // Create new cart
            $stmt = $this->db->prepare('INSERT INTO carts (user_id) VALUES (?)');
            $stmt->execute([$userId]);
            $cartId = (int)$this->db->lastInsertId();
            return ['id' => $cartId, 'user_id' => $userId, 'items' => []];
        }

        // Get cart items
        $stmt = $this->db->prepare('
            SELECT ci.id, ci.product_id, ci.qty, ci.size, p.title, p.price
            FROM cart_items ci
            LEFT JOIN products p ON ci.product_id = p.id
            WHERE ci.cart_id = ?
            ORDER BY ci.added_at
        ');
        $stmt->execute([$cart['id']]);
        $items = $stmt->fetchAll();

        return [
            'id' => $cart['id'],
            'user_id' => $cart['user_id'],
            'items' => $items ?: []
        ];
    }

    public function addItem(int $cartId, int $productId, int $qty, ?string $size = null): array
    {
        // Check if item already exists
        $stmt = $this->db->prepare('
            SELECT id, qty FROM cart_items
            WHERE cart_id = ? AND product_id = ? AND size IS ?
        ');
        $stmt->execute([$cartId, $productId, $size]);
        $existing = $stmt->fetch();

        if ($existing) {
            // Update quantity
            $newQty = (int)$existing['qty'] + $qty;
            $stmt = $this->db->prepare('UPDATE cart_items SET qty = ? WHERE id = ?');
            $stmt->execute([$newQty, $existing['id']]);
        } else {
            // Insert new item
            $stmt = $this->db->prepare('
                INSERT INTO cart_items (cart_id, product_id, qty, size)
                VALUES (?, ?, ?, ?)
            ');
            $stmt->execute([$cartId, $productId, $qty, $size]);
        }

        // Return updated item with product data
        $stmt = $this->db->prepare('
            SELECT ci.id, ci.product_id, ci.qty, ci.size, p.title, p.price
            FROM cart_items ci
            LEFT JOIN products p ON ci.product_id = p.id
            WHERE ci.cart_id = ? AND ci.product_id = ?
            LIMIT 1
        ');
        $stmt->execute([$cartId, $productId]);
        return $stmt->fetch();
    }

    public function updateItem(int $cartId, int $itemId, int $qty): bool
    {
        if ($qty <= 0) {
            return $this->removeItem($cartId, $itemId);
        }

        $stmt = $this->db->prepare('
            UPDATE cart_items SET qty = ?
            WHERE id = ? AND cart_id = ?
        ');
        $stmt->execute([$qty, $itemId, $cartId]);
        return $stmt->rowCount() > 0;
    }

    public function removeItem(int $cartId, int $itemId): bool
    {
        $stmt = $this->db->prepare('
            DELETE FROM cart_items
            WHERE id = ? AND cart_id = ?
        ');
        $stmt->execute([$itemId, $cartId]);
        return $stmt->rowCount() > 0;
    }

    public function clear(int $cartId): bool
    {
        $stmt = $this->db->prepare('DELETE FROM cart_items WHERE cart_id = ?');
        $stmt->execute([$cartId]);
        return true;
    }
}
