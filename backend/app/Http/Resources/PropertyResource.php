<?php

namespace App\Http\Resources;

use App\Models\PhoneReveal;
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
        // The phone rule, in three halves:
        //   listsOwnerPhone() — does this listing publish a number at all?
        //   viewer check      — may THIS request see a number in principle
        //                       (logged in, verified)?
        //   reveal check      — has THIS viewer actually paid to reveal
        //                       THIS listing's number (Phase 29)?
        //
        // sanctum guard explicitly: the property routes are public, so
        // there may be no user; asking the sanctum guard is what resolves
        // the SPA session cookie on an API route that does not require
        // auth (same mechanism that lets an owner preview their draft).
        $viewer = $request->user('sanctum');
        $listsPhone = $this->listsOwnerPhone();
        $viewerMaySeePhone = $viewer !== null && $viewer->hasVerifiedEmail();

        // Phase 29 (monetization overhaul) — phone reveal is its own
        // one-off fee now, independent of rental_type and independent of
        // messaging. Only queried when it could actually matter (a
        // listing that lists a number, and a viewer who could ever see
        // it) so a plain listing page does not run this query for every
        // row. While Kridar is free every reveal is free too, same
        // convention as requires_publication_fee below.
        $viewerHasRevealed = false;
        if ($listsPhone && $viewerMaySeePhone) {
            $viewerHasRevealed = ! config('payments.enabled')
                || PhoneReveal::query()
                    ->where('user_id', $viewer->id)
                    ->where('property_id', $this->id)
                    ->exists();
        }

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

            // The publication fee for an ADDITIONAL listing. Sent (rather
            // than letting the frontend re-derive it) so the rule lives
            // in ONE place: App\Models\Property.
            //
            // Phase 29: no longer a rental_type rule — every owner's
            // first-ever listing is free, whatever kind it is, and every
            // one after that owes the fee. Still gated on payments being
            // enabled at all: while Kridar is free it is simply false,
            // which is what makes the owner's "pay the fee" button and
            // the "Publication non payée" badge vanish on their own.
            //
            // publication_status below stays the RAW column: it is the
            // record of what was actually paid, and going free must not
            // rewrite history.
            'requires_publication_fee' => (bool) config('payments.enabled') && $this->requiresPublicationFee(),
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
            // $this->owner can be null even when the relation IS loaded:
            // owner_id has restrictOnDelete(), but that only blocks a real
            // SQL DELETE — it does nothing for User's SoftDeletes (just an
            // UPDATE), so a listing whose owner was soft-deleted still
            // exists with an owner_id that no longer resolves. Explicit
            // null here, never a half-filled ['id' => null, 'name' => null]
            // (same fix as RoommateListingResource::user).
            'owner' => $this->whenLoaded('owner', fn () => $this->owner ? [
                'id' => $this->owner->id,
                'name' => $this->owner->name,
            ] : null),

            // Safe to send to anyone: it says THAT a number exists, not
            // what it is. It lets the page tell an anonymous visitor
            // "log in to see the number" honestly, instead of promising
            // a number the owner never agreed to show.
            'owner_phone_available' => $listsPhone,

            // Phase 29 — has THIS viewer paid to unlock it? The frontend
            // uses this (not owner_phone being non-null) to decide
            // between "reveal for X MAD" and "already unlocked".
            'owner_phone_unlocked' => $viewerHasRevealed,

            // The number itself: the owner opted in, there is a number,
            // the viewer is logged in and verified, AND (Phase 29) the
            // viewer has actually paid to reveal it (or payments are
            // off). Verified rather than merely logged in, because a
            // throwaway account is free to create — that is what a
            // scraper would use.
            'owner_phone' => $listsPhone && $viewerMaySeePhone && $viewerHasRevealed ? $this->owner?->phone : null,

            'amenities' => AmenityResource::collection($this->whenLoaded('amenities')),
            'images' => PropertyImageResource::collection($this->whenLoaded('images')),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
