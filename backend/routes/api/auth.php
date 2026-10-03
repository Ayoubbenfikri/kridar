<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

// "Connect with Google" used to live here too, but it moved to
// routes/web.php — see that file for why (it needs a session on both the
// /redirect leg AND the /callback leg, and stacking 'web' on top of this
// file's statefulApi()-wrapped 'api' group started TWO competing sessions
// instead of one, which is exactly what broke it).

// Public, like register/login above - a locked-out user has no session to
// prove who they are, the emailed token is what does that instead. Same
// throttle as login: both are exactly the kind of endpoint brute-forcing
// targets (guessing emails here, guessing passwords there).
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:5,1');
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:5,1');

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

    // Account settings (Phase 19) - deliberately not behind 'verified' too,
    // so a not-yet-verified user can still fix a typo'd name/phone or
    // change their password.
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);
    Route::put('/auth/password', [AuthController::class, 'updatePassword']);

    // Profile photo. POST (not PUT) because it's a multipart file upload —
    // same convention as PropertyImageController::store.
    Route::post('/auth/avatar', [AuthController::class, 'updateAvatar']);
    Route::delete('/auth/avatar', [AuthController::class, 'destroyAvatar']);

    // Account deletion. DELETE (not POST) because it's the semantically
    // correct verb for "remove this resource" and matches how the SPA's
    // axios client calls it (see authApi.deleteAccount).
    Route::delete('/auth/account', [AuthController::class, 'deleteAccount']);

    // The language switcher (Phase 27). Its own route rather than a field
    // on /auth/profile, because that endpoint requires `name` and the
    // switcher sends only the language — see UpdateLocaleRequest.
    //
    // Only logged-in users persist a choice. A visitor's language lives in
    // localStorage and travels on the Accept-Language header, which is all
    // the backend needs to answer them correctly.
    Route::put('/auth/locale', [AuthController::class, 'updateLocale']);

    // Terms of Use / Privacy Policy re-acceptance. Deliberately NOT behind
    // any extra gate (no "already accepted?" check here) — calling it
    // twice is harmless, it just re-stamps the same current version, and
    // that keeps AcceptTermsModal on the frontend simple (always just
    // calls this and refetches the user).
    Route::post('/auth/accept-terms', [AuthController::class, 'acceptTerms']);
});
