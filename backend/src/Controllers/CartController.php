<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Http\AuthMiddleware;
use App\Models\CartModel;

class CartController
{
    private CartModel $cart;

    public function __construct() {
        $this->cart = new CartModel();
    }

    public function get(Request $req): void
    {
        $payload = AuthMiddleware::requireAuth();
        if (!$payload) Response::json(['error' => 'Unauthorized'], 401);

        $cart = $this->cart->getOrCreate((int)$payload['id']);
        Response::json($cart);
    }

    public function addItem(Request $req): void
    {
        $payload = AuthMiddleware::requireAuth();
        if (!$payload) Response::json(['error' => 'Unauthorized'], 401);

        $data = $req->json();
        $productId = (int)($data['product_id'] ?? 0);
        $qty = (int)($data['qty'] ?? 1);
        $size = $data['size'] ?? null;

        if (!$productId || $qty <= 0) {
            Response::json(['error' => 'Invalid product_id or qty'], 422);
        }

        $cart = $this->cart->getOrCreate((int)$payload['id']);
        $item = $this->cart->addItem($cart['id'], $productId, $qty, $size);

        if (!$item) {
            Response::json(['error' => 'Product not found'], 404);
        }

        Response::json($item, 201);
    }

    public function updateItem(Request $req): void
    {
        $payload = AuthMiddleware::requireAuth();
        if (!$payload) Response::json(['error' => 'Unauthorized'], 401);

        $itemId = (int)$req->params['id'];
        $data = $req->json();
        $qty = (int)($data['qty'] ?? 0);

        $cart = $this->cart->getOrCreate((int)$payload['id']);
        $updated = $this->cart->updateItem($cart['id'], $itemId, $qty);

        if (!$updated) {
            Response::json(['error' => 'Item not found'], 404);
        }

        Response::json(['success' => true]);
    }

    public function removeItem(Request $req): void
    {
        $payload = AuthMiddleware::requireAuth();
        if (!$payload) Response::json(['error' => 'Unauthorized'], 401);

        $itemId = (int)$req->params['id'];
        $cart = $this->cart->getOrCreate((int)$payload['id']);
        $removed = $this->cart->removeItem($cart['id'], $itemId);

        if (!$removed) {
            Response::json(['error' => 'Item not found'], 404);
        }

        Response::json(['success' => true]);
    }

    public function clear(Request $req): void
    {
        $payload = AuthMiddleware::requireAuth();
        if (!$payload) Response::json(['error' => 'Unauthorized'], 401);

        $cart = $this->cart->getOrCreate((int)$payload['id']);
        $this->cart->clear($cart['id']);

        Response::json(['success' => true]);
    }
}
