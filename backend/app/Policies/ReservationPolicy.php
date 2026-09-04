<?php

namespace App\Policies;

use App\Models\Reservation;
use App\Models\User;

class ReservationPolicy
{
    /**
     * The guest who made it, the owner of the property, or an admin.
     */
    public function view(User $user, Reservation $reservation): bool
    {
        return $user->id === $reservation->guest_id
            || $user->id === $reservation->property->owner_id
            || $user->isAdmin();
    }

    /**
     * Either side can cancel — the guest changing their mind, or the
     * owner no longer able to host.
     */
    public function cancel(User $user, Reservation $reservation): bool
    {
        return $user->id === $reservation->guest_id
            || $user->id === $reservation->property->owner_id
            || $user->isAdmin();
    }

    /**
     * Only the owner (or an admin) decides whether to accept a request.
     */
    public function confirm(User $user, Reservation $reservation): bool
    {
        return $user->id === $reservation->property->owner_id || $user->isAdmin();
    }

    public function reject(User $user, Reservation $reservation): bool
    {
        return $user->id === $reservation->property->owner_id || $user->isAdmin();
    }

    /**
     * Only the guest who made the reservation can pay for it.
     */
    public function initiatePayment(User $user, Reservation $reservation): bool
    {
        return $user->id === $reservation->guest_id;
    }
}
