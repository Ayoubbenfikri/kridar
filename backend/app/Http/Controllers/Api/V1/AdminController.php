<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PropertyResource;
use App\Http\Resources\UserResource;
use App\Models\Property;
use App\Models\User;
use App\Services\AdminService;
use Illuminate\Http\JsonResponse;

/**
 * The /admin/* routes - gated by the 'admin' middleware
 * (App\Http\Middleware\EnsureUserIsAdmin, role=admin). No Policy needed:
 * an admin can act on any user/property, there's no per-resource
 * ownership nuance to check.
 */
class AdminController extends Controller
{
    public function __construct(
        private readonly AdminService $admin,
    ) {}

    /**
     * GET /admin/users
     */
    public function users(): JsonResponse
    {
        return UserResource::collection($this->admin->listUsers())->response();
    }

    /**
     * PATCH /admin/users/{user}/suspend
     */
    public function suspendUser(User $user): JsonResponse
    {
        $user = $this->admin->suspendUser($user);

        return response()->json([
            'message' => 'User suspended.',
            'user' => new UserResource($user),
        ]);
    }

    /**
     * GET /admin/properties — every property, any status, any owner.
     */
    public function properties(): JsonResponse
    {
        return PropertyResource::collection($this->admin->listProperties())->response();
    }

    /**
     * PATCH /admin/properties/{property}/approve
     */
    public function approveProperty(Property $property): JsonResponse
    {
        $property = $this->admin->approveProperty($property);

        return response()->json([
            'message' => 'Property approved and published.',
            'property' => new PropertyResource($property),
        ]);
    }

    /**
     * PATCH /admin/properties/{property}/suspend
     */
    public function suspendProperty(Property $property): JsonResponse
    {
        $property = $this->admin->suspendProperty($property);

        return response()->json([
            'message' => 'Property suspended.',
            'property' => new PropertyResource($property),
        ]);
    }

    /**
     * GET /admin/stats
     */
    public function stats(): JsonResponse
    {
        return response()->json([
            'stats' => $this->admin->getStats(),
        ]);
    }
}
