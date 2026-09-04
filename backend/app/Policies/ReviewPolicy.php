<?php

namespace App\Policies;

use App\Models\Reservation;
use App\Models\Review;
use App\Models\User;

class ReviewPolicy
{
    /**
     * Only the guest who made the reservation can review it. Whether the
     * reservation is actually completed (and not already reviewed) is a
     * business rule, not an authorization rule — checked in
     * ReviewService::createForReservation() instead.
     */
    public function create(User $user, Reservation $reservation): bool
    {
        return $user->id === $reservation->guest_id;
    }

    /**
     * Only the owner of the reviewed property can reply.
     */
    public function reply(User $user, Review $review): bool
    {
        return $user->id === $review->property->owner_id;
    }
}
