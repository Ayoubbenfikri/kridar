<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/**
 * @mixin \App\Models\RoommateListingImage
 *
 * Same shape as PropertyImageResource. Created now (Phase R3) so
 * RoommateListingResource has something to serialize `images` with —
 * the upload/delete endpoints themselves (RoommateListingImageController)
 * are still Phase R4.
 */
class RoommateListingImageResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'url' => Storage::disk('public')->url($this->path),
            'is_cover' => $this->is_cover,
            'sort_order' => $this->sort_order,
        ];
    }
}
