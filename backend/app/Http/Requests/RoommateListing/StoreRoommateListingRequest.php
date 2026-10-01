<?php

namespace App\Http\Requests\RoommateListing;

use App\Enums\RoommateListingType;
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
            // "offer") — required there. Left optional for a "request"
            // post, which has no place yet.
            'price_per_person' => [$isOffer ? 'required' : 'nullable', 'numeric', 'min:0'],
            'beds' => [$isOffer ? 'required' : 'nullable', 'integer', 'min:1', 'max:20'],
            'bedrooms' => [$isOffer ? 'required' : 'nullable', 'integer', 'min:1', 'max:20'],
            'furnished' => [$isOffer ? 'required' : 'nullable', 'boolean'],

            // Meaningful for both: an offer says when the room is free,
            // a request says when the poster needs to move in.
            'available_from' => ['nullable', 'date'],

            // Meaningful for a "request" — how many people are looking
            // together (e.g. two friends sharing one room). Optional on
            // an offer.
            'people_count' => [$isOffer ? 'nullable' : 'required', 'integer', 'min:1', 'max:10'],
        ];
    }
}
