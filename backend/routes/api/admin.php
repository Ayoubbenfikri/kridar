<?php

use App\Http\Controllers\Api\V1\AdminController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
    Route::get('/users', [AdminController::class, 'users']);
    Route::patch('/users/{user}/suspend', [AdminController::class, 'suspendUser']);

    Route::get('/properties', [AdminController::class, 'properties']);
    Route::patch('/properties/{property}/approve', [AdminController::class, 'approveProperty']);
    Route::patch('/properties/{property}/suspend', [AdminController::class, 'suspendProperty']);

    Route::get('/stats', [AdminController::class, 'stats']);

    // Phase 22 (pricing).
    Route::get('/payments', [AdminController::class, 'payments']);

    // Reading the settings is public (GET /settings,
    // routes/api/settings.php) — only writing them is admin-only.
    Route::put('/settings', [AdminController::class, 'updateSettings']);
});
