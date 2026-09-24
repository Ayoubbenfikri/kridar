<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\AdminAction;
use App\Enums\PaymentType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSettingsRequest;
use App\Http\Resources\AdminActivityLogResource;
use App\Http\Resources\PaymentResource;
use App\Http\Resources\PropertyResource;
use App\Http\Resources\UserResource;
use App\Models\Property;
use App\Models\User;
use App\Services\AdminActivityLogger;
use App\Services\AdminService;
use App\Services\SettingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The /admin/* routes — gated by the 'admin' middleware
 * (App\Http\Middleware\EnsureUserIsAdmin, role=admin) and rate limited as
 * a group (see routes/api/admin.php). No Policy needed: an admin can act
 * on any user/property, there's no per-resource ownership nuance to check.
 *
 * Phase 26: every mutating action passes $request->user() down to
 * AdminService, which records who did what in admin_activity_logs. The
 * actor is never read from the container — it travels as an argument, so
 * a log row can never be attributed to the wrong person.
 */
class AdminController extends Controller
{
    public function __construct(
        private readonly AdminService $admin,
        private readonly SettingService $settings,
        private readonly AdminActivityLogger $audit,
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
    public function suspendUser(Request $request, User $user): JsonResponse
    {
        $user = $this->admin->suspendUser($request->user(), $user);

        return response()->json([
            'message' => 'User suspended.',
            'user' => new UserResource($user),
        ]);
    }

    /**
     * PATCH /admin/users/{user}/activate — Phase 26. The undo for the
     * route above.
     */
    public function activateUser(Request $request, User $user): JsonResponse
    {
        $user = $this->admin->activateUser($request->user(), $user);

        return response()->json([
            'message' => 'User reactivated.',
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
    public function approveProperty(Request $request, Property $property): JsonResponse
    {
        $property = $this->admin->approveProperty($request->user(), $property);

        return response()->json([
            'message' => 'Property approved and published.',
            'property' => new PropertyResource($property),
        ]);
    }

    /**
     * PATCH /admin/properties/{property}/suspend
     */
    public function suspendProperty(Request $request, Property $property): JsonResponse
    {
        $property = $this->admin->suspendProperty($request->user(), $property);

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

    /**
     * GET /admin/payments?type=listing_publication|reservation — Phase 22
     * (pricing). Every transaction, newest first.
     *
     * An unknown ?type is treated as "no filter" rather than rejected:
     * tryFrom() returns null, and a bad query string on a read-only
     * listing does not deserve a 422.
     */
    public function payments(Request $request): JsonResponse
    {
        $type = PaymentType::tryFrom((string) $request->query('type'));

        return PaymentResource::collection($this->admin->listPayments($type))->response();
    }

    /**
     * GET /admin/activity?action=user.suspended — Phase 26. The audit
     * trail. Read-only: there is no route that edits or deletes a row
     * here, and there should never be one.
     *
     * Same lenient handling of ?action as ?type above.
     */
    public function activity(Request $request): JsonResponse
    {
        $action = AdminAction::tryFrom((string) $request->query('action'));

        return AdminActivityLogResource::collection($this->admin->listActivity($action))->response();
    }

    /**
     * PUT /admin/settings — Phase 22 (pricing). Changes the publication
     * fee and the commission rate for FUTURE listings and bookings only:
     * both values are snapshotted at the moment of payment/booking, so
     * nothing already agreed is rewritten.
     *
     * Phase 26: the before and after are both recorded. A commission rate
     * quietly moved from 10% to 30% is the kind of change that shows up
     * as an owner complaint weeks later, and this is what answers it.
     * Logged here rather than in SettingService because the service is
     * also used by non-admin code paths that have no actor.
     */
    public function updateSettings(UpdateSettingsRequest $request): JsonResponse
    {
        $before = $this->settings->all();
        $after = $this->settings->update($request->validated());

        $this->audit->record($request->user(), AdminAction::SettingsUpdated, null, [
            'before' => $before,
            'after' => $after,
        ]);

        return response()->json([
            'message' => 'Settings updated.',
            'settings' => $after,
        ]);
    }
}
