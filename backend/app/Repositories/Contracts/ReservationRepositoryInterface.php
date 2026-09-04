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
}
