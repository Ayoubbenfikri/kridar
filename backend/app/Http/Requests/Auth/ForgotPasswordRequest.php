<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class ForgotPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Anyone can ask for a reset link — no auth required to hit this
        // endpoint (the whole point is the person is locked out).
        return true;
    }

    /**
     * Deliberately NOT checking `exists:users,email` here. A validation
     * error from that rule would tell the caller "no account with that
     * email" before AuthController::forgotPassword even runs — exactly
     * the enumeration leak the controller's generic response is designed
     * to avoid. Format is still worth validating; existence isn't.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'email'],
        ];
    }
}
