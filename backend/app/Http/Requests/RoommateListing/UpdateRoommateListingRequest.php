<?php

namespace App\Http\Requests\RoommateListing;

use App\Enums\RoommateListingType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoommateListingRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Real authorization (poster/admin only) happens via
        // RoommateListingPolicy in the controller.
        return true;
    }

    /**
     * Every field optional (PATCH-style partial update). Like
     * UpdatePropertyRequest, we deliberately don't cross-validate `type`
     * against the offer-only fields here — a partial update may not
     * include `type` at all, so there is no "other side" of that rule to
     * check in the same request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'type' => ['sometimes', Rule::enum(RoommateListingType::class)],
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string', 'min:20'],

            'city' => ['sometimes', 'string', 'max:120'],
            'neighborhood' => ['nullable', 'string', 'max:120'],
            'address' => ['nullable', 'string', 'max:255'],

            'price_per_person' => ['nullable', 'numeric', 'min:0'],
            'beds' => ['nullable', 'integer', 'min:1', 'max:20'],
            'bedrooms' => ['nullable', 'integer', 'min:1', 'max:20'],
            'furnished' => ['nullable', 'boolean'],
            'available_from' => ['nullable', 'date'],
            'people_count' => ['nullable', 'integer', 'min:1', 'max:10'],
        ];
    }
}
