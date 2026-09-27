<?php

namespace App\Http\Requests\Messaging;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * POST /messaging/packs — buy a 7-day or 15-day unlimited messaging pass.
 * The PRICE is never in the request — PaymentService reads it from
 * SettingService, same rule as the listing publication fee.
 */
class StoreMessagingPackRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'duration' => ['required', Rule::in(['7d', '15d'])],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'duration.required' => 'Choose a pack duration.',
            'duration.in' => 'Unknown pack duration.',
        ];
    }
}
