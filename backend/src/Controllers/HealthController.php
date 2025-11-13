<?php
declare(strict_types=1);

namespace App\Controllers;

use App\Http\Request;
use App\Http\Response;

class HealthController
{
    public function index(Request $req): void
    {
        Response::json(['status' => 'ok', 'time' => date('c')]);
    }
}
