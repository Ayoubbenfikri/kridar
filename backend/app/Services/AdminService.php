<?php

namespace App\Services;

use App\Enums\AdminAction;
use App\Enums\PaymentStatus;
use App\Enums\PaymentType;
use App\Enums\PropertyStatus;
use App\Enums\PublicationStatus;
use App\Enums\RentalType;
use App\Enums\ReservationStatus;
use App\Enums\UserStatus;
use App\Exceptions\AdminActionNotAllowedException;
use App\Models\AdminActivityLog;
use App\Models\Payment;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\Review;
use App\Models\User;
use App\Repositories\Contracts\PropertyRepositoryInterface;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Pagination\LengthAwarePaginator;

/**
 * Everything the /admin/* endpoints do.
 *
 * Phase 26 changed two things about every mutating method here:
 *
 *   1. Each one now takes the acting admin as its first argument and
 *      writes an audit row. The caller (AdminController) passes
 *      $request->user(). Nothing here reads the current user out of the
 *      container, so the actor is always explicit and always testable.
 *
 *   2. `status` is set by direct assignment, never through update([...]).
 *      It is no longer in User::$fillable precisely so that no request
 *      body can ever reach it — this service is the only place allowed to
 *      change it, and it says so in code rather than by convention.
 */
class AdminService
{
    public function __construct(
        private readonly PropertyRepositoryInterface $properties,
        private readonly SettingService $settings,
        private readonly AdminActivityLogger $audit,
    ) {}

    public function listUsers(int $perPage = 15): LengthAwarePaginator
    {
        return User::query()->latest()->paginate($perPage);
    }

    /**
     * Suspending a user also suspends their currently published
     * properties — a banned account's listings shouldn't stay publicly
     * bookable.
     *
     * As of Phase 26 this actually bites: EnsureAccountIsActive rejects
     * the account's existing session on its very next request. Before
     * that middleware existed, suspension only blocked future logins and
     * an open browser kept full access.
     */
    public function suspendUser(User $admin, User $user): User
    {
        if ($user->isAdmin()) {
            throw new AdminActionNotAllowedException('An admin account cannot be suspended.');
        }

        // Guarded server-side even though the UI hides the button: the
        // button is not what enforces this (project rule — never trust
        // the frontend).
        if ($user->status === UserStatus::Suspended) {
            throw new AdminActionNotAllowedException('This account is already suspended.');
        }

        $user->status = UserStatus::Suspended;
        $user->save();

        // A builder update(), not a model fill — this bypasses $fillable
        // by design and is scoped to one owner's published listings.
        $suspendedListings = Property::query()
            ->where('owner_id', $user->id)
            ->where('status', PropertyStatus::Published)
            ->update(['status' => PropertyStatus::Suspended]);

        $this->audit->record($admin, AdminAction::UserSuspended, $user, [
            'email' => $user->email,
            'listings_suspended' => $suspendedListings,
        ]);

        return $user->fresh();
    }

    /**
     * The way back. Added in Phase 26 because suspension used to be
     * one-way through the API, which meant a misclick could only be
     * undone by editing the database by hand — no record, no review, and
     * far more dangerous than an endpoint that logs what it did.
     *
     * It deliberately does NOT republish the listings that
     * suspendUser() took down. Some of them may have been suspended on
     * their own merits before the account ever was, and silently putting
     * a bad listing back live is worse than making an admin approve each
     * one from /admin/properties.
     */
    public function activateUser(User $admin, User $user): User
    {
        if ($user->status === UserStatus::Active) {
            throw new AdminActionNotAllowedException('This account is already active.');
        }

        $user->status = UserStatus::Active;
        $user->save();

        $this->audit->record($admin, AdminAction::UserActivated, $user, [
            'email' => $user->email,
        ]);

        return $user->fresh();
    }

