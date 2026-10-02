<?php

use App\Http\Controllers\Api\V1\Auth\AuthController;
use App\Http\Controllers\Api\V1\Auth\GoogleAuthController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:5,1');

// "Connect with Google". Both public and, like verifyEmail() below, meant
// to be hit by a real browser navigation (the frontend button is a plain
// <a href>, not an axios call) — Google redirects the browser itself
// between these two, there is no JSON exchange to protect with Sanctum.
//
// ->middleware('web') is NOT decorative — without it this 500s with
// "Session store not set on request". Every other route in this file sits
// under bootstrap/app.php's statefulApi(), which only starts a session
// when the request's Referer/Origin matches SANCTUM_STATEFUL_DOMAINS.
// That works for /redirect (the browser is navigating away FROM the SPA,
// so Referer = localhost:5173) but NOT for /callback — that request
// arrives with Referer = accounts.google.com, which matches nothing, so
// Sanctum would skip starting a session right when Socialite needs one
// (to store/verify its CSRF 'state' value) and Auth::login() needs one
// (to actually sign the person in). 'web' starts a session unconditionally
// instead of guessing from the Referer, which is correct here on both legs.
Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect'])->middleware('web');
Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->middleware('web');

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
