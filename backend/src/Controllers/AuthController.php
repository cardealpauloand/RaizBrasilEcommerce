<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Models\UserModel;

class AuthController
{
    private UserModel $users;
    public function __construct() { $this->users = new UserModel(); }

    public function register(Request $req): void
    {
        $data = $req->json();
        $name = trim($data['name'] ?? '');
        $email = trim($data['email'] ?? '');
        $password = (string)($data['password'] ?? '');
        if (!$name || !$email || !$password) Response::json(['error'=>'Missing fields'], 422);
        // simple duplication check
        if ($this->users->findByEmail($email)) Response::json(['error' => 'Email already in use'], 409);
        $id = $this->users->create($name, $email, $password);
        Response::json(['id' => $id, 'name' => $name, 'email' => $email]);
    }

    public function login(Request $req): void
    {
        $data = $req->json();
        $email = trim($data['email'] ?? '');
        $password = (string)($data['password'] ?? '');
        $u = $this->users->findByEmail($email);
        if (!$u || !password_verify($password, $u['password_hash'])) Response::json(['error'=>'Invalid credentials'], 401);
        // In a real app we would issue a JWT/session. Here we just echo user basics.
        Response::json(['id'=>$u['id'], 'name'=>$u['name'], 'email'=>$u['email'], 'is_admin'=>(bool)$u['is_admin']]);
    }
}
