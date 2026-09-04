<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Everything lives under /api/v1 so we can introduce a v2 later without
| breaking the frontend that's already talking to v1.
|
| Route files are grouped by domain and required below as each phase adds
| them (Phase 4: auth, Phase 5: properties, Phase 8: reservations, ...).
| This keeps this file short instead of becoming one giant route list.
|
*/

Route::prefix('v1')->group(function () {

    // Simple health check so we can verify the API is reachable from the
    // frontend before any real feature exists yet.
    Route::get('/ping', function () {
        return response()->json([
            'status' => 'ok',
            'app' => config('app.name'),
        ]);
    });

    require __DIR__.'/api/auth.php';
    require __DIR__.'/api/properties.php';
    require __DIR__.'/api/reservations.php';
    require __DIR__.'/api/payments.php';
    // require __DIR__.'/api/reviews.php';       // added in Phase 9
    // require __DIR__.'/api/favorites.php';     // added in Phase 10
    // require __DIR__.'/api/notifications.php'; // added in Phase 11
    // require __DIR__.'/api/owner.php';         // added in Phase 12
    // require __DIR__.'/api/admin.php';         // added in Phase 13
});
