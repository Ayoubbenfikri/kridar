<?php

use App\Http\Controllers\Api\V1\ReservationController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'verified'])->group(function () {
    Route::get('/reservations', [ReservationController::class, 'index']);
    Route::post('/reservations', [ReservationController::class, 'store']);

    // Phase 22 (pricing): read-only price + commission breakdown, shown
    // before the guest commits. POST, not GET, because it takes a body
    // of dates — and declared above the /{reservation} routes out of
    // habit, so it stays safe if one of them ever gains a POST verb.
    Route::post('/reservations/price-preview', [ReservationController::class, 'pricePreview']);

    Route::get('/reservations/{reservation}', [ReservationController::class, 'show']);
    Route::patch('/reservations/{reservation}/confirm', [ReservationController::class, 'confirm']);
    Route::patch('/reservations/{reservation}/reject', [ReservationController::class, 'reject']);
    Route::patch('/reservations/{reservation}/cancel', [ReservationController::class, 'cancel']);
});
