<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\RoommateListing\RoommateListingSearchRequest;
use App\Http\Requests\RoommateListing\StoreRoommateListingRequest;
use App\Http\Requests\RoommateListing\UpdateRoommateListingRequest;
use App\Http\Resources\RoommateListingResource;
use App\Models\RoommateListing;
use App\Services\RoommateListingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Same shape as PropertyController — public browse/search + show,
 * auth-gated create/update/delete/publish/unpublish, plus mine() for the
 * poster's own "my posts" screen. No availability endpoint (that's a
 * booking-calendar concept, which roommate posts don't have); image
 * actions live in RoommateListingImageController (Phase R4).
 */
class RoommateListingController extends Controller
{
    public function __construct(
        private readonly RoommateListingService $listings,
    ) {}

    /**
     * GET /roommate-listings — public, published posts only.
     */
    public function index(RoommateListingSearchRequest $request): JsonResponse
    {
        $filters = $request->safe()->except('per_page');
        $perPage = (int) ($request->validated('per_page') ?? 15);

        return RoommateListingResource::collection($this->listings->listPublished($filters, $perPage))
            ->response();
    }

    /**
     * GET /roommate-listings/mine — every post by the current user, any
     * status (draft included): their own "my posts" screen. Deliberately
     * NOT under /owner/* (OwnerController) — that group requires owning a
     * property (see the 'owner' middleware), and posting a roommate
     * listing has nothing to do with that. Reuses
     * RoommateListingService::listForUser(), already built in Phase R3
     * for exactly this screen.
     */
    public function mine(Request $request): JsonResponse
    {
        return RoommateListingResource::collection(
            $this->listings->listForUser($request->user())
        )->response();
    }

    /**
     * GET /roommate-listings/{roommate_listing} — public if published;
     * poster/admin can preview their own draft/archived post.
     */
    public function show(Request $request, RoommateListing $roommateListing): JsonResponse
    {
        $this->authorize('view', $roommateListing);

        $roommateListing->load(['user:id,name', 'images']);

        return response()->json([
            'roommate_listing' => new RoommateListingResource($roommateListing),
        ]);
    }

    /**
     * POST /roommate-listings — auth + verified (see routes/api/roommate-listings.php).
     * Always created as a draft — call publish() to go live.
     */
    public function store(StoreRoommateListingRequest $request): JsonResponse
    {
        $listing = $this->listings->create($request->validated(), $request->user());

        return response()->json([
            'message' => 'Post created as a draft. Call publish when it is ready to go live.',
            'roommate_listing' => new RoommateListingResource($listing->load('user:id,name')),
        ], 201);
    }

    public function update(UpdateRoommateListingRequest $request, RoommateListing $roommateListing): JsonResponse
    {
        $this->authorize('update', $roommateListing);

        $roommateListing = $this->listings->update($roommateListing, $request->validated());

        return response()->json([
            'roommate_listing' => new RoommateListingResource($roommateListing->load(['user:id,name', 'images'])),
        ]);
    }

    public function destroy(RoommateListing $roommateListing): JsonResponse
    {
        $this->authorize('delete', $roommateListing);

        $this->listings->delete($roommateListing);

        return response()->json(['message' => 'Post deleted.']);
    }

    public function publish(RoommateListing $roommateListing): JsonResponse
    {
        $this->authorize('update', $roommateListing);

        $roommateListing = $this->listings->publish($roommateListing);

        return response()->json([
            'message' => 'Post published.',
            'roommate_listing' => new RoommateListingResource($roommateListing->load('user:id,name')),
        ]);
    }

    public function unpublish(RoommateListing $roommateListing): JsonResponse
    {
        $this->authorize('update', $roommateListing);

        $roommateListing = $this->listings->unpublish($roommateListing);

        return response()->json([
            'message' => 'Post moved back to draft.',
            'roommate_listing' => new RoommateListingResource($roommateListing->load('user:id,name')),
        ]);
    }
}
