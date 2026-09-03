<?php

use App\Http\Controllers\Api\V1\PropertyController;
use Illuminate\Support\Facades\Route;

Route::get('/properties', [PropertyController::class, 'index']);
Route::get('/properties/{property}', [PropertyController::class, 'show']);

Route::middleware(['auth:sanctum', 'verified'])->group(function () {
    Route::post('/properties', [PropertyController::class, 'store']);
    Route::put('/properties/{property}', [PropertyController::class, 'update']);
    Route::patch('/properties/{property}', [PropertyController::class, 'update']);
    Route::delete('/properties/{property}', [PropertyController::class, 'destroy']);
    Route::patch('/properties/{property}/publish', [PropertyController::class, 'publish']);
    Route::patch('/properties/{property}/unpublish', [PropertyController::class, 'unpublish']);
});
