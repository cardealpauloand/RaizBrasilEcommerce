<?php
declare(strict_types=1);

namespace App\Models;

class OrderModel extends BaseModel
{
    public function create(array $payload): int
    {
        $this->db->beginTransaction();
        try {
            // Address
            $addr = $payload['shipping'] ?? [];
            $stmt = $this->db->prepare('INSERT INTO addresses (user_id, name, phone, street, number, complement, city, state, zip) VALUES (?,?,?,?,?,?,?,?,?)');
            $stmt->execute([
                $payload['user_id'] ?? null,
                $addr['name'] ?? '',
                $addr['phone'] ?? '',
                $addr['street'] ?? '',
                $addr['number'] ?? '',
                $addr['complement'] ?? '',
                $addr['city'] ?? '',
                $addr['state'] ?? '',
                $addr['cep'] ?? '',
            ]);
            $addressId = (int)$this->db->lastInsertId();

            // Order
            $stmt = $this->db->prepare('INSERT INTO orders (user_id, address_id, status, subtotal, shipping_cost, total, payment_method) VALUES (?,?,?,?,?,?,?)');
            $status = $payload['status'] ?? 'novo';
            $stmt->execute([
                $payload['user_id'] ?? null,
                $addressId,
                $status,
                $payload['subtotal'] ?? 0,
                $payload['shippingCost'] ?? 0,
                $payload['total'] ?? 0,
                $payload['payment']['method'] ?? 'cartao',
            ]);
            $orderId = (int)$this->db->lastInsertId();

            // Items
            $items = $payload['items'] ?? [];
            $itStmt = $this->db->prepare('INSERT INTO order_items (order_id, product_id, title, price, qty, size) VALUES (?,?,?,?,?,?)');
            foreach ($items as $it) {
                $itStmt->execute([
                    $orderId,
                    $it['productId'] ?? null,
                    $it['title'] ?? '',
                    $it['price'] ?? 0,
                    $it['qty'] ?? 1,
                    $it['size'] ?? 'M',
                ]);
            }

            // Payment record
            $p = $payload['payment'] ?? [];
            $pmStmt = $this->db->prepare('INSERT INTO payments (order_id, method, status, pix_code, boleto_line, card_last4) VALUES (?,?,?,?,?,?)');
            $pmStatus = $status === 'pago' ? 'pago' : 'aguardando';
            $pmStmt->execute([
                $orderId,
                $p['method'] ?? 'cartao',
                $pmStatus,
                $p['pix_code'] ?? null,
                $p['boleto_line'] ?? null,
                isset($p['card_number']) ? substr($p['card_number'], -4) : null,
            ]);

            $this->db->commit();
            return $orderId;
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }

    public function find(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM orders WHERE id = ?');
        $stmt->execute([$id]);
        $order = $stmt->fetch();
        if (!$order) return null;
        $addr = $this->db->prepare('SELECT * FROM addresses WHERE id = ?');
        $addr->execute([$order['address_id']]);
        $order['shipping'] = $addr->fetch();
        $items = $this->db->prepare('SELECT * FROM order_items WHERE order_id = ?');
        $items->execute([$id]);
        $order['items'] = $items->fetchAll();
        $pay = $this->db->prepare('SELECT * FROM payments WHERE order_id = ?');
        $pay->execute([$id]);
        $order['payment'] = $pay->fetch();
        return $order;
    }
}
