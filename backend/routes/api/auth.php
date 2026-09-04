<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

// Deliberately NOT inside the auth:sanctum group. This link is clicked
// from an email, possibly in a browser that has no active session at
// all (different browser than the one used to register, phone's mail
// app, etc). Requiring auth:sanctum here would mean "you must already
// be logged in on this exact browser to verify your email", which
// isn't true for most real users and crashes Laravel's default
// unauthenticated-redirect logic (it tries to redirect to a 'login'
// route, which doesn't exist in this API-only app).
//
// The 'signed' middleware is what actually secures this route: Laravel
// rejects the request before verifyEmail() even runs if the URL's
// signature doesn't match or has expired. Route name must stay exactly
// 'verification.verify' — Laravel's built-in VerifyEmail notification
// looks up this name to build the signed URL it emails to the user.
Route::get('/auth/email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->middleware('signed')
    ->name('verification.verify');

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    Route::post('/auth/email/verification-notification', [AuthController::class, 'resendVerificationEmail'])
        ->middleware('throttle:6,1');
});
