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

            'owner' => new UserResource($this->whenLoaded('owner')),
            'amenities' => AmenityResource::collection($this->whenLoaded('amenities')),

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
