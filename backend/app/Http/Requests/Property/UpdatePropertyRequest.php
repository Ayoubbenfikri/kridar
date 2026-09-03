<?php

namespace App\Http\Requests\Property;

use App\Enums\PropertyType;
use App\Enums\RentalType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePropertyRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Real authorization (owner/admin only) happens via PropertyPolicy
        // in the controller — this just means "the request is well-formed".
        return true;
    }

    /**
     * Every field is optional here (PATCH-style partial update). We
     * deliberately don't cross-validate rental_type against
     * price_per_night/price_per_month like StorePropertyRequest does —
     * with a partial update we can't always see the "other side" of that
     * rule in the same request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string', 'min:20'],
            'property_type' => ['sometimes', Rule::enum(PropertyType::class)],
            'rental_type' => ['sometimes', Rule::enum(RentalType::class)],

            'address' => ['sometimes', 'string', 'max:255'],
            'city' => ['sometimes', 'string', 'max:120'],
            'region' => ['nullable', 'string', 'max:120'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],

            'bedrooms' => ['sometimes', 'integer', 'min:0', 'max:50'],
            'bathrooms' => ['sometimes', 'integer', 'min:0', 'max:50'],
            'max_guests' => ['nullable', 'integer', 'min:1'],
            'area_sqm' => ['nullable', 'numeric', 'min:0'],

            'price_per_night' => ['nullable', 'numeric', 'min:0'],
            'price_per_month' => ['nullable', 'numeric', 'min:0'],

            'amenity_ids' => ['nullable', 'array'],
            'amenity_ids.*' => ['integer', 'exists:amenities,id'],
        ];
    }
}
