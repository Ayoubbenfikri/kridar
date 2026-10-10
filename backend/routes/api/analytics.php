<?php

use App\Http\Controllers\Api\V1\AnalyticsController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Admin analytics - collecting (Phase A1)
|--------------------------------------------------------------------------
|
| PUBLIC: most visitors are not logged in, and they are exactly the ones
| the numbers are about. Throttled per IP: a real visitor sends one event
| per page plus a few clicks, far under 120 a minute; a script trying to
| inflate the numbers is cut off quickly.
|
| Reading the numbers is admin-only and lives in routes/api/admin.php
| (Phase A2).
|
*/

Route::post('/analytics/collect', [AnalyticsController::class, 'collect'])
    ->middleware('throttle:120,1');
