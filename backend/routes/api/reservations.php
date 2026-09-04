<?php

use App\Http\Controllers\Api\V1\ReservationController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'verified'])->group(function () {
    Route::get('/reservations', [ReservationController::class, 'index']);
    Route::post('/reservations', [ReservationController::class, 'store']);
    Route::get('/reservations/{reservation}', [ReservationController::class, 'show']);
    Route::patch('/reservations/{reservation}/confirm', [ReservationController::class, 'confirm']);
    Route::patch('/reservations/{reservation}/reject', [ReservationController::class, 'reject']);
    Route::patch('/reservations/{reservation}/cancel', [ReservationController::class, 'cancel']);
});
