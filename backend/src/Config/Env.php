<?php
declare(strict_types=1);

namespace App\Config;

class Env
{
    private static bool $booted = false;

    public static function init(string $projectRoot): void
    {
        if (self::$booted) return;
        // Try to load Dotenv if available (composer). If not, fallback to .env parse.
        $envPath = $projectRoot . '/.env';
        if (class_exists('Dotenv\\Dotenv')) {
            // Avoid hard-referencing the class to keep linters happy when composer deps aren't installed
            $dotenvClass = 'Dotenv\\Dotenv';
            /** @var object $dotenv */
            $dotenv = $dotenvClass::createImmutable($projectRoot);
            if (method_exists($dotenv, 'safeLoad')) {
                $dotenv->safeLoad();
            } else if (method_exists($dotenv, 'load')) {
                $dotenv->load();
            }
        } else if (file_exists($envPath)) {
            $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
            foreach ($lines as $line) {
                if (str_starts_with(trim($line), '#')) continue;
                [$k, $v] = array_map('trim', explode('=', $line, 2) + [null, null]);
                if ($k !== null && $v !== null) {
                    // Strip optional wrapping quotes from values ("..." or '...')
                    if ((str_starts_with($v, '"') && str_ends_with($v, '"')) || (str_starts_with($v, "'") && str_ends_with($v, "'"))) {
                        $v = substr($v, 1, -1);
                    }
                    $_ENV[$k] = $v;
                    putenv("$k=$v");
                }
            }
        }
        self::$booted = true;
    }

    public static function get(string $key, ?string $default = null): ?string
    {
        $val = $_ENV[$key] ?? getenv($key) ?: null;
        return $val !== null ? $val : $default;
    }
}
