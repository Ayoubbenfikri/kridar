<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class ResetPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Anyone holding a valid token can reset — that token (not a
        // session) IS the proof of identity here.
        return true;
    }

    /**
     * token/email come from the link the user clicked (see
     * AppServiceProvider::boot() for how that URL is built); password
     * rules match RegisterRequest's, same password-strength policy
     * everywhere an account's password is set.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'token' => ['required', 'string'],
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ];
    }
}
