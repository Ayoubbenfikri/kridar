<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Enums\Locale;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\UpdateLocaleRequest;
use App\Http\Requests\Auth\UpdatePasswordRequest;
use App\Http\Requests\Auth\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

/**
 * Phase 27: every message in this controller comes from the messages.php
 * of the current locale, via __(), and which file that is was decided by
 * the SetLocale middleware before this ran. Nothing here knows or cares
 * which language it is speaking.
 *
 * (Do not write that path as a glob in a docblock. "lang" slash star
 * slash closes the comment, and the next line becomes PHP — which is a
 * ParseError that takes every route on this controller down with it.)
 */
class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        // Phase 26: role and status are no longer mass-assignable (see
        // User::$fillable), so they are set here by direct assignment
        // instead of being passed into create(). Same result, except that
        // a request body containing "role": "admin" can no longer reach
        // the column even if someone later relaxes RegisterRequest.
        $user = new User([
            'name' => $request->string('name')->toString(),
            'email' => $request->string('email')->toString(),

            // ->toString() matters. $request->string() returns a
            // Stringable OBJECT, and every object is truthy in PHP — so
            // the old `$request->string('phone') ?: null` never produced
            // null and a user who registered without a phone got an empty
            // string in the column instead. Harmless so far (filled('')
            // is false, so nothing displayed it), but wrong, and it would
            // have bitten the first query that looked for whereNull.
            'phone' => $request->string('phone')->toString() ?: null,

            'password' => Hash::make($request->string('password')->toString()),
        ]);

        $user->role = UserRole::User;
        $user->status = UserStatus::Active;

        // Phase 27: whatever language they are registering IN. SetLocale
        // already resolved it from the Accept-Language header the SPA
        // sent, so the account starts in the language of the form they
        // just filled in — including the verification email, which is
        // queued from the event below and could not otherwise know.
        //
        // tryFrom rather than a bare assignment: the locale cast throws a
        // ValueError on an unknown value, and app()->getLocale() answers
        // from config on any route SetLocale does not cover. A registration
        // must not be able to 500 because APP_LOCALE was edited.
        $user->locale = Locale::tryFrom(app()->getLocale()) ?? Locale::default();

        $user->save();

        // Firing this event is enough to send the verification email —
        // Laravel's built-in SendEmailVerificationNotification listener is
        // wired to the Registered event automatically (no manual
        // registration needed). Calling $user->sendEmailVerificationNotification()
        // here too would send the email TWICE per registration.
        // MAIL_MAILER=log in .env, so during development the email (with
        // its verify link) is written to storage/logs/laravel.log instead
        // of actually sent.
        event(new Registered($user));

        Auth::login($user);
        $request->session()->regenerate();

        return response()->json([
            'message' => __('messages.auth.registered'),
            'user' => new UserResource($user),
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->only('email', 'password');

        if (! Auth::attempt($credentials, remember: true)) {
            return response()->json([
                'message' => __('messages.auth.invalid_credentials'),
            ], 401);
        }

        $request->session()->regenerate();

        /** @var User $user */
        $user = Auth::user();

        // The first of two locks. This one gives a suspended person a real
        // explanation; EnsureAccountIsActive is the one that stops an
        // ALREADY-open session, which is what this check alone could never
        // do (see that middleware for why that mattered).
        if ($user->status === UserStatus::Suspended) {
            Auth::logout();

            return response()->json([
                'message' => __('messages.auth.suspended'),
            ], 403);
        }

        return response()->json([
            'user' => new UserResource($user),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => __('messages.auth.logged_out'),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => new UserResource($request->user()),
        ]);
    }

    /**
     * Hit from the link inside the verification email — no auth:sanctum
     * (see routes/api/auth.php), so we can't rely on $request->user().
     * The 'signed' middleware already guarantees the URL (id + hash)
     * wasn't tampered with since Laravel generated it; the hash_equals
     * check below confirms that hash really matches this user's email
     * (same check Laravel's built-in EmailVerificationRequest does).
     */
    public function verifyEmail(Request $request, int $id, string $hash): JsonResponse
    {
        $user = User::findOrFail($id);

        if (! hash_equals(sha1($user->getEmailForVerification()), $hash)) {
            abort(403, __('messages.auth.invalid_verification_link'));
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => __('messages.auth.email_already_verified')]);
        }

        $user->markEmailAsVerified();
        event(new Verified($user));

        // Whoever clicked the link is now logged in as this user, in
        // whatever browser they clicked it in — reasonable UX (verify
        // and land signed in), and it's also why the PowerShell test
        // scripts keep working: they call authenticated endpoints right
        // after hitting this route.
        Auth::login($user);
        $request->session()->regenerate();

        return response()->json(['message' => __('messages.auth.email_verified')]);
    }

    public function resendVerificationEmail(Request $request): JsonResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json(['message' => __('messages.auth.email_already_verified')]);
        }

        $request->user()->sendEmailVerificationNotification();

        return response()->json(['message' => __('messages.auth.verification_sent')]);
    }

    /**
     * PUT /auth/profile — the current user edits their own name/phone.
     *
     * $request->validated() is safe to hand straight to update() for two
     * independent reasons, and it takes both: UpdateProfileRequest only
     * allows name/phone/show_phone_on_listings, AND role/status are not
     * mass-assignable at all (User::$fillable). AdminSecurityTest pins
     * both — a profile update must never be able to grant admin or lift a
     * suspension.
     */
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->update($request->validated());

        return response()->json([
            'message' => __('messages.auth.profile_updated'),
            'user' => new UserResource($user->fresh()),
        ]);
    }

    /**
     * PUT /auth/locale — the language switcher (Phase 27).
     *
     * Its own endpoint rather than a field on updateProfile: see
     * UpdateLocaleRequest for why. The response is the whole user so the
     * SPA can reseed its cached copy in one round trip instead of
     * refetching /auth/me afterwards.
     *
     * Note this does NOT decide the language of THIS response — SetLocale
     * already did that from the Accept-Language header the switcher sent.
     * What it does is make the choice outlive the browser.
     */
    public function updateLocale(UpdateLocaleRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->locale = $request->validated('locale');
        $user->save();

        return response()->json([
            'user' => new UserResource($user->fresh()),
        ]);
    }

    /**
     * PUT /auth/password — the current user changes their own password.
     * UpdatePasswordRequest already confirmed current_password matches
     * before this runs.
     */
    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $request->user()->update([
            'password' => Hash::make($request->validated('password')),
        ]);

        return response()->json([
            'message' => __('messages.auth.password_updated'),
        ]);
    }
}
