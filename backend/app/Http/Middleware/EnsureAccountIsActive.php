<?php

namespace App\Http\Middleware;

use App\Enums\UserStatus;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * Refuses every request coming from a suspended account, and kills the
 * session it came with.
 *
 * WHY THIS EXISTS
 * ---------------
 * AuthController::login() has refused suspended accounts since Phase 4,
 * and that looked like enough. It was not. Sanctum SPA auth is a session
 * cookie: once someone is logged in, `auth:sanctum` reloads them from the
 * database on each request and never looks at `status`. So suspending an
 * account only stopped it logging in AGAIN — which a user with an open
 * browser never needs to do. A suspended owner kept publishing listings,
 * taking bookings and messaging guests.
 *
 * WHERE IT RUNS
 * -------------
 * Aliased as 'active' (bootstrap/app.php) and applied once to the whole
 * /api/v1 group in routes/api.php — not to /admin/*. Suspension is an
 * account-wide sanction, so the check belongs where every route passes,
 * and a route file added in a later phase is covered without anyone
 * remembering to add it.
 *
 * Being on the outer group, it runs BEFORE each section's own
 * `auth:sanctum`, so it resolves the user itself. It uses the `sanctum`
 * guard (not the default one) because that is what the app actually
 * authenticates with, and because PropertyResource already resolves that
 * same guard on public reads — reusing it means no second query.
 *
 * It runs AFTER 'locale' (Phase 27), which is deliberate: the refusal
 * below is a message a real person reads, so it goes out in the language
 * they are using rather than always in English.
 *
 * WHY 401 AND NOT 403
 * -------------------
 * By the time this responds the session is gone, so "you are not
 * authenticated" is the truthful answer, and it is also the useful one:
 * the SPA already treats 401 on /auth/me as "nobody is logged in"
 * (useAuth), so a suspended user is simply logged out with no frontend
 * change. The explanation reaches them on their next login attempt,
 * where AuthController::login() returns the real reason.
 *
 * A side effect worth knowing: the first request after suspension gets
 * this 401, and every request after that is anonymous — so the person can
 * still browse the public listings, just not act as themselves. That is
 * the intended outcome, not an oversight.
 */
class EnsureAccountIsActive
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user('sanctum');

        if ($user === null || $user->status !== UserStatus::Suspended) {
            return $next($request);
        }

        // Not optional: login() uses remember: true, so the browser also
        // holds a recaller cookie. logout() is what cycles the remember
        // token and queues that cookie for deletion — without it the very
        // next request would silently log them straight back in.
        Auth::guard('web')->logout();

        // Only touch the session when there is one. A token-authenticated
        // request (or a test) has none, and invalidate() would be
        // operating on nothing.
        if ($request->hasSession()) {
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return response()->json([
            'message' => __('messages.auth.suspended'),
        ], 401);
    }
}
