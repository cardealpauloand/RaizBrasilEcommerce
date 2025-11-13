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
}
