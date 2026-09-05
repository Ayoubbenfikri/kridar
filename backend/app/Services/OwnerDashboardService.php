<?php

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Enums\PropertyStatus;
use App\Enums\ReservationStatus;
use App\Models\Payment;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\Review;
use App\Models\User;
use App\Repositories\Contracts\PropertyRepositoryInterface;
use App\Repositories\Contracts\ReservationRepositoryInterface;
use Illuminate\Pagination\LengthAwarePaginator;

class OwnerDashboardService
{
    public function __construct(
        private readonly PropertyRepositoryInterface $properties,
        private readonly ReservationRepositoryInterface $reservations,
    ) {}

    public function listProperties(User $owner, int $perPage = 15): LengthAwarePaginator
    {
        return $this->properties->paginateForOwner($owner->id, $perPage);
    }

    public function listReservations(User $owner, int $perPage = 15): LengthAwarePaginator
    {
        return $this->reservations->paginateForOwner($owner->id, $perPage);
    }

    /**
     * Plain aggregate reads across the owner's own properties - no
     * Repository methods for these, same reasoning as AvailabilityService:
     * these are simple derived/computed numbers, not model persistence,
     * so a Service querying Eloquent directly stays simple and readable.
     *
     * @return array<string, mixed>
     */
    public function getStats(User $owner): array
    {
        $propertyIds = Property::query()->where('owner_id', $owner->id)->pluck('id');

        $reservationsCount = Reservation::query()->whereIn('property_id', $propertyIds)->count();
        $pendingReservationsCount = Reservation::query()
            ->whereIn('property_id', $propertyIds)
            ->where('status', ReservationStatus::Pending)
            ->count();
        $completedReservationsCount = Reservation::query()
            ->whereIn('property_id', $propertyIds)
            ->where('status', ReservationStatus::Completed)
            ->count();

        $reservationIds = Reservation::query()->whereIn('property_id', $propertyIds)->pluck('id');
        $totalRevenue = Payment::query()
            ->where('status', PaymentStatus::Paid)
            ->whereIn('reservation_id', $reservationIds)
            ->sum('amount');

        $reviewsCount = Review::query()->whereIn('property_id', $propertyIds)->count();
        $averageRating = $reviewsCount > 0
            ? round((float) Review::query()->whereIn('property_id', $propertyIds)->avg('rating'), 1)
            : null;

        return [
            'properties_count' => $propertyIds->count(),
            'published_properties_count' => Property::query()
                ->where('owner_id', $owner->id)
                ->where('status', PropertyStatus::Published)
                ->count(),
            'reservations_count' => $reservationsCount,
            'pending_reservations_count' => $pendingReservationsCount,
            'completed_reservations_count' => $completedReservationsCount,
            'total_revenue' => (float) $totalRevenue,
            'reviews_count' => $reviewsCount,
            'average_rating' => $averageRating,
        ];
    }
}
