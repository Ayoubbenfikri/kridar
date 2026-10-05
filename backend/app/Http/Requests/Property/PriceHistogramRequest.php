<?php

namespace App\Http\Requests\Property;

use App\Enums\ListingType;
use App\Enums\RentalType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PriceHistogramRequest extends FormRequest
{
    /**
     * Public endpoint, like the search it feeds.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Only the two things that decide WHICH price column is meant. Both
     * optional: no listing_type means rentals, exactly like the search.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'listing_type' => ['sometimes', Rule::enum(ListingType::class)],
            'rental_type' => ['sometimes', Rule::enum(RentalType::class)],
        ];
    }
}
