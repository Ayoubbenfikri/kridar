<?php

use App\Http\Controllers\Api\V1\PaymentController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'verified'])->group(function () {
    Route::post('/reservations/{reservation}/payments', [PaymentController::class, 'store']);
    Route::get('/reservations/{reservation}/payments', [PaymentController::class, 'indexForReservation']);
    Route::get('/payments/{payment}', [PaymentController::class, 'show']);
});

// Public: the gateway (CMI) calls this server-to-server, not a logged-in
// browser. See the security TODO on FakeCmiGateway::handleCallback().
Route::post('/payments/{payment}/callback', [PaymentController::class, 'callback']);
