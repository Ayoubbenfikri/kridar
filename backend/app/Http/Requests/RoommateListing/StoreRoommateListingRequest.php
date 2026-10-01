<?php

namespace App\Http\Requests\RoommateListing;

use App\Enums\RoommateListingType;
use Illuminate\Contracts\Validation\Validator as ValidatorContract;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRoommateListingRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Any authenticated user can post one — being logged in + email
        // verified is enforced by route middleware, not here (same
        // convention as StorePropertyRequest).
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $isOffer = $this->input('type') === RoommateListingType::Offer->value;

        return [
            'type' => ['required', Rule::enum(RoommateListingType::class)],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'min:20'],

            'city' => ['required', 'string', 'max:120'],
            'neighborhood' => ['nullable', 'string', 'max:120'],
            'address' => ['nullable', 'string', 'max:255'],
            // Optional even for an 'offer' — same as properties, the map
            // pin is a nice-to-have, not a requirement to post.
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],

            // Meaningful when you already have a place to describe (an
            // "offer") — the rent asked per roommate. Required there,
            // never used for a "request" post (see budget_min/budget_max
            // below — a single figure can't say "between 1000 and 1500").
            'price_per_person' => [$isOffer ? 'required' : 'nullable', 'numeric', 'min:0'],
            'beds' => [$isOffer ? 'required' : 'nullable', 'integer', 'min:1', 'max:20'],
            'bedrooms' => [$isOffer ? 'required' : 'nullable', 'integer', 'min:1', 'max:20'],
            'furnished' => [$isOffer ? 'required' : 'nullable', 'boolean'],

            // "Request" only — the poster's price range. Required there
            // (see the after() cross-check below for max >= min); never
            // used for an "offer".
            'budget_min' => [$isOffer ? 'nullable' : 'required', 'numeric', 'min:0'],
            'budget_max' => [$isOffer ? 'nullable' : 'required', 'numeric', 'min:0'],

            // Meaningful for both: an offer says when the room is free,
            // a request says when the poster needs to move in.
            'available_from' => ['nullable', 'date'],

            // Meaningful for a "request" — how many people are looking
            // together (e.g. two friends sharing one room). Optional on
            // an offer.
            'people_count' => [$isOffer ? 'nullable' : 'required', 'integer', 'min:1', 'max:10'],
        ];
    }

    /**
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (ValidatorContract $validator): void {
                $min = $this->input('budget_min');
                $max = $this->input('budget_max');

                if ($min !== null && $max !== null && (float) $max < (float) $min) {
                    $validator->errors()->add('budget_max', 'budget_max must be greater than or equal to budget_min.');
                }
            },
        ];
    }
}
