<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Property\StorePropertyImageRequest;
use App\Http\Resources\PropertyImageResource;
use App\Models\Property;
use App\Models\PropertyImage;
use App\Services\PropertyImageService;
use Illuminate\Http\JsonResponse;

class PropertyImageController extends Controller
{
    public function __construct(
        private readonly PropertyImageService $images,
    ) {}

    /**
     * POST /properties/{property}/images — auth + verified + owner/admin
     * (see StorePropertyImageRequest::authorize). Accepts several files at
     * once under the "images" key.
     */
    public function store(StorePropertyImageRequest $request, Property $property): JsonResponse
    {
        $uploaded = $this->images->upload($property, $request->file('images'));

        return response()->json([
            'message' => 'Images uploaded.',
            'images' => PropertyImageResource::collection($uploaded),
        ], 201);
    }

    /**
     * DELETE /properties/{property}/images/{image} — owner or admin.
     */
    public function destroy(Property $property, PropertyImage $image): JsonResponse
    {
        $this->authorize('update', $property);

        // {image} is bound by its own primary key, not scoped to {property}
        // by Laravel automatically, so double check it actually belongs to
        // this property before deleting anything.
        abort_if($image->property_id !== $property->id, 404);

        $this->images->delete($image);

        return response()->json(['message' => 'Image deleted.']);
    }
}
