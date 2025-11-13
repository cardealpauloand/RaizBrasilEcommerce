<?php
// Front controller
declare(strict_types=1);

// If using Composer, include autoloader
$vendorAutoload = __DIR__ . '/../vendor/autoload.php';
if (file_exists($vendorAutoload)) {
    require $vendorAutoload;
}

require __DIR__ . '/../src/bootstrap.php';

use App\Http\Router;
use App\Controllers\HealthController;
use App\Controllers\ProductController;
use App\Controllers\AuthController;
use App\Controllers\OrderController;

$router = new Router();

// Health
$router->get('/api/health', [HealthController::class, 'index']);

// Products
$router->get('/api/products', [ProductController::class, 'index']);
$router->get('/api/products/{id}', [ProductController::class, 'show']);

// Auth
$router->post('/api/register', [AuthController::class, 'register']);
$router->post('/api/login', [AuthController::class, 'login']);

// Orders
$router->post('/api/orders', [OrderController::class, 'create']);
$router->get('/api/orders/{id}', [OrderController::class, 'show']);

$router->dispatch();
