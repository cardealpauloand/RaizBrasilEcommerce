<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Models\CategoryModel;

class CategoryController
{
    private CategoryModel $cats;
    public function __construct(){ $this->cats = new CategoryModel(); }

    public function index(Request $req): void
    {
        Response::json($this->cats->listAll());
    }

    public function store(Request $req): void
    {
        $data = $req->json();
        $name = trim((string)($data['name'] ?? ''));
        if($name==='') Response::json(['error'=>'Name required'], 422);
        $id = $this->cats->create($name);
        Response::json(['id'=>$id], 201);
    }

    public function update(Request $req): void
    {
        $id = (int)($req->params['id'] ?? 0);
        $data = $req->json();
        $name = trim((string)($data['name'] ?? ''));
        if($name==='') Response::json(['error'=>'Name required'], 422);
        $this->cats->update($id, $name);
        Response::json(['ok'=>true]);
    }

    public function destroy(Request $req): void
    {
        $id = (int)($req->params['id'] ?? 0);
        $this->cats->delete($id);
        Response::json(['ok'=>true]);
    }
}
