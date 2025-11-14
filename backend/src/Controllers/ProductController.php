<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Models\ProductModel;

class ProductController
{
    private ProductModel $model;
    public function __construct() { $this->model = new ProductModel(); }

    public function index(Request $req): void
    {
        $rows = $this->model->listAll();
        Response::json($rows);
    }

    public function show(Request $req): void
    {
        $id = (int)($req->params['id'] ?? 0);
        $row = $this->model->findById($id);
        if (!$row) Response::json(['error' => 'Not Found'], 404);
        Response::json($row);
    }

    public function store(Request $req): void
    {
        $data = $req->json();
        if (!isset($data['title']) || !isset($data['price'])) Response::json(['error'=>'Missing required fields'], 422);
        $id = $this->model->create($data);
        Response::json(['id'=>$id], 201);
    }

    public function update(Request $req): void
    {
        $id = (int)($req->params['id'] ?? 0);
        $data = $req->json();
        try{
            $this->model->update($id, $data);
            Response::json(['ok'=>true]);
        }catch(\Throwable $e){ Response::json(['error'=>'Update failed','message'=>$e->getMessage()], 500); }
    }

    public function destroy(Request $req): void
    {
        $id = (int)($req->params['id'] ?? 0);
        try{ $this->model->delete($id); Response::json(['ok'=>true]); }
        catch(\Throwable $e){ Response::json(['error'=>'Delete failed','message'=>$e->getMessage()], 500); }
    }
}
