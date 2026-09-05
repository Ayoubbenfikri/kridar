<?php

use App\Http\Controllers\Api\V1\FavoriteController;
use Illuminate\Support\Facades\Route;

// Just auth, no email verification required (see architecture doc) -
// saving a favorite is low-stakes, unlike booking/paying/reviewing.
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/favorites', [FavoriteController::class, 'index']);
    Route::post('/favorites/{property}', [FavoriteController::class, 'store']);
    Route::delete('/favorites/{property}', [FavoriteController::class, 'destroy']);
});
