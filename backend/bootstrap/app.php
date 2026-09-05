<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Lets Sanctum issue stateful (cookie-based) auth to the React SPA
        // for requests coming from the domains listed in SANCTUM_STATEFUL_DOMAINS.
        $middleware->statefulApi();

        // CORS is required so the browser accepts responses from the API
        // when the React app runs on a different port (e.g. Vite's 5173).
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);

        // 'owner' gates the /owner/* dashboard routes (Phase 12) - see
        // App\Http\Middleware\EnsureUserOwnsAProperty for what it checks.
        $middleware->alias([
            'owner' => \App\Http\Middleware\EnsureUserOwnsAProperty::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
