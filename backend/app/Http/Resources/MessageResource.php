<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

/**
 * @mixin \App\Models\Message
 */
class MessageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        // Once deleted, the real body and any shared-listing attachment
        // are hidden from the API response — they stay in the database
        // (see the migration that added deleted_at) but no longer leave
        // the server. The frontend renders the "Message supprimé"
        // placeholder off of is_deleted, not off of an empty body.
        $isDeleted = $this->deleted_at !== null;

        return [
            'id' => $this->id,
            'body' => $isDeleted ? null : $this->body,
            'is_deleted' => $isDeleted,
            'edited_at' => $isDeleted ? null : $this->edited_at,

            'sender' => [
                'id' => $this->sender_id,
                'name' => $this->sender?->name,
            ],

            // Which side of the thread to render this on. Computed here
            // rather than compared in the component, so the rule lives
            // with the data.
            'is_mine' => $request->user()?->id === $this->sender_id,

            // "Partager une annonce" — at most one of these two is ever
            // non-null (MessagingService::resolveSharedListing()). Hand-built,
            // same convention as PropertyResource::owner / RoommateListingResource::user,
            // never serialized through the full PropertyResource/RoommateListingResource:
            // this is a safe summary for the OTHER side of the chat, not
            // the full listing payload.
            'shared_property' => $isDeleted ? null : $this->whenLoaded('sharedProperty', fn () => $this->sharedProperty ? [
                'id' => $this->sharedProperty->id,
                'title' => $this->sharedProperty->title,
                'slug' => $this->sharedProperty->slug,
                'city' => $this->sharedProperty->city,
                'price_per_night' => $this->sharedProperty->price_per_night,
                'price_per_month' => $this->sharedProperty->price_per_month,
                'currency' => $this->sharedProperty->currency,
                'cover_image_url' => $this->coverImageUrl($this->sharedProperty->images),
            ] : null),
            'shared_roommate_listing' => $isDeleted ? null : $this->whenLoaded('sharedRoommateListing', fn () => $this->sharedRoommateListing ? [
                'id' => $this->sharedRoommateListing->id,
                'title' => $this->sharedRoommateListing->title,
                'type' => $this->sharedRoommateListing->type,
                'city' => $this->sharedRoommateListing->city,
                'price_per_person' => $this->sharedRoommateListing->price_per_person,
                'budget_min' => $this->sharedRoommateListing->budget_min,
                'budget_max' => $this->sharedRoommateListing->budget_max,
                'currency' => $this->sharedRoommateListing->currency,
                'cover_image_url' => $this->coverImageUrl($this->sharedRoommateListing->images),
            ] : null),

            'read_at' => $this->read_at,
            'created_at' => $this->created_at,
        ];
    }

    /**
     * Same computation PropertyImageResource/RoommateListingImageResource
     * do for a single image, applied to pick the COVER one out of a
     * loaded collection — images carry no url attribute of their own
     * (see those two Resources), so this is done by hand here rather
     * than routing through either one just to get one field out.
     *
     * @param Collection<int, \App\Models\PropertyImage|\App\Models\RoommateListingImage> $images
     */
    private function coverImageUrl(Collection $images): ?string
    {
        $cover = $images->sortByDesc('is_cover')->first();

        return $cover ? Storage::disk('public')->url($cover->path) : null;
    }
}
