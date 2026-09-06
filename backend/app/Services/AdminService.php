<?php

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Enums\PropertyStatus;
use App\Enums\ReservationStatus;
use App\Enums\UserStatus;
use App\Exceptions\AdminActionNotAllowedException;
use App\Models\Payment;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\Review;
use App\Models\User;
use App\Repositories\Contracts\PropertyRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class AdminService
{
    public function __construct(
        private readonly PropertyRepositoryInterface $properties,
    ) {}

    public function listUsers(int $perPage = 15): LengthAwarePaginator
    {
        return User::query()->latest()->paginate($perPage);
    }

    /**
     * Suspending a user also suspends their currently published
     * properties - a banned account's listings shouldn't stay publicly
     * bookable just because the account itself can no longer log in
     * (that part - rejecting login for a suspended user - already
     * existed since Phase 4, see AuthController::login()).
     */
    public function suspendUser(User $user): User
    {
        if ($user->isAdmin()) {
            throw new AdminActionNotAllowedException('An admin account cannot be suspended.');
        }

        $user->update(['status' => UserStatus::Suspended]);

        Property::query()
            ->where('owner_id', $user->id)
            ->where('status', PropertyStatus::Published)
            ->update(['status' => PropertyStatus::Suspended]);

        return $user->fresh();
    }

    public function listProperties(int $perPage = 15): LengthAwarePaginator
    {
        return Property::query()
            ->with('owner:id,name')
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Publishes a property regardless of its current status (draft,
     * pending_review, or suspended) - this is the admin-only path back
     * to Published for a suspended listing (see PropertyService::publish()).
     */
    public function approveProperty(Property $property): Property
    {
        return $this->properties->update($property, [
            'status' => PropertyStatus::Published,
            'published_at' => now(),
        ]);
    }

    public function suspendProperty(Property $property): Property
    {
        return $this->properties->update($property, [
            'status' => PropertyStatus::Suspended,
        ]);
    }

    /**
     * Platform-wide numbers - same categories as OwnerDashboardService::getStats()
     * (Phase 12), just not scoped to one owner's properties.
     *
     * @return array<string, mixed>
     */
    public function getStats(): array
    {
        $reviewsCount = Review::query()->count();

        return [
            'users_count' => User::query()->count(),
            'active_users_count' => User::query()->where('status', UserStatus::Active)->count(),
            'suspended_users_count' => User::query()->where('status', UserStatus::Suspended)->count(),
            'owners_count' => User::query()->whereHas('properties')->count(),
            'properties_count' => Property::query()->count(),
            'published_properties_count' => Property::query()->where('status', PropertyStatus::Published)->count(),
            'reservations_count' => Reservation::query()->count(),
            'completed_reservations_count' => Reservation::query()->where('status', ReservationStatus::Completed)->count(),
            'total_revenue' => (float) Payment::query()->where('status', PaymentStatus::Paid)->sum('amount'),
            'reviews_count' => $reviewsCount,
            'average_rating' => $reviewsCount > 0 ? round((float) Review::query()->avg('rating'), 1) : null,
        ];
    }
}
