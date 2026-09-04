<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Property\AvailabilityRequest;
use App\Http\Requests\Property\PropertySearchRequest;
use App\Http\Requests\Property\StorePropertyRequest;
use App\Http\Requests\Property\UpdatePropertyRequest;
use App\Http\Resources\PropertyResource;
use App\Models\Property;
use App\Services\AvailabilityService;
use App\Services\PropertyService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PropertyController extends Controller
{
    public function __construct(
        private readonly PropertyService $properties,
        private readonly AvailabilityService $availability,
    ) {}

    /**
     * GET /properties — public, published listings only. Every filter in
     * PropertySearchRequest is optional, so this also serves the plain
     * "newest first, no filters" listing from Phase 5.
     */
    public function index(PropertySearchRequest $request): JsonResponse
    {
        $filters = $request->safe()->except('per_page');
        $perPage = (int) ($request->validated('per_page') ?? 15);

        // ->response() (not response()->json()) so Laravel wraps the
        // paginated collection in the standard {"data": [...], "links":
        // {...}, "meta": {...}} envelope. Passing the collection straight
        // to response()->json() skips that wrapping entirely.
        return PropertyResource::collection($this->properties->listPublished($filters, $perPage))
            ->response();
    }

    /**
     * GET /properties/{property} — public if published; owner/admin
     * can preview their own draft/suspended listing.
     */
    public function show(Request $request, Property $property): JsonResponse
    {
        $this->authorize('view', $property);

        return response()->json([
            'property' => new PropertyResource($property->load(['owner:id,name', 'amenities', 'images'])),
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
            'property' => new PropertyResource($property->load(['owner:id,name', 'amenities', 'images'])),
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

    /**
     * GET /properties/{property}/availability?start=YYYY-MM-DD&end=YYYY-MM-DD
     * Public — returns the booked/blocked date ranges in the window so
     * the frontend can grey out a calendar. Read-only: whether a
     * specific pair of dates can actually be booked is only guaranteed
     * at the moment of POST /reservations (inside its locked transaction).
     */
    public function availability(AvailabilityRequest $request, Property $property): JsonResponse
    {
        $start = Carbon::parse($request->validated('start'))->startOfDay();
        $end = Carbon::parse($request->validated('end'))->startOfDay();

        return response()->json(
            $this->availability->getUnavailableRanges($property, $start, $end)
        );
    }
}
