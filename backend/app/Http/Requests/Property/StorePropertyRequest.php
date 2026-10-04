<?php

namespace App\Http\Requests\Property;

use App\Enums\LegalStatus;
use App\Enums\ListingType;
use App\Enums\PropertyCondition;
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
     * A listing is either a rental (the default, so a client that has
     * never heard of listing_type keeps working exactly as before) or a
     * sale. The two have different fields, so each gets its own rule set.
     *
     * Only fields declared in the chosen set survive into validated(), so
     * a sale request that also carries price_per_night or rental_type
     * simply has them dropped — a property for sale can never end up with
     * rental data, and a rental can never end up with a sale price.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return $this->isSale() ? $this->saleRules() : $this->rentRules();
    }

    private function isSale(): bool
    {
        return $this->input('listing_type') === ListingType::Sale->value;
    }

    /**
     * Rules both kinds of listing share.
     *
     * @return array<string, mixed>
     */
    private function commonRules(): array
    {
        return [
            // Optional on purpose: missing means 'rent' (PropertyService::
            // create() fills it in). See the class docblock.
            'listing_type' => ['sometimes', Rule::enum(ListingType::class)],

            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'min:20'],

            'address' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:120'],
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
        $needsNightly = in_array($this->input('rental_type'), ['short_term', 'both'], true);
        $needsMonthly = in_array($this->input('rental_type'), ['long_term', 'both'], true);

        return [
            ...$this->commonRules(),

            // Land can only be sold, never rented.
            'property_type' => ['required', Rule::enum(PropertyType::class)->except(PropertyType::Land)],
            'rental_type' => ['required', Rule::enum(RentalType::class)],

            'bedrooms' => ['required', 'integer', 'min:0', 'max:50'],
            'bathrooms' => ['required', 'integer', 'min:0', 'max:50'],
            'max_guests' => [$needsNightly ? 'required' : 'nullable', 'integer', 'min:1'],

            'price_per_night' => [$needsNightly ? 'required' : 'nullable', 'numeric', 'min:0'],
            'price_per_month' => [$needsMonthly ? 'required' : 'nullable', 'numeric', 'min:0'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function saleRules(): array
    {
        return [
            ...$this->commonRules(),

            'property_type' => ['required', Rule::enum(PropertyType::class)],

            // Optional for a sale: a plot of land has no bedrooms.
            // PropertyService::create() stores 0 when they are missing.
            'bedrooms' => ['nullable', 'integer', 'min:0', 'max:50'],
            'bathrooms' => ['nullable', 'integer', 'min:0', 'max:50'],

            // decimal(14, 2) in the database. Strictly positive: a free
            // listing is not a sale.
            'sale_price' => ['required', 'numeric', 'min:1', 'max:999999999999'],
            'price_negotiable' => ['nullable', 'boolean'],

            // A sanity range, not a business rule: a few years ahead
            // allows off-plan buildings under construction.
            'year_built' => ['nullable', 'integer', 'between:1800,'.(now()->year + 5)],
            'property_condition' => ['nullable', Rule::enum(PropertyCondition::class)],
            'legal_status' => ['nullable', Rule::enum(LegalStatus::class)],
        ];
    }
}
