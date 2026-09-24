<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProfileRequest extends FormRequest
{
    /**
     * Any authenticated user can update their own profile - the route
     * itself is already behind auth:sanctum, there's no per-resource
     * ownership check needed here.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Email is deliberately NOT editable here - changing it would need
     * to re-trigger verification, which is a bigger decision than a
     * simple profile edit. Out of scope for now.
     *
     * `locale` is deliberately NOT here either (Phase 27). It looks like
     * it belongs, but `name` is required on this endpoint — the settings
     * form always submits every field — and the language switcher sends
     * nothing but the new language. Adding locale here would have meant
     * either relaxing `name` to `sometimes` (so a buggy client could
     * silently half-update a profile) or making the switcher resend the
     * user's name to change a dropdown. It gets its own endpoint instead:
     * PUT /auth/locale, UpdateLocaleRequest.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],

            // nullable so a user can REMOVE their number, not just
            // change it. Sending null clears it.
            'phone' => ['nullable', 'string', 'max:30'],

            // Consent to show the number on long-term listings.
            // `sometimes`: an older client that does not send it leaves
            // the stored choice untouched rather than resetting it.
            'show_phone_on_listings' => ['sometimes', 'boolean'],
        ];
    }
}
