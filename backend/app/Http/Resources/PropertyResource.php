<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Property
 */
class PropertyResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // The phone rule, in two halves:
        //   listsOwnerPhone() — does this listing publish a number at all?
        //   viewer check      — may THIS request see it?
        //
        // sanctum guard explicitly: the property routes are public, so
        // there may be no user; asking the sanctum guard is what resolves
        // the SPA session cookie on an API route that does not require
        // auth (same mechanism that lets an owner preview their draft).
        $viewer = $request->user('sanctum');
        $listsPhone = $this->listsOwnerPhone();
        $viewerMaySeePhone = $viewer !== null && $viewer->hasVerifiedEmail();

        return [
            'id' => $this->id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'property_type' => $this->property_type,
            'rental_type' => $this->rental_type,

            'address' => $this->address,
            'city' => $this->city,
            'region' => $this->region,
            'country' => $this->country,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,

            'bedrooms' => $this->bedrooms,
            'bathrooms' => $this->bathrooms,
            'max_guests' => $this->max_guests,
            'area_sqm' => $this->area_sqm,

            'price_per_night' => $this->price_per_night,
            'price_per_month' => $this->price_per_month,
            'currency' => $this->currency,

            'status' => $this->status,
            'is_featured' => $this->is_featured,
            'published_at' => $this->published_at,

            // The long-term publication fee. `requires_publication_fee`
            // is sent (rather than letting the frontend re-derive it from
            // rental_type) so the rule lives in ONE place:
            // Property::requiresPublicationFee().
            'requires_publication_fee' => $this->requiresPublicationFee(),
            'publication_status' => $this->publication_status,
            'publication_paid_at' => $this->publication_paid_at,

            // Only populated when the query added withAvg/withCount (see
            // EloquentPropertyRepository::paginatePublished() and
            // PropertyController::show()) — null/0 elsewhere rather than
            // an error, since these are plain magic attributes.
            'average_rating' => $this->reviews_avg_rating !== null ? round((float) $this->reviews_avg_rating, 1) : null,
            'reviews_count' => $this->reviews_count ?? 0,

            // Built by hand, NOT through UserResource. UserResource
            // exposes email and phone; this used to be
            // `new UserResource($this->whenLoaded('owner'))`, and was
            // safe only because the queries happened to select
            // owner:id,name. Loading one more column — which the phone
            // feature needs — would have published every owner's email
            // and phone to anonymous visitors. Only id and name can ever
            // come out of this key now, whatever the query loads.
            'owner' => $this->whenLoaded('owner', fn () => [
                'id' => $this->owner->id,
                'name' => $this->owner->name,
            ]),

            // Safe to send to anyone: it says THAT a number exists, not
            // what it is. It lets the page tell an anonymous visitor
            // "log in to see the number" honestly, instead of promising
            // a number that the owner never agreed to show.
            'owner_phone_available' => $listsPhone,

            // The number itself: long-term listing, owner opted in, and a
            // logged-in, verified viewer. Verified rather than merely
            // logged in, because a throwaway account is free to create —
            // that is what a scraper would use.
            'owner_phone' => $listsPhone && $viewerMaySeePhone ? $this->owner->phone : null,

            'amenities' => AmenityResource::collection($this->whenLoaded('amenities')),
            'images' => PropertyImageResource::collection($this->whenLoaded('images')),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
