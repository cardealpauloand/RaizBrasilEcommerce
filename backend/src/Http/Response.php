<?php
declare(strict_types=1);

namespace App\Http;

class Response
{
    public static function json($data, int $status = 200): void
    {
        http_response_code($status);
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        exit;
    }
}
