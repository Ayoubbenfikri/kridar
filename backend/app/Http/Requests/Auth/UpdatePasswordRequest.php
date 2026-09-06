<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class UpdatePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * 'current_password' is Laravel's built-in rule - it checks the
     * given value against the currently authenticated user's actual
     * password (via the 'web' guard, same one Sanctum SPA auth uses),
     * so a stolen/left-open session can't silently change the password
     * without knowing the current one. Password::defaults() matches the
     * same rule RegisterRequest uses, so both endpoints enforce the
     * same strength requirements.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ];
    }
}
