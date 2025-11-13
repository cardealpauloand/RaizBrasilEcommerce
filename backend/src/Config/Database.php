<?php
declare(strict_types=1);

namespace App\Config;

use PDO;
use PDOException;

class Database
{
    private static ?PDO $pdo = null;

    public static function pdo(): PDO
    {
        if (self::$pdo instanceof PDO) return self::$pdo;

        $host = Env::get('DB_HOST', '127.0.0.1');
        $port = Env::get('DB_PORT', '3306');
        $db   = Env::get('DB_DATABASE', 'raiz_brasil');
        $user = Env::get('DB_USERNAME', 'root');
        $pass = Env::get('DB_PASSWORD', '');

        $dsn = "mysql:host={$host};port={$port};dbname={$db};charset=utf8mb4";
        try {
            $pdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]);
            self::$pdo = $pdo;
            return $pdo;
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['error' => 'DB connection failed', 'message' => $e->getMessage()]);
            exit;
        }
    }
}
