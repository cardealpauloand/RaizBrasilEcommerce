<?php
declare(strict_types=1);

namespace App\Http;

class Request
{
    public string $method;
    public string $path;
    public array $params = [];

    public function __construct()
    {
        $this->method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $uri = $_SERVER['REQUEST_URI'] ?? '/';
        $this->path = parse_url($uri, PHP_URL_PATH) ?: '/';
    }

    public function json(): array
    {
        $input = file_get_contents('php://input') ?: '';
        $data = json_decode($input, true);
        return is_array($data) ? $data : [];
    }
}
