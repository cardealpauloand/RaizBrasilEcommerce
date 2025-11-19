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

    public function index(Request $req): void
    {
        Response::json($this->orders->listAll());
    }

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
            $msg = $e->getMessage();
            if (stripos($msg, 'Sem estoque') !== false) {
                Response::json(['error' => 'Sem estoque', 'message' => $msg], 409);
            }
            Response::json(['error' => 'Failed to create order', 'message' => $msg], 500);
        }
    }

    public function show(Request $req): void
    {
        $id = (int)($req->params['id'] ?? 0);
        $order = $this->orders->find($id);
        if (!$order) Response::json(['error' => 'Not Found'], 404);
        Response::json($order);
    }

    public function updateStatus(Request $req): void
    {
        $id = (int)($req->params['id'] ?? 0);
        $data = $req->json();
        $status = (string)($data['status'] ?? '');
        try{
            $this->orders->updateStatus($id, $status);
            Response::json(['ok'=>true]);
        }catch(\Throwable $e){ Response::json(['error'=>'Failed to update status','message'=>$e->getMessage()], 400); }
    }

    public function destroy(Request $req): void
    {
        $id = (int)($req->params['id'] ?? 0);
        try{
            $this->orders->delete($id);
            Response::json(['ok'=>true]);
        }catch(\Throwable $e){
            $msg = $e->getMessage();
            if (stripos($msg, 'não encontrado') !== false || stripos($msg, 'not found') !== false) {
                Response::json(['error'=>'Not Found'], 404);
                return;
            }
            Response::json(['error'=>'Failed to delete order','message'=>$msg], 400);
        }
    }
}
