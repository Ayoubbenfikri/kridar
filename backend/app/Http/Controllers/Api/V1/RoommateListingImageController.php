<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RoommateListing\StoreRoommateListingImageRequest;
use App\Http\Resources\RoommateListingImageResource;
use App\Models\RoommateListing;
use App\Models\RoommateListingImage;
use App\Services\RoommateListingImageService;
use Illuminate\Http\JsonResponse;

class RoommateListingImageController extends Controller
{
    public function __construct(
        private readonly RoommateListingImageService $images,
    ) {}

    /**
     * POST /roommate-listings/{roommate_listing}/images — auth + verified
     * + poster/admin (see StoreRoommateListingImageRequest::authorize).
     * Accepts several files at once under the "images" key.
     */
    public function store(StoreRoommateListingImageRequest $request, RoommateListing $roommateListing): JsonResponse
    {
        $uploaded = $this->images->upload($roommateListing, $request->file('images'));

        return response()->json([
            'message' => 'Images uploaded.',
            'images' => RoommateListingImageResource::collection($uploaded),
        ], 201);
    }

    /**
     * DELETE /roommate-listings/{roommate_listing}/images/{image} — poster or admin.
     */
    public function destroy(RoommateListing $roommateListing, RoommateListingImage $image): JsonResponse
    {
        $this->authorize('update', $roommateListing);

        // {image} is bound by its own primary key, not scoped to
        // {roommate_listing} by Laravel automatically, so double check it
        // actually belongs to this post before deleting anything.
        abort_if($image->roommate_listing_id !== $roommateListing->id, 404);

        $this->images->delete($image);

        return response()->json(['message' => 'Image deleted.']);
    }
}
