<?php

namespace App\Http\Requests\Admin;

use App\Services\SettingService;
use Illuminate\Foundation\Http\FormRequest;

/**
 * PUT /admin/settings — the configurable numbers.
 *
 * All fields are required: the admin form always submits the whole
 * form, so a missing field means something is wrong with the request,
 * not "leave this one alone".
 */
class UpdateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        // The 'admin' middleware (EnsureUserIsAdmin) already guards the
        // route — same pattern as the other admin endpoints.
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            // A publication fee of 0 is allowed on purpose: it is how an
            // admin runs a free-listing promotion without a code change.
            SettingService::LISTING_FEE => ['required', 'numeric', 'min:0', 'max:100000'],

            // Percent. Capped at 100 — Kridar can never take more than
            // the guest actually pays.
            SettingService::COMMISSION_RATE => ['required', 'numeric', 'min:0', 'max:100'],

            // MAD per one unit of the PayPal currency. min:0.01, never 0:
            // the gateway divides by this, and a zero would be a division
            // by zero rather than a "free" setting.
            SettingService::PAYPAL_RATE => ['required', 'numeric', 'min:0.01', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            SettingService::LISTING_FEE.'.required' => 'The listing publication fee is required.',
            SettingService::COMMISSION_RATE.'.required' => 'The commission rate is required.',
            SettingService::COMMISSION_RATE.'.max' => 'The commission rate cannot exceed 100%.',
            SettingService::PAYPAL_RATE.'.required' => 'The MAD conversion rate is required.',
            SettingService::PAYPAL_RATE.'.min' => 'The conversion rate must be greater than zero.',
        ];
    }
}
