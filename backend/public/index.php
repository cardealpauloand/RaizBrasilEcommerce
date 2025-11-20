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
use App\Controllers\CategoryController;
use App\Controllers\AuthController;
use App\Controllers\UserController;
use App\Controllers\CartController;
use App\Controllers\SavedItemController;
use App\Controllers\OrderController;

$router = new Router();

// Health
$router->get('/api/health', [HealthController::class, 'index']);

// Products
$router->get('/api/products', [ProductController::class, 'index']);
$router->get('/api/products/{id}', [ProductController::class, 'show']);
$router->post('/api/products', [ProductController::class, 'store']);
$router->put('/api/products/{id}', [ProductController::class, 'update']);
$router->delete('/api/products/{id}', [ProductController::class, 'destroy']);

// Categories
$router->get('/api/categories', [CategoryController::class, 'index']);
$router->post('/api/categories', [CategoryController::class, 'store']);
$router->put('/api/categories/{id}', [CategoryController::class, 'update']);
$router->delete('/api/categories/{id}', [CategoryController::class, 'destroy']);

// Auth
$router->post('/api/register', [AuthController::class, 'register']);
$router->post('/api/login', [AuthController::class, 'login']);
$router->get('/api/me', [AuthController::class, 'me']);

// User Profile
$router->get('/api/users/me', [UserController::class, 'getProfile']);
$router->put('/api/users/me', [UserController::class, 'updateProfile']);

// Cart
$router->get('/api/cart', [CartController::class, 'get']);
$router->post('/api/cart/items', [CartController::class, 'addItem']);
$router->put('/api/cart/items/{id}', [CartController::class, 'updateItem']);
$router->delete('/api/cart/items/{id}', [CartController::class, 'removeItem']);
$router->delete('/api/cart', [CartController::class, 'clear']);

// Saved Items (Wishlist)
$router->get('/api/saved', [SavedItemController::class, 'list']);
$router->post('/api/saved', [SavedItemController::class, 'add']);
$router->delete('/api/saved/{id}', [SavedItemController::class, 'remove']);
$router->delete('/api/saved/clear', [SavedItemController::class, 'clear']);

// Orders
$router->get('/api/orders', [OrderController::class, 'index']);
$router->post('/api/orders', [OrderController::class, 'create']);
$router->get('/api/orders/{id}', [OrderController::class, 'show']);
$router->post('/api/orders/{id}/status', [OrderController::class, 'updateStatus']);
$router->delete('/api/orders/{id}', [OrderController::class, 'destroy']);
$router->get('/api/users/me/orders', [OrderController::class, 'listUserOrders']);

$router->dispatch();
