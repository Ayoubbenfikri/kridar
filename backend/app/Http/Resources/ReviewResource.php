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
            'guest' => new UserResource($this->whenLoaded('guest')),
            'created_at' => $this->created_at,
        ];
    }
}
