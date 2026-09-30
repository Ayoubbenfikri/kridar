<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\RoommateListing
 */
class RoommateListingResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'title' => $this->title,
            'description' => $this->description,

            'city' => $this->city,
            'neighborhood' => $this->neighborhood,
            'address' => $this->address,

            'price_per_person' => $this->price_per_person,
            'currency' => $this->currency,
            'beds' => $this->beds,
            'bedrooms' => $this->bedrooms,
            'furnished' => $this->furnished,
            'people_count' => $this->people_count,
            'available_from' => $this->available_from,

            'status' => $this->status,
            'published_at' => $this->published_at,

            // Same "built by hand, not through UserResource" convention
            // as PropertyResource::owner — only id and name can ever
            // come out of this key, whatever the query loads.
            //
            // $this->user can be null even when the relation IS loaded:
            // user_id has restrictOnDelete(), but that only blocks a real
            // SQL DELETE — it does nothing for User's SoftDeletes (just an
            // UPDATE), so a post whose author was soft-deleted still
            // exists with a user_id that no longer resolves. The admin
            // moderation list (AdminService::listRoommateListings) is the
            // one place that renders every post regardless of author, so
            // it is the one that actually hits this. Explicit null here,
            // never a half-filled ['id' => null, 'name' => null].
            'user' => $this->whenLoaded('user', fn () => $this->user ? [
                'id' => $this->user->id,
                'name' => $this->user->name,
            ] : null),

            'images' => RoommateListingImageResource::collection($this->whenLoaded('images')),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
