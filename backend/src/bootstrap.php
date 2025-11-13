<?php
declare(strict_types=1);

use App\Config\Env;

// Basic headers/CORS
header('Content-Type: application/json');
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowed = Env::get('CORS_ORIGIN', '*');
if ($allowed === '*' || $origin === $allowed) {
    header('Access-Control-Allow-Origin: ' . ($allowed === '*' ? '*' : $allowed));
    header('Vary: Origin');
}
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Load env
require_once __DIR__ . '/Config/Env.php';
Env::init(__DIR__ . '/..');

// Simple error reporting
if (Env::get('APP_DEBUG', 'true') === 'true') {
    ini_set('display_errors', '1');
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', '0');
}

// Ensure classes are loadable if Composer isn't installed
spl_autoload_register(function ($class) {
    $prefix = 'App\\';
    $base_dir = __DIR__ . '/';
    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }
    $relative_class = substr($class, $len);
    $file = $base_dir . str_replace('\\', '/', $relative_class) . '.php';
    if (file_exists($file)) {
        require $file;
    }
});
