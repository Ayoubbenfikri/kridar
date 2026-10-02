<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Enums\Locale;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

/**
 * "Connect with Google" — same shape as AuthController::verifyEmail(): a
 * real top-level browser navigation (the frontend's Google button is a
 * plain <a>, not an axios call), never JSON. Both routes are public (see
 * routes/api/auth.php) because the whole point is to authenticate someone
 * who has no session yet.
 */
class GoogleAuthController extends Controller
{
    /**
     * GET /auth/google/redirect — sends the browser to Google's consent
     * screen. Socialite builds that URL from config('services.google'),
     * which reads GOOGLE_CLIENT_ID/GOOGLE_REDIRECT_URI from .env.
     */
    public function redirect(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * GET /auth/google/callback — where Google sends the browser back to
     * after the person approves (or cancels) on the consent screen.
     *
     * Three cases, in order:
     *   1. google_id already on file -> that's our user, log them in.
     *   2. No google_id, but the Google email matches an existing
     *      classic (email+password) account that is already verified ->
     *      link this Google id to it (same person proved the email twice,
     *      once via Google, once via the original verification email).
     *   3. Nothing matches -> brand new account. Password is a random,
     *      never-typed string (Hash::make(Str::random(40))) so every other
     *      password code path (login, "change password") keeps working
     *      unchanged; Terms of Use is auto-accepted since clicking
     *      "Continue with Google" IS the consent action on the frontend
     *      button (which shows the terms notice right under it).
     *
     * An existing classic account with the same email that is NOT yet
     * verified is deliberately left unlinked (falls through to redirect
     * with an error) — auto-linking there would let anyone who merely
     * knows your email address take over an unverified signup by
     * Google-signing-in with it.
     */
    public function callback(Request $request): RedirectResponse
    {
        $frontendUrl = rtrim(config('app.frontend_url'), '/');

        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (Throwable $e) {
            // Logged rather than swallowed — "google_auth_failed" alone
            // doesn't say WHICH of several very different problems this
            // is (state/session mismatch, redirect_uri not matching what
            // Google Cloud Console has on file, the person clicking
            // "Cancel" on the consent screen, wrong/missing
            // GOOGLE_CLIENT_ID...). Check storage/logs/laravel.log for the
            // real exception message when this fires.
            Log::warning('Google OAuth callback failed.', [
                'exception' => $e::class,
                'message' => $e->getMessage(),
            ]);

            return redirect("{$frontendUrl}/login?error=google_auth_failed");
        }

        $user = User::where('google_id', $googleUser->getId())->first();

        if (! $user) {
            $existing = User::where('email', $googleUser->getEmail())->first();

            if ($existing && ! $existing->hasVerifiedEmail()) {
                return redirect("{$frontendUrl}/login?error=google_email_unverified");
            }

            if ($existing) {
                // Case 2 — link.
                $existing->google_id = $googleUser->getId();
                $existing->save();
                $user = $existing;
            } else {
                // Case 3 — brand new account.
                $user = new User([
                    'name' => $googleUser->getName() ?: explode('@', $googleUser->getEmail())[0],
                    'email' => $googleUser->getEmail(),
                    'password' => Hash::make(Str::random(40)),
                ]);

                $user->role = UserRole::User;
                $user->status = UserStatus::Active;
                $user->locale = Locale::tryFrom(app()->getLocale()) ?? Locale::default();
                $user->google_id = $googleUser->getId();

                // Google already verified this address — no point sending
                // our own verification email for one that just worked.
                $user->email_verified_at = now();

                $user->terms_accepted_at = now();
                $user->terms_version = config('legal.terms_version');

                $user->save();

                event(new Registered($user));
            }
        }

        if ($user->status === UserStatus::Suspended) {
            return redirect("{$frontendUrl}/login?error=account_suspended");
        }

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        return redirect($frontendUrl.'/');
    }
}
