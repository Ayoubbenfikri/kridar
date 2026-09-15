<?php

use App\Http\Controllers\Api\V1\SettingController;
use Illuminate\Support\Facades\Route;

// Public: the publication fee and the commission rate are shown to
// owners and guests before they commit to anything. Writing them is in
// routes/api/admin.php.
Route::get('/settings', [SettingController::class, 'index']);
