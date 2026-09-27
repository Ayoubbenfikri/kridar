<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Krihouse's backend is a pure JSON API — the React app is a separate
| project and never renders Blade views. This route just confirms the
| API is up if someone opens the backend URL directly in a browser.
| Real endpoints all live in routes/api.php under /api/v1.
|
*/

Route::get('/', function () {
    return response()->json([
        'app' => config('app.name'),
        'status' => 'Krihouse API is running.',
    ]);
});

// React Router owns every other frontend path (e.g. /properties,
// /properties/5) client-side, but that only works once the SPA's JS has
// already loaded in the browser. A full page load or a refresh asks
// Laravel directly for that exact path, and until now Laravel had
// nothing registered for it beyond '/', so it 404'd.
//
// This fallback only runs for a request that matched NOTHING else —
// every /api/v1/* endpoint is matched first and never reaches here. A
// genuinely wrong /api/... path still gets Laravel's normal JSON 404,
// not the SPA's index.html, via the check below.
Route::fallback(function () {
    if (request()->is('api/*')) {
        abort(404);
    }

    return response()->file(public_path('index.html'));
});
