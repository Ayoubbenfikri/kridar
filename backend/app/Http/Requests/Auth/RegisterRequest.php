<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Anyone can register — no auth required to hit this endpoint.
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'phone' => ['nullable', 'string', 'max:30'],

            // The registration-form checkbox. 'accepted' passes on
            // true/1/"yes"/"on" — exactly what a checkbox sends — and
            // fails on missing/false, so registration is impossible
            // without it. Which VERSION they accepted is not taken from
            // the request at all: AuthController::register() always
            // stamps config('legal.terms_version'), never a client value
            // (rule 13 — never trust the frontend for that).
            'terms_accepted' => ['required', 'accepted'],
        ];
    }

    /**
     * Laravel's default 'accepted' message ("The terms accepted field
     * must be accepted.") is ugly and English-only. This is the one line
     * that routes it through the same lang/{locale}/messages.php files as
     * everything else in this controller, instead of validation.php's
     * generic wording.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'terms_accepted.required' => __('messages.auth.terms_required'),
            'terms_accepted.accepted' => __('messages.auth.terms_required'),
        ];
    }
}
