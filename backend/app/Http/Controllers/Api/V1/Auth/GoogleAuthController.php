<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Enums\AnalyticsEventName;
use App\Enums\Locale;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AnalyticsService;
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
     *
     * The "google_login_click" analytics event is recorded HERE, not by the
     * frontend. It used to be a separate POST /analytics/collect sent at
     * the same moment as this navigation, with the same session cookie:
     * that request read the session before Socialite saved its 'state'
     * into it, then saved its own older copy back after - wiping the state.
     * Google then came back to callback() with a state Laravel no longer
     * had (InvalidStateException -> "Google sign-in failed"), depending on
     * which of the two requests finished last.
     */
    public function redirect(Request $request, AnalyticsService $analytics): RedirectResponse
    {
        try {
            $analytics->record($request, [
                'name' => AnalyticsEventName::GoogleLoginClick->value,
                // The page the button was on (/login or /register).
                // AnalyticsService keeps only the path of this URL.
                'path' => (string) $request->headers->get('referer', '/login'),
            ]);
        } catch (Throwable $e) {
            // A counter must never stop someone from signing in.
            Log::warning('Could not record google_login_click.', ['exception' => $e::class]);
        }

        // Phase O1 (owner UX): where to land once Google is done, e.g. an
        // owner who clicked "Publish my property". Kept in the session
        // until callback(); an unsafe value is simply dropped.
        $target = self::safeRedirectPath($request->query('redirect'));

        if ($target !== null) {
            $request->session()->put(self::REDIRECT_SESSION_KEY, $target);
        } else {
            $request->session()->forget(self::REDIRECT_SESSION_KEY);
        }

        return Socialite::driver('google')->redirect();
    }

    private const REDIRECT_SESSION_KEY = 'google_auth_redirect';

    /**
     * A path on the FRONTEND site only - same rule as the frontend's
     * lib/safeRedirect.ts. The value comes from a URL anyone can craft:
     * accepting "//evil.com" or "https://evil.com" would make our sign-in
     * forward people to a phishing site (open redirect). Auth pages are
     * refused too (pointless loop).
     */
    public static function safeRedirectPath(mixed $value): ?string
    {
        if (! is_string($value) || $value === '' || $value === '/' || strlen($value) > 255) {
            return null;
        }

        if (preg_match('#^/(?![/\\\\])[A-Za-z0-9\-._~/?=&%]*$#', $value) !== 1) {
            return null;
        }

        if (preg_match('#^/(login|register)(/|\?|$)#', $value) === 1) {
            return null;
        }

        return $value;
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

        // Phase O1: read once, re-checked (the session could hold a value
        // written by an older version of this code).
        $target = self::safeRedirectPath($request->session()->pull(self::REDIRECT_SESSION_KEY));
        // Failures go back to /login, still carrying the target, so a
        // second attempt (Google or password) lands at the same place.
        $loginUrl = fn (string $error) => "{$frontendUrl}/login?error={$error}"
            .($target !== null ? '&redirect='.rawurlencode($target) : '');

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

            return redirect($loginUrl('google_auth_failed'));
        }

        $user = User::where('google_id', $googleUser->getId())->first();

        if (! $user) {
            // Security audit (Oct 2026): from here on the Google EMAIL is
            // what matters - it can link to an existing Krihouse account
            // and is stored as already verified on a new one. So Google
            // must vouch for it. A Google account can carry an address its
            // owner never proved (email_verified = false); trusting it
            // would let someone sign in as whoever really owns that email.
            $googleEmailVerified = filter_var(
                $googleUser->getRaw()['email_verified'] ?? false,
                FILTER_VALIDATE_BOOLEAN,
            );

            // google_auth_failed, not google_email_unverified: that one
            // tells the person to verify their KRIHOUSE email, which is
            // not the problem here. Rare enough not to need its own text.
            if (! filled($googleUser->getEmail()) || ! $googleEmailVerified) {
                Log::warning('Google sign-in refused: Google did not confirm the email address.');

                return redirect($loginUrl('google_auth_failed'));
            }

            $existing = User::where('email', $googleUser->getEmail())->first();

            if ($existing && ! $existing->hasVerifiedEmail()) {
                return redirect($loginUrl('google_email_unverified'));
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
            return redirect($loginUrl('account_suspended'));
        }

        Auth::login($user, remember: true);
        $request->session()->regenerate();

        return redirect($frontendUrl.($target ?? '/'));
    }
}
