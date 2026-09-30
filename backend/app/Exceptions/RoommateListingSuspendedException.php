<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Thrown by RoommateListingService::publish() when the post is currently
 * suspended by an admin - only App\Services\AdminService::approveRoommateListing()
 * can bring a suspended post back, not the poster's own publish button
 * (otherwise an admin suspension would have no real effect).
 *
 * Mirrors PropertySuspendedException exactly.
 */
class RoommateListingSuspendedException extends Exception
{
    public function render(Request $request): JsonResponse
    {
        return response()->json(['message' => $this->getMessage()], 409);
    }
}
