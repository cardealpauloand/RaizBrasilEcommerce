<?php
declare(strict_types=1);

namespace App\Models;

class UserModel extends BaseModel
{
    public function create(string $name, string $email, string $password): int
    {
        $hash = password_hash($password, PASSWORD_BCRYPT);
        $stmt = $this->db->prepare('INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)');
        $stmt->execute([$name, $email, $hash]);
        return (int)$this->db->lastInsertId();
    }

    public function findByEmail(string $email): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE email = ?');
        $stmt->execute([$email]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function findById(int $id): ?array
    {
        $stmt = $this->db->prepare('SELECT * FROM users WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        return $row ?: null;
    }

    public function update(int $id, array $data): bool
    {
        $fields = [];
        $values = [];
        foreach ($data as $key => $value) {
            if (in_array($key, ['name', 'phone', 'email'])) {
                $fields[] = "$key = ?";
                $values[] = $value;
            }
        }
        if (empty($fields)) return true;
        $values[] = $id;
        $stmt = $this->db->prepare('UPDATE users SET ' . implode(', ', $fields) . ', updated_at = NOW() WHERE id = ?');
        return $stmt->execute($values);
    }
}
