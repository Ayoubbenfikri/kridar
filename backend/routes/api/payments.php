<?php

use App\Http\Controllers\Api\V1\PaymentController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'verified'])->group(function () {
    Route::post('/reservations/{reservation}/payments', [PaymentController::class, 'store']);
    Route::get('/reservations/{reservation}/payments', [PaymentController::class, 'indexForReservation']);

    // The owner pays for an additional listing (Phase 29 — the first is
    // always free). Kept here with the other payment routes rather than
    // in properties.php — it is a payment, and it is handled by
    // PaymentController.
    Route::post('/properties/{property}/publication-payment', [PaymentController::class, 'storeForProperty']);

    // Phase 29 (monetization overhaul) — pay once to reveal one owner's
    // phone number on one listing. Independent of messaging.
    Route::post('/properties/{property}/phone-reveal', [PaymentController::class, 'storePhoneReveal']);

    // Phase 29 — a 7 or 15 day unlimited messaging pass, bought once the
    // 5 free contacts run out.
    Route::post('/messaging/packs', [PaymentController::class, 'storeMessagingPack']);

    Route::get('/payments/{payment}', [PaymentController::class, 'show']);
});

/*
| PUBLIC below — these are where the PAYER's browser comes back from the
| gateway, so they cannot require a session: the request is a cross-site
| top-level redirect from paypal.com.
|
| They are safe without auth because neither trusts the request: the
| gateway verifies the returning order against the id stored on the
| payment row, and cancel only ever marks a still-pending attempt as
| failed.
*/
Route::get('/payments/{payment}/return', [PaymentController::class, 'gatewayReturn']);
Route::get('/payments/{payment}/cancel', [PaymentController::class, 'gatewayCancel']);

// The older server-to-server JSON shape, kept for the test-*.ps1
// scripts driving the fake gateway. Real PayPal uses the GET above.
Route::post('/payments/{payment}/callback', [PaymentController::class, 'callback']);
