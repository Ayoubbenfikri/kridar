<?php

namespace App\Http\Requests\Property;

use App\Enums\PropertyType;
use App\Enums\RentalType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePropertyRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Any authenticated user can list a property — ownership is
        // implicit (see architecture doc). Being logged in + email
        // verified is enforced by route middleware, not here.
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $needsNightly = in_array($this->input('rental_type'), ['short_term', 'both'], true);
        $needsMonthly = in_array($this->input('rental_type'), ['long_term', 'both'], true);

        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'min:20'],
            'property_type' => ['required', Rule::enum(PropertyType::class)],
            'rental_type' => ['required', Rule::enum(RentalType::class)],

            'address' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:120'],
            'region' => ['nullable', 'string', 'max:120'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],

            'bedrooms' => ['required', 'integer', 'min:0', 'max:50'],
            'bathrooms' => ['required', 'integer', 'min:0', 'max:50'],
            'max_guests' => [$needsNightly ? 'required' : 'nullable', 'integer', 'min:1'],
            'area_sqm' => ['nullable', 'numeric', 'min:0'],

            'price_per_night' => [$needsNightly ? 'required' : 'nullable', 'numeric', 'min:0'],
            'price_per_month' => [$needsMonthly ? 'required' : 'nullable', 'numeric', 'min:0'],

            'amenity_ids' => ['nullable', 'array'],
            'amenity_ids.*' => ['integer', 'exists:amenities,id'],
        ];
    }
}
