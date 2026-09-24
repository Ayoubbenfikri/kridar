<?php

use App\Http\Controllers\Api\V1\AdminController;
use Illuminate\Support\Facades\Route;

/*
| The admin back office.
|
| Three layers, in order:
|   auth:sanctum   you are logged in
|   admin          your role is admin (EnsureUserIsAdmin)
|   throttle:60,1  60 requests per minute, per authenticated admin
|
| The throttle is not there to stop a careless admin — a human clicking
| around never approaches 60 requests a minute. It is there so that a
| STOLEN admin session cannot be scripted: without it, a leaked cookie
| could walk the whole user list or suspend every account in seconds.
| Combined with admin_activity_logs, an attack is both slowed down and
| written down.
|
| Note that the 'active' middleware on the /api/v1 group (routes/api.php)
| has already run before any of this, so a suspended account never
| reaches these routes at all.
*/

Route::middleware(['auth:sanctum', 'admin', 'throttle:60,1'])->prefix('admin')->group(function () {
    Route::get('/users', [AdminController::class, 'users']);
    Route::patch('/users/{user}/suspend', [AdminController::class, 'suspendUser']);
    // Phase 26 — the undo. Suspension used to be one-way through the API,
    // which pushed an admin who misclicked towards editing the database
    // by hand: no record, no review, far more dangerous than this.
    Route::patch('/users/{user}/activate', [AdminController::class, 'activateUser']);

    Route::get('/properties', [AdminController::class, 'properties']);
    Route::patch('/properties/{property}/approve', [AdminController::class, 'approveProperty']);
    Route::patch('/properties/{property}/suspend', [AdminController::class, 'suspendProperty']);

    Route::get('/stats', [AdminController::class, 'stats']);

    // Phase 22 (pricing).
    Route::get('/payments', [AdminController::class, 'payments']);

    // Phase 26 — the audit trail. Read-only by design: nothing in this
    // app writes to admin_activity_logs except AdminActivityLogger, and
    // nothing edits or deletes a row at all.
    Route::get('/activity', [AdminController::class, 'activity']);

    // Reading the settings is public (GET /settings,
    // routes/api/settings.php) — only writing them is admin-only.
    Route::put('/settings', [AdminController::class, 'updateSettings']);
});
