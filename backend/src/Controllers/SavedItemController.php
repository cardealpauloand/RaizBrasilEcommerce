<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Http\AuthMiddleware;
use App\Models\SavedItemModel;

class SavedItemController
{
    private SavedItemModel $saved;

    public function __construct() {
        $this->saved = new SavedItemModel();
    }

    public function list(Request $req): void
    {
        $payload = AuthMiddleware::requireAuth();
        if (!$payload) Response::json(['error' => 'Unauthorized'], 401);

        $items = $this->saved->list((int)$payload['id']);
        Response::json($items);
    }

    public function add(Request $req): void
    {
        $payload = AuthMiddleware::requireAuth();
        if (!$payload) Response::json(['error' => 'Unauthorized'], 401);

        $data = $req->json();
        $productId = (int)($data['product_id'] ?? 0);
        $size = $data['size'] ?? null;

        if (!$productId) {
            Response::json(['error' => 'Invalid product_id'], 422);
        }

        $item = $this->saved->add((int)$payload['id'], $productId, $size);

        if (!$item) {
            Response::json(['error' => 'Product not found'], 404);
        }

        Response::json($item, 201);
    }

    public function remove(Request $req): void
    {
        $payload = AuthMiddleware::requireAuth();
        if (!$payload) Response::json(['error' => 'Unauthorized'], 401);

        $itemId = (int)$req->params['id'];
        $removed = $this->saved->remove((int)$payload['id'], $itemId);

        if (!$removed) {
            Response::json(['error' => 'Item not found'], 404);
        }

        Response::json(['success' => true]);
    }

    public function clear(Request $req): void
    {
        $payload = AuthMiddleware::requireAuth();
        if (!$payload) Response::json(['error' => 'Unauthorized'], 401);

        $this->saved->clear((int)$payload['id']);
        Response::json(['success' => true]);
    }
}
