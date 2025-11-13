<?php
declare(strict_types=1);

namespace App\Http;

class Router
{
    private array $routes = [];

    public function get(string $path, $handler): void { $this->add('GET', $path, $handler); }
    public function post(string $path, $handler): void { $this->add('POST', $path, $handler); }
    public function put(string $path, $handler): void { $this->add('PUT', $path, $handler); }
    public function delete(string $path, $handler): void { $this->add('DELETE', $path, $handler); }

    private function add(string $method, string $path, $handler): void
    {
        $regex = preg_replace('#\{([a-zA-Z_][a-zA-Z0-9_]*)\}#', '(?P<$1>[^/]+)', $path);
        $regex = '#^' . $regex . '$#';
        $this->routes[] = compact('method', 'path', 'regex', 'handler');
    }

    public function dispatch(): void
    {
        $request = new Request();
        foreach ($this->routes as $r) {
            if ($request->method !== $r['method']) continue;
            if (preg_match($r['regex'], $request->path, $m)) {
                $params = array_filter($m, '\\is_string', ARRAY_FILTER_USE_KEY);
                $request->params = $params;
                $this->call($r['handler'], $request);
                return;
            }
        }
        http_response_code(404);
        echo json_encode(['error' => 'Not Found']);
    }

    private function call($handler, Request $req)
    {
        if (is_array($handler) && is_string($handler[0])) {
            $class = $handler[0]; $method = $handler[1];
            if (!class_exists($class)) { http_response_code(500); echo json_encode(['error'=>'Controller not found']); return; }
            $obj = new $class();
            return $obj->$method($req);
        }
        if (is_callable($handler)) return $handler($req);
        http_response_code(500); echo json_encode(['error' => 'Invalid route handler']);
    }
}