    public function listProperties(int $perPage = 15): LengthAwarePaginator
    {
        return Property::query()
            ->with([
                'owner:id,name',

                // The cover image. This was missing, and its absence
                // crashed /admin/properties outright: PropertyResource
                // emits `images` through whenLoaded(), so an unloaded
                // relation means the key is not in the JSON at all, and
                // the page's `property.images.find(...)` ran on undefined.
                //
                // Same shape as EloquentPropertyRepository's two list
                // queries — cover only, since a list row shows one
                // thumbnail. And useful for moderation in its own right:
                // "has this listing got real photos" is visible at a
                // glance instead of one click away.
                //
                // No Builder type-hint on the closure, on purpose: an
                // eager-load constraint on a hasMany receives a
                // Relations\HasMany, not a plain Builder, and hinting
                // Builder throws a TypeError.
                'images' => fn ($query) => $query->where('is_cover', true),
            ])
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Publishes a property regardless of its current status (draft,
     * pending_review, or suspended) — this is the admin-only path back
     * to Published for a suspended listing (see PropertyService::publish()).
     *
     * It deliberately does NOT check the publication fee. An admin
     * publishing a listing by hand is an override — cash taken at the
     * office, a goodwill gesture — and overriding is the whole point of
     * an admin action. The fee stays recorded as unpaid, so the revenue
     * figures stay honest.
     *
     * Phase 26: that override is now recorded. The audit row carries
     * publication_fee_paid, so "why is this unpaid listing live?" has an
     * answer with a name and a timestamp on it.
     */
    public function approveProperty(User $admin, Property $property): Property
    {
        if ($property->status === PropertyStatus::Published) {
            throw new AdminActionNotAllowedException('This property is already published.');
        }

        $previousStatus = $property->status;
        $feeWasPaid = $property->publicationFeePaid();
        $owedFee = $property->requiresPublicationFee();

        $property = $this->properties->update($property, [
            'status' => PropertyStatus::Published,
            'published_at' => now(),
        ]);

        $this->audit->record($admin, AdminAction::PropertyApproved, $property, [
            'previous_status' => $previousStatus->value,
            'owed_publication_fee' => $owedFee,
            'publication_fee_paid' => $feeWasPaid,
        ]);

        return $property;
    }

    public function suspendProperty(User $admin, Property $property): Property
    {
        if ($property->status === PropertyStatus::Suspended) {
            throw new AdminActionNotAllowedException('This property is already suspended.');
        }

        $previousStatus = $property->status;

        $property = $this->properties->update($property, [
            'status' => PropertyStatus::Suspended,
        ]);

        $this->audit->record($admin, AdminAction::PropertySuspended, $property, [
            'previous_status' => $previousStatus->value,
            'owner_id' => $property->owner_id,
        ]);

        return $property;
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
     * Phase 26 — the audit trail, newest first.
     *
     * @param  AdminAction|null  $action  null = every kind of action
     */
    public function listActivity(?AdminAction $action = null, int $perPage = 20): LengthAwarePaginator
    {
        return AdminActivityLog::query()
            ->with('admin:id,name,email')
            ->when($action !== null, fn ($query) => $query->where('action', $action))
            ->latest()
            ->paginate($perPage);
    }

    /**
     * Platform-wide numbers.
     *
     * Phase 22 (pricing) changed what "revenue" means here, and this is
     * the important part to understand:
     *
     *   BEFORE — total_revenue was the sum of every paid payment. That
     *   included the full price of each booking, almost all of which
     *   belongs to the OWNER, not to Kridar. It was money that passed
     *   through the platform, not money the platform earned.
     *
     *   NOW — total_revenue is what Kridar actually keeps:
     *       long_term_revenue   the one-off publication fees
     *     + short_term_revenue  the commissions on paid bookings
     *
     *   The old figure is still available, renamed honestly to
     *   bookings_volume — useful, but it is not income.
     *
     * @return array<string, mixed>
     */
    public function getStats(): array
    {
        $reviewsCount = Review::query()->count();

        // Only bookings that were actually PAID count as earned
        // commission — a pending or cancelled booking earns nothing.
        //
        // Phase 26: this used to pluck() every matching reservation_id
        // into a PHP array and feed it back as whereIn(...). Fine at
        // fifty rows; at fifty thousand it loads the whole column into
        // memory twice. A closure so each whereIn() below gets its own
        // clean builder to compile as a subquery.
        $paidReservations = fn (): Builder => Payment::query()
            ->select('reservation_id')
            ->where('type', PaymentType::Reservation)
            ->where('status', PaymentStatus::Paid)
            ->whereNotNull('reservation_id');

        $shortTermRevenue = (float) Reservation::query()
            ->whereIn('id', $paidReservations())
            ->sum('commission_amount');

        $bookingsVolume = (float) Reservation::query()
            ->whereIn('id', $paidReservations())
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
            // Not Kridar's — shown so the commission can be read in
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
                ->whereIn('rental_type', [RentalType::LongTerm->value, RentalType::Both->value])
                ->where(function ($query) {
                    $query->whereNull('publication_status')
                        ->orWhere('publication_status', '!=', PublicationStatus::Paid);
                })
                ->count(),

            // Phase 26 — the queue. Listings waiting on a human decision
            // are the one number that tells an admin whether they have
            // work to do, and it was the one number missing.
            'pending_review_properties_count' => Property::query()
                ->where('status', PropertyStatus::PendingReview)
                ->count(),

            // The rates currently in force, so the dashboard can show
            // them next to the figures without a second request.
            'listing_fee' => $this->settings->listingFee(),
            'commission_rate' => $this->settings->commissionRate(),
        ];
    }
}
