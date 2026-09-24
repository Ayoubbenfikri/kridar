<?php

namespace App\Http\Middleware;

use App\Enums\Locale;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

/**
 * Decides which language this response speaks (Phase 27).
 *
 * Applied to the whole /api/v1 group in routes/api.php, BEFORE 'active',
 * so that even the "your account is suspended" refusal comes back in the
 * right language.
 *
 * PRIORITY
 * --------
 *   1. The authenticated user's stored locale.
 *   2. The Accept-Language header.
 *   3. French.
 *
 * WHY THE ACCOUNT WINS, and why the first version had it backwards
 * -----------------------------------------------------------------
 * The first version let the header win, reasoning that the header is what
 * the person is looking at right now. That was wrong, and a test caught
 * it: a signed-in user with Darija saved got English back.
 *
 * The flaw is that Accept-Language is not a signal the SPA controls on its
 * own. EVERY browser sends one, filled in from the operating system —
 * "en-US,en;q=0.9", "fr-FR,fr;q=0.9". Symfony's test client does too
 * ("en-us,en;q=0.5"), which is how this surfaced. So the header cannot
 * distinguish "the app deliberately asked for this language" from "this
 * laptop happens to be in English", and letting it win meant a logged-in
 * user's saved choice could never take effect — the whole point of
 * storing it.
 *
 * With the account first, the header is what it should be: a hint for
 * people who have no account yet. A visitor whose browser is in English
 * gets English; the moment they have an account, their own choice governs.
 *
 * The cost is small and worth naming: for the instant between a logged-in
 * user clicking a new language and the PUT /auth/locale landing, a
 * response still in flight comes back in the old language. The interface
 * itself has already switched (i18next does that locally and does not
 * wait), so what this affects is at most one server message.
 *
 * Accept-Language rather than a custom X-Locale header on purpose — it is
 * a CORS-safelisted request header, so it needs no preflight and no entry
 * in config/cors.php.
 *
 * Nothing here trusts the incoming value: it is matched against
 * App\Enums\Locale and anything unrecognised is ignored rather than
 * handed to App::setLocale().
 */
class SetLocale
{
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $this->fromUser($request)
            ?? $this->fromHeader($request)
            ?? Locale::default();

        App::setLocale($locale->value);

        return $next($request);
    }

    /**
     * The sanctum guard, not the default one — same reasoning as
     * EnsureAccountIsActive, and because this middleware runs first, it is
     * the call that resolves the guard for the whole request. The guard
     * caches its answer, so 'active' costs nothing extra afterwards.
     */
    private function fromUser(Request $request): ?Locale
    {
        $user = $request->user('sanctum');

        return $user instanceof User ? $user->locale : null;
    }

    /**
     * Accept-Language carries a ranked list — "ary,fr;q=0.9,en;q=0.8", or
     * "en-US,en;q=0.9" straight from the browser. Each entry is tried in
     * order and the first one Kridar actually speaks wins, so a browser
     * asking for a language we do not have falls through to its next
     * choice instead of jumping to the default.
     *
     * Note a regional tag like "en-US" does not match on its own: the
     * enum holds 'en', not 'en-US'. That is deliberate — the next entry in
     * a real browser's list is always the bare language, so "en-US,en" still
     * resolves to English, while a tag we have never heard of cannot
     * sneak through by looking almost right.
     */
    private function fromHeader(Request $request): ?Locale
    {
        $header = $request->header('Accept-Language');

        if (! is_string($header) || $header === '') {
            return null;
        }

        foreach (explode(',', $header) as $entry) {
            // Strip the ";q=0.9" quality value and any stray whitespace.
            $tag = trim(explode(';', $entry)[0]);

            if ($locale = Locale::tryFrom($tag)) {
                return $locale;
            }
        }

        return null;
    }
}
