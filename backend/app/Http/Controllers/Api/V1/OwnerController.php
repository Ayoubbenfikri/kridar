<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PropertyResource;
use App\Http\Resources\ReservationResource;
use App\Services\OwnerDashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The /owner/* routes - gated by the 'owner' middleware (must own at
 * least one property, see App\Http\Middleware\EnsureUserOwnsAProperty).
 * No Policy needed here: every method is already scoped to
 * $request->user()'s own properties by OwnerDashboardService, there is
 * nothing left to separately authorize per item.
 */
class OwnerController extends Controller
{
    public function __construct(
        private readonly OwnerDashboardService $dashboard,
    ) {}

    /**
     * GET /owner/properties — every property owned by the current user,
     * any status (draft included) - their "my listings" screen.
     */
    public function properties(Request $request): JsonResponse
    {
        return PropertyResource::collection(
            $this->dashboard->listProperties($request->user())
        )->response();
    }

    /**
     * GET /owner/reservations — every reservation made on any of the
     * current user's properties (bookings OTHERS made, not their own
     * bookings as a guest - that's GET /reservations).
     */
    public function reservations(Request $request): JsonResponse
    {
        return ReservationResource::collection(
            $this->dashboard->listReservations($request->user())
        )->response();
    }

    /**
     * GET /owner/stats
     */
    public function stats(Request $request): JsonResponse
    {
        return response()->json([
            'stats' => $this->dashboard->getStats($request->user()),
        ]);
    }
}
