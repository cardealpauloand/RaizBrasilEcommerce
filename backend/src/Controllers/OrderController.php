<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Models\OrderModel;

class OrderController
{
    private OrderModel $orders;
    public function __construct() { $this->orders = new OrderModel(); }

    public function create(Request $req): void
    {
        $data = $req->json();
        // Map payment status rule similar to frontend
        $method = $data['payment']['method'] ?? 'cartao';
        $status = ($method === 'cartao') ? 'pago' : 'aguardando';
        $data['status'] = $status;
        try {
            $orderId = $this->orders->create($data);
            Response::json(['id' => $orderId, 'status' => $status], 201);
        } catch (\Throwable $e) {
            Response::json(['error' => 'Failed to create order', 'message' => $e->getMessage()], 500);
        }
    }

    public function show(Request $req): void
    {
        $id = (int)($req->params['id'] ?? 0);
        $order = $this->orders->find($id);
        if (!$order) Response::json(['error' => 'Not Found'], 404);
        Response::json($order);
    }
}
