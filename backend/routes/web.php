<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Kridar's backend is a pure JSON API — the React app is a separate
| project and never renders Blade views. This route just confirms the
| API is up if someone opens the backend URL directly in a browser.
| Real endpoints all live in routes/api.php under /api/v1.
|
*/

Route::get('/', function () {
    return response()->json([
        'app' => config('app.name'),
        'status' => 'Kridar API is running.',
    ]);
});
