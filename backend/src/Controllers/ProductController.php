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
}
