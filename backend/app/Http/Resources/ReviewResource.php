<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Review
 */
class ReviewResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'reservation_id' => $this->reservation_id,
            'property_id' => $this->property_id,
            'rating' => $this->rating,
            'comment' => $this->comment,
            'owner_reply' => $this->owner_reply,
            'owner_replied_at' => $this->owner_replied_at,
            // Built by hand, NOT through UserResource (security audit, Oct
            // 2026). This list is PUBLIC, and UserResource is the account
            // owner's own view: email, phone, role, messaging pass... Only
            // the reviewer's public identity belongs here - same convention
            // as the owner block in PropertyResource.
            'guest' => $this->whenLoaded('guest', fn () => [
                'id' => $this->guest?->id,
                'name' => $this->guest?->name,
                'avatar_url' => $this->guest?->avatarUrl(),
            ]),
            'created_at' => $this->created_at,
        ];
    }
}
