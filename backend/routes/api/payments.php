<?php

use App\Http\Controllers\Api\V1\PaymentController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'verified'])->group(function () {
    Route::post('/reservations/{reservation}/payments', [PaymentController::class, 'store']);
    Route::get('/reservations/{reservation}/payments', [PaymentController::class, 'indexForReservation']);

    // Phase 22 (pricing): the owner pays the long-term listing
    // publication fee. Kept here with the other payment routes rather
    // than in properties.php — it is a payment, and it is handled by
    // PaymentController.
    Route::post('/properties/{property}/publication-payment', [PaymentController::class, 'storeForProperty']);

    Route::get('/payments/{payment}', [PaymentController::class, 'show']);
});

// Public: the gateway (CMI) calls this server-to-server, not a logged-in
// browser. See the security TODO on FakeCmiGateway::handleCallback().
Route::post('/payments/{payment}/callback', [PaymentController::class, 'callback']);
