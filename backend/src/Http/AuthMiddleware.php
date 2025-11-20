<?php
declare(strict_types=1);

namespace App\Http;

use App\Utils\JWT;

class AuthMiddleware
{
    public static function requireAuth(): ?array
    {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

        if (!preg_match('/^Bearer\s+(.+)$/i', $authHeader, $matches)) {
            return null;
        }

        $token = $matches[1];
        $payload = JWT::decode($token);

        if (!$payload) {
            return null;
        }

        return $payload;
    }
}
