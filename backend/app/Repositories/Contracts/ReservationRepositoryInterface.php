<?php

namespace App\Repositories\Contracts;

use App\Models\Reservation;
use Illuminate\Pagination\LengthAwarePaginator;

interface ReservationRepositoryInterface
{
    public function create(array $attributes): Reservation;

    public function update(Reservation $reservation, array $attributes): Reservation;

    /**
     * A guest's own bookings, newest first — GET /reservations.
     */
    public function paginateForGuest(int $guestId, int $perPage = 15): LengthAwarePaginator;

    /**
     * Every reservation made on any property owned by this user, newest
     * first — GET /owner/reservations (Phase 12). The other side of
     * paginateForGuest(): bookings OTHERS made on THEIR properties, not
     * their own bookings as a guest.
     */
    public function paginateForOwner(int $ownerId, int $perPage = 15): LengthAwarePaginator;
}
