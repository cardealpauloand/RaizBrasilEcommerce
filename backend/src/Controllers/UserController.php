<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;
use App\Http\AuthMiddleware;
use App\Models\UserModel;

class UserController
{
    private UserModel $users;

    public function __construct() {
        $this->users = new UserModel();
    }

    public function getProfile(Request $req): void
    {
        $payload = AuthMiddleware::requireAuth();
        if (!$payload) Response::json(['error' => 'Unauthorized'], 401);

        $user = $this->users->findById((int)$payload['id']);
        if (!$user) Response::json(['error' => 'User not found'], 404);

        Response::json([
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'phone' => $user['phone'],
            'is_admin' => (bool)$user['is_admin']
        ]);
    }

    public function updateProfile(Request $req): void
    {
        $payload = AuthMiddleware::requireAuth();
        if (!$payload) Response::json(['error' => 'Unauthorized'], 401);

        $data = $req->json();
        $name = trim($data['name'] ?? '');
        $phone = trim($data['phone'] ?? '');

        if ($name && strlen($name) < 2) {
            Response::json(['error' => 'Name must be at least 2 characters'], 422);
        }

        if ($phone && strlen($phone) < 10) {
            Response::json(['error' => 'Phone must be at least 10 characters'], 422);
        }

        // Update user
        $updateData = [];
        if ($name) $updateData['name'] = $name;
        if ($phone) $updateData['phone'] = $phone;

        if (!empty($updateData)) {
            $this->users->update((int)$payload['id'], $updateData);
        }

        $user = $this->users->findById((int)$payload['id']);
        Response::json([
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'phone' => $user['phone'],
            'is_admin' => (bool)$user['is_admin']
        ]);
    }
}
