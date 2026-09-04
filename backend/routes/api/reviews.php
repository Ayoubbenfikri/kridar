<?php

use App\Http\Controllers\Api\V1\ReviewController;
use Illuminate\Support\Facades\Route;

// Public — anyone can read the reviews for a property.
Route::get('/properties/{property}/reviews', [ReviewController::class, 'indexForProperty']);

Route::middleware(['auth:sanctum', 'verified'])->group(function () {
    Route::post('/reservations/{reservation}/review', [ReviewController::class, 'store']);
    Route::patch('/reviews/{review}', [ReviewController::class, 'reply']);
});
