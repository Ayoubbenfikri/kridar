<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Property\StorePropertyRequest;
use App\Http\Requests\Property\UpdatePropertyRequest;
use App\Http\Resources\PropertyResource;
use App\Models\Property;
use App\Services\PropertyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PropertyController extends Controller
{
    public function __construct(
        private readonly PropertyService $properties,
    ) {}

    /**
     * GET /properties — public, published listings only.
     * Plain pagination for now; search/filters are built in Phase 7.
     */
    public function index(Request $request): JsonResponse
    {
        $perPage = min((int) $request->integer('per_page', 15), 50);

        return response()->json(
            PropertyResource::collection($this->properties->listPublished($perPage))
        );
    }

    /**
     * GET /properties/{property} — public if published; owner/admin
     * can preview their own draft/suspended listing.
     */
    public function show(Request $request, Property $property): JsonResponse
    {
        $this->authorize('view', $property);

        return response()->json([
            'property' => new PropertyResource($property->load(['owner:id,name', 'amenities'])),
        ]);
    }

    /**
     * POST /properties — auth + verified (see routes/api/properties.php).
     * Always created as a draft (see Phase 5 plan) — use publish() to go live.
     */
    public function store(StorePropertyRequest $request): JsonResponse
    {
        $property = $this->properties->create($request->validated(), $request->user());

        return response()->json([
            'message' => 'Property created as a draft. Call publish when it is ready to go live.',
            'property' => new PropertyResource($property->load('owner:id,name')),
        ], 201);
    }

    public function update(UpdatePropertyRequest $request, Property $property): JsonResponse
    {
        $this->authorize('update', $property);

        $property = $this->properties->update($property, $request->validated());

        return response()->json([
            'property' => new PropertyResource($property->load(['owner:id,name', 'amenities'])),
        ]);
    }

    public function destroy(Property $property): JsonResponse
    {
        $this->authorize('delete', $property);

        $this->properties->delete($property);

        return response()->json(['message' => 'Property deleted.']);
    }

    public function publish(Property $property): JsonResponse
    {
        $this->authorize('update', $property);

        $property = $this->properties->publish($property);

        return response()->json([
            'message' => 'Property published.',
            'property' => new PropertyResource($property->load('owner:id,name')),
        ]);
    }

    public function unpublish(Property $property): JsonResponse
    {
        $this->authorize('update', $property);

        $property = $this->properties->unpublish($property);

        return response()->json([
            'message' => 'Property moved back to draft.',
            'property' => new PropertyResource($property->load('owner:id,name')),
        ]);
    }
}
