<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;

class DeleteAccountRequest extends FormRequest
{
    /**
     * Any authenticated user can request to delete their own account -
     * the route is already behind auth:sanctum, no ownership check needed.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * No password confirmation (Ayoub's call - see AuthController::
     * deleteAccount for the security note). The frontend instead makes
     * the user type a confirmation word before this request is even
     * sent, which is a UI affordance, not something the backend needs to
     * re-check: the real protection here is that the route already sits
     * behind auth:sanctum, exactly like logout.
     *
     * Kept as an empty FormRequest rather than removed, so a field can be
     * added back here later without having to touch the route or the
     * controller signature again.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [];
    }
}
