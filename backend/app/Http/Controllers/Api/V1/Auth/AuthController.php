<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
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

class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->string('name'),
            'email' => $request->string('email'),
            'phone' => $request->string('phone') ?: null,
            'password' => Hash::make($request->string('password')),
            'role' => UserRole::User,
            'status' => UserStatus::Active,
        ]);

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
            'message' => 'Registered successfully. Check your email to verify your account.',
            'user' => new UserResource($user),
        ], 201);
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = $request->only('email', 'password');

        if (! Auth::attempt($credentials, remember: true)) {
            return response()->json([
                'message' => 'These credentials do not match our records.',
            ], 401);
        }

        $request->session()->regenerate();

        /** @var User $user */
        $user = Auth::user();

        if ($user->status === UserStatus::Suspended) {
            Auth::logout();

            return response()->json([
                'message' => 'This account has been suspended.',
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
            'message' => 'Logged out.',
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
            abort(403, 'Invalid verification link.');
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
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

        return response()->json(['message' => 'Email verified successfully.']);
    }

    public function resendVerificationEmail(Request $request): JsonResponse
    {
        if ($request->user()->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email already verified.']);
        }

        $request->user()->sendEmailVerificationNotification();

        return response()->json(['message' => 'Verification link sent.']);
    }

    /**
     * PUT /auth/profile — the current user edits their own name/phone.
     */
    public function updateProfile(UpdateProfileRequest $request): JsonResponse
    {
        $user = $request->user();
        $user->update($request->validated());

        return response()->json([
            'message' => 'Profile updated.',
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
            'message' => 'Password updated.',
        ]);
    }
}
