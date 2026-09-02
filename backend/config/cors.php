<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Kridar's React frontend (Vite dev server) runs on a different port
    | than the Laravel API, so the browser treats every request as
    | cross-origin. This config, together with Sanctum's stateful-domain
    | check, is what allows the SPA to authenticate via cookies.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // Comma-separated list in .env, e.g. CORS_ALLOWED_ORIGINS=http://localhost:5173
    'allowed_origins' => explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173')),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    // Must be true for Sanctum's SPA cookie authentication to work.
    'supports_credentials' => true,

];
