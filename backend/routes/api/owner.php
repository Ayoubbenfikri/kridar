<?php

use App\Http\Controllers\Api\V1\OwnerController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'owner'])->prefix('owner')->group(function () {
    Route::get('/properties', [OwnerController::class, 'properties']);
    Route::get('/reservations', [OwnerController::class, 'reservations']);
    Route::get('/stats', [OwnerController::class, 'stats']);
});
