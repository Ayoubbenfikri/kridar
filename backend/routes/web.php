<?php

use App\Http\Controllers\Api\V1\Auth\GoogleAuthController;
use App\Http\Controllers\SitemapController;
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
| The two Google OAuth routes below are the one exception: they live here,
| under /api/v1 path-wise (so the URL still reads like every other
| endpoint) but NOT inside routes/api.php's actual route group, because
| this file carries Laravel's plain 'web' middleware group - a session
| that just works, every request, no conditions. routes/api.php sits under
| bootstrap/app.php's statefulApi(), which only starts a session when the
| request's Referer/Origin matches SANCTUM_STATEFUL_DOMAINS: true for
| /redirect (the browser is navigating away FROM the SPA) but false for
| /callback (Referer is accounts.google.com, matching nothing). Adding
| 'web' middleware on top of THAT, instead of moving the routes here, was
| tried first and made it worse - two different session middlewares ran on
| the same request, so Socialite wrote its CSRF 'state' into one session
| and read it back from the other, 100% of the time
| (Laravel\Socialite\Two\InvalidStateException). One middleware stack,
| here, is what actually fixes it.
|
*/

Route::get('/', function () {
    return response()->json([
        'app' => config('app.name'),
        'status' => 'Krihouse API is running.',
    ]);
});

// "Connect with Google" - both public and meant to be hit by a real
// browser navigation (the frontend button is a plain <a href>, not an
// axios call), same reasoning as AuthController::verifyEmail().
Route::get('/api/v1/auth/google/redirect', [GoogleAuthController::class, 'redirect']);
Route::get('/api/v1/auth/google/callback', [GoogleAuthController::class, 'callback']);

// SEO. Generated, not a static file, because it has to list every
// published property (see SitemapController) - a hand-written file
// would go stale the moment a listing is added or removed.
Route::get('/sitemap.xml', [SitemapController::class, 'index']);

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
