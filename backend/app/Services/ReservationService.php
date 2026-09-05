<?php

namespace App\Services;

use App\Enums\RentalType;
use App\Enums\ReservationStatus;
use App\Exceptions\InvalidReservationStatusException;
use App\Exceptions\PropertyNotAvailableException;
use App\Models\Property;
use App\Models\Reservation;
use App\Models\User;
use App\Notifications\ReservationCancelledNotification;
use App\Notifications\ReservationConfirmedNotification;
use App\Notifications\ReservationRejectedNotification;
use App\Notifications\ReservationRequestedNotification;
use App\Repositories\Contracts\ReservationRepositoryInterface;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ReservationService
{
    public function __construct(
        private readonly ReservationRepositoryInterface $reservations,
        private readonly AvailabilityService $availability,
        private readonly PricingService $pricing,
    ) {}

    /**
     * @param  array<string, mixed>  $data  validated StoreReservationRequest data
     */
    public function create(array $data, Property $property, User $guest): Reservation
    {
        $reservation = DB::transaction(function () use ($data, $property, $guest) {
            // Row-lock the property for the rest of this transaction. If a
            // second request for overlapping dates is already waiting on
            // this same lock, it only proceeds (and re-checks
            // availability) after this transaction commits — so it will
            // correctly see the reservation created below instead of
            // racing against stale data.
            $lockedProperty = Property::query()->lockForUpdate()->findOrFail($property->id);

            $startDate = Carbon::parse($data['start_date'])->startOfDay();
            $endDate = Carbon::parse($data['end_date'])->startOfDay();

            if (! $this->availability->isAvailable($lockedProperty, $startDate, $endDate)) {
                throw new PropertyNotAvailableException;
            }

            $rentalType = RentalType::from($data['rental_type']);
            $price = $this->pricing->calculate($lockedProperty, $rentalType, $startDate, $endDate);

            return $this->reservations->create([
                'property_id' => $lockedProperty->id,
                'guest_id' => $guest->id,
                'rental_type' => $rentalType,
                'start_date' => $startDate,
                'end_date' => $endDate,
                'unit_price' => $price['unit_price'],
                'total_price' => $price['total_price'],
                'guests_count' => $data['guests_count'] ?? null,
                'status' => ReservationStatus::Pending,
            ]);
        });

        // Outside the transaction — a notification is a side effect, not
        // part of the atomic booking write, and there's no need to hold
        // the row lock open for it.
        $reservation->property->owner->notify(new ReservationRequestedNotification($reservation));

        return $reservation;
    }

    public function confirm(Reservation $reservation): Reservation
    {
        $this->ensureStatus($reservation, ReservationStatus::Pending, 'confirmed');

        $reservation = $this->reservations->update($reservation, ['status' => ReservationStatus::Confirmed]);
        $reservation->guest->notify(new ReservationConfirmedNotification($reservation));

        return $reservation;
    }

    public function reject(Reservation $reservation): Reservation
    {
        $this->ensureStatus($reservation, ReservationStatus::Pending, 'rejected');

        $reservation = $this->reservations->update($reservation, ['status' => ReservationStatus::Rejected]);
        $reservation->guest->notify(new ReservationRejectedNotification($reservation));

        return $reservation;
    }

    /**
     * @param  User  $actor  whoever is cancelling — either side can, per
     *                       ReservationPolicy::cancel() — so we know who the
     *                       "other party" to notify is.
     */
    public function cancel(Reservation $reservation, User $actor, ?string $reason = null): Reservation
    {
        if (! in_array($reservation->status, [ReservationStatus::Pending, ReservationStatus::Confirmed], true)) {
            throw new InvalidReservationStatusException(
                "This reservation is already {$reservation->status->value} and can no longer be cancelled."
            );
        }

        $reservation = $this->reservations->update($reservation, [
            'status' => ReservationStatus::Cancelled,
            'cancellation_reason' => $reason,
            'cancelled_at' => now(),
        ]);

        $cancelledByGuest = $actor->id === $reservation->guest_id;
        $recipient = $cancelledByGuest ? $reservation->property->owner : $reservation->guest;
        $recipient->notify(new ReservationCancelledNotification($reservation, $cancelledByGuest));

        return $reservation;
    }

    public function listForGuest(User $guest, int $perPage = 15): LengthAwarePaginator
    {
        return $this->reservations->paginateForGuest($guest->id, $perPage);
    }

    private function ensureStatus(Reservation $reservation, ReservationStatus $required, string $action): void
    {
        if ($reservation->status !== $required) {
            throw new InvalidReservationStatusException(
                "Only a {$required->value} reservation can be {$action} (this one is {$reservation->status->value})."
            );
        }
    }
}
