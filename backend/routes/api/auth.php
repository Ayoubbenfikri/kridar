<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Route name must stay exactly 'verification.verify' — Laravel's
    // built-in VerifyEmail notification looks up this name to build the
    // signed URL it emails to the user.
    Route::get('/auth/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
        ->middleware('signed')
        ->name('verification.verify');

    Route::post('/auth/email/verification-notification', [AuthController::class, 'resendVerificationEmail'])
        ->middleware('throttle:6,1');
});
