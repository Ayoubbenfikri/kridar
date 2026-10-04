<?php

namespace App\Http\Requests\Property;

use App\Enums\LegalStatus;
use App\Enums\PropertyCondition;
use App\Enums\PropertyType;
use App\Enums\RentalType;
use App\Models\Property;
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
     * Which fields exist depends on what the property IS, read from the
     * property in the URL — never from the request body. listing_type
     * itself is NOT updatable: it is not in either rule set, so a client
     * that sends it has it ignored. Turning a rental into a sale (or the
     * reverse) after the fact would strand its reservations and its price
     * fields, so a listing keeps the type it was created with.
     *
     * Same whitelist behaviour as StorePropertyRequest: a field that is
     * not declared for this kind of listing never reaches validated().
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $property = $this->route('property');

        return $property instanceof Property && $property->isForSale()
            ? $this->saleRules()
            : $this->rentRules();
    }

    /**
     * @return array<string, mixed>
     */
    private function commonRules(): array
    {
        return [
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['sometimes', 'string', 'min:20'],

            'address' => ['sometimes', 'string', 'max:255'],
            'city' => ['sometimes', 'string', 'max:120'],
            'region' => ['nullable', 'string', 'max:120'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],

            'area_sqm' => ['nullable', 'numeric', 'min:0'],

            'amenity_ids' => ['nullable', 'array'],
            'amenity_ids.*' => ['integer', 'exists:amenities,id'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function rentRules(): array
    {
        return [
            ...$this->commonRules(),

            // Land can only be sold, never rented.
            'property_type' => ['sometimes', Rule::enum(PropertyType::class)->except(PropertyType::Land)],
            'rental_type' => ['sometimes', Rule::enum(RentalType::class)],

            'bedrooms' => ['sometimes', 'integer', 'min:0', 'max:50'],
            'bathrooms' => ['sometimes', 'integer', 'min:0', 'max:50'],
            'max_guests' => ['nullable', 'integer', 'min:1'],

            'price_per_night' => ['nullable', 'numeric', 'min:0'],
            'price_per_month' => ['nullable', 'numeric', 'min:0'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function saleRules(): array
    {
        return [
            ...$this->commonRules(),

            'property_type' => ['sometimes', Rule::enum(PropertyType::class)],

            'bedrooms' => ['sometimes', 'integer', 'min:0', 'max:50'],
            'bathrooms' => ['sometimes', 'integer', 'min:0', 'max:50'],

            // Not nullable: a sale always has a price. Same bounds as
            // StorePropertyRequest.
            'sale_price' => ['sometimes', 'numeric', 'min:1', 'max:999999999999'],
            'price_negotiable' => ['sometimes', 'boolean'],

            'year_built' => ['nullable', 'integer', 'between:1800,'.(now()->year + 5)],
            'property_condition' => ['nullable', Rule::enum(PropertyCondition::class)],
            'legal_status' => ['nullable', Rule::enum(LegalStatus::class)],
        ];
    }
}
