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
| The 'active' middleware on the whole group (Phase 26) refuses any
| request from a suspended account and destroys the session it arrived
| with — see App\Http\Middleware\EnsureAccountIsActive. It is HERE, on
| the group, rather than in each route file, for two reasons:
|
|   1. Suspension is account-wide. Before this existed, suspending
|      someone only stopped them logging in AGAIN: their already-open
|      browser kept publishing listings and taking bookings, because
|      auth:sanctum reloads the user from the database and never looks
|      at `status`.
|   2. A route file added in a later phase is covered automatically.
|      Nothing to remember, nothing to forget.
|
| It runs before each group's own auth:sanctum, and resolves the user
| itself. Unauthenticated and active requests pass straight through.
|
*/

Route::prefix('v1')->middleware('active')->group(function () {

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
    require __DIR__.'/api/reviews.php';
    require __DIR__.'/api/favorites.php';
    require __DIR__.'/api/notifications.php';
    require __DIR__.'/api/conversations.php';
    require __DIR__.'/api/owner.php';
    require __DIR__.'/api/amenities.php';
    require __DIR__.'/api/settings.php';
    require __DIR__.'/api/admin.php';
});
