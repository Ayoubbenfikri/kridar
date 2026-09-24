<?php

namespace App\Http\Requests\Auth;

use App\Enums\Locale;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * PUT /auth/locale — one field, on its own endpoint (Phase 27).
 *
 * Separate from UpdateProfileRequest because the two have opposite
 * contracts: the profile form always submits every field and `name` is
 * required, while the language switcher submits nothing but the language.
 * Merging them would have forced `name` down to `sometimes`, which is
 * exactly the rule that lets a half-filled request quietly overwrite half
 * a profile.
 */
class UpdateLocaleRequest extends FormRequest
{
    public function authorize(): bool
    {
        // The route is already behind auth:sanctum, and a user changing
        // their own language needs no further permission.
        return true;
    }

    /**
     * Rule::enum is what keeps an arbitrary string out of users.locale.
     * The column is 8 characters wide, so without this "xx" would store
     * happily and then silently fall back on every read — a bug that
     * would look like "the language does not save" and have nothing to do
     * with the frontend.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'locale' => ['required', Rule::enum(Locale::class)],
        ];
    }
}
