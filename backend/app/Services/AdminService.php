<?php

namespace App\Services;

use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\PropertyStatus;
use App\Enums\PublicationStatus;
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
        private readonly SettingService $settings,
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
     *
     * Phase 22 (pricing) note: this deliberately does NOT check the
     * publication fee. An admin publishing a listing by hand is an
     * override - cash taken at the office, a goodwill gesture - and
     * overriding is the whole point of an admin action. The fee stays
     * recorded as unpaid, so the revenue figures stay honest.
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
     * Phase 22 (pricing) — every transaction, newest first, optionally
     * narrowed to one revenue stream.
     *
     * @param  PaymentType|null  $type  null = both streams
     */
    public function listPayments(?PaymentType $type = null, int $perPage = 15): LengthAwarePaginator
    {
        return Payment::query()
            ->with([
                'user:id,name,email',
                'property:id,title',
                'reservation:id,total_price,commission_rate,commission_amount,owner_amount',
            ])
            ->when($type !== null, fn ($query) => $query->where('type', $type))
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Platform-wide numbers.
     *
     * Phase 22 (pricing) changed what "revenue" means here, and this is
     * the important part to understand:
     *
     *   BEFORE - total_revenue was the sum of every paid payment. That
     *   included the full price of each booking, almost all of which
     *   belongs to the OWNER, not to Kridar. It was money that passed
     *   through the platform, not money the platform earned.
     *
     *   NOW - total_revenue is what Kridar actually keeps:
     *       long_term_revenue   the one-off publication fees
     *     + short_term_revenue  the commissions on paid bookings
     *
     *   The old figure is still available, renamed honestly to
     *   bookings_volume - useful, but it is not income.
     *
     * @return array<string, mixed>
     */
    public function getStats(): array
    {
        $reviewsCount = Review::query()->count();

        // Only bookings that were actually PAID count as earned
        // commission - a pending or cancelled booking earns nothing.
        $paidReservationIds = Payment::query()
            ->where('type', PaymentType::Reservation)
            ->where('status', PaymentStatus::Paid)
            ->whereNotNull('reservation_id')
            ->pluck('reservation_id');

        $shortTermRevenue = (float) Reservation::query()
            ->whereIn('id', $paidReservationIds)
            ->sum('commission_amount');

        $bookingsVolume = (float) Reservation::query()
            ->whereIn('id', $paidReservationIds)
            ->sum('total_price');

        $longTermRevenue = (float) Payment::query()
            ->where('type', PaymentType::ListingPublication)
            ->where('status', PaymentStatus::Paid)
            ->sum('amount');

        return [
            'users_count' => User::query()->count(),
            'active_users_count' => User::query()->where('status', UserStatus::Active)->count(),
            'suspended_users_count' => User::query()->where('status', UserStatus::Suspended)->count(),
            'owners_count' => User::query()->whereHas('properties')->count(),
            'properties_count' => Property::query()->count(),
            'published_properties_count' => Property::query()->where('status', PropertyStatus::Published)->count(),
            'reservations_count' => Reservation::query()->count(),
            'completed_reservations_count' => Reservation::query()->where('status', ReservationStatus::Completed)->count(),
            'reviews_count' => $reviewsCount,
            'average_rating' => $reviewsCount > 0 ? round((float) Review::query()->avg('rating'), 1) : null,

            // --- Phase 22 (pricing): the two revenue streams ---------
            'long_term_revenue' => round($longTermRevenue, 2),
            'short_term_revenue' => round($shortTermRevenue, 2),
            'total_revenue' => round($longTermRevenue + $shortTermRevenue, 2),

            // Money that passed THROUGH the platform on paid bookings.
            // Not Kridar's - shown so the commission can be read in
            // context (e.g. 150 MAD earned on 1 500 MAD of bookings).
            'bookings_volume' => round($bookingsVolume, 2),

            'paid_publications_count' => Payment::query()
                ->where('type', PaymentType::ListingPublication)
                ->where('status', PaymentStatus::Paid)
                ->count(),

            // Listings that owe the fee and have not settled it. Counted
            // from the PROPERTY, not from payment rows: a listing whose
            // owner never even started a payment has no payment row at
            // all, and it still owes the fee.
            'unpaid_publications_count' => Property::query()
                ->whereIn('rental_type', ['long_term', 'both'])
                ->where(function ($query) {
                    $query->whereNull('publication_status')
                        ->orWhere('publication_status', '!=', PublicationStatus::Paid);
                })
                ->count(),

            // The rates currently in force, so the dashboard can show
            // them next to the figures without a second request.
            'listing_fee' => $this->settings->listingFee(),
            'commission_rate' => $this->settings->commissionRate(),
        ];
    }
}
