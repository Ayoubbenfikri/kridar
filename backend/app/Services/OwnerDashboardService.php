<?php

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
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
     * Phase 22 (pricing) fixed what total_revenue means. It used to sum
     * the full payment amounts, which is what the GUEST paid - Kridar's
     * commission included. An owner seeing that number would be counting
     * money that was never theirs. It now sums owner_amount: what the
     * owner actually receives. total_commission is shown beside it so
     * the difference is visible rather than mysterious.
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

        // Only bookings that were actually paid count as earnings.
        $paidReservationIds = Payment::query()
            ->where('type', PaymentType::Reservation)
            ->where('status', PaymentStatus::Paid)
            ->whereIn('reservation_id', $reservationIds)
            ->pluck('reservation_id');

        $totalRevenue = (float) Reservation::query()
            ->whereIn('id', $paidReservationIds)
            ->sum('owner_amount');

        $totalCommission = (float) Reservation::query()
            ->whereIn('id', $paidReservationIds)
            ->sum('commission_amount');

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
            // What the owner receives, commission already deducted.
            'total_revenue' => round($totalRevenue, 2),
            // What Kridar kept on those same bookings.
            'total_commission' => round($totalCommission, 2),
            'reviews_count' => $reviewsCount,
            'average_rating' => $averageRating,
        ];
    }
}
