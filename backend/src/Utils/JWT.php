<?php
declare(strict_types=1);

namespace App\Utils;

class JWT
{
    private static string $secret = '';

    public static function init(string $secret): void
    {
        self::$secret = $secret;
    }

    public static function encode(array $payload, int $expiresIn = 86400): string
    {
        $header = [
            'alg' => 'HS256',
            'typ' => 'JWT'
        ];

        $payload['iat'] = time();
        $payload['exp'] = time() + $expiresIn;

        $headerEncoded = self::base64url_encode(json_encode($header));
        $payloadEncoded = self::base64url_encode(json_encode($payload));

        $signature = self::base64url_encode(
            hash_hmac('sha256', "$headerEncoded.$payloadEncoded", self::$secret, true)
        );

        return "$headerEncoded.$payloadEncoded.$signature";
    }

    public static function decode(string $token): ?array
    {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;

        [$headerEncoded, $payloadEncoded, $signatureEncoded] = $parts;

        $signature = self::base64url_encode(
            hash_hmac('sha256', "$headerEncoded.$payloadEncoded", self::$secret, true)
        );

        if (!hash_equals($signature, $signatureEncoded)) return null;

        $payload = json_decode(self::base64url_decode($payloadEncoded), true);
        if (!is_array($payload)) return null;

        if (isset($payload['exp']) && $payload['exp'] < time()) return null;

        return $payload;
    }

    private static function base64url_encode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    private static function base64url_decode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', strlen($data) % 4));
    }
}
